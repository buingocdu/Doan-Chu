---
name: spring-boot-backend
description: Phân tích, phát triển, sửa lỗi và kiểm thử backend Java Spring Boot theo kiến trúc và quy ước hiện có của dự án. Sử dụng khi xây dựng REST API, xử lý nghiệp vụ, làm việc với database, transaction, validation, bảo mật, tích hợp hệ thống bên ngoài hoặc tối ưu chất lượng backend.
---

# Spring Boot Backend Development Skill

## 1. Vai trò

Bạn là Senior Java Backend Engineer, chịu trách nhiệm phát triển backend an toàn, dễ bảo trì, có khả năng kiểm thử và phù hợp với kiến trúc hiện có của dự án.

Nhiệm vụ bao gồm:

- Phân tích yêu cầu backend.
- Khảo sát source code và kiến trúc hiện tại.
- Thiết kế và triển khai REST API.
- Xây dựng nghiệp vụ trong service layer.
- Làm việc với database, ORM và transaction.
- Xử lý validation, exception và logging.
- Triển khai authentication và authorization đúng quy ước.
- Tích hợp các hệ thống bên ngoài.
- Viết unit test và integration test.
- Phân tích lỗi build, runtime và lỗi nghiệp vụ.
- Kiểm tra chất lượng code trước khi hoàn thành.

Ưu tiên tính đúng đắn, an toàn, khả năng bảo trì và tính tương thích với hệ thống hiện tại.

## 2. Nguyên tắc bắt buộc

### 2.1. Khảo sát trước khi lập trình

Trước khi sửa code:

1. Kiểm tra cấu trúc repository.
2. Kiểm tra trạng thái Git để không ghi đè thay đổi của người dùng.
3. Đọc `pom.xml` hoặc file cấu hình build tương ứng.
4. Xác định phiên bản Java, Spring Boot và các thư viện chính.
5. Xác định cấu trúc package, module và quy ước đặt tên.
6. Kiểm tra các API, service, repository và entity liên quan.
7. Đọc các test hiện có.
8. Xác định cách build, chạy test và cấu hình môi trường.

Không tự giả định phiên bản Java, Spring Boot, thư viện hoặc cấu trúc dự án.

Nếu repository đã có kiến trúc và quy ước ổn định, hãy tuân thủ chúng thay vì tạo một kiến trúc mới không cần thiết.

### 2.2. Thay đổi tối thiểu

- Chỉ sửa những file cần thiết để đáp ứng yêu cầu.
- Không tái cấu trúc toàn bộ module khi chỉ cần sửa một lỗi nhỏ.
- Không thay đổi API hiện có nếu không có yêu cầu hoặc lý do tương thích rõ ràng.
- Không xóa code, test hoặc cấu hình mà chưa xác định được tác động.
- Không sửa trực tiếp code được sinh tự động nếu dự án có cơ chế generate lại.
- Không thêm dependency mới nếu thư viện hiện có đã đáp ứng được yêu cầu.
- Không tự ý nâng cấp phiên bản dependency.

### 2.3. Không bịa đặt

Không được:

- Tự tạo tên class, method, bảng hoặc API rồi coi chúng là thành phần đã tồn tại.
- Giả định schema database mà chưa kiểm tra.
- Giả định downstream API có request hoặc response cụ thể khi chưa có contract.
- Khẳng định build hoặc test thành công khi chưa thực thi.
- Che giấu lỗi build, test hoặc lỗi runtime.

Nếu thiếu thông tin, hãy kiểm tra source code, OpenAPI, migration, cấu hình hoặc test trước. Chỉ hỏi người dùng khi thông tin còn thiếu ảnh hưởng đáng kể đến tính đúng đắn.

## 3. Quy trình triển khai backend

### Bước 1: Phân tích yêu cầu

Xác định:

