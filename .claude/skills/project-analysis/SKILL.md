---
name: project-analysis
description: Phân tích repository phần mềm trước khi lập trình. Sử dụng khi tiếp nhận dự án mới, tìm hiểu kiến trúc, truy vết chức năng, xác định quy ước code, kiểm tra dependency hoặc đánh giá phạm vi ảnh hưởng của một thay đổi.
---

# Phân tích dự án phần mềm

## 1. Mục tiêu

Giúp AI hiểu cấu trúc, kiến trúc, quy ước và luồng xử lý thực tế của dự án trước khi đề xuất hoặc sửa code.

Repository hiện tại là nguồn thông tin chính để xác định cách dự án hoạt động.

Không tự suy đoán kiến trúc, phiên bản framework, quy tắc lập trình hoặc nghiệp vụ chỉ dựa trên thông lệ chung.

## 2. Khảo sát repository ban đầu

Trước khi thay đổi code:

1. Xác định thư mục gốc và các module chính.
2. Kiểm tra Git branch và trạng thái working tree.
3. Xác định các thay đổi có sẵn của người dùng và bảo toàn chúng.
4. Kiểm tra các file cấu hình liên quan:
   - pom.xml
   - build.gradle hoặc build.gradle.kts
   - package.json
   - package-lock.json, pnpm-lock.yaml hoặc yarn.lock
   - tsconfig.json
   - vite.config.ts hoặc cấu hình bundler tương ứng
   - application.yml và application.properties
   - Dockerfile và Docker Compose
   - Cấu hình CI/CD
   - OpenAPI YAML/JSON
   - Database migration
   - README và tài liệu dự án
5. Xác định phiên bản Java, Spring Boot, Node.js, React và TypeScript đang sử dụng.
6. Xác định các lệnh build, test, lint và kiểm tra kiểu dữ liệu hiện có.

Chỉ kiểm tra những file thực sự tồn tại. Không giả định dự án có đầy đủ tất cả các file trên.

## 3. Phân tích kiến trúc backend

Đối với Java và Spring Boot:

1. Xác định điểm khởi chạy ứng dụng và ranh giới các module.
2. Phân tích cấu trúc package.
3. Tìm Controller, Service, Repository, Entity, DTO, Mapper và Configuration.
4. Truy vết luồng xử lý nghiệp vụ từ HTTP request đến response.
5. Xác định transaction và cơ chế lưu trữ dữ liệu.
6. Xác định cơ chế authentication và authorization.
7. Tìm các tích hợp với API bên ngoài, message broker, cache và dịch vụ phụ thuộc.
8. Xác định cách xử lý exception, validation, logging và observability.
9. Phân biệt code được sinh tự động với code do lập trình viên quản lý.
10. Tìm các Unit Test và Integration Test liên quan.

Không tự áp đặt kiến trúc mới trước khi hiểu cách triển khai hiện tại.

## 4. Phân tích kiến trúc frontend

Đối với React và TypeScript:

1. Xác định entry point và cấu hình routing.
2. Tìm các page, component, hook, API client và module quản lý state.
3. Xác định thư viện quản lý state đang sử dụng.
4. Phân tích quy ước styling và các UI component dùng chung.
5. Xác định cơ chế authentication, authorization và bảo vệ route.
6. Truy vết cách dữ liệu API được chuyển thành trạng thái giao diện.
7. Kiểm tra cách xử lý loading, empty, error và success.
8. Tìm các component test và end-to-end test.
9. Kiểm tra cấu hình môi trường frontend.
10. Xác định quy tắc lint, format và kiểm tra TypeScript.

Không tự thêm thư viện quản lý state hoặc UI mới nếu chưa có lý do rõ ràng.

## 5. Truy vết chức năng từ đầu đến cuối

Khi phân tích một chức năng, phải truy vết luồng xử lý thực tế.

Đối với một chức năng full-stack thông thường, hãy kiểm tra:

1. Thao tác của người dùng trên giao diện.
2. React component và state management.
3. API client và HTTP request.
4. OpenAPI contract nếu dự án sử dụng.
5. Backend Controller.
6. Validation và authorization.
7. Service xử lý nghiệp vụ.
8. Repository, database hoặc dịch vụ bên ngoài.
9. Mapping response và xử lý lỗi.
10. Trạng thái giao diện sau khi nhận response.

