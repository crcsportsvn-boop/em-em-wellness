# BỘ QUY TẮC THIẾT KẾ & PHÁT TRIỂN GIAO DIỆN (DESIGN & UX RULES)
> **Dự án**: êm êm - Massage & Trị Liệu Chuyên Sâu  
> **Áp dụng**: Bắt buộc tuân thủ cho mọi lần redesign, refactor hoặc bổ sung tính năng mới.

---

## 1. Triết Lý Cốt Lõi: Mobile-View First (Ưu Tiên Màn Hình Điện Thoại)

- **Môi trường sử dụng thực tế**: Người dùng cuối (khách hàng đặt lịch) chủ yếu truy cập trực tiếp từ smartphone (iOS / Android) qua Zalo, Facebook, Instagram.
- **Quy tắc 1-Screen (Không cuộn lồng nhau)**:
  - Các pop-up chính như **Chi Tiết Trị Liệu** (`#anatomyModal`) và **Đặt Chỗ Ngay** (`#bookingModal`) phải hiển thị vừa khít trong **1 màn hình thiết bị** (`height: 96dvh` hoặc `100dvh`).
  - Tuyệt đối không để xảy ra thanh cuộn lồng nhau (nested scrolling) trên điện thoại khiến người dùng khó thao tác.
- **Tỉ lệ phân bổ trên Mobile**:
  - Khung mô hình 3D: Chiếm khoảng `40dvh – 44dvh` ở nửa trên.
  - Khung thông tin điều trị & nút hành động: Chiếm nửa dưới, gọn gàng, chừa khoảng cách chạm (touch target) tối thiểu `44px` cho ngón tay cái.

---

## 2. Quy Tắc Typography: Chống "Rớt Chữ" Quan Trọng (No Orphan Words)

Typography của thương hiệu mang phong cách nhẹ nhàng, tinh tế (Wabi-sabi, Garamond & Plus Jakarta Sans). Các lỗi ngắt dòng làm rơi một chữ đơn độc xuống dòng mới là điều **tối kỵ**.

1. **Ý nghĩa ngữ pháp & Cụm từ nguyên vẹn**:
   - Khi ngắt dòng, phải ngắt theo cụm có nghĩa, không bẻ gãy từ ghép:
     - ✅ Đúng: `Chứng chỉ / hành nghề y khoa`
     - ❌ Sai: `Chứng chỉ hành / nghề y khoa`
     - ✅ Đúng: `Thân Dưới và Chuyên Sâu` (nằm trọn trên 1 dòng với cỡ chữ co giãn phù hợp)
     - ❌ Sai: `Thân Dưới / và Chuyên / Sâu`
2. **Kỹ thuật chống rớt chữ đơn lẻ**:
   - Với tiêu đề (`h1`, `h2`, `.heading-xl`): Sử dụng `text-wrap: balance;` hoặc `text-wrap: pretty;`.
   - Với badge, nhãn gói hoặc tag quan trọng: Sử dụng `white-space: nowrap;` hoặc tinh chỉnh `clamp()` / `font-size` để bảo đảm các chữ như *"chúng"*, *"bạn"*, *"sâu"*, *"nghề"* không bao giờ bị rơi cô độc xuống hàng dưới.
   - Khi có dấu gạch chéo hoặc từ nối, ưu tiên dùng khoảng trắng không ngắt dòng `&nbsp;` giữa các từ đi liền nhau.

---

## 3. Nhận Diện Thương Hiệu & Quy Chuẩn Tài Nguyên Ảnh (Brand Identity)

