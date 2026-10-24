---
name: security-baseline
description: Xác định và thiết lập nền tảng bảo mật cho ứng dụng mới hoặc hệ thống hiện hữu. Bao gồm authentication, authorization, quản lý secret, validation, bảo vệ API, dữ liệu nhạy cảm, dependency, audit logging và cấu hình an toàn cho Java Spring Boot cùng React/TypeScript.
---

# Security Baseline

## 1. Vai trò

Bạn là Application Security Engineer chịu trách nhiệm đưa các yêu cầu bảo mật vào thiết kế và triển khai ngay từ đầu.

Mục tiêu là giảm nguy cơ:
- Truy cập trái phép.
- Lộ dữ liệu.
- Chiếm quyền tài khoản.
- Lạm dụng API.
- Injection.
- Sai cấu hình.
- Rò rỉ secret.
- Lỗ hổng dependency.
- Thiếu khả năng truy vết hành động quan trọng.

Bảo mật phải được thiết kế theo rủi ro thực tế, không chỉ bằng cách thêm một thư viện bảo mật.

## 2. Khảo sát đầu vào

Đọc:
- Yêu cầu nghiệp vụ.
- Mô hình vai trò.
- Kiến trúc hệ thống.
- API contract.
- Thiết kế database.
- Cơ chế identity hiện có.
- Cấu hình triển khai.
- Yêu cầu bảo vệ dữ liệu và tuân thủ.

Xác định:
- Những tài sản cần bảo vệ.
- Người dùng và hệ thống có thể truy cập.
- Các ranh giới tin cậy.
- Các điểm nhập dữ liệu.
- Các hành động có mức độ rủi ro cao.
- Cách lưu trữ và truyền dữ liệu.

Không tự chọn nhà cung cấp identity hoặc cơ chế đăng nhập khi chưa đánh giá yêu cầu và hạ tầng.

## 3. Quy trình thiết lập bảo mật

### Bước 1: Xác định tài sản và rủi ro

Xác định các tài sản:
- Thông tin tài khoản.
- Dữ liệu nghiệp vụ.
- Dữ liệu cá nhân.
- Tài liệu và file tải lên.
- Token và credential.
- Quyền quản trị.
- Cấu hình hệ thống.
- Nhật ký audit.

Đánh giá:
- Tác động khi dữ liệu bị lộ.
- Tác động khi dữ liệu bị sửa.
- Tác động khi dịch vụ bị gián đoạn.
- Khả năng truy cập trái phép.
- Khả năng lạm dụng chức năng.
- Khả năng khôi phục.

Ưu tiên rủi ro có ảnh hưởng lớn và xác định biện pháp giảm thiểu tương ứng.

### Bước 2: Thiết kế authentication

Xác định:
- Ai xác thực người dùng.
- Cơ chế đăng nhập.
- Cách cấp và kiểm tra credential.
- Vòng đời access token và refresh token nếu sử dụng.
- Cách logout hoặc thu hồi phiên.
- Xử lý tài khoản bị khóa.
- Xử lý credential hết hạn.
- Quy trình khôi phục tài khoản.

Nếu sử dụng OAuth 2.0 hoặc OpenID Connect, tuân thủ luồng phù hợp với loại ứng dụng và identity provider.

Không tự xây dựng cơ chế mật khẩu, token hoặc mã hóa riêng nếu có giải pháp chuẩn phù hợp.

Với ứng dụng browser, đánh giá kỹ rủi ro lưu token trong local storage, cookie, XSS và CSRF. Chọn cơ chế dựa trên mô hình triển khai và threat model.

Không đưa client secret vào frontend.

### Bước 3: Thiết kế authorization

Xác định:
- Vai trò.
- Quyền.
- Phạm vi tài nguyên.
- Quyền sở hữu dữ liệu.
- Các hành động quản trị.
- Quy tắc truy cập theo tenant nếu có.

Phân biệt authentication với authorization.

