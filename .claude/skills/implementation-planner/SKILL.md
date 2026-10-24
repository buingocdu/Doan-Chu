
---
name: implementation-planner
description: Lập kế hoạch triển khai tính năng, sửa lỗi hoặc thay đổi kiến trúc dựa trên source code thực tế. Sử dụng khi yêu cầu ảnh hưởng nhiều file, nhiều module, frontend và backend, API contract, database hoặc quy trình nghiệp vụ phức tạp.
---

# Lập kế hoạch triển khai phần mềm

## 1. Mục tiêu

Chuyển yêu cầu của người dùng thành kế hoạch triển khai cụ thể, có thể kiểm chứng và phù hợp với kiến trúc hiện tại của dự án.

Trước khi lập kế hoạch, phải hiểu yêu cầu nghiệp vụ, kiểm tra source code liên quan và xác định phạm vi ảnh hưởng.

Không bắt đầu sửa code ngay khi yêu cầu còn chưa rõ hoặc chưa xác định được luồng xử lý hiện tại.

## 2. Tiếp nhận và phân tích yêu cầu

Thực hiện các bước sau:

1. Đọc đầy đủ yêu cầu của người dùng.
2. Xác định mục tiêu nghiệp vụ cần đạt được.
3. Xác định hành vi hiện tại và hành vi mong muốn.
4. Xác định các đầu vào, đầu ra và điều kiện xử lý.
5. Xác định các trường hợp thành công, thất bại và ngoại lệ.
6. Xác định các yêu cầu về bảo mật, hiệu năng và tính tương thích.
7. Chuyển yêu cầu thành các tiêu chí nghiệm thu có thể kiểm tra.

Nếu yêu cầu là sửa lỗi, phải phân biệt triệu chứng được quan sát với nguyên nhân gốc cần điều tra.

Nếu yêu cầu là phát triển chức năng mới, phải xác định người dùng, luồng nghiệp vụ và kết quả mong muốn.

## 3. Khảo sát source code

Trước khi quyết định giải pháp:

1. Kiểm tra cấu trúc repository.
2. Tìm các module và file liên quan.
3. Đọc các implementation tương tự đang tồn tại.
4. Truy vết luồng xử lý từ frontend đến backend.
5. Kiểm tra API contract và cách mapping dữ liệu.
6. Kiểm tra database schema, entity, repository và migration nếu có.
7. Kiểm tra authentication, authorization và validation.
8. Xác định các test hiện có.
9. Xác định dependency và cấu hình có liên quan.

Ưu tiên tái sử dụng các abstraction và convention đã có.

Không đề xuất thay đổi dựa trên giả định khi có thể kiểm tra source code để xác minh.

## 4. Xác định phạm vi thay đổi

Phân chia phạm vi theo từng lớp.

### 4.1. Frontend

Xác định:

- Trang hoặc component cần thay đổi.
- Hook và state management liên quan.
- API client cần bổ sung hoặc cập nhật.
- Form validation và xử lý lỗi.
- Các trạng thái loading, empty, success và error.
- Ảnh hưởng đến routing và quyền truy cập giao diện.

### 4.2. Backend

Xác định:

- Controller hoặc API endpoint.
- Request DTO và response DTO.
- Validation.
- Service và business logic.
- Repository và truy vấn dữ liệu.
- Entity và mapping.
- Exception handling.
- Authentication và authorization.
- Tích hợp với downstream services.

Chỉ liệt kê những thành phần thực sự cần thiết cho yêu cầu.

### 4.3. API contract

Xác định:

- Endpoint và HTTP method.
- Cấu trúc request và response.
- Required, optional và nullable fields.
- Mã HTTP và cấu trúc lỗi.
- Thay đổi OpenAPI specification.
- Tương thích với các client hiện tại.
- Quy trình sinh code nếu dự án sử dụng OpenAPI Generator.

Không sửa code sinh tự động thay cho việc cập nhật nguồn sinh code.

### 4.4. Database

Xác định:

- Có cần thay đổi schema hay không.
- Có cần thêm hoặc sửa migration không.
- Ảnh hưởng đến dữ liệu hiện có.
- Index, constraint và quan hệ dữ liệu.
- Khả năng tương thích giữa phiên bản ứng dụng cũ và mới.
- Kế hoạch khôi phục khi migration thất bại.

Không tạo migration chỉ vì muốn thay đổi cấu trúc code nếu schema hiện tại đã đáp ứng được yêu cầu.

## 5. Thiết kế phương án triển khai

Đề xuất phương án đáp ứng yêu cầu với mức thay đổi tối thiểu nhưng đầy đủ.

Mỗi phương án phải làm rõ:

1. Cách hoạt động.
2. Các thành phần cần thay đổi.
3. Lý do lựa chọn.
4. Ưu điểm và hạn chế.
5. Rủi ro kỹ thuật.
6. Ảnh hưởng đến API và dữ liệu.
7. Cách kiểm thử.

Nếu có nhiều phương án, ưu tiên phương án phù hợp với kiến trúc hiện tại và dễ bảo trì.

Không tự thêm framework, thư viện hoặc dịch vụ mới nếu chưa chứng minh được nhu cầu.

## 6. Chia nhỏ công việc

Chia kế hoạch thành các bước có thứ tự rõ ràng.

