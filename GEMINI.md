# Êm Êm Wellness - Hướng Dẫn & Quy Chuẩn Dự Án

Mọi sửa đổi, tái thiết kế (redesign), refactor hoặc bổ sung tính năng mới cho dự án này BẮT BUỘC tuân thủ tài liệu:
- [DESIGN_RULES.md](file:///c:/Users/ns20372840/.gemini/antigravity-ide/scratch/0.Personal/a-minh-business/em-em-wellness/DESIGN_RULES.md)

## Tóm tắt quy tắc cốt lõi:
1. **Phone View First**: Ưu tiên điện thoại; pop-up Chi Tiết Trị Liệu & Đặt Chỗ vừa khít 1 màn hình (`96dvh`), không cuộn lồng nhau.
2. **Typography - Không rớt chữ**: Ngắt dòng theo đúng cụm từ có nghĩa (ví dụ: `chứng chỉ / hành nghề`, `Thân Dưới và Chuyên Sâu` trên 1 dòng). Không để rớt một chữ cô độc ("chúng", "bạn", "sâu", "nghề").
3. **Nhận diện thương hiệu**:
   - Header Logo: `logo.png` trên nền tối (KHÔNG thay đổi).
   - Tab Favicon: `picture/Hình logo nhỏ.jpg`.
4. **Nút đóng & biểu tượng**: Bắt buộc dùng Vector SVG hình học căn giữa tuyệt đối, không dùng ký tự chữ như `&times;`.
5. **Pop-up Desktop**: Thụt lề `padding-top: 2.2rem` để hàng nút tab không bao giờ va chạm với nút thoát `×`.
6. **Hiệu năng & Tránh lag**:
   - Dừng Three.js render loop (`stopAnimationLoop()`) ngay khi đóng modal hoặc ẩn tab.
   - Lazy-load 3D model theo tương tác người dùng (`pointerenter`), không tải 34MB lúc tải trang.
   - Giới hạn `pixelRatio <= 1.75`.
7. **Phạm vi nghiệp vụ**: Không thêm tính năng thanh toán, đặt cọc hay quản lý tài chính; dừng ở bước cấp mã đặt chỗ.
