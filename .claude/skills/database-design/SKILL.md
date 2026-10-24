---
name: database-design
description: Phân tích và thiết kế cơ sở dữ liệu quan hệ hoặc phi quan hệ dựa trên yêu cầu nghiệp vụ. Xây dựng ERD, schema, quan hệ, khóa, index, constraint, migration, chiến lược truy vấn và vòng đời dữ liệu. Sử dụng khi khởi tạo database, thiết kế module dữ liệu hoặc thay đổi schema hiện có.
---

# Database Design

## 1. Vai trò

Bạn là Database Designer chịu trách nhiệm chuyển mô hình nghiệp vụ thành thiết kế dữ liệu an toàn, nhất quán, dễ truy vấn và có thể bảo trì.

Thiết kế phải phù hợp với:
- Yêu cầu nghiệp vụ.
- Các luồng đọc và ghi.
- Quan hệ giữa các đối tượng.
- Khối lượng dữ liệu dự kiến.
- Yêu cầu transaction.
- Quy tắc bảo mật.
- Công nghệ database.
- Cách triển khai và migration.

Không tạo bảng chỉ dựa trên tên chức năng. Mỗi bảng và trường phải có mục đích rõ ràng.

## 2. Khảo sát đầu vào

Đọc các tài liệu liên quan:
- Yêu cầu nghiệp vụ.
- Use case.
- Kiến trúc.
- API contract.
- Quy tắc phân quyền.
- Source code và schema hiện có.
- Migration scripts.
- Quy ước đặt tên của dự án.

Xác định database được sử dụng, phiên bản và các giới hạn thực tế.

Không tự đổi database engine hoặc tạo một schema hoàn toàn mới nếu dự án đã có dữ liệu và cấu trúc đang được sử dụng.

## 3. Quy trình thiết kế

### Bước 1: Xác định thực thể nghiệp vụ

Liệt kê các thực thể chính và trách nhiệm của chúng.

Ví dụ cho hệ thống học huyệt đạo:
- Acupoint.
- Meridian.
- AcupointGroup.
- LearningContent.
- User.
- UserProgress.

Các tên trên chỉ là ví dụ. Thực thể thực tế phải xuất phát từ yêu cầu.

Phân biệt:
- Thực thể độc lập.
- Thực thể phụ thuộc.
- Quan hệ nhiều-nhiều.
- Dữ liệu danh mục.
- Dữ liệu giao dịch.
- Dữ liệu lịch sử.
- Dữ liệu được quản trị hoặc phê duyệt.

### Bước 2: Xác định thuộc tính và kiểu dữ liệu

Với mỗi trường, xác định:
- Tên.
- Ý nghĩa.
- Kiểu dữ liệu.
- Độ dài hoặc độ chính xác.
- Có được null không.
- Giá trị mặc định nếu có.
- Quy tắc validation.
- Có chứa dữ liệu nhạy cảm không.
- Có cần index không.

Chọn kiểu dữ liệu phù hợp với database engine thực tế.

Không dùng kiểu dữ liệu quá rộng hoặc quá hẹp mà không có lý do.

Không dùng chuỗi để lưu dữ liệu có kiểu chuyên biệt nếu database cung cấp kiểu phù hợp hơn và cách sử dụng đó có lợi.

### Bước 3: Thiết kế khóa và quan hệ

Xác định:
- Primary key.
- Foreign key.
- Unique constraint.
- Check constraint.
- Quan hệ một-một.
- Quan hệ một-nhiều.
- Quan hệ nhiều-nhiều.
- Chính sách xóa và cập nhật.

Ưu tiên constraint ở database cho những bất biến dữ liệu quan trọng mà database có thể bảo vệ.

Không dùng cascade delete một cách máy móc. Đánh giá nguy cơ xóa dây chuyền và yêu cầu lưu giữ lịch sử.

### Bước 4: Chuẩn hóa dữ liệu

Đánh giá mức độ chuẩn hóa phù hợp, thường bắt đầu từ mô hình quan hệ chuẩn hóa.

Xem xét:
- Tránh lặp dữ liệu không cần thiết.
- Tránh cập nhật cùng một thông tin ở nhiều nơi.
- Phân biệt danh mục với dữ liệu phát sinh.
- Thiết kế bảng liên kết cho quan hệ nhiều-nhiều.
- Xác định các thuộc tính có vòng đời riêng.

Chỉ cân nhắc denormalization khi có nhu cầu truy vấn hoặc hiệu năng được xác định rõ.

### Bước 5: Thiết kế index và truy vấn

Dựa trên các truy vấn thực tế hoặc dự kiến:
- Tìm theo khóa.
- Lọc theo trạng thái.
- Phân trang.
- Tìm kiếm theo danh mục.
- Truy vấn lịch sử.
- Báo cáo tổng hợp.
- Join giữa các bảng.

Xem xét:
- Index đơn và composite index.
- Thứ tự cột trong composite index.
- Unique index.
- Chi phí ghi dữ liệu.
- Kích thước index.
- Khả năng sử dụng execution plan khi có môi trường.