Ví dụ đối với một chức năng full-stack:

### Bước 1: Xác định hợp đồng API
- Thống nhất request, response và mã lỗi.
- Cập nhật OpenAPI nếu cần.
- Kiểm tra ảnh hưởng đến client hiện tại.

### Bước 2: Triển khai backend
- Cập nhật DTO và validation.
- Triển khai business logic.
- Cập nhật persistence hoặc downstream integration nếu cần.
- Bổ sung xử lý lỗi và phân quyền.

### Bước 3: Triển khai frontend
- Cập nhật kiểu dữ liệu và API client.
- Bổ sung giao diện và xử lý state.
- Hiển thị validation và lỗi phù hợp.

### Bước 4: Kiểm thử
- Unit Test.
- Integration Test.
- Kiểm thử API contract.
- Kiểm thử các trường hợp lỗi.
- Kiểm thử frontend.

### Bước 5: Review và hoàn thiện
- Kiểm tra diff.
- Kiểm tra bảo mật.
- Xác nhận các tiêu chí nghiệm thu.
- Ghi nhận rủi ro còn lại.

Đây chỉ là ví dụ. Hãy điều chỉnh thứ tự theo dependency thực tế của dự án.

## 7. Chiến lược kiểm thử

Với mỗi tiêu chí nghiệm thu, xác định cách kiểm chứng tương ứng.

Xem xét các trường hợp:

- Dữ liệu đầu vào hợp lệ.
- Dữ liệu thiếu hoặc không hợp lệ.
- Dữ liệu không tồn tại.
- Người dùng không có quyền.
- Tài nguyên không thuộc phạm vi được phép truy cập.
- Database hoặc dịch vụ phụ thuộc gặp lỗi.
- Timeout và phản hồi không mong muốn.
- Dữ liệu rỗng và trường hợp biên.
- Tương thích với client hoặc dữ liệu hiện có.

Không cần tạo tất cả loại test cho mọi thay đổi. Chọn mức kiểm thử phù hợp với rủi ro và convention hiện tại.

## 8. Đánh giá rủi ro

Trước khi thực hiện, xem xét:

- Nguy cơ phá vỡ chức năng hiện có.
- Thay đổi API không tương thích.
- Thay đổi dữ liệu hoặc migration nguy hiểm.
- Lỗ hổng phân quyền.
- Rò rỉ thông tin nhạy cảm.
- Hiệu năng truy vấn hoặc gọi dịch vụ.
- Xung đột dependency.
- Ảnh hưởng đến CI/CD và triển khai.
- Khả năng rollback.

Với các thao tác có nguy cơ mất dữ liệu hoặc ảnh hưởng production, phải xác định rõ điều kiện an toàn và yêu cầu phê duyệt.

## 9. Quy tắc thực thi

- Nếu người dùng chỉ yêu cầu lập kế hoạch, không sửa code.
- Nếu người dùng yêu cầu triển khai, sử dụng kế hoạch để thực hiện công việc sau khi đã hiểu phạm vi.
- Với tác vụ nhỏ, lập kế hoạch ngắn gọn và không tạo quy trình dư thừa.
- Với tác vụ lớn, chia nhỏ công việc và kiểm chứng từng giai đoạn.
- Không hỏi lại những thông tin có thể xác định từ repository.
- Nếu thiếu thông tin quan trọng, hãy hỏi câu hỏi tập trung vào điểm chặn.
- Nêu rõ giả định khi có thể tiếp tục một cách an toàn.
- Không tự ý commit, push, merge hoặc deploy.
- Không ghi đè thay đổi có sẵn của người dùng.

## 10. Định dạng đầu ra

Trình bày kế hoạch theo cấu trúc sau:

### A. Mục tiêu
Mô tả kết quả cần đạt được.

### B. Tiêu chí nghiệm thu
Liệt kê các điều kiện để xác nhận chức năng hoàn thành.

### C. Hiện trạng
Mô tả cách hệ thống đang hoạt động dựa trên source code đã kiểm tra.

### D. Phương án đề xuất
Giải thích giải pháp và lý do lựa chọn.

### E. Danh sách thay đổi
Liệt kê các file, module hoặc thành phần dự kiến cần thay đổi và trách nhiệm của từng thành phần.

### F. Các bước triển khai
Liệt kê thứ tự thực hiện, phụ thuộc và kết quả mong đợi.

### G. Kế hoạch kiểm thử
Nêu các loại test, trường hợp kiểm thử và lệnh cần chạy.

### H. Rủi ro và biện pháp giảm thiểu
Xác định các rủi ro chính và cách kiểm soát.

### I. Giả định và câu hỏi
Ghi rõ thông tin chưa xác định.

Không khẳng định file sẽ được sửa hoặc test sẽ được chạy thành công trước khi thực hiện.

## 11. Tiêu chí hoàn thành

Kế hoạch được xem là đầy đủ khi:

- Yêu cầu được chuyển thành tiêu chí nghiệm thu.
- Đã xác định được luồng nghiệp vụ liên quan.
- Đã xác định phạm vi frontend, backend, API và database.
- Các bước triển khai có thứ tự rõ ràng.
- Có chiến lược kiểm thử phù hợp.
- Rủi ro và giới hạn được ghi nhận.
- Không có thay đổi code ngoài phạm vi khi chỉ lập kế hoạch.
