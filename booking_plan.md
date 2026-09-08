# Kế hoạch Triển khai Hệ thống Booking cho Em Em Wellness

Tài liệu này hướng dẫn chi tiết cách thiết lập hệ thống đặt lịch sử dụng **Google Sheets** làm cơ sở dữ liệu, **Google Apps Script** làm backend và **Sepay** làm cổng thanh toán.

## 1. Cấu trúc Google Sheets

Bạn cần tạo một Google Sheet với 2 trang tính (Tabs) sau:

### Tab 1: `Slots` (Quản lý khung giờ)

Dùng để thiết lập các giờ trống mà khách có thể chọn.

- **Cột A: Date** (Định dạng: YYYY-MM-DD)
- **Cột B: Time** (Định dạng: HH:mm)
- **Cột C: Status** (Giá trị: `Available` hoặc `Booked`)
- **Cột D: BookingID** (ID tham chiếu từ tab Bookings)

### Tab 2: `Bookings` (Lưu thông tin khách)

Dùng để lưu lịch sử đặt chỗ và trạng thái thanh toán.

- **Cột A: Timestamp** (Thời gian khách đặt)
- **Cột B: GuestName**
- **Cột C: GuestEmail**
- **Cột D: ChosenSlot** (Ngày + Giờ)
- **Cột E: Amount** (100,000)
- **Cột F: SepayCode** (Mã nội dung chuyển khoản duy nhất)
- **Cột G: PaymentStatus** (Giá trị: `Pending` hoặc `Paid`)

---

## 2. Google Apps Script (Backend)

Truy cập `Tiện ích mở rộng` > `Apps Script` trong Google Sheet và triển khai các hàm sau:

### A. Hàm lấy danh sách giờ trống (doGet)

Trả về JSON các khung giờ có trạng thái `Available` để hiển thị lên Website.

### B. Hàm xử lý đặt lịch (doPost)

1. Nhận thông tin từ Website (Tên, Email, Giờ chọn).
2. Tạo một mã `SepayCode` duy nhất (Ví dụ: EMEM1234).
3. Lưu vào tab `Bookings` với trạng thái `Pending`.
4. Trả về thông tin thanh toán (Số tài khoản, Ngân hàng, Nội dung chuyển khoản).

### C. Webhook nhận thông báo từ Sepay

Sepay sẽ gọi vào URL Web App của bạn khi nhận được tiền:

1. Kiểm tra mã `SepayCode` trong nội dung chuyển khoản.
2. Cập nhật `PaymentStatus` thành `Paid`.
3. Chuyển `Status` của khung giờ đó trong tab `Slots` thành `Booked`.
4. Gửi email xác nhận cho khách và email thông báo cho Quản lý.

### D. Email nhắc lịch (Trigger)

Thiết lập một con chạy tự động (Trigger) mỗi giờ:

- Tìm các booking có ngày hẹn là "Ngày mai".
- Gửi email nhắc khách qua `MailApp.sendEmail`.

---

## 3. Tích hợp Cổng thanh toán Sepay

1. **Đăng ký**: Tạo tài khoản tại [sepay.vn](https://sepay.vn).
2. **Kết nối ngân hàng**: Kết nối tài khoản ngân hàng của Em Em Wellness để Sepay theo dõi biến động số dư.
3. **Cấu hình Webhook**: Copy URL sau khi Deploy Apps Script và dán vào mục Webhook trên Dashboard của Sepay.
4. **QR Code**: Website sẽ gọi API Sepay để tạo QR Code chứa sẵn số tiền (100k) và nội dung chuyển khoản định danh.

---

## 4. Frontend Integration (Website)

1. **Fetch Data**: Sử dụng `fetch()` để gọi Apps Script lấy các khung giờ đang `Available`.
2. **Booking Form**: Khi khách nhấn "Đặt cọc", gửi dữ liệu lên Apps Script.
3. **Payment UI**: Hiển thị modal QR Code thanh toán và hướng dẫn khách chuyển khoản đúng nội dung.
4. **Polling**: Website kiểm tra trạng thái thanh toán sau mỗi 5 giây để thông báo "Thành công" ngay khi nhận được tiền.

---

## 5. Các thông tin cần chuẩn bị để thực hiện sau

- **Google Account**: Có quyền chỉnh sửa Sheet.
- **Sepay API Key**: Lấy từ dashboard Sepay.
- **Nội dung Email**: Mẫu email nhắc lịch và xác nhận (văn phong nhẹ nhàng, tinh tế chuẩn "êm êm").

---

_Tài liệu được tạo bởi Antigravity AI - 2026-04-20_
