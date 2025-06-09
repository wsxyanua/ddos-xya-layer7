const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

class ProxyManager {
    constructor() {
        this.proxyList = [];
        this.workingProxies = [];
        this.proxyFile = path.join(__dirname, 'proxies.txt');
        this.testUrls = [
            'http://httpbin.org/ip',
            'http://ip-api.com/json',
            'https://api.ipify.org?format=json'
        ];
    }

    // Lấy proxy từ các nguồn miễn phí
    async fetchFreeProxies() {
        const sources = [
            'https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt',
            'https://raw.githubusercontent.com/ShiftyTR/Proxy-List/master/http.txt',
            'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/http.txt',
            'https://raw.githubusercontent.com/hookzof/socks5_list/master/proxy.txt',
            'https://raw.githubusercontent.com/sunny9577/proxy-scraper/master/proxies.txt'
        ];

        console.log('[*] Đang tải danh sách proxy...');
        
        const fetchPromises = sources.map(async (source) => {
            try {
                const response = await axios.get(source, { timeout: 5000 });
                const proxies = response.data.split('\n')
                    .map(proxy => proxy.trim())
                    .filter(proxy => proxy && proxy.includes(':'));
                
                console.log(`[+] Đã tải ${proxies.length} proxy từ ${source}`);
                return proxies;
            } catch (error) {
                console.error(`[-] Lỗi khi tải từ ${source}: ${error.message}`);
                return [];
            }
        });

        const results = await Promise.all(fetchPromises);
        this.proxyList = [...new Set(results.flat())];
        console.log(`[+] Tổng số proxy đã tải: ${this.proxyList.length}`);
    }

    // Kiểm tra proxy có hoạt động không
    async checkProxy(proxy) {
        try {
            const config = {
                proxy: {
                    host: proxy.split(':')[0],
                    port: proxy.split(':')[1],
                    protocol: 'http'
                },
                timeout: 3000,
                validateStatus: false
            };

            // Thử với một URL ngẫu nhiên
            const testUrl = this.testUrls[Math.floor(Math.random() * this.testUrls.length)];
            const response = await axios.get(testUrl, config);
            
            return response.status === 200;
        } catch (error) {
            return false;
        }
    }

    // Kiểm tra nhiều proxy cùng lúc
    async validateProxies() {
        console.log('[*] Đang kiểm tra proxy...');
        this.workingProxies = [];

        const batchSize = 50; // Số lượng proxy kiểm tra cùng lúc
        const batches = [];
        
        for (let i = 0; i < this.proxyList.length; i += batchSize) {
            batches.push(this.proxyList.slice(i, i + batchSize));
        }

        for (const batch of batches) {
            const checkPromises = batch.map(proxy => this.checkProxy(proxy));
            const results = await Promise.all(checkPromises);
            
            batch.forEach((proxy, index) => {
                if (results[index]) {
                    this.workingProxies.push(proxy);
                    console.log(`[+] Proxy hoạt động: ${proxy}`);
                }
            });
        }

        console.log(`[+] Tìm thấy ${this.workingProxies.length} proxy hoạt động`);
    }

    // Lưu danh sách proxy vào file
    saveProxies() {
        const content = this.workingProxies.join('\n');
        fs.writeFileSync(this.proxyFile, content);
        console.log(`[+] Đã lưu ${this.workingProxies.length} proxy vào ${this.proxyFile}`);
    }

    // Đọc danh sách proxy từ file
    loadProxies() {
        if (fs.existsSync(this.proxyFile)) {
            const content = fs.readFileSync(this.proxyFile, 'utf8');
            this.workingProxies = content.split('\n')
                .map(proxy => proxy.trim())
                .filter(proxy => proxy);
            console.log(`[+] Đã tải ${this.workingProxies.length} proxy từ ${this.proxyFile}`);
        }
    }

    // Lấy một proxy ngẫu nhiên
    getRandomProxy() {
        if (this.workingProxies.length === 0) {
            return null;
        }
        return this.workingProxies[Math.floor(Math.random() * this.workingProxies.length)];
    }

    // Cập nhật danh sách proxy
    async updateProxies() {
        await this.fetchFreeProxies();
        await this.validateProxies();
        this.saveProxies();
    }
}

// Export để sử dụng trong các file khác
module.exports = ProxyManager;

// Nếu chạy trực tiếp file này
if (require.main === module) {
    const proxyManager = new ProxyManager();
    
    async function main() {
        console.log('[*] Bắt đầu cập nhật proxy...');
        await proxyManager.updateProxies();
    }

    main().catch(console.error);
} 