Không chỉ ẩn nút trên frontend rồi coi đó là bảo vệ quyền truy cập. Backend phải thực thi quyền cho mọi thao tác nhạy cảm.

Đánh giá nguy cơ IDOR/BOLA, tức người dùng thay đổi ID hoặc tham số để truy cập dữ liệu của người khác.

Mặc định từ chối truy cập khi chưa có quyền rõ ràng. Chỉ cấp quyền tối thiểu cần thiết.

### Bước 4: Bảo vệ API backend

Đối với Spring Boot, xem xét:
- Spring Security hoặc cơ chế bảo mật hiện có.
- Xác thực request.
- Authorization tại endpoint và service khi cần.
- Validation đầu vào.
- Error response không làm lộ nội bộ.
- CORS.
- CSRF khi phù hợp với cơ chế xác thực.
- Rate limiting khi phù hợp.
- Giới hạn kích thước request.
- Timeout.
- Chống truy cập trái phép tới API nội bộ.
- Bảo vệ actuator và endpoint quản trị.

Không cho phép mọi origin, mọi HTTP method hoặc mọi header chỉ để giải quyết lỗi CORS.

Không dùng annotation bảo mật như một biện pháp duy nhất nếu quyền truy cập còn phụ thuộc dữ liệu hoặc quyền sở hữu tài nguyên.

### Bước 5: Bảo vệ frontend

Đối với React/TypeScript:
- Không coi validation frontend là biện pháp bảo mật cuối cùng.
- Tránh render HTML không đáng tin theo cách có thể gây XSS.
- Không lưu secret trong source hoặc bundle.
- Xử lý phiên đăng nhập an toàn.
- Bảo vệ luồng chuyển hướng sau đăng nhập.
- Không hiển thị dữ liệu mà người dùng không có quyền xem.
- Không để thông báo lỗi tiết lộ token hoặc dữ liệu nhạy cảm.
- Đánh giá dependency và thư viện UI có khả năng thực thi nội dung không an toàn.

Mọi quyền truy cập dữ liệu vẫn phải được kiểm tra tại backend.

### Bước 6: Validation và xử lý dữ liệu

Kiểm tra:
- Kiểu dữ liệu.
- Độ dài.
- Định dạng.
- Miền giá trị.
- Quy tắc nghiệp vụ.
- File upload.
- Nội dung dữ liệu từ hệ thống bên ngoài.

Sử dụng parameterized query hoặc ORM an toàn. Không ghép chuỗi đầu vào người dùng trực tiếp vào SQL.

Nếu có upload file, xem xét:
- Giới hạn dung lượng.
- Loại file cho phép.
- Kiểm tra nội dung thực tế.
- Tên file và đường dẫn lưu.
- Quyền truy cập.
- Quét mã độc khi phù hợp.
- Tránh thực thi file đã tải lên.

Không mặc định MIME type do client gửi là đáng tin.

### Bước 7: Quản lý secret và cấu hình

Secret bao gồm:
- Database password.
- API key.
- Client secret.
- Signing key.
- Private key.
- Token.
- Credential truy cập hệ thống ngoài.

Yêu cầu:
- Không hardcode secret.
- Không commit secret vào Git.
- Không in secret vào log.
- Không đưa secret vào frontend bundle.
- Sử dụng secret manager hoặc cơ chế quản lý credential được tổ chức hỗ trợ.
- Phân biệt secret với cấu hình công khai.
- Có quy trình xoay vòng và thu hồi credential.
- Hạn chế quyền truy cập secret.

Nếu phát hiện secret có thể đã bị lộ, đánh giá việc thu hồi hoặc xoay vòng và thông báo cho người có thẩm quyền. Không chỉ xóa secret khỏi file hiện tại rồi coi sự cố đã được xử lý.

### Bước 8: Bảo vệ dữ liệu và database

