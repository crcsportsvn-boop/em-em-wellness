# TÀI LIỆU USE CASES & THIẾT KẾ KIẾN TRÚC BACK-END
## DỰ ÁN: ÊM ÊM WELLNESS - ĐẶT LỊCH TRỊ LIỆU CHUYÊN SÂU

> **Mục tiêu**: Thiết lập tài liệu đặc tả nghiệp vụ, luồng dữ liệu và giải pháp kỹ thuật cho hệ thống đặt lịch hẹn của Êm Êm Wellness, giải quyết triệt để các bài toán xung đột lịch, tối ưu vận hành thực tế cho kỹ thuật viên và chủ spa.

---

## I. ĐẶC TẢ CHI TIẾT 9 USE CASES VẬN HÀNH THỰC TẾ

### 1. Use Case 1: Đang phục vụ ca này, khách đặt gấp ca tiếp theo (Minimum Lead Time)
* **Ngữ cảnh thực tế**: Kỹ thuật viên (KTV) đang thực hiện trị liệu ca `13:30 - 14:30`, điện thoại ở chế độ im lặng. Lúc `14:35`, một khách hàng trên mạng vào web đặt ca `15:00`. KTV vừa xong ca lúc `14:30`, đang dọn dẹp phòng và chưa kịp nghỉ ngơi thì khách mới xuất hiện đột ngột vào lúc `15:00`.
* **Rủi ro**: Không kịp đón tiếp chu đáo, không kịp chuẩn bị phòng trị liệu, KTV bị quá tải.
* **Giải pháp kỹ thuật**:
  * Thiết lập **Minimum Lead Time (Khoảng cách đặt trước tối thiểu)**: Khách hàng online bắt buộc phải đặt trước giờ bắt đầu tối thiểu `45 - 60 phút`.
  * **Thuật toán**: 
    $$\text{Slot Start Time} - \text{Current Time} < 60\text{ phút} \implies \text{Tự động ẩn Slot khỏi Web}$$
  * **Xử lý ngoại lệ**: Nếu khách truy cập vào khung giờ sát nút, web hiển thị gợi ý: *"Khung giờ này sắp diễn ra trong 60 phút tới. Quý khách vui lòng gọi Hotline hoặc nhắn Zalo để chúng tôi kiểm tra tiếp nhận ngay."*

---

### 2. Use Case 2: Chủ spa khóa lịch trên bảng tính linh hoạt (Internal Schedule Lock)
* **Ngữ cảnh thực tế**: KTV cần nghỉ ăn trưa đột xuất, đi công việc cá nhân, ốm, hoặc spa tổ chức đào tạo nội bộ nên cần khóa một số khung giờ nhất định mà không cần can thiệp vào mã nguồn website.
* **Giải pháp kỹ thuật**:
  * **Phương án Google Sheets**: Tạo một trang tính đồng bộ 2 chiều:
    * Cột dữ liệu: `Ngày` | `Khung Giờ` | `Trạng Thái` (`Trống` / `Đã Đặt` / `Khóa Nội Bộ`) | `Lý Do`.
    * Khi chủ spa chọn trạng thái `Khóa Nội Bộ`, webhook/API tự động đánh dấu slot đó là `Occupied`, web ẩn ngay lập tức.
  * **Phương án Google Calendar (Tiện nhất trên di động)**:
    * KTV chỉ cần mở ứng dụng Google Calendar trên điện thoại, tạo một sự kiện bất kỳ (ví dụ: "Bận việc", "Ăn trưa") đè lên khung thời gian `13:30 - 14:30`.
    * Backend định kỳ kiểm tra Google Calendar Free/Busy API và tự động khóa ca tương ứng trên web.

---

### 3. Use Case 3: Quy trình Xác nhận $\rightarrow$ Khách hủy $\rightarrow$ Tự động mở lại Slot
* **Ngữ cảnh thực tế**: Khách đặt lịch qua web $\rightarrow$ Spa xác nhận $\rightarrow$ Đến ngày hẹn khách bận việc gọi báo hủy $\rightarrow$ Chủ spa xóa hoặc hủy đơn $\rightarrow$ Khung giờ đó phải lập tức hiển thị lại trên web để người khác đặt.
* **Mô hình trạng thái (State Machine)**:
  ```mermaid
  stateDiagram-v2
      [*] --> Available: Khởi tạo
      Available --> Pending: Khách đặt trên Web
      Pending --> Confirmed: Spa gọi/nhắn Zalo xác nhận
      Pending --> Available: Quá 30p chưa duyệt / Khách hủy
      Confirmed --> Cancelled: Khách báo hủy
      Cancelled --> Available: Giải phóng Slot về Web
      Confirmed --> Completed: Trị liệu hoàn tất
  ```