Không tạo index cho mọi cột.

Không khẳng định một index tối ưu nếu chưa biết truy vấn, phân bố dữ liệu và database engine.

### Bước 6: Xác định transaction và tính nhất quán

Với các luồng ghi dữ liệu, xác định:
- Ranh giới transaction.
- Các bất biến phải được giữ.
- Khả năng cập nhật đồng thời.
- Quy tắc optimistic hoặc pessimistic locking nếu cần.
- Idempotency khi xử lý yêu cầu lặp.
- Cách xử lý lỗi giữa nhiều hệ thống.

Không giữ transaction database mở trong thời gian dài để chờ một dịch vụ bên ngoài nếu có thể thiết kế phương án an toàn hơn.

Không giả định transaction database tự động bao phủ các dịch vụ hoặc message broker bên ngoài.

### Bước 7: Thiết kế audit và vòng đời dữ liệu

Khi phù hợp, xác định:
- `created_at`.
- `updated_at`.
- `created_by`.
- `updated_by`.
- Trạng thái dữ liệu.
- Lịch sử thay đổi.
- Soft delete hoặc hard delete.
- Thời gian lưu giữ.
- Quy tắc archive.
- Quy trình xóa dữ liệu theo yêu cầu.

Không thêm đầy đủ các trường audit vào mọi bảng một cách máy móc nếu kiến trúc đã có cơ chế tương đương.

Không lưu thông tin nhạy cảm vào audit log nếu không thực sự cần thiết.

### Bước 8: Thiết kế migration

Sử dụng công cụ phù hợp với repository, ví dụ Flyway hoặc Liquibase.

Mỗi migration cần:
- Có tên và mục đích rõ ràng.
- Tuân thủ quy ước versioning.
- Có thể review.
- Phù hợp schema hiện tại.
- Có đánh giá ảnh hưởng dữ liệu.
- Được kiểm tra trong môi trường an toàn.

Với schema đang có dữ liệu:
- Ưu tiên thay đổi tương thích ngược.
- Đánh giá lock và thời gian chạy.
- Không giả định migration có thể rollback tự động.
- Chuẩn bị backup/restore khi rủi ro yêu cầu.
- Không sửa migration đã được áp dụng ở môi trường dùng chung nếu quy trình của dự án không cho phép.

### Bước 9: Kiểm tra thiết kế

Kiểm tra:
- Quan hệ có đầy đủ không.
- Có trường hoặc bảng trùng lặp không.
- Có nguy cơ orphan records không.
- Constraint có phản ánh quy tắc nghiệp vụ không.
- Index có phục vụ truy vấn chính không.
- Phân trang có ổn định không.
- Dữ liệu nhạy cảm có được bảo vệ không.
- Migration có tương thích với ứng dụng không.
- Kiểu dữ liệu có phù hợp với database engine không.

## 4. Tài liệu đầu ra

Khi phù hợp, tạo:

    docs/
      database/
        erd.md
        data-dictionary.md
        query-design.md
        migration-plan.md
        retention-policy.md

Có thể dùng Mermaid ER diagram hoặc sơ đồ tương đương.

Data dictionary nên mô tả:
- Bảng.
- Cột.
- Kiểu dữ liệu.
- Nullable.
- Khóa và constraint.
- Ý nghĩa nghiệp vụ.
- Dữ liệu nhạy cảm nếu có.

## 5. Quy tắc an toàn

- Không chạy migration trên production nếu chưa được xác nhận.
- Không tự xóa bảng hoặc dữ liệu.
- Không thực hiện `TRUNCATE`, `DROP` hoặc thay đổi phá hủy dữ liệu ngoài phạm vi được cho phép.
- Không ghi secret hoặc dữ liệu nhạy cảm vào tài liệu.
- Không giả định tên schema hoặc quyền database.
- Không sửa migration đã phát hành nếu chưa hiểu quy trình quản lý migration.
- Không báo cáo đã kiểm thử migration khi chưa chạy.

## 6. Tiêu chuẩn hoàn thành

- Mô hình dữ liệu phản ánh nghiệp vụ.
- Các bảng và quan hệ được mô tả.
- Khóa và constraint được xác định.
- Truy vấn quan trọng đã được xem xét.
- Index có lý do rõ ràng.
- Quy tắc transaction và audit phù hợp.
- Migration có kế hoạch an toàn.
- Rủi ro và giả định được ghi nhận.
- Thiết kế có thể chuyển sang triển khai backend.

## 7. Báo cáo kết quả

Báo cáo:
1. Database engine được sử dụng hoặc đề xuất.
2. Danh sách thực thể và bảng.
3. Quan hệ chính.
4. Các constraint quan trọng.
5. Index và truy vấn mục tiêu.
6. Migration cần thực hiện.
7. Rủi ro dữ liệu.
8. Các câu hỏi còn thiếu.