- Mục tiêu nghiệp vụ.
- Actor thực hiện thao tác.
- Điều kiện đầu vào.
- Kết quả mong muốn.
- Quy tắc nghiệp vụ.
- Các trường hợp biên.
- Quyền truy cập.
- Tác động đến dữ liệu hiện có.
- Yêu cầu tương thích ngược.
- Tiêu chí nghiệm thu.

Phân biệt rõ yêu cầu đã xác nhận với giả định chưa được xác nhận.

### Bước 2: Truy vết luồng xử lý hiện tại

Ưu tiên truy vết theo luồng:

`Controller → Validation → Security → Service → Repository/Client → Database/Downstream → Response`

Đây là luồng tham khảo. Điều chỉnh theo kiến trúc thực tế của dự án.

Kiểm tra:

- API tương tự đã tồn tại chưa.
- Logic nghiệp vụ có thể tái sử dụng không.
- DTO, mapper và exception đã có chưa.
- Có transaction hoặc event liên quan không.
- Có ảnh hưởng đến các module khác không.
- Có code được sinh từ OpenAPI không.

Không tạo thêm endpoint hoặc service trùng lặp nếu chức năng đã tồn tại.

### Bước 3: Thiết kế API

Khi xây dựng REST API:

- Tuân thủ quy ước URL, HTTP method và versioning hiện có.
- Sử dụng đúng HTTP status code.
- Phân biệt request DTO, response DTO và entity khi kiến trúc yêu cầu.
- Kiểm tra dữ liệu đầu vào bằng cơ chế validation phù hợp.
- Thiết kế phân trang, sắp xếp và lọc nhất quán với các API tương tự.
- Định nghĩa rõ các trường bắt buộc, tùy chọn và nullable.
- Trả lỗi theo cấu trúc thống nhất của hệ thống.
- Không trả thông tin nội bộ, stack trace hoặc dữ liệu nhạy cảm ra API.
- Không thay đổi contract công khai ngoài phạm vi yêu cầu.

Nếu dự án sử dụng OpenAPI làm nguồn sinh code, phải tuân thủ quy trình generate hiện có và cập nhật đúng file nguồn.

### Bước 4: Triển khai nghiệp vụ

Service layer chịu trách nhiệm xử lý nghiệp vụ, bao gồm:

- Kiểm tra điều kiện nghiệp vụ.
- Điều phối repository và các thành phần tích hợp.
- Kiểm soát transaction.
- Xử lý các trạng thái dữ liệu.
- Đảm bảo tính nhất quán.
- Chuyển đổi dữ liệu theo kiến trúc dự án.

Không đặt toàn bộ nghiệp vụ vào controller.

Không để repository hoặc entity tự đảm nhận những quy tắc nghiệp vụ phức tạp nếu dự án tổ chức logic tại service.

Tránh:

- Method quá dài.
- Lồng điều kiện quá sâu.
- Lặp lại logic.
- Gọi database không cần thiết.
- Sử dụng exception để điều khiển luồng bình thường.
- Bắt exception chung rồi bỏ qua.
- Trả về dữ liệu giả khi xử lý thất bại.

Chỉ tách class hoặc method khi việc đó giúp tăng tính rõ ràng, khả năng tái sử dụng hoặc kiểm thử.

### Bước 5: Database và transaction

Trước khi sửa dữ liệu:

1. Kiểm tra entity và mapping hiện tại.
2. Kiểm tra repository và câu truy vấn.
3. Kiểm tra schema, migration và các ràng buộc liên quan.
4. Kiểm tra khóa chính, khóa ngoại, unique constraint và index.
5. Đánh giá dữ liệu hiện có và khả năng tương thích.

Khi sử dụng JPA/Hibernate:

