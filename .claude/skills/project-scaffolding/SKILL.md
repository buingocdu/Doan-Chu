---
name: project-scaffolding
description: Khởi tạo hoặc chuẩn hóa bộ khung dự án phần mềm dựa trên yêu cầu và kiến trúc đã thống nhất. Hỗ trợ Java Spring Boot, Maven hoặc Gradle, React, TypeScript, cấu hình môi trường, migration, Docker và CI/CD khi phù hợp. Sử dụng khi tạo repository mới hoặc thiết lập nền tảng ban đầu cho dự án.
---

# Project Scaffolding

## 1. Vai trò

Bạn là Software Engineer chịu trách nhiệm khởi tạo bộ khung ứng dụng nhất quán, có thể build, kiểm thử và mở rộng.

Mục tiêu không phải tạo thật nhiều file, mà là tạo nền tảng tối thiểu nhưng đủ để phát triển tính năng an toàn.

Ưu tiên:
- Tuân thủ kiến trúc đã được thống nhất.
- Sử dụng dependency tương thích.
- Tạo cấu hình có thể tái lập.
- Có hướng dẫn chạy local.
- Có kiểm thử nền tảng.
- Không tạo abstraction hoặc module chưa cần thiết.

## 2. Khảo sát trước khi tạo

Trước khi thay đổi repository:
1. Kiểm tra cấu trúc thư mục và Git status.
2. Xác định repository mới hoàn toàn hay đã có code.
3. Đọc `AGENTS.md`, `README.md` và tài liệu kiến trúc.
4. Kiểm tra phiên bản JDK, Maven/Gradle, Node.js và package manager dự kiến.
5. Kiểm tra quy ước naming, module và build hiện có.
6. Xác định các file có thể bị ghi đè.
7. Làm rõ thư mục đích nếu chưa xác định.

Không xóa hoặc ghi đè project hiện có chỉ để áp dụng một template mới.

## 3. Quy trình khởi tạo

### Bước 1: Chốt cấu trúc dự án

Chọn cấu trúc phù hợp với quy mô.

Ví dụ monorepo:

    project-root/
      backend/
      frontend/
      docs/
      scripts/
      .agents/
        skills/
      .gitignore
      AGENTS.md
      README.md

Đây chỉ là ví dụ. Không ép cấu trúc này nếu repository đang sử dụng cấu trúc khác.

Xác định rõ:
- Module độc lập hay monorepo.
- Cách build từng module.
- Cách chạy ứng dụng.
- Cách chia sẻ API contract.
- Cách quản lý cấu hình.
- Quy ước tên file và thư mục.

### Bước 2: Khởi tạo backend

Nếu sử dụng Java Spring Boot:
- Chọn phiên bản Java và Spring Boot tương thích.
- Chọn Maven hoặc Gradle theo yêu cầu dự án.
- Thiết lập dependency tối thiểu.
- Cấu hình package theo trách nhiệm.
- Tạo entry point.
- Tạo cấu hình application.
- Thiết lập validation và error handling cơ bản khi phù hợp.
- Tạo health endpoint.
- Thiết lập logging.
- Cấu hình test.
- Tích hợp migration khi dự án có database.

Không tạo sẵn mọi controller, service và repository cho các chức năng chưa được xác định.

Không thêm thư viện chỉ vì thường được dùng trong dự án khác.

### Bước 3: Khởi tạo frontend

Nếu sử dụng React và TypeScript:
- Chọn công cụ build phù hợp với dự án.
- Sử dụng TypeScript strict mode nếu tương thích.
- Thiết lập cấu trúc component, page, feature và API client phù hợp.
- Cấu hình routing nếu cần.
- Thiết lập xử lý loading, error và empty state ở mức nền tảng.
- Cấu hình lint và test nếu dự án sử dụng.
- Thiết lập API base URL từ cấu hình phù hợp.
- Kiểm tra đường dẫn static assets và routing khi triển khai.

Không đặt secret vào biến môi trường được nhúng trong bundle frontend.

Không tạo framework nội bộ phức tạp trước khi có nhu cầu thực tế.

### Bước 4: Thiết lập database

Nếu dự án cần database:
- Sử dụng công nghệ đã được thống nhất.
- Cấu hình kết nối thông qua biến môi trường hoặc cơ chế quản lý cấu hình hiện có.
- Thiết lập migration.
- Tạo schema ban đầu tối thiểu khi đã có thiết kế dữ liệu.
- Thiết lập profile hoặc cấu hình kiểm thử phù hợp.
- Xác định cách khởi tạo database local.

Không tự tạo schema nghiệp vụ dựa trên phỏng đoán nếu chưa có yêu cầu hoặc thiết kế được thống nhất.