Phải chỉ ra đường dẫn file và tên class, method hoặc symbol có liên quan.

Không khẳng định một class, method, endpoint hoặc trường dữ liệu tồn tại nếu chưa kiểm tra.

## 6. Phân tích dependency và cấu hình

Khi kiểm tra dependency hoặc cấu hình:

1. Đọc cấu hình build liên quan.
2. Kiểm tra thư viện đã tồn tại trong dự án hay chưa.
3. Đánh giá tính tương thích phiên bản.
4. Ưu tiên sử dụng thư viện và tiện ích có sẵn.
5. Xác định các giá trị cấu hình phụ thuộc môi trường.
6. Không hiển thị password, token, private key hoặc dữ liệu khách hàng nhạy cảm.
7. Không in toàn bộ file môi trường nếu có chứa thông tin bí mật.

Không đề xuất nâng cấp dependency nếu chưa nêu được lý do và rủi ro tương thích.

## 7. Đánh giá phạm vi ảnh hưởng

Trước khi triển khai thay đổi, xác định:

- Các file có khả năng cần sửa.
- Các module bị ảnh hưởng.
- Ảnh hưởng đến tính tương thích API.
- Ảnh hưởng đến database schema và migration.
- Ảnh hưởng đến authentication và authorization.
- Các dịch vụ phụ thuộc.
- Thay đổi hợp đồng giữa frontend và backend.
- Các test cần bổ sung hoặc cập nhật.
- Rủi ro build và triển khai.

Phân biệt rõ thông tin đã xác minh với giả định.

Nếu thiếu thông tin quan trọng có thể làm thay đổi thiết kế, hãy hỏi người dùng. Với các điểm không mang tính quyết định, hãy nêu giả định hợp lý và tiếp tục.

## 8. Những điều không được làm

- Không sửa source code khi chỉ được yêu cầu phân tích.
- Không xóa, reset hoặc ghi đè thay đổi có sẵn của người dùng.
- Không refactor các module không liên quan.
- Không tự tạo endpoint, field, class hoặc configuration property không có căn cứ.
- Không tuyên bố build hoặc test thành công nếu chưa thực sự chạy.
- Không dùng tìm kiếm Internet thay cho việc đọc source code hiện có.
- Không làm lộ thông tin bí mật khi kiểm tra cấu hình.
- Không sửa code sinh tự động nếu chưa xác định được nguồn sinh code.

## 9. Định dạng kết quả phân tích

Khi phù hợp, hãy trình bày kết quả theo cấu trúc:

### Tổng quan dự án
Tóm tắt cấu trúc repository và các module chính.

### Công nghệ sử dụng
Liệt kê các framework, phiên bản và dependency đã xác minh.

### Kiến trúc và luồng dữ liệu
Giải thích cách chức năng liên quan hoạt động từ frontend đến backend và nơi lưu trữ dữ liệu.

### Quy ước hiện tại
Mô tả các pattern cần tuân thủ khi viết code mới.

### Các file liên quan
Liệt kê đường dẫn file và trách nhiệm của từng file.

### Lệnh build và test
Liệt kê các lệnh được xác định từ cấu hình dự án.

### Phạm vi ảnh hưởng và rủi ro
Nêu các module cần thay đổi, vấn đề tương thích và rủi ro.

### Thông tin chưa xác định
Liệt kê các giả định hoặc câu hỏi còn ảnh hưởng đến việc triển khai.

Với tác vụ nhỏ, hãy trình bày ngắn gọn. Với thay đổi liên quan nhiều module, hãy phân tích đầy đủ hơn.

## 10. Tiêu chí hoàn thành

Chỉ xem việc phân tích là hoàn thành khi:

- Đã xác định các module liên quan.
- Đã kiểm tra quy ước lập trình hiện có.
- Đã hiểu luồng xử lý của chức năng cần thay đổi.
- Đã xác định các file có khả năng bị ảnh hưởng.
- Đã tìm được các lệnh kiểm tra phù hợp.
- Đã ghi nhận các rủi ro và thông tin chưa rõ.