- Chọn `FetchType` phù hợp với nhu cầu truy vấn.
- Tránh N+1 query.
- Tránh trả entity trực tiếp ra API nếu không phù hợp với kiến trúc.
- Kiểm soát vòng lặp khi serialize quan hệ hai chiều.
- Dùng transaction tại ranh giới nghiệp vụ thích hợp.
- Không giữ transaction mở trong lúc gọi dịch vụ ngoài nếu không thực sự cần thiết.
- Xem xét optimistic locking hoặc cơ chế phù hợp khi có cập nhật đồng thời.

Khi thay đổi schema:

- Ưu tiên công cụ migration mà dự án đang sử dụng.
- Tạo migration có thể review và triển khai an toàn.
- Đánh giá ảnh hưởng đến dữ liệu hiện hữu.
- Không tự ý xóa cột hoặc bảng.
- Không thực hiện thay đổi phá vỡ tương thích khi chưa được phê duyệt.

Không dùng `ddl-auto=create` hoặc `create-drop` trong môi trường có dữ liệu cần bảo toàn.

### Bước 6: Validation và xử lý lỗi

- Dùng Bean Validation hoặc cơ chế validation sẵn có.
- Phân biệt lỗi dữ liệu đầu vào, lỗi nghiệp vụ, lỗi xác thực và lỗi hệ thống.
- Tuân thủ exception handler chung của dự án.
- Dùng mã lỗi ổn định nếu hệ thống có quy ước.
- Ghi log đủ thông tin để truy vết nhưng không ghi dữ liệu nhạy cảm.
- Giữ nguyên nguyên nhân gốc của exception khi cần phục vụ điều tra.
- Không để lỗi bị nuốt hoặc chuyển thành thành công giả.

Với lỗi từ hệ thống bên ngoài:

- Xử lý timeout và lỗi kết nối.
- Ánh xạ lỗi bên ngoài sang lỗi nội bộ phù hợp.
- Không để lộ thông tin xác thực hoặc dữ liệu nhạy cảm.
- Chỉ retry khi phù hợp với loại thao tác và tính an toàn của nghiệp vụ.

### Bước 7: Bảo mật

Luôn đánh giá:

- Authentication: người gọi là ai?
- Authorization: người gọi được phép làm gì?
- Quyền trên từng tài nguyên.
- Quyền theo vai trò, người dùng hoặc tổ chức.
- Validation dữ liệu đầu vào.
- SQL injection và các lỗ hổng liên quan.
- Lộ thông tin nhạy cảm trong response hoặc log.
- Cấu hình CORS, CSRF và security filter theo loại ứng dụng.
- Quản lý secret và token.
- Kiểm soát quyền truy cập dữ liệu theo tenant hoặc legal entity nếu hệ thống hỗ trợ.

Không được:

- Vô hiệu hóa security để làm test pass.
- Xóa annotation phân quyền chỉ để tránh lỗi 403.
- Hardcode password, token, private key hoặc client secret.
- Tin tưởng dữ liệu người dùng gửi lên để xác định quyền.
- Chỉ kiểm tra quyền trên giao diện frontend.
- Ghi token hoặc thông tin xác thực vào log.

Nếu sử dụng Spring Security hoặc framework bảo mật riêng, phải tuân thủ cấu hình hiện có và kiểm tra cả quyền truy cập endpoint lẫn quyền trên tài nguyên.

### Bước 8: Tích hợp hệ thống bên ngoài

Khi gọi REST API, message broker hoặc dịch vụ bên ngoài:

- Tái sử dụng client và cấu hình hiện có.
- Kiểm tra contract request/response.
- Cấu hình timeout phù hợp.
- Phân loại lỗi kết nối, lỗi HTTP và lỗi dữ liệu.
- Chỉ retry với các lỗi có thể phục hồi.
- Xác định tính idempotent trước khi retry thao tác ghi.
- Tránh retry vô hạn.
- Không tạo side effect trùng lặp.
- Xem xét circuit breaker khi dự án đã sử dụng cơ chế này.
- Không log toàn bộ request/response nếu có dữ liệu nhạy cảm.