* **Giải pháp kỹ thuật**:
  * Mỗi slot có ID định danh duy nhất (ví dụ: `SLOT_2026-09-12_1500`).
  * Khi đơn chuyển sang trạng thái `Cancelled` hoặc bị xóa khỏi hàng chờ, cờ trạng thái của slot được đặt về `Available` ngay lập tức. Web client qua SSE (Server-Sent Events) hoặc API polling sẽ cập nhật lại tức thì.

---

### 4. Use Case 4: Khách vãng lai đến trực tiếp (Walk-in Quick Lock)
* **Ngữ cảnh thực tế**: Khách lẻ đi ngang qua tiệm hoặc người quen ghé vào đột xuất. KTV tiếp đón và chuẩn bị làm ngay. Nếu KTV không khóa lịch tức thì, khách ở nhà có thể vô tình đặt trùng đúng khung giờ đó.
* **Giải pháp kỹ thuật (Khóa nhanh 1-chạm)**:
  * **Cách 1 (Telegram Bot - Tiện lợi nhất)**: Tạo một Bot Telegram nội bộ. KTV chỉ cần bấm nút `/lock_now` hoặc gửi tin `/lock 15:00` từ điện thoại. Backend nhận lệnh và khóa slot trên web trong vòng 1 giây.
  * **Cách 2 (Quick Action trên Web Admin)**: Mở trang Admin rút gọn trên điện thoại, bấm nút "Khóa Nhanh Ca Hiện Tại" (1 chạm).
  * **Cách 3 (Google Calendar)**: Kéo tạo sự kiện 5 giây trên điện thoại.

---

### 5. Use Case 5: Gói 90 phút (Toàn Thân) chiếm slot kép (Consecutive Slot Blocking)
* **Ngữ cảnh thực tế**: Menu trị liệu có các gói 60 phút (Thân trên, Thân dưới) và gói 90 phút (Toàn thân).
  * Các khung giờ niêm yết: `09:00 - 10:00`, `10:30 - 11:30`, `13:30 - 14:30`, `15:00 - 16:00`, `17:00 - 18:00`, `19:00 - 20:00`.
  * Nếu khách chọn gói 90 phút lúc `09:00`, ca sẽ kéo dài từ `09:00` đến `10:30`, cộng thêm 15-20 phút vệ sinh/thay drap $\implies$ Chiếm sang khung giờ của ca `10:30 - 11:30`.
* **Giải pháp kỹ thuật**:
  * **Quy tắc Khóa Liên Hoàn (Cascading Block)**:
    * Khi dịch vụ được chọn có thời lượng `90 phút`:
    * Backend tự động khóa **cả ca được chọn (`09:00`) VÀ ca liền sau (`10:30`)**.
    * Đảm bảo không xảy ra hiện tượng chồng chéo hai khách cùng một thời điểm (Overbooking).

---

### 6. Use Case 6: Thời gian vệ sinh y tế & thay drap 1 lần (Turnaround Buffer Time)
* **Ngữ cảnh thực tế**: Êm Êm cam kết tiêu chuẩn vệ sinh y khoa: 100% khăn trải và ga giường trị liệu được thay mới hoàn toàn sau mỗi lần tiếp đón, KTV sát khuẩn tay và dụng cụ. Cần tối thiểu `15 - 20 phút` giữa 2 ca liên tiếp.
* **Giải pháp kỹ thuật**:
  * Các khung giờ hiển thị đã được thiết kế sẵn vùng đệm (buffer):
    * `09:00 - 10:00` $\rightarrow$ Ca sau: `10:30` (Nghỉ 30 phút).
    * `10:30 - 11:30` $\rightarrow$ Ca sau: `13:30` (Nghỉ trưa & dọn dẹp).
    * `13:30 - 14:30` $\rightarrow$ Ca sau: `15:00` (Nghỉ 30 phút).
  * Trong mọi thuật toán tính toán lịch trống của backend, luôn mặc định thêm tham số `BUFFER_MINUTES = 20` vào thời gian kết thúc của ca.

