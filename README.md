# PhotoBooth Đẹp

Đây là ứng dụng PhotoBooth cho phép bạn chụp ảnh trực tiếp từ webcam, áp dụng các bộ lọc và tải xuống ảnh đã chụp.

## Tính năng

- Chụp ảnh từ webcam
- Áp dụng các bộ lọc: bình thường, đen trắng, sepia, đảo màu, vintage
- Tải xuống ảnh đã chụp
- Hiệu ứng flash khi chụp
- Giao diện thân thiện, đáp ứng trên mọi thiết bị

## Cách sử dụng

1. Mở trang web
2. Cho phép truy cập webcam khi được yêu cầu
3. Chọn bộ lọc nếu muốn
4. Nhấn nút "Chụp ảnh"
5. Tải xuống ảnh bằng nút "Tải về"
6. Chụp thêm ảnh bằng nút "Chụp lại"

## Cách deploy lên GitHub Pages

1. Tạo một tài khoản GitHub nếu bạn chưa có
2. Tạo một repository mới trên GitHub
3. Push code lên repository của bạn:

```bash
# Khởi tạo Git repository cục bộ
git init

# Thêm tất cả file vào staging
git add .

# Commit các thay đổi
git commit -m "Initial commit"

# Kết nối với repository từ xa (thay USERNAME và REPOSITORY_NAME)
git remote add origin https://github.com/USERNAME/REPOSITORY_NAME.git

# Push code lên GitHub
git push -u origin main
```

4. Vào phần "Settings" của repository 
5. Cuộn xuống phần "GitHub Pages"
6. Trong mục "Source", chọn nhánh (branch) bạn muốn sử dụng (thường là "main")
7. Chọn thư mục gốc (root) và lưu lại
8. Sau vài phút, trang web của bạn sẽ được deploy và có thể truy cập tại 
   https://USERNAME.github.io/REPOSITORY_NAME

## Yêu cầu kỹ thuật

- Trình duyệt hiện đại với hỗ trợ WebRTC (Chrome, Firefox, Safari, Edge)
- Quyền truy cập webcam

## Công nghệ sử dụng

- HTML5
- CSS3
- JavaScript (ES6+)
- WebRTC API cho truy cập webcam
- Canvas API cho xử lý ảnh
