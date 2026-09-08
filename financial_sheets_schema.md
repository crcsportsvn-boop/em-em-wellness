# Cấu Trúc Google Sheets Quản Lý Tài Chính & Vận Hành Êm Êm Wellness Spa

Tài liệu này mở rộng kế hoạch [`booking_plan.md`](file:///c:/Users/ns20372840/.gemini/antigravity-ide/scratch/0.Personal/a-minh-business/em-em-wellness/booking_plan.md) ban đầu, cung cấp cấu trúc chuẩn gồm **5 Sheets** để quản lý đồng bộ giữa Website Booking, Dòng tiền thu/chi thực tế tại quầy, chi phí vận hành và Báo cáo Kết quả Kinh doanh (P&L).

---

## 1. Tab `Slots` (Quản lý khung giờ nhận khách)
Dùng để quản lý các ca nhận khách của spa mỗi ngày (phòng trị liệu & kỹ thuật viên).

| Tên Cột | Kiểu Dữ Liệu | Ví dụ | Ý Nghĩa / Công Thức |
| :--- | :--- | :--- | :--- |
| **A: Date** | YYYY-MM-DD | `2026-09-08` | Ngày làm việc |
| **B: TimeSlot** | HH:mm - HH:mm | `09:00 - 10:00` | Khung giờ tiếp khách |
| **C: RoomID** | Text | `Room-01` | Phòng trị liệu hoặc giường |
| **D: Therapist** | Text | `KTV Thảo` | Kỹ thuật viên phụ trách ca |
| **E: Status** | Enum | `Available` / `Booked` / `Blocked` | Trạng thái khung giờ |
| **F: BookingID** | Text | `EMEM8291` | ID liên kết từ Tab Bookings |

---

## 2. Tab `Bookings` (Lịch hẹn & Cọc Web)
Lưu thông tin khách đặt qua website và trạng thái thanh toán đặt cọc 100.000đ qua cổng SePay / VietQR.

| Tên Cột | Kiểu Dữ Liệu | Ví dụ | Ý Nghĩa / Công Thức |
| :--- | :--- | :--- | :--- |
| **A: BookingID** | Text | `EMEM8291` | Mã định danh duy nhất sinh từ Web |
| **B: Timestamp** | Datetime | `2026-09-08 09:30:12` | Thời gian khách gửi form |
| **C: GuestName** | Text | `Minh Nguyễn` | Họ tên khách hàng |
| **D: Phone** | Text | `0909245911` | Số điện thoại (Zalo) |
| **E: Service** | Text | `Trị liệu thân trên 60p` | Dịch vụ đã chọn |
| **F: SlotDate** | Text | `2026-09-08 15:00` | Lịch hẹn khách đã chọn |
| **G: TotalAmount** | Number | `490000` | Tổng giá trị dịch vụ |
| **H: DepositAmount** | Number | `100000` | Số tiền đặt cọc quy định |
| **I: DepositStatus** | Enum | `Pending` / `Paid` | Trạng thái nhận cọc SePay |
| **J: Note** | Text | `Mỏi cổ vai gáy bên phải` | Ghi chú bệnh lý thể trạng |

---

## 3. Tab `Cashflow_Revenue` (Tổng Hợp Dòng Tiền Thu)
Ghi nhận toàn bộ dòng tiền thu thực tế đổ về spa (không chỉ riêng cọc web mà bao gồm cả thanh toán tại quầy và bán gói combo).

| Tên Cột | Kiểu Dữ Liệu | Ví dụ | Ý Nghĩa / Công Thức |
| :--- | :--- | :--- | :--- |
| **A: TransID** | Text | `REV-20260908-01` | Mã giao dịch thu |
| **B: Date** | Date | `2026-09-08` | Ngày phát sinh thu |
| **C: SourceType** | Enum | `Booking Web (Cọc)` / `Thu Nốt Tại Quầy` / `Khách Vãng Lai` / `Bán Combo` / `Bán Tinh Dầu` | Nguồn doanh thu |
| **D: CustomerName** | Text | `Trần Anh Tú` | Khách hàng |
| **E: ServiceOrItem** | Text | `Gói trị liệu toàn thân 90p` | Chi tiết dịch vụ |
| **F: PaymentMethod** | Enum | `Chuyển Khoản (MB)` / `Tiền Mặt` / `VietQR` | Hình thức thanh toán |
| **G: Amount** | Number | `690000` | Số tiền thu thực tế |
| **H: Therapist** | Text | `KTV Linh` | KTV thực hiện để tính hoa hồng |
| **I: RefBookingID** | Text | `EMEM8291` | Tham chiếu ID booking (nếu có) |

---

## 4. Tab `Expenses` (Dòng Tiền Chi Phí Vận Hành)
Kiểm soát toàn bộ chi phí hoạt động của spa để tính toán lỗ/lãi chính xác.

| Tên Cột | Kiểu Dữ Liệu | Ví dụ | Ý Nghĩa / Công Thức |
| :--- | :--- | :--- | :--- |
| **A: ExpenseID** | Text | `EXP-202609-01` | Mã chứng từ chi |
| **B: Date** | Date | `2026-09-01` | Ngày chi tiền |
| **C: Category** | Enum | `Mặt bằng` / `Điện nước - Internet` / `Vật tư & Tinh dầu` / `Lương & Hoa hồng KTV` / `Marketing` / `Chi phí khác` | Phân loại chi phí |
| **D: Description** | Text | `Tiền thuê nhà 366/1 Lê Quang Định T9` | Chi tiết khoản chi |
| **E: Recipient** | Text | `Chủ nhà` / `Công ty Điện Lực` | Người/Đơn vị nhận tiền |
| **F: Amount** | Number | `15000000` | Số tiền chi |
| **G: ApprovedBy** | Text | `Chủ Spa` / `Manager` | Người phê duyệt |

---

## 5. Tab `PnL_Report` (Báo Cáo Kết Quả Kinh Doanh & Tỷ Suất Lợi Nhuận)
Trang tính tự động tổng hợp dùng hàm Google Sheet (`SUMIFS`) để phục vụ quản lý:

- **Doanh thu tháng (A)**: `=SUMIFS(Cashflow_Revenue!G:G, Cashflow_Revenue!B:B, ">=2026-09-01", Cashflow_Revenue!B:B, "<=2026-09-30")`
- **Tổng chi phí tháng (B)**: `=SUMIFS(Expenses!F:F, Expenses!B:B, ">=2026-09-01", Expenses!B:B, "<=2026-09-30")`
- **Lợi nhuận ròng (Net Profit)**: `= A - B`
- **Tỷ suất sinh lời (Margin %)**: `=(Net Profit / Doanh thu) * 100%`

---

## 6. Kịch Bản Google Apps Script Mở Rộng Đồng Bộ

```javascript
// Webhook nhận thông báo SePay tự động ghi 2 dòng:
// 1. Cập nhật Tab Bookings -> Paid
// 2. Ghi nhận tức thời 1 dòng Doanh thu vào Tab Cashflow_Revenue
function handleSepayWebhook(postData) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  var bookingSheet = sheet.getSheetByName("Bookings");
  var revSheet = sheet.getSheetByName("Cashflow_Revenue");
  
  var sepayCode = postData.content; // Mã nội dung chuyển khoản
  var amount = postData.transferAmount;
  
  // Tìm và cập nhật Booking
  var data = bookingSheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === sepayCode) {
      bookingSheet.getRange(i + 1, 9).setValue("Paid");
      
      // Tự động ghi vào dòng tiền thu thực tế
      revSheet.appendRow([
        "REV-" + sepayCode,
        new Date(),
        "Booking Web (Cọc)",
        data[i][2], // Customer Name
        data[i][4], // Service
        "Chuyển Khoản (SePay)",
        amount,
        "",
        sepayCode
      ]);
      break;
    }
  }
}
```