---

### 7. Use Case 7: Chống đặt lịch ảo / Spam giữ chỗ (Ghost Booking Prevention)
* **Ngữ cảnh thực tế**: Người dùng vào nghịch ngợm điền thông tin ảo hoặc đối thủ cố tình spam giữ chỗ khiến các slot chuyển sang `Pending` và biến mất khỏi web, khách thật không thể đặt.
* **Giải pháp kỹ thuật**:
  * **Auto-Expire Pending**: Mọi đơn đặt ở trạng thái `Pending` chỉ được giữ chỗ tối đa **25 - 30 phút**.
  * Sau thời gian này, nếu chủ spa chưa bấm `Confirm` (hoặc hệ thống chưa nhận được phản hồi Zalo), đơn sẽ tự động chuyển về `Expired` và slot được trả lại tự do trên website.
  * **Rate Limiting theo IP & SĐT**: Mỗi số điện thoại / IP chỉ được tạo tối đa 2 đơn `Pending` cùng lúc trong ngày.

---

### 8. Use Case 8: Khách dời lịch hẹn (Atomic Reschedule)
* **Ngữ cảnh thực tế**: Khách gọi xin đổi từ `15:00 Thứ Sáu` sang `17:00 Thứ Bảy`.
* **Rủi ro**: Nếu thao tác tách rời (hủy ca cũ trước, đặt ca mới sau), có nguy cơ ca mới đã bị người khác đặt hoặc mạng lỗi giữa chừng khiến khách mất lịch.
* **Giải pháp kỹ thuật**:
  * Thực hiện **Giao dịch Nguyên tử (Database Atomic Transaction)**:
    $$\text{Giải phóng Slot cũ} \iff \text{Chiếm giữ Slot mới}$$
  * Đảm bảo cả hai hành động cùng thành công hoặc cùng thất bại, không bao giờ bị treo slot lơ lửng.

---

### 9. Use Case 9: Khách sử dụng thẻ Combo (5 buổi / 10 buổi)
* **Ngữ cảnh thực tế**: Khách đã mua Combo 5 buổi Toàn thân hoặc Combo 10 buổi Thân trên/Thân dưới. Khách chỉ đặt trước 1 buổi đầu, các buổi sau khách sẽ lên web book dần theo từng tuần.
* **Giải pháp kỹ thuật**:
  * Khi khách chọn "Gói Combo" và nhập SĐT:
    * Backend tra cứu số điện thoại trong danh sách khách hàng combo.
    * Hiển thị: *"Chào bạn Minh, bạn đang còn 4/5 buổi Combo Toàn Thân."*
    * Chi phí dịch vụ hiển thị: `0 VNĐ (Đã thanh toán theo gói Combo)`.
    * Sau khi hoàn tất ca trị liệu, số buổi của khách tự động trừ đi 1.

---

## II. THIẾT KẾ CƠ SỞ DỮ LIỆU ĐỀ XUẤT (DATA SCHEMA)

### 1. Bảng `slots` (Khung giờ trong ngày)
| Tên cột | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `id` | `VARCHAR(50)` | Khóa chính, ví dụ: `SLOT_2026-09-12_0900` |
| `date` | `DATE` | Ngày hẹn (`2026-09-12`) |
| `start_time` | `TIME` | Giờ bắt đầu (`09:00`) |
| `end_time` | `TIME` | Giờ kết thúc (`10:00`) |
| `status` | `VARCHAR(20)` | `available`, `pending`, `confirmed`, `blocked`, `walk_in` |
| `booking_id` | `VARCHAR(50)` | Liên kết tới đơn đặt (nếu có) |
| `updated_at` | `TIMESTAMP` | Thời gian cập nhật trạng thái |

