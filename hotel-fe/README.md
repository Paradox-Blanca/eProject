# Hotel Manager – Frontend (ReactJS)

Bản demo **giao diện** gồm: Đăng nhập, Đăng ký, Quên mật khẩu và Hồ sơ khách.
Hiện chưa nối API nên chưa kiểm tra tài khoản thật, các nút Lưu/Xuất file chỉ hiện thông báo "Bản demo".

## Yêu cầu
- Node.js 18 trở lên (kèm npm) – tải tại https://nodejs.org

## Chạy dự án
```bash
npm install      # cài thư viện (chỉ lần đầu)
npm run dev      # chạy thử, mở http://localhost:5173
```
Các lệnh khác:
```bash
npm run build    # build bản production vào thư mục dist/
npm run preview  # xem thử bản đã build
```

## Các màn hình
| Đường dẫn | Màn hình | File |
|---|---|---|
| `/login` | Đăng nhập | `src/pages/Login.jsx` |
| `/register` | Đăng ký + xác thực OTP | `src/pages/Register.jsx` |
| `/forgot-password` | Quên mật khẩu (3 bước) | `src/pages/ForgotPassword.jsx` |
| `/profile` | Hồ sơ khách (5 tab) | `src/pages/Profile.jsx` |

## Hướng dẫn sử dụng
**Đăng nhập:** nhập email/SĐT và mật khẩu bất kỳ (bắt buộc nhập), bấm *Hiện/Ẩn* để xem mật khẩu, bấm *Đăng nhập* để vào Hồ sơ khách.

**Đăng ký:**
1. Nhập họ tên, chọn nhận OTP qua *Email*, *Số điện thoại* hoặc cả hai (ô nhập hiện theo lựa chọn).
2. Nhập mật khẩu (tối thiểu 6 ký tự) và nhập lại. Hai mật khẩu phải khớp.
3. Bấm *Gửi mã OTP*, nhập 6 số OTP bất kỳ rồi bấm *Xác nhận* để về màn đăng nhập.

**Quên mật khẩu:** nhập email/SĐT → nhập mã OTP → đặt mật khẩu mới (phải khớp) → quay về đăng nhập.

**Hồ sơ khách** (góc trên có huy hiệu *Admin*, tạm thời không phân quyền):
- *Thông tin cá nhân*: họ tên, ngày sinh, giới tính, quốc tịch, liên hệ, địa chỉ.
- *Giấy tờ*: chọn CCCD hoặc hộ chiếu, nhập số/ngày cấp/nơi cấp, tải ảnh **mặt trước** và **mặt sau** (xem trước ngay).
- *Lịch sử lưu trú*: bảng các lần ở trước đây (dữ liệu mẫu).
- *Ghi chú*: tick Dị ứng / Yêu cầu giường / VIP và ghi chú chi tiết.
- *Khai báo lưu trú*: chọn công dân Việt Nam hoặc người nước ngoài (hiện thêm thị thực, ngày và cửa khẩu nhập cảnh), bấm *Xuất file nộp công an*.

## Cấu trúc thư mục
```
src/
  main.jsx, App.jsx        # khởi tạo và khai báo route
  index.css                # toàn bộ style
  components/              # AuthLayout, OtpInput
  pages/                   # Login, Register, ForgotPassword, Profile
```

## Git: nhánh main và develop
Tạo repo trống trên GitHub/GitLab rồi chạy:
```bash
git init
git add .
git commit -m "init: login, register, forgot password, profile UI"
git branch -M main
git remote add origin <link-repo>
git push -u origin main
git checkout -b develop
git push -u origin develop
```
Quy ước: làm việc trên nhánh con tách từ `develop` (ví dụ `feature/profile`), xong thì merge về `develop`; khi chốt bản demo thì merge `develop` vào `main`.

## Việc tiếp theo (khi có backend)
- Gọi API đăng nhập/đăng ký/OTP/đổi mật khẩu và lưu token.
- Chặn `/profile` khi chưa đăng nhập, thêm phân quyền.
- Lưu hồ sơ, upload ảnh CCCD và xuất file khai báo lưu trú thật.