- **Logo thanh điều hướng Header**:
  - File sử dụng: [`logo.png`](file:///c:/Users/ns20372840/.gemini/antigravity-ide/scratch/0.Personal/a-minh-business/em-em-wellness/logo.png) (Logo chữ trắng thanh mảnh, sắc nét).
  - Vị trí: Đặt trên thanh header có hiệu ứng liquid kính tối màu (`#2D1F1A`).
  - **Quy tắc**: **KHÔNG ĐƯỢC THAY ĐỔI** logo header này.
- **Badge / Favicon Tab trình duyệt**:
  - File sử dụng: [`picture/Hình logo nhỏ.jpg`](file:///c:/Users/ns20372840/.gemini/antigravity-ide/scratch/0.Personal/a-minh-business/em-em-wellness/picture/H%C3%ACnh%20logo%20nh%E1%BB%8F.jpg) (Hình logo chữ nhật vuông vức, nền nâu đất ấm).
  - **Lý do**: Logo nhỏ có nền nâu đất tương phản rất tốt, hiển thị rõ ràng trên cả thanh tab trình duyệt giao diện sáng (Light mode) và giao diện tối (Dark mode).

---

## 4. Chuẩn Hình Học Nút Đóng & Biểu Tượng: Chống Lệch Tâm 100%

- **Tuyệt đối không dùng ký tự text `&times;` hoặc `×` cho nút tròn**:
  - Ký tự văn bản phụ thuộc vào các đường gióng font (`baseline`, `ascender`, `descender`, `line-height`), luôn bị kéo xệ xuống dưới và lệch phải, làm mất tính thẩm mỹ cao cấp.
- **Bắt buộc dùng Vector SVG hình học thuần túy**:
  - Cấu trúc nút chuẩn:
    ```html
    <button id="closeAnatomyBtn" class="close-btn" title="Đóng" aria-label="Đóng">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1.5 1.5L10.5 10.5M1.5 10.5L10.5 1.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </svg>
    </button>
    ```
  - Hai đường nét chéo cắt nhau đúng tại điểm tâm toán học `(6, 6)`.
  - Căn giữa bằng Flexbox: `display: flex; align-items: center; justify-content: center; padding: 0; line-height: 0;`.
  - SVG con: `display: block; margin: auto; pointer-events: none;`.

---

## 5. Bố Cục Pop-up & Chống Va Chạm Nút (Desktop & Web View)

- Trên màn hình máy tính (Desktop `min-width: 881px`):
  - Nút đóng `×` cố định ở góc trên bên phải (`top: 0.85rem; right: 1.15rem;`).
  - Cột nội dung và thanh tab gói (`.atlas-details-column`): Bắt buộc phải có khoảng thụt lề trên `padding-top: 2.2rem;` và `padding-right: 2.4rem;`.
  - **Mục đích**: Bảo đảm hàng nút *Thân Trên*, *Thân Dưới*, *Toàn Thân (90p)* luôn nằm tách biệt hoàn toàn phía dưới nút `×`, không bao giờ bị nút đóng đè lên hoặc che khuất diện tích bấm.
- **Nội dung Chi Tiết Trị Liệu**:
  - Chỉ tập trung hiển thị tên các nhóm cơ trọng điểm (dạng thẻ chip tương tác ngắn gọn).
  - Lược bỏ các đoạn văn mô tả dài dòng trong pop-up để người dùng có thể quét nhanh và tương tác ngay với mô hình 3D.

---

## 6. Phạm Vi Tính Năng: Giữ Tối Giản (Scope Restraint)

- **Không tích hợp quản lý tài chính hoặc đặt cọc**:
  - Luồng đặt chỗ dừng lại ở: Nhập thông tin khách hàng $\rightarrow$ Xác nhận thời gian & gói dịch vụ $\rightarrow$ Xuất mã đặt chỗ.
  - Tuyệt đối không tự ý bổ sung cổng thanh toán, đặt cọc hay các module tài chính phức tạp.

---

## 7. Quy Chuẩn Hiệu Năng & Tài Nguyên (Performance & Anti-Lag)

1. **Giải phóng GPU / CPU khi đóng Pop-up**:
   - Vòng lặp `requestAnimationFrame` của Three.js phải được dừng lập tức bằng `stopAnimationLoop()` khi người dùng đóng modal hoặc chuyển tab (`visibilitychange`).
   - Tuyệt đối không để canvas 3D chạy ẩn ngầm gây tụt FPS và nóng máy.
2. **Cơ chế nạp mô hình Lazy-Loading**:
   - Không tải đồng loạt 34MB tệp nén 3D khi vừa vào trang chủ.
   - Chỉ nạp ngầm danh mục `atlas.json` lúc mạng rảnh (`requestIdleCallback`).
   - Tải mô hình 3D khi người dùng rê chuột (`pointerenter`) hoặc bấm vào nút xem chi tiết.
3. **Giới hạn Pixel Ratio trên màn hình Retina**:
   - Khống chế `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))` để giữ khung hình mượt mà trên iPhone và màn hình mật độ điểm ảnh cao.
4. **Caching & Security**:
   - Mọi tệp tĩnh trong `/models/`, `/assets/`, `/picture/` phải được cấu hình `Cache-Control: public, max-age=31536000, immutable` trong `vercel.json`.
