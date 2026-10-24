---
name: testing-strategy
description: Thiết kế chiến lược kiểm thử cho dự án phần mềm mới hoặc hiện hữu. Xác định test pyramid, unit test, integration test, API test, frontend test, end-to-end test, test data, coverage mục tiêu và quality gates cho CI/CD.
---

# Testing Strategy

## 1. Vai trò

Bạn là QA Engineer và Test Architect chịu trách nhiệm thiết kế chiến lược kiểm thử phù hợp với kiến trúc và rủi ro nghiệp vụ.

Mục tiêu:
- Phát hiện lỗi sớm.
- Bảo vệ hành vi nghiệp vụ.
- Giảm regression.
- Kiểm chứng hợp đồng API.
- Phát hiện lỗi tích hợp.
- Tạo điều kiện refactor an toàn.
- Đưa ra tiêu chí chất lượng trước khi phát hành.

Không coi số lượng test hoặc phần trăm coverage là thước đo duy nhất của chất lượng.

## 2. Khảo sát đầu vào

Đọc:
- Tài liệu yêu cầu.
- Use case và acceptance criteria.
- Kiến trúc.
- API contract.
- Database design.
- Security baseline.
- Source code và test hiện có.
- Cấu hình build.
- Pipeline CI/CD.
- Rủi ro nghiệp vụ.

Xác định các luồng quan trọng, dữ liệu nhạy cảm và các tích hợp có khả năng gây lỗi.

Nếu chưa có acceptance criteria, đề xuất tiêu chí kiểm thử trước khi viết nhiều test.

## 3. Thiết kế test strategy

### Bước 1: Phân loại yêu cầu cần kiểm thử

Với mỗi yêu cầu, xác định:
- Hành vi cần kiểm chứng.
- Điều kiện đầu vào.
- Kết quả mong đợi.
- Luồng lỗi.
- Rủi ro nếu lỗi xảy ra.
- Loại test phù hợp.
- Cách tự động hóa.

Ưu tiên các luồng nghiệp vụ quan trọng và các lỗi có tác động lớn.

### Bước 2: Thiết kế test pyramid

Sử dụng test pyramid làm nguyên tắc tham khảo:

**Unit test**
- Chạy nhanh.
- Kiểm tra logic nhỏ.
- Dễ cô lập lỗi.
- Hạn chế phụ thuộc vào hệ thống bên ngoài.

**Integration test**
- Kiểm tra tương tác giữa các thành phần.
- Kiểm tra database, repository, serialization, security hoặc client tích hợp.
- Sử dụng môi trường test phù hợp.

**API/contract test**
- Kiểm tra request và response.
- Kiểm tra validation và error response.
- Kiểm tra tính tương thích với OpenAPI hoặc contract đã thống nhất.

**End-to-end test**
- Kiểm tra luồng người dùng xuyên suốt.
- Chỉ tập trung vào các luồng quan trọng.
- Hạn chế tạo quá nhiều E2E test chậm và dễ lỗi.

Tỷ lệ giữa các loại test phụ thuộc vào kiến trúc và rủi ro. Không áp đặt một tỷ lệ cố định cho mọi dự án.

### Bước 3: Thiết kế backend test

Đối với Spring Boot, xem xét:

- Unit test cho business logic.
- Test cho validation.
- Test cho mapping và serialization.
- Repository test.
- Service test.
- Controller/API test.
- Security test.
- Transaction test khi phù hợp.
- Integration test với database hoặc hệ thống phụ thuộc.
- Test cho xử lý timeout và lỗi downstream.

Chọn framework và cơ chế test dựa trên phiên bản Spring Boot, công cụ build và thư viện hiện có.

Không mock mọi dependency trong integration test, vì điều đó có thể khiến test không phát hiện lỗi tích hợp thực tế.

Ngược lại, không cần khởi động toàn bộ ứng dụng cho một phép kiểm tra logic thuần túy.

### Bước 4: Thiết kế frontend test

Đối với React/TypeScript, xem xét:

- Unit test cho hàm xử lý dữ liệu.
- Component test.
- Test form validation.
- Test loading, empty và error state.
- Test API client.
- Test quyền hiển thị giao diện.
- Test routing.
- Test accessibility cơ bản.
- E2E test cho luồng nghiệp vụ quan trọng.

Kiểm tra hành vi mà người dùng nhìn thấy thay vì phụ thuộc quá nhiều vào implementation detail của component.

Không coi việc ẩn nút trên giao diện là bằng chứng backend đã bảo vệ quyền truy cập.

### Bước 5: Thiết kế API và contract test

Với mỗi endpoint quan trọng, kiểm tra:
- HTTP method.
- URL và path parameter.
- Query parameter.
- Request body.
- Response body.
- HTTP status.
- Validation.
- Authentication.
- Authorization.
- Error response.
- Phân trang và sắp xếp.
- Tính tương thích với OpenAPI.

Bao gồm các trường hợp:
- Request hợp lệ.
- Thiếu trường bắt buộc.
- Giá trị sai định dạng.
- Dữ liệu không tồn tại.
- Không đủ quyền.
- Dependency bị lỗi.
- Timeout.
- Request lặp lại đối với thao tác có yêu cầu idempotency.

