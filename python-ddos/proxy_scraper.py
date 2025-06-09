import requests
import concurrent.futures
import time
from bs4 import BeautifulSoup
import random
import json
from datetime import datetime

class ProxyScraper:
    def __init__(self):
        self.proxies = []
        self.working_proxies = []
        self.sources = [
            "https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt",
            "https://raw.githubusercontent.com/ShiftyTR/Proxy-List/master/http.txt",
            "https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/http.txt",
            "https://raw.githubusercontent.com/hookzof/socks5_list/master/proxy.txt",
            "https://raw.githubusercontent.com/sunny9577/proxy-scraper/master/proxies.txt"
        ]
        
    def fetch_proxies(self):
        print("[*] Đang tải danh sách proxy...")
        for source in self.sources:
            try:
                response = requests.get(source, timeout=10)
                if response.status_code == 200:
                    proxies = response.text.strip().split('\n')
                    self.proxies.extend(proxies)
                    print(f"[+] Đã tải {len(proxies)} proxy từ {source}")
            except Exception as e:
                print(f"[-] Lỗi khi tải từ {source}: {str(e)}")
        
        # Loại bỏ proxy trùng lặp
        self.proxies = list(set(self.proxies))
        print(f"[*] Tổng số proxy đã tải: {len(self.proxies)}")

    def check_proxy(self, proxy):
        try:
            proxy_dict = {
                "http": f"http://{proxy}",
                "https": f"http://{proxy}"
            }
            # Kiểm tra với nhiều website khác nhau
            test_urls = [
                "http://httpbin.org/ip",
                "http://ip-api.com/json",
                "https://api.ipify.org?format=json"
            ]
            
            for url in test_urls:
                response = requests.get(
                    url,
                    proxies=proxy_dict,
                    timeout=5
                )
                if response.status_code == 200:
                    return proxy
        except:
            pass
        return None

    def validate_proxies(self):
        print("[*] Đang kiểm tra proxy...")
        with concurrent.futures.ThreadPoolExecutor(max_workers=50) as executor:
            future_to_proxy = {executor.submit(self.check_proxy, proxy): proxy for proxy in self.proxies}
            for future in concurrent.futures.as_completed(future_to_proxy):
                proxy = future.result()
                if proxy:
                    self.working_proxies.append(proxy)
                    print(f"[+] Proxy hoạt động: {proxy}")

    def save_proxies(self):
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"proxies_{timestamp}.txt"
        
        # Lưu dạng text
        with open(filename, 'w') as f:
            for proxy in self.working_proxies:
                f.write(f"{proxy}\n")
        
        # Lưu dạng JSON với metadata
        json_data = {
            "timestamp": timestamp,
            "total_proxies": len(self.working_proxies),
            "proxies": self.working_proxies
        }
        with open(f"proxies_{timestamp}.json", 'w') as f:
            json.dump(json_data, f, indent=4)
        
        print(f"[+] Đã lưu {len(self.working_proxies)} proxy vào {filename}")
        return filename

    def run(self):
        self.fetch_proxies()
        self.validate_proxies()
        return self.save_proxies()

if __name__ == "__main__":
    scraper = ProxyScraper()
    proxy_file = scraper.run()
    print(f"\n[*] Sử dụng proxy file: {proxy_file}")
    print("[*] Chạy tấn công với lệnh:")
    print(f"python ddos_layer7.py http://target.com --proxy-file {proxy_file}") 