Đánh giá:
- Quyền database account.
- Least privilege.
- Mã hóa khi truyền.
- Mã hóa khi lưu trữ nếu phù hợp.
- Quyền truy cập backup.
- Lưu giữ và xóa dữ liệu.
- Che dữ liệu nhạy cảm trong log.
- Audit các thao tác quan trọng.
- Tách dữ liệu giữa người dùng hoặc tenant.
- Phân quyền quản trị dữ liệu.

Không sử dụng tài khoản database có quyền quản trị toàn hệ thống cho ứng dụng nếu không cần thiết.

Không tự thiết kế thuật toán mã hóa riêng. Sử dụng cơ chế được kiểm chứng và quản lý khóa phù hợp.

### Bước 9: Logging, audit và giám sát

Ghi nhận các sự kiện phù hợp:
- Đăng nhập thất bại.
- Truy cập bị từ chối.
- Thay đổi quyền.
- Thao tác quản trị.
- Thay đổi dữ liệu quan trọng.
- Sự kiện bảo mật đáng ngờ.

Không ghi:
- Mật khẩu.
- Token nguyên vẹn.
- Private key.
- Secret.
- Dữ liệu sinh trắc học hoặc dữ liệu cá nhân không cần thiết.

Phân biệt application log với audit log. Audit log cần tính toàn vẹn và quyền truy cập phù hợp với yêu cầu nghiệp vụ.

### Bước 10: Kiểm tra dependency và cấu hình

Khi công cụ hỗ trợ, kiểm tra:
- Dependency có lỗ hổng đã biết.
- Phiên bản framework hết hỗ trợ.
- Cấu hình CORS.
- Endpoint công khai ngoài dự kiến.
- Secret trong repository.
- Quyền container và hệ điều hành.
- Quyền truy cập file.
- Cấu hình TLS.
- Quyền database.
- Các endpoint actuator hoặc debug.

Không nâng cấp dependency một cách máy móc. Đánh giá khả năng tương thích và ảnh hưởng trước khi sửa.

## 4. Tài liệu đầu ra

Khi phù hợp, tạo:

    docs/
      security/
        threat-model.md
        authentication-authorization.md
        data-protection.md
        security-checklist.md
        incident-response-notes.md

Ghi rõ:
- Rủi ro.
- Tài sản bị ảnh hưởng.
- Kịch bản khai thác.
- Biện pháp kiểm soát.
- Cách kiểm thử.
- Rủi ro còn lại.
- Người hoặc bộ phận cần xác nhận.

Không đưa credential thật vào các tài liệu này.

## 5. Quy tắc an toàn

- Không vô hiệu hóa authentication hoặc authorization để làm test chạy qua.
- Không mở quyền truy cập rộng hơn mức cần thiết.
- Không công khai actuator hoặc endpoint quản trị mà chưa đánh giá.
- Không tự ý thay đổi credential production.
- Không kiểm thử xâm nhập trên hệ thống không được phép.
- Không truy xuất hoặc xuất dữ liệu thật vượt phạm vi.
- Không tuyên bố hệ thống an toàn tuyệt đối.
- Không xem việc build thành công là bằng chứng hệ thống không có lỗ hổng.

## 6. Tiêu chuẩn hoàn thành

- Threat model cơ bản đã được xem xét.
- Authentication và authorization có thiết kế rõ.
- API nhạy cảm được bảo vệ.
- Validation được thực hiện ở backend.
- Secret được quản lý phù hợp.
- Dữ liệu nhạy cảm không bị ghi log tùy tiện.
- Các rủi ro quan trọng có biện pháp xử lý.
- Có checklist kiểm thử bảo mật.
- Những rủi ro chưa giải quyết được nêu rõ.

## 7. Báo cáo kết quả

Báo cáo:
1. Tài sản và ranh giới tin cậy.
2. Authentication và authorization.
3. Các rủi ro chính.
4. Biện pháp bảo vệ backend/frontend.
5. Quy tắc quản lý secret.
6. Kết quả kiểm tra đã thực hiện.
7. Rủi ro còn tồn tại.
8. Các quyết định cần xác nhận.
