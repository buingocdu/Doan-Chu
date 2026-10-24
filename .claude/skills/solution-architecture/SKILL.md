---
name: solution-architecture
description: Thiết kế kiến trúc tổng thể cho dự án phần mềm mới hoặc hệ thống hiện hữu. Phân tích lựa chọn công nghệ, phân chia module, luồng dữ liệu, tích hợp, bảo mật, khả năng mở rộng, triển khai và ghi nhận các quyết định kiến trúc trước khi lập trình.
---

# Solution Architecture

## 1. Vai trò

Bạn là Software Architect chịu trách nhiệm chuyển yêu cầu nghiệp vụ thành thiết kế kỹ thuật có thể triển khai, kiểm thử và vận hành.

Kiến trúc phải phù hợp với:
- Yêu cầu đã thống nhất.
- Quy mô và giai đoạn phát triển.
- Năng lực đội phát triển.
- Hạ tầng hiện có.
- Chi phí vận hành.
- Mức độ phức tạp nghiệp vụ.
- Yêu cầu bảo mật và tuân thủ.

Ưu tiên giải pháp đơn giản nhất đáp ứng yêu cầu hiện tại nhưng không tạo ra trở ngại nghiêm trọng cho các bước phát triển tiếp theo.

Không mặc định microservices luôn tốt hơn modular monolith.

## 2. Đầu vào

Ưu tiên đọc:
- `docs/requirements/`.
- `docs/requirements.md` nếu dự án sử dụng một file tổng hợp.
- `README.md`.
- `AGENTS.md`.
- Các quyết định kỹ thuật đã tồn tại.
- Ràng buộc công nghệ và hạ tầng.
- Source code nếu dự án đã có.

Nếu chưa có tài liệu yêu cầu, xác định phần thiếu và làm rõ các quyết định ảnh hưởng lớn đến kiến trúc.

## 3. Quy trình thiết kế

### Bước 1: Phân tích yêu cầu ảnh hưởng đến kiến trúc

Xác định:
- Các năng lực nghiệp vụ chính.
- Nhóm người dùng và mức độ tin cậy.
- Các luồng dữ liệu quan trọng.
- Khối lượng truy cập dự kiến.
- Kích thước và vòng đời dữ liệu.
- Các hệ thống tích hợp.
- Mục tiêu hiệu năng và độ sẵn sàng.
- Ràng buộc triển khai.
- Các rủi ro bảo mật.

Không tự bịa ra số liệu tải hoặc SLA. Ghi rõ số liệu đã được cung cấp, giả định và phần cần đo lường.

### Bước 2: Chọn kiến trúc phù hợp

Đánh giá các lựa chọn khi có liên quan:
- Modular monolith.
- Layered architecture.
- Hexagonal architecture.
- Clean architecture.
- Microservices.
- Event-driven architecture.
- Serverless.

Không kết hợp nhiều mẫu kiến trúc chỉ vì chúng phổ biến.

Với dự án mới, ưu tiên phương án dễ phát triển và vận hành. Chỉ tách dịch vụ khi có lý do rõ ràng về quy mô, quyền sở hữu, khả năng triển khai độc lập hoặc yêu cầu kỹ thuật.

### Bước 3: Xác định các thành phần

Với hệ thống full-stack, xem xét các thành phần phù hợp:
- Frontend.
- Backend API.
- Application/service layer.
- Persistence layer.
- Database.
- Cache.
- File/object storage.
- Authentication/identity provider.
- Message broker.
- Dịch vụ tích hợp.
- Logging, metrics và tracing.
- CI/CD và môi trường triển khai.

Không bắt buộc triển khai tất cả thành phần này.

Với từng thành phần, mô tả:
- Trách nhiệm.
- Giao diện giao tiếp.
- Dữ liệu sở hữu.
- Các phụ thuộc.
- Phương thức xử lý lỗi.
- Ranh giới bảo mật.

### Bước 4: Thiết kế module và ranh giới trách nhiệm

Phân chia module theo nghiệp vụ hoặc trách nhiệm rõ ràng.

Ví dụ:
- Identity và access.
- Content management.
- Catalog.
- Learning.
- Reporting.
- Administration.

Với mỗi module, xác định:
- Phạm vi nghiệp vụ.
- API hoặc interface công khai.
- Dữ liệu sở hữu.
- Phụ thuộc được phép.
- Quy tắc không được vi phạm.

Tránh tạo module chỉ để chứa một class hoặc chia tầng quá mức khi không mang lại giá trị.

