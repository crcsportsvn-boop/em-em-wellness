# Quy tắc Thiết kế & Phát triển Êm Êm Wellness (Project Rules)

> Tham khảo chi tiết tại file [DESIGN_RULES.md](../../DESIGN_RULES.md).

Khi làm việc trên dự án này, Agent BẮT BUỘC tuân thủ các quy tắc sau:

1. **Mobile-First**: Luôn ưu tiên giao diện điện thoại (375px - 430px). Pop-up Chi Tiết Trị Liệu và Đặt Chỗ phải vừa khít trong 1 màn hình (`96dvh` / `100dvh`), không cuộn lồng nhau.
2. **Không rớt chữ**: Tuyệt đối không để rớt chữ đơn lẻ xuống dòng mới (ví dụ: "chúng", "bạn", "sâu", "nghề"). Ngắt dòng phải theo cụm từ có nghĩa (ví dụ: "chứng chỉ / hành nghề y khoa", "Thân Dưới và Chuyên Sâu").
3. **Nhận diện thương hiệu**:
   - Header logo: Dùng `logo.png` trên nền thanh điều hướng tối. KHÔNG thay đổi.
   - Browser Tab Favicon: Luôn dùng `picture/Hình logo nhỏ.jpg`.
4. **Căn giữa nút bấm**: Mọi nút đóng hoặc biểu tượng tròn bắt buộc dùng SVG vector hình học, không dùng ký tự text như `&times;` để tránh lệch tâm font chữ.
5. **Khoảng cách Pop-up Desktop**: Đảm bảo `padding-top: 2.2rem;` và `padding-right: 2.4rem;` để các tab không bị nút đóng đè lên.
6. **Bảo tồn tài nguyên & Hiệu năng**:
   - Luôn tắt vòng lặp Three.js `stopAnimationLoop()` khi đóng modal hoặc khi chuyển tab.
   - Mô hình 3D phải được lazy-load theo ý định người dùng (pointerenter/click), không tải 34MB lúc khởi động.
   - Capping `pixelRatio <= 1.75`.
7. **Phạm vi tính năng**: Không tự ý thêm tính năng tài chính, thanh toán hay đặt cọc. Quá trình đặt chỗ chỉ dừng ở tạo mã lịch hẹn.