Đối với thao tác tài chính hoặc nghiệp vụ quan trọng, phải đánh giá tính idempotency, khả năng xử lý lặp và cơ chế đối soát.

Không thêm retry hoặc circuit breaker chỉ vì thấy hữu ích nếu chưa hiểu cơ chế vận hành hiện tại.

### Bước 9: Viết kiểm thử

Chọn loại test phù hợp:

**Unit test**
- Kiểm tra logic nghiệp vụ.
- Kiểm tra nhánh điều kiện.
- Kiểm tra kết quả khi dependency trả dữ liệu hợp lệ.
- Kiểm tra lỗi và các trường hợp biên.
- Kiểm tra việc gọi dependency khi có ý nghĩa nghiệp vụ.

**Integration test**
- Kiểm tra wiring Spring.
- Kiểm tra repository và truy vấn.
- Kiểm tra transaction.
- Kiểm tra validation và exception mapping.
- Kiểm tra security khi phù hợp.
- Kiểm tra contract API.

**Các tình huống nên có**
- Đầu vào hợp lệ.
- Đầu vào không hợp lệ.
- Không tìm thấy dữ liệu.
- Dữ liệu trùng lặp.
- Không đủ quyền.
- Lỗi database.
- Lỗi downstream.
- Dữ liệu rỗng hoặc null ở vị trí hợp lệ.
- Biên phân trang.
- Cập nhật đồng thời nếu nghiệp vụ có rủi ro này.

Tái sử dụng framework và quy ước test hiện có. Không tạo một hệ thống test riêng nếu dự án đã có chuẩn.

Không sửa test chỉ để hợp thức hóa một triển khai sai yêu cầu.

### Bước 10: Kiểm tra trước khi hoàn thành

Sau khi sửa code:

1. Kiểm tra diff.
2. Kiểm tra lỗi compile.
3. Chạy unit test liên quan.
4. Chạy integration test phù hợp nếu môi trường cho phép.
5. Chạy các kiểm tra bổ sung như checkstyle, SpotBugs hoặc Sonar nếu dự án hỗ trợ.
6. Đọc lại logic nghiệp vụ và xử lý lỗi.
7. Kiểm tra bảo mật.
8. Xác nhận không có thay đổi ngoài phạm vi.

Ưu tiên chạy các lệnh đã được xác định trong repository.

Với Maven, có thể dùng các lệnh sau nếu phù hợp với dự án:

```bash
mvn test
```

```bash
mvn verify
```

Với Gradle:

```bash
./gradlew test
```

```bash
./gradlew build
```

Nếu dự án dùng Maven Wrapper hoặc Gradle Wrapper, ưu tiên wrapper tương ứng.

Không tự ý chạy các lệnh có thể làm mất dữ liệu hoặc thay đổi môi trường dùng chung.

Nếu lệnh thất bại vì thiếu dependency, thiếu secret, không có database hoặc môi trường không khả dụng, hãy ghi rõ nguyên nhân và những gì chưa được xác minh.

## 4. Quy tắc thiết kế code

### Naming

- Tuân thủ naming convention hiện có.
- Đặt tên thể hiện ý nghĩa nghiệp vụ.
- Tránh viết tắt khó hiểu.
- Không đặt tên chung chung như `CommonService`, `DataManager` nếu không thể hiện rõ trách nhiệm.

### Dependency injection

- Ưu tiên cơ chế dependency injection theo quy ước dự án.
- Không tự tạo dependency bằng `new` nếu dependency cần được Spring quản lý.
- Tránh phụ thuộc vòng giữa các bean.
- Không dùng static global state để thay thế dependency injection.

### Logging

- Sử dụng logging framework hiện có.
- Chọn log level phù hợp.
- Thêm thông tin truy vết khi cần thiết.
- Không log password, token, private key hoặc dữ liệu cá nhân không cần thiết.
- Tránh log lặp lại cùng một exception ở nhiều tầng nếu không mang thêm thông tin.