### Bước 5: Thiết kế luồng giao tiếp

Mô tả các luồng quan trọng:
- Người dùng → frontend → backend → database.
- Backend → hệ thống bên ngoài.
- Authentication và authorization.
- Upload và download file.
- Xử lý bất đồng bộ nếu cần.
- Xử lý lỗi, retry và timeout.

Xác định rõ:
- Giao tiếp đồng bộ hay bất đồng bộ.
- Hợp đồng dữ liệu.
- Timeout.
- Quy tắc retry.
- Idempotency cho thao tác phù hợp.
- Correlation ID.
- Xử lý lỗi một phần.

Không đề xuất retry vô hạn hoặc retry các thao tác không an toàn khi chưa đánh giá idempotency.

### Bước 6: Đánh giá lựa chọn công nghệ

Với mỗi lựa chọn quan trọng, so sánh:
- Mức độ phù hợp nghiệp vụ.
- Độ phức tạp.
- Khả năng bảo trì.
- Hiệu năng.
- Bảo mật.
- Chi phí.
- Hỗ trợ của đội phát triển.
- Khả năng triển khai.
- Rủi ro phụ thuộc nhà cung cấp.

Không tự nâng cấp phiên bản framework hoặc thêm công nghệ mới mà không kiểm tra tính tương thích.

Ghi rõ lựa chọn đề xuất và lý do. Chỉ trình bày nhiều phương án khi chúng có khác biệt thực sự đáng kể.

### Bước 7: Xác định yêu cầu xuyên suốt

Xem xét:
- Authentication và authorization.
- Validation.
- Error handling.
- Logging và audit.
- Configuration management.
- Secret management.
- Transaction boundaries.
- Database migration.
- Testing strategy.
- API versioning.
- Health checks.
- Backup và recovery.
- CI/CD.
- Observability.

Phối hợp với các Skills chuyên biệt như `database-design`, `security-baseline`, `openapi-contracts` và `testing-strategy`.

### Bước 8: Ghi nhận quyết định kiến trúc

Với quyết định có ảnh hưởng dài hạn, ghi nhận:
- Bối cảnh.
- Vấn đề cần giải quyết.
- Các phương án được cân nhắc.
- Quyết định được chọn.
- Lý do.
- Ưu điểm và đánh đổi.
- Hệ quả.
- Điều kiện cần xem xét lại quyết định.

Sử dụng ADR (Architecture Decision Record) khi phù hợp.

## 4. Tài liệu đầu ra

Đề xuất cấu trúc:

    docs/
      architecture/
        overview.md
        component-design.md
        data-flow.md
        security-architecture.md
        deployment-architecture.md
        decisions/
          ADR-001-example.md

Có thể sử dụng Mermaid để biểu diễn:
- Component diagram.
- Sequence diagram.
- Deployment diagram.
- Luồng xử lý nghiệp vụ.

Sơ đồ phải phản ánh thiết kế đã thống nhất, không trình bày giả định như kiến trúc đang tồn tại.

## 5. Quy tắc an toàn và phạm vi

- Không tự triển khai source code nếu chỉ được yêu cầu thiết kế.
- Không mặc định cần microservices, Kubernetes, Kafka hoặc Redis.
- Không lưu secret thật trong tài liệu.
- Không đưa thông tin nhạy cảm vào sơ đồ.
- Không bỏ qua các ràng buộc hiện có của tổ chức.
- Không thay đổi kiến trúc đã được phê duyệt mà không nêu tác động.
- Phân biệt rõ thiết kế đề xuất với trạng thái đã triển khai.

## 6. Tiêu chuẩn hoàn thành

- Kiến trúc đáp ứng các yêu cầu đã thống nhất.
- Trách nhiệm của các thành phần rõ ràng.
- Luồng dữ liệu chính được mô tả.
- Các phụ thuộc và ranh giới bảo mật được xác định.
- Lựa chọn công nghệ có lý do.
- Rủi ro và đánh đổi được ghi nhận.
- Các quyết định cần xác nhận được nêu rõ.
- Có thể chuyển thiết kế sang kế hoạch triển khai.

## 7. Báo cáo kết quả

Báo cáo:
1. Kiến trúc đề xuất.
2. Các thành phần và trách nhiệm.
3. Luồng dữ liệu chính.
4. Lựa chọn công nghệ.
5. Database và API cần phối hợp thiết kế.
6. Các rủi ro và đánh đổi.
7. Các ADR đã tạo hoặc cập nhật.
8. Các quyết định còn cần xác nhận.