### 2. Bảng `bookings` (Thông tin đơn đặt)
| Tên cột | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `id` | `VARCHAR(50)` | Mã đơn đặt |
| `customer_name` | `VARCHAR(100)` | Họ tên khách hàng |
| `customer_phone` | `VARCHAR(20)` | Số điện thoại |
| `customer_note` | `TEXT` | Ghi chú thể trạng / yêu cầu riêng |
| `service_name` | `VARCHAR(100)` | Tên gói trị liệu |
| `service_price` | `VARCHAR(50)` | Giá dịch vụ |
| `service_duration`| `INT` | Thời lượng (60 hoặc 90 phút) |
| `slot_id` | `VARCHAR(50)` | Khóa ngoại trỏ tới `slots.id` |
| `consecutive_slot_id` | `VARCHAR(50)` | Slot phụ bị khóa kèm (nếu là gói 90p) |
| `status` | `VARCHAR(20)` | `pending`, `confirmed`, `cancelled`, `completed` |
| `source` | `VARCHAR(20)` | `online_web`, `walk_in`, `zalo`, `phone` |
| `created_at` | `TIMESTAMP` | Thời điểm khách gửi đơn |

### 3. Bảng `combos` (Theo dõi gói dài hạn)
| Tên cột | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `id` | `VARCHAR(50)` | Mã thẻ combo |
| `customer_phone` | `VARCHAR(20)` | SĐT khách hàng |
| `combo_type` | `VARCHAR(50)` | `combo_5_full`, `combo_10_target` |
| `total_sessions` | `INT` | Tổng số buổi (5 hoặc 10) |
| `remaining_sessions`| `INT` | Số buổi còn lại |
| `expire_date` | `DATE` | Hạn dùng (6 tháng kể từ ngày mua) |

---

## III. SO SÁNH 2 PHƯƠNG ÁN CÔNG NGHỆ TRIỂN KHAI

| Tiêu chí | Phương án 1: Google Sheets + Telegram Bot | Phương án 2: Supabase (PostgreSQL) + Admin Web |
| :--- | :--- | :--- |
| **Chi phí hạ tầng** | **0 VNĐ trọn đời** (Serverless) | **0 VNĐ** (Gói Free Tier của Supabase rất dư dả) |
| **Độ khó bảo trì** | Cực kỳ thấp, dễ dùng như một file Excel | Cần duy trì mã nguồn trang Admin |
| **Thao tác trên Mobile** | Siêu tiện: Khóa/Mở qua app Sheets hoặc chat Telegram Bot | Mở trình duyệt vào trang `admin.html` |
| **Thông báo đơn mới** | Bắn tin nhắn tự động về Telegram kèm nút bấm | Bắn tin Telegram / Webhook Realtime |
| **Khả năng mở rộng** | Phù hợp cho 1-2 giường / 1 chi nhánh | Rất mạnh, sẵn sàng mở chuỗi nhiều chi nhánh |

---

## IV. LỘ TRÌNH TRIỂN KHAI KHUYẾN NGHỊ

1. **Giai đoạn 1 (Thiết lập Backend cốt lõi)**:
   - Tạo cấu trúc bảng lịch và đơn đặt trên cơ sở dữ liệu đã chọn.
   - Viết các API Endpoint:
     - `GET /api/available-slots?date=YYYY-MM-DD` (Trả về các ca trống sau khi đã trừ giờ quá khứ, Lead Time và ca đã bị khóa).
     - `POST /api/book` (Tạo đơn `Pending`, tự động khóa slot chính và slot phụ nếu là ca 90p).
     - `POST /api/quick-lock` (Khóa tức thời cho khách walk-in hoặc nghỉ đột xuất).
     - `POST /api/update-status` (Duyệt / Hủy / Hoàn tất).
2. **Giai đoạn 2 (Tích hợp Frontend)**:
   - Thay thế dữ liệu tĩnh trong `app.js` bằng việc gọi API lấy lịch động.
   - Khi khách chọn ngày, gọi API để lấy danh sách ca còn nhận khách theo thời gian thực.
3. **Giai đoạn 3 (Tự động hóa thông báo)**:
   - Tích hợp gửi thông báo Telegram tức thì về điện thoại của KTV/chủ spa mỗi khi có đơn mới.
   - Bổ sung nút bấm trực tiếp trên tin nhắn Telegram: `[Xác Nhận Đơn]` và `[Hủy / Mở Lại Slot]`.