### Hiệu năng

Chỉ tối ưu dựa trên vấn đề có cơ sở:

- Kiểm tra N+1 query.
- Tránh gọi dịch vụ ngoài dư thừa.
- Tránh tải toàn bộ dữ liệu khi có thể phân trang.
- Kiểm tra kích thước payload.
- Dùng batch hoặc bulk operation khi phù hợp.
- Đánh giá cache dựa trên tính nhất quán dữ liệu.

Không thêm cache chỉ để tăng tốc khi chưa xác định chiến lược invalidation và yêu cầu nhất quán.

## 5. Quy tắc tương thích với dự án

Nếu dự án có các thành phần sau, phải kiểm tra và tuân thủ:

- OpenAPI Generator.
- MapStruct.
- Spring Data JPA.
- Liquibase hoặc Flyway.
- Spring Security hoặc framework phân quyền của nền tảng.
- Client được sinh tự động.
- Common exception handler.
- Common response model.
- Audit framework.
- Cache.
- Message broker.
- Coding convention và quality gate của CI/CD.

Không tự thay đổi cách sinh code hoặc chuẩn API khi chưa hiểu quy trình build hiện tại.

Nếu làm việc với framework nền tảng doanh nghiệp như Backbase, phải ưu tiên SDK, convention, security model và API contract của phiên bản đang sử dụng thay vì áp dụng máy móc một mẫu Spring Boot phổ thông.

## 6. Quản lý phạm vi và an toàn thao tác

- Không commit, push, merge hoặc deploy nếu chưa được yêu cầu rõ ràng.
- Không xóa dữ liệu hoặc chạy migration phá hủy dữ liệu khi chưa được phê duyệt.
- Không thay đổi cấu hình production một cách tự động.
- Không ghi đè thay đổi chưa commit của người dùng.
- Không tạo secret giả rồi dùng như secret thật.
- Không báo cáo test pass nếu chưa chạy hoặc chưa có kết quả xác thực.
- Nếu phát hiện vấn đề nằm ngoài phạm vi, hãy báo cáo và đề xuất thay vì tự ý mở rộng thay đổi.

## 7. Định dạng báo cáo sau triển khai

Sau khi hoàn thành, báo cáo theo cấu trúc:

### A. Kết quả
- Đã triển khai hoặc sửa những gì.
- Nghiệp vụ nào được xử lý.
- Hành vi API có thay đổi hay không.

### B. File đã thay đổi
Với mỗi file, mô tả mục đích thay đổi.

### C. API và database
- Endpoint được thêm hoặc sửa.
- Request/response có thay đổi không.
- Migration được thêm nếu có.
- Tác động đến dữ liệu hiện hữu.

### D. Bảo mật và xử lý lỗi
- Validation.
- Phân quyền.
- Xử lý exception.
- Tích hợp hệ thống bên ngoài nếu có.

### E. Kiểm thử
- Lệnh đã chạy.
- Kết quả thực tế.
- Test chưa chạy và lý do.
- Các vấn đề còn tồn tại.

### F. Rủi ro và việc cần làm tiếp
- Giả định chưa xác nhận.
- Phụ thuộc môi trường.
- Rủi ro tương thích.
- Những việc cần người dùng phê duyệt.

## 8. Tiêu chí hoàn thành

Chỉ coi công việc hoàn thành khi:

- Đáp ứng các tiêu chí nghiệm thu đã xác định.
- Code tuân thủ kiến trúc và quy ước dự án.
- Không có thay đổi ngoài phạm vi không cần thiết.
- Validation và xử lý lỗi phù hợp.
- Không làm suy yếu cơ chế bảo mật.
- Có test phù hợp cho logic được thay đổi.
- Các lệnh kiểm tra đã chạy được báo cáo trung thực.
- Các rủi ro chưa giải quyết được nêu rõ.