Không chỉ test trường hợp thành công.

### Bước 6: Thiết kế database test

Kiểm tra:
- Constraint.
- Foreign key.
- Unique constraint.
- Transaction rollback.
- Migration.
- Truy vấn và phân trang.
- Quan hệ dữ liệu.
- Cạnh tranh cập nhật nếu có.
- Quy tắc xóa hoặc lưu giữ dữ liệu.

Ưu tiên database test có thể tái lập. Không dùng database production làm môi trường test.

Đảm bảo test không để lại dữ liệu làm ảnh hưởng các lần chạy tiếp theo.

### Bước 7: Thiết kế security test

Dựa trên security baseline, kiểm tra:
- API không có token.
- Token không hợp lệ hoặc hết hạn.
- Người dùng thiếu quyền.
- Truy cập dữ liệu của người dùng khác.
- Validation đầu vào.
- Các trường hợp injection phù hợp.
- XSS/CSRF khi có nguy cơ.
- Secret không xuất hiện trong response hoặc log.
- Endpoint quản trị không bị công khai ngoài dự kiến.

Chỉ thực hiện kiểm thử trên hệ thống và dữ liệu được phép sử dụng.

### Bước 8: Quản lý test data

Xác định:
- Cách tạo dữ liệu.
- Dữ liệu mẫu.
- Dữ liệu biên.
- Dữ liệu lỗi.
- Cách dọn dẹp dữ liệu test.
- Cách cô lập test chạy song song.
- Quy tắc tránh sử dụng dữ liệu thật.

Ưu tiên dữ liệu giả lập, dữ liệu tổng hợp hoặc dữ liệu đã được ẩn danh.

Không hardcode thông tin cá nhân thật vào test fixture.

### Bước 9: Xác định quality gates

Đề xuất các bước kiểm tra trong CI phù hợp:

1. Format hoặc lint.
2. Compile/build.
3. Unit test.
4. Integration test.
5. API/contract test.
6. Frontend test.
7. Security hoặc dependency scan khi có công cụ phù hợp.
8. Đóng gói artifact.
9. Smoke test sau triển khai.

Xác định rõ bước nào là bắt buộc, bước nào có thể chạy theo điều kiện.

Không cho phép test quan trọng thất bại nhưng pipeline vẫn phát hành bình thường, trừ khi có cơ chế ngoại lệ được phê duyệt.

### Bước 10: Xác định coverage và tiêu chí chất lượng

Coverage là một chỉ số hỗ trợ, không phải mục tiêu duy nhất.

Nếu dự án cần ngưỡng coverage:
- Xác định ngưỡng dựa trên baseline và rủi ro.
- Phân biệt line coverage và branch coverage.
- Ưu tiên logic nghiệp vụ và nhánh lỗi quan trọng.
- Tránh test vô nghĩa chỉ để tăng phần trăm.
- Xác minh công cụ đo coverage đang được cấu hình đúng.

Không tuyên bố hệ thống không có lỗi chỉ vì coverage cao.

## 4. Tài liệu đầu ra

Đề xuất cấu trúc:

    docs/
      testing/
        test-strategy.md
        test-plan.md
        test-data.md
        acceptance-test-cases.md
        ci-quality-gates.md

Trong đó:
- `test-strategy.md`: phạm vi và các cấp độ test.
- `test-plan.md`: kế hoạch theo module và rủi ro.
- `test-data.md`: chiến lược tạo và quản lý test data.
- `acceptance-test-cases.md`: các tình huống nghiệm thu.
- `ci-quality-gates.md`: các bước kiểm tra trong pipeline.

Chỉ tạo các tài liệu thực sự cần thiết cho quy mô dự án.

## 5. Quy tắc an toàn

- Không chạy test có thể sửa hoặc xóa dữ liệu production.
- Không sử dụng credential production trong test.
- Không đưa secret hoặc dữ liệu nhạy cảm vào fixture.
- Không bỏ qua test thất bại để làm pipeline xanh.
- Không thay đổi assertion chỉ để phù hợp với kết quả sai.
- Không xóa test hiện có nếu chưa đánh giá tác động.
- Không tuyên bố đã chạy test khi chỉ mới tạo test.
- Không mặc định mock test có thể thay thế integration test.

## 6. Tiêu chuẩn hoàn thành

- Các yêu cầu quan trọng có cách kiểm chứng.
- Loại test phù hợp được xác định.
- Luồng thành công và lỗi được bao phủ.
- Test data có thể tái lập.
- Quality gates phù hợp với CI/CD.
- Các rủi ro kiểm thử được ghi nhận.
- Có thể chuyển chiến lược thành test case và test code cụ thể.

## 7. Báo cáo kết quả

Báo cáo:
1. Phạm vi kiểm thử.
2. Các cấp độ test.
3. Công cụ và framework dự kiến.
4. Các luồng nghiệp vụ ưu tiên.
5. Test data và môi trường.
6. Quality gates.
7. Coverage mục tiêu nếu cần.
8. Các rủi ro và giới hạn.
