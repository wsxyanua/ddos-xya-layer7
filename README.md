# DDoS Layer 7 Attack Tool

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Node.js%20%7C%20Python-blueviolet)

## Giới Thiệu

DDoS Layer 7 Attack Tool là một công cụ mạnh mẽ được phát triển để mô phỏng và kiểm tra khả năng chịu tải của các ứng dụng web. Công cụ này được thiết kế với mục đích giáo dục và nghiên cứu, giúp các chuyên gia bảo mật hiểu rõ hơn về các cuộc tấn công DDoS Layer 7 và cách phòng chống chúng.

## Đặc Điểm Nổi Bật

### 🚀 Hiệu Suất Cao
- Đa luồng thông minh với Worker Threads
- Tối ưu hóa tài nguyên hệ thống
- Xử lý đồng thời hàng nghìn request
- Hiệu suất ổn định trên mọi nền tảng

### 🔄 Quản Lý Proxy Thông Minh
- Tự động cập nhật danh sách proxy
- Kiểm tra và xác thực proxy
- Xoay vòng proxy tự động
- Hỗ trợ nhiều nguồn proxy

### 📊 Thống Kê Chi Tiết
- Theo dõi thời gian thực
- Phân tích tỷ lệ thành công/thất bại
- Báo cáo hiệu suất chi tiết
- Xuất dữ liệu thống kê

### 🛡️ Bảo Mật Nâng Cao
- Mã hóa thông tin nhạy cảm
- Xác thực proxy an toàn
- Bảo vệ thông tin người dùng
- Tuân thủ các tiêu chuẩn bảo mật

## Cài Đặt

### Yêu Cầu Hệ Thống
- Node.js >= 14.0.0
- Python >= 3.8.0
- RAM >= 2GB
- Kết nối internet ổn định

### Cài Đặt Dependencies
```bash
# Cài đặt Node.js dependencies
npm install

# Cài đặt Python dependencies
pip install -r requirements.txt
```

## Sử Dụng

### Cập Nhật Proxy
```bash
npm run update-proxies
```

### Chạy Tấn Công

#### Sử dụng Node.js
```bash
# Cài đặt dependencies
npm install

# Chạy tấn công cơ bản
node http-xya.js http://target.com -t 100 -d 60 -u

# Chạy tấn công nâng cao
node http-xya.js http://target.com -t 200 -d 120 -u --proxy-file custom-proxies.txt
```

#### Sử dụng Python
```bash
# Cài đặt dependencies
pip install -r requirements.txt

# Chạy tấn công cơ bản
python ddos_layer7.py http://target.com -t 100 -d 60

# Chạy tấn công nâng cao
python ddos_layer7.py http://target.com -t 200 -d 120 --proxy-file custom-proxies.txt --user-agent-file custom-user-agents.txt

# Chạy với proxy tự động
python ddos_layer7.py http://target.com -t 150 -d 90 --auto-proxy

# Chạy với chế độ debug
python ddos_layer7.py http://target.com -t 100 -d 60 --debug
```

### Tham Số
| Tham Số | Mô Tả | Mặc Định |
|---------|--------|-----------|
| `-t, --threads` | Số lượng luồng | 100 |
| `-d, --duration` | Thời gian tấn công (giây) | 60 |
| `-u, --update-proxies` | Cập nhật danh sách proxy | false |
| `--proxy-file` | Đường dẫn đến file proxy tùy chỉnh | proxies.txt |
| `--user-agent-file` | Đường dẫn đến file user-agent tùy chỉnh | user-agents.txt |
| `--auto-proxy` | Tự động cập nhật và xoay vòng proxy | false |
| `--debug` | Bật chế độ debug | false |

## Kiến Trúc Hệ Thống

### Module Chính
1. **DDoS Engine**
   - Xử lý đa luồng
   - Quản lý request
   - Theo dõi hiệu suất

2. **Proxy Manager**
   - Quản lý danh sách proxy
   - Kiểm tra proxy
   - Xoay vòng proxy

3. **Statistics Engine**
   - Thu thập dữ liệu
   - Phân tích hiệu suất
   - Tạo báo cáo

### Luồng Dữ Liệu
```
[Request Generator] → [Proxy Manager] → [Target Server]
        ↑                    ↑
        └── [Statistics] ←──┘
```

## Bảo Mật & Quyền Riêng Tư

### Nguyên Tắc Sử Dụng
1. Chỉ sử dụng cho mục đích giáo dục
2. Tuân thủ luật pháp và quy định
3. Tôn trọng quyền riêng tư
4. Bảo vệ thông tin người dùng

### Biện Pháp Bảo Mật
- Mã hóa dữ liệu nhạy cảm
- Xác thực proxy
- Bảo vệ thông tin cá nhân
- Kiểm tra bảo mật định kỳ

## Đóng Góp

Chúng tôi luôn hoan nghênh mọi đóng góp từ cộng đồng. Nếu bạn muốn đóng góp, vui lòng:

1. Fork repository
2. Tạo branch mới
3. Commit thay đổi
4. Push lên branch
5. Tạo Pull Request

## Giấy Phép

Dự án này được phát hành dưới giấy phép MIT. Xem file [LICENSE](LICENSE) để biết thêm chi tiết.

## Liên Hệ

- Email: [your-email@example.com]
- GitHub: [your-github-profile]
- Website: [your-website]

## Cảm Ơn

Cảm ơn bạn đã quan tâm đến dự án này. Chúng tôi hy vọng công cụ này sẽ hữu ích cho việc học tập và nghiên cứu của bạn.

---
*Được phát triển với ❤️ bởi [Your Name]* 