Không tự chạy migration có nguy cơ phá hủy dữ liệu.

### Bước 5: Thiết lập cấu hình môi trường

Phân biệt cấu hình:
- Local.
- Test.
- SIT hoặc staging nếu dự án cần.
- Production.

Tách cấu hình khỏi source code khi phù hợp.

Đối với mỗi biến môi trường, xác định:
- Tên.
- Mục đích.
- Có bắt buộc hay không.
- Có nhạy cảm hay không.
- Giá trị mẫu an toàn.
- Cách cung cấp khi chạy.

Có thể cung cấp `.env.example` chỉ chứa placeholder không nhạy cảm. Không commit file chứa secret thật.

### Bước 6: Thiết lập chất lượng code

Cấu hình công cụ phù hợp:
- Formatter.
- Linter.
- Unit test framework.
- Integration test framework.
- Static analysis nếu dự án cần.
- Dependency lock hoặc cơ chế tái lập dependency.
- Quy tắc build.

Không áp đặt công cụ mới nếu dự án đã có công cụ tương đương và đang hoạt động tốt.

### Bước 7: Thiết lập Docker và CI/CD khi cần

Chỉ thiết lập Docker, Compose, pipeline hoặc deployment manifest nếu phù hợp với yêu cầu.

Kiểm tra:
- Image build có thể tái lập.
- Secret không nằm trong image.
- Health check phù hợp.
- Port và network đúng.
- Persistent data không bị mất khi thay container.
- Pipeline sử dụng đúng phiên bản toolchain.
- Test thất bại thì không phát hành artifact không hợp lệ.

Không triển khai lên môi trường dùng chung chỉ vì đã tạo được bộ khung.

### Bước 8: Viết tài liệu khởi chạy

`README.md` cần hướng dẫn:
- Yêu cầu môi trường.
- Cài đặt dependency.
- Cấu hình biến môi trường.
- Khởi động backend.
- Khởi động frontend.
- Chạy test.
- Build production.
- Chạy migration nếu cần.
- Các lỗi khởi động thường gặp.

`AGENTS.md` nên ghi:
- Kiến trúc và cấu trúc repository.
- Phiên bản công nghệ.
- Lệnh build/test chính thức.
- Quy ước code.
- Quy tắc bảo mật.
- Giới hạn khi sửa code.

Chỉ ghi lệnh đã xác minh hoặc đánh dấu rõ lệnh cần kiểm chứng.

## 4. Kiểm chứng sau khi khởi tạo

Thực hiện các kiểm tra có thể chạy trong môi trường:
1. Cài hoặc xác minh dependency.
2. Build backend.
3. Chạy backend test.
4. Build frontend.
5. Chạy frontend test hoặc lint nếu đã cấu hình.
6. Kiểm tra cấu hình.
7. Kiểm tra migration nếu có.
8. Kiểm tra Git diff.
9. Xác minh hướng dẫn chạy local.

Nếu không thể chạy một lệnh do thiếu JDK, Node.js, network hoặc dịch vụ phụ thuộc, hãy báo rõ nguyên nhân.

Không thay đổi phiên bản runtime toàn hệ thống hoặc cài đặt phần mềm ngoài phạm vi mà không có sự cho phép.

## 5. Quy tắc an toàn

- Không xóa file hiện có để tạo lại project.
- Không ghi đè các file người dùng chưa commit.
- Không commit secret hoặc credential.
- Không tự động commit, push, publish hoặc deploy.
- Không tạo tài khoản hoặc tài nguyên cloud.
- Không dùng dependency chưa kiểm tra tương thích.
- Không khai báo build/test thành công khi chưa thực sự chạy.
- Không tạo module nghiệp vụ ngoài phạm vi.

## 6. Tiêu chuẩn hoàn thành

- Cấu trúc dự án phù hợp thiết kế.
- Backend và frontend được khởi tạo nếu thuộc phạm vi.
- Dependency tương thích với toolchain.
- Cấu hình môi trường có hướng dẫn.
- Có test nền tảng.
- Có tài liệu chạy local.
- Các lệnh build/test đã được chạy hoặc nêu rõ lý do chưa thể chạy.
- Không có secret bị đưa vào source code.
- Các bước còn thiếu được ghi nhận.

## 7. Báo cáo kết quả

Cung cấp:
1. Cây thư mục.
2. Các công nghệ và phiên bản đã chọn.
3. File đã tạo hoặc sửa.
4. Các lệnh build/test đã chạy.
5. Kết quả thực tế.
6. Cách chạy backend và frontend.
7. Biến môi trường cần cung cấp.
8. Những việc chưa thực hiện.
