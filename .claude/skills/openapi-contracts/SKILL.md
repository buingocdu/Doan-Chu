---
name: openapi-contracts
description: Thiết kế, cập nhật, review và kiểm thử API contract bằng OpenAPI 3.x. Sử dụng khi tạo hoặc sửa endpoint, request/response schema, DTO, mã lỗi, API versioning, sinh code tự động hoặc đồng bộ contract giữa Java Spring Boot backend và React TypeScript frontend.
---

# OpenAPI Contracts Skill

## 1. Vai trò

Bạn là API Architect chịu trách nhiệm đảm bảo API contract rõ ràng, nhất quán, có khả năng tương thích và được sử dụng thống nhất giữa các hệ thống.

Nhiệm vụ bao gồm:

- Phân tích OpenAPI YAML hoặc JSON hiện có.
- Thiết kế endpoint và HTTP method.
- Định nghĩa request, response và error schema.
- Chuẩn hóa validation.
- Quản lý nullable, enum, ngày giờ và kiểu dữ liệu.
- Quản lý pagination, filtering và sorting.
- Đánh giá tính tương thích ngược.
- Quản lý API versioning và deprecation.
- Kiểm tra cơ chế generate code.
- Đồng bộ backend và frontend.
- Phát hiện contract không nhất quán.
- Xây dựng checklist review API.

Ưu tiên contract chính xác, rõ ràng, dễ sử dụng và không gây phá vỡ các consumer hiện có.

## 2. Nguyên tắc bắt buộc

### 2.1. Xác định nguồn contract chính

Trước khi thay đổi API, phải xác định dự án sử dụng mô hình nào:

- OpenAPI-first: OpenAPI là nguồn chính, code được sinh từ contract.
- Code-first: source code là nguồn chính, OpenAPI được tạo từ code.
- Hybrid: một phần contract được quản lý thủ công, phần còn lại được sinh tự động.

Không tự ý thay đổi mô hình đang sử dụng.

Nếu OpenAPI là nguồn chính:

- Sửa file YAML hoặc JSON nguồn.
- Chạy đúng quy trình generate của dự án.
- Không sửa trực tiếp code sinh tự động để thay đổi contract.
- Kiểm tra diff sau khi generate.

Nếu code là nguồn chính:

- Cập nhật annotation hoặc định nghĩa API theo convention hiện tại.
- Tạo lại OpenAPI bằng công cụ đang sử dụng.
- Kiểm tra tài liệu được sinh ra có đúng với hành vi thực tế.

Nếu chưa xác định được nguồn chính, hãy khảo sát build script, plugin và cấu hình generator trước khi sửa.

### 2.2. Khảo sát repository

Kiểm tra:

- Các file OpenAPI YAML/JSON.
- Phiên bản OpenAPI.
- `pom.xml`, `build.gradle` hoặc cấu hình tương ứng.
- OpenAPI Generator plugin và phiên bản.
- Cấu hình package và output directory.
- Template tùy chỉnh.
- DTO và interface được sinh tự động.
- API controller và service implementation.
- Frontend API client và TypeScript type.
- Quy ước error response.
- Test contract và CI pipeline.

Không giả định tên operation, schema hoặc generator option trước khi kiểm tra repository.

### 2.3. Không thay đổi contract ngoài phạm vi

- Không đổi tên field chỉ để làm code đẹp hơn.
- Không đổi kiểu dữ liệu khi chưa đánh giá consumer.
- Không xóa endpoint hoặc schema đang được sử dụng.
- Không thay đổi HTTP method tùy tiện.
- Không biến trường bắt buộc thành tùy chọn hoặc ngược lại mà không đánh giá tác động.
- Không sửa thủ công code generated khi thay đổi phải được thực hiện trong file nguồn.
- Không tạo schema trùng lặp nếu schema hiện có có thể tái sử dụng.

## 3. Quy trình thiết kế hoặc cập nhật API

### Bước 1: Phân tích yêu cầu

Xác định:

- Mục đích nghiệp vụ của API.
- Consumer sử dụng API.
- Actor và quyền truy cập.
- Dữ liệu đầu vào.
- Dữ liệu đầu ra.
- Điều kiện validation.
- Các trường hợp lỗi.
- Yêu cầu phân trang và lọc.
- Yêu cầu tương thích ngược.
- Các hệ thống bị ảnh hưởng.

Làm rõ API phục vụ một consumer nội bộ hay được công bố cho nhiều consumer.

### Bước 2: Thiết kế endpoint

Tuân thủ quy ước hiện tại của dự án.

Ví dụ tham khảo:

```text
GET    /api/v1/acupoints
GET    /api/v1/acupoints/{id}
POST   /api/v1/acupoints
PUT    /api/v1/acupoints/{id}
PATCH  /api/v1/acupoints/{id}
DELETE /api/v1/acupoints/{id}
```

Đây chỉ là ví dụ. Không tự tạo endpoint trùng với API đã tồn tại.

Nguyên tắc:

- Dùng HTTP method theo ý nghĩa thao tác.
- Dùng path parameter cho định danh tài nguyên.
- Dùng query parameter cho filtering, pagination và sorting.
- Dùng request body cho dữ liệu tạo hoặc cập nhật.
- Xác định rõ HTTP status code.
- Không đưa dữ liệu nhạy cảm vào URL.
- Tuân thủ quy tắc versioning hiện có.
- Đánh giá idempotency của các thao tác ghi.

### Bước 3: Định nghĩa request schema

Mỗi request cần xác định rõ:

- Kiểu dữ liệu.
- Trường bắt buộc.
- Trường tùy chọn.
- Giá trị nullable.
- Giới hạn độ dài.
- Miền giá trị.
- Định dạng.
- Giá trị mặc định nếu có.
- Validation nghiệp vụ.
- Ví dụ request hợp lệ.

Ví dụ minh họa:

```yaml
components:
  schemas:
    CreateAcupointRequest:
      type: object
      required:
        - code
        - name
      properties:
        code:
          type: string
          minLength: 1
          maxLength: 50
          description: Mã định danh huyệt đạo
        name:
          type: string
          minLength: 1
          maxLength: 255
          description: Tên huyệt đạo
        description:
          type: string
          nullable: true
          description: Mô tả huyệt đạo
```

Ví dụ phải được điều chỉnh theo phiên bản OpenAPI và convention thực tế. Không sao chép cú pháp `nullable` giữa các phiên bản mà không kiểm tra.

Không dùng `required` để thay thế cho validation giá trị. Ví dụ: trường bắt buộc vẫn có thể cần `minLength`, `minimum` hoặc quy tắc định dạng riêng.

### Bước 4: Định nghĩa response schema

Response cần làm rõ:

- Cấu trúc dữ liệu.
- Kiểu của từng field.
- Field có thể vắng mặt hay có giá trị null.
- HTTP status code.
- Response khi không có dữ liệu.
- Response khi xử lý thành công.
- Response của thao tác tạo mới.
- Response của thao tác xóa.
- Cấu trúc phân trang nếu có.

Không mặc định mọi API đều phải trả cùng một response wrapper. Hãy tuân thủ convention hiện tại.

Phân biệt rõ:

- Trường bị thiếu.
- Trường có giá trị `null`.
- Trường có giá trị mặc định.
- Danh sách rỗng.
- Tài nguyên không tồn tại.

Không tự thay đổi cấu trúc response đang được consumer sử dụng.

### Bước 5: Định nghĩa error contract

Nếu hệ thống có error schema chuẩn, hãy tái sử dụng.

Error contract nên thể hiện các thông tin phù hợp như:

- Mã lỗi ổn định.
- Thông báo có thể hiển thị cho người dùng.
- Chi tiết validation.
- Request hoặc correlation ID nếu được hỗ trợ.
- HTTP status code tương ứng.

Phân biệt các trường hợp:

- Request không hợp lệ.
- Chưa xác thực.
- Không đủ quyền.
- Không tìm thấy tài nguyên.
- Xung đột dữ liệu.
- Quá nhiều request.
- Lỗi hệ thống nội bộ.
- Lỗi từ downstream.

Không trả stack trace, thông tin cấu hình, token hoặc dữ liệu nhạy cảm trong error response.

Không tự tạo error wrapper mới nếu nền tảng đã có chuẩn dùng chung.

### Bước 6: Chuẩn hóa dữ liệu đặc biệt

Đặc biệt kiểm tra:

**Ngày giờ**

- Xác định `date`, `time` hay `date-time`.
- Xác định timezone.
- Thống nhất định dạng giữa backend và frontend.
- Không tự chuyển đổi timezone làm thay đổi ý nghĩa thời điểm.
- Kiểm tra kiểu Java và TypeScript thực tế được generator sử dụng.

**Enum**

- Giá trị phải rõ ràng và ổn định.
- Kiểm tra hành vi khi xuất hiện giá trị mới.
- Đánh giá ảnh hưởng tới client được sinh tự động.

**Số thập phân**

- Xác định precision và scale nếu liên quan.
- Không dùng kiểu số dấu phẩy động trong các nghiệp vụ cần độ chính xác thập phân cao mà không đánh giá rủi ro.

**Nullable và trường tùy chọn**

- Kiểm tra cách OpenAPI Generator biểu diễn.
- Kiểm tra sự khác nhau giữa không gửi field và gửi `null`.
- Đảm bảo backend và frontend hiểu thống nhất.

**Binary và dữ liệu lớn**

- Xác định đúng media type.
- Phân biệt JSON với multipart hoặc binary payload.
- Không khai báo file upload như một trường JSON thông thường nếu API yêu cầu multipart.
- Không đưa payload quá lớn vào schema ví dụ.

## 4. Pagination, filtering và sorting

Nếu API hỗ trợ danh sách, phải xác định:

- Cách truyền page và size hoặc cursor.
- Quy tắc đánh số trang.
- Kích thước tối đa.
- Cách sắp xếp mặc định.
- Các trường cho phép sort.
- Cách lọc dữ liệu.
- Cấu trúc metadata phân trang.
- Hành vi khi không có kết quả.

Tái sử dụng convention hiện có.

Không tự tạo response phân trang khác biệt giữa các endpoint cùng hệ thống nếu không có lý do.

Nếu hỗ trợ sorting từ request, backend phải giới hạn các field được phép sắp xếp thay vì cho phép truyền tùy ý tên cột database.

## 5. Sinh code tự động

### 5.1. Kiểm tra generator

Trước khi generate:

1. Xác định công cụ và phiên bản.
2. Kiểm tra cấu hình input và output.
3. Kiểm tra package name.
4. Kiểm tra naming convention.
5. Kiểm tra custom template và type mapping.
6. Kiểm tra output directory có chứa code thủ công không.
7. Xác định cách build đang gọi generator.

Không tự ý thay đổi phiên bản generator hoặc toàn bộ cấu hình chỉ để giải quyết một lỗi nhỏ.

### 5.2. Quy trình generate

Thực hiện theo quy trình của repository:

1. Cập nhật contract nguồn.
2. Kiểm tra cú pháp OpenAPI.
3. Chạy generator.
4. Review các file được tạo hoặc thay đổi.
5. Kiểm tra compile.
6. Chạy test.
7. Kiểm tra diff ngoài dự kiến.

Nếu generator tạo nhiều thay đổi không liên quan, phải điều tra nguyên nhân thay vì tự động chấp nhận toàn bộ.

Không xóa output directory hoặc file thủ công nếu chưa xác định được cơ chế generate.

### 5.3. Type mapping

Khi cấu hình type mapping:

- Kiểm tra kiểu dữ liệu ở cả contract và ngôn ngữ đích.
- Kiểm tra nullability.
- Kiểm tra serialization và deserialization.
- Kiểm tra format ngày giờ.
- Kiểm tra generic type và collection.
- Đảm bảo mapping tương thích với framework hiện tại.

Không đổi mapping chỉ để compile thành công nếu làm sai ý nghĩa dữ liệu.

## 6. Đồng bộ Java backend và React frontend

Khi một API thay đổi, kiểm tra toàn bộ chuỗi:

`OpenAPI → Generated Java Model/API → Backend Implementation → Generated TypeScript Client/Types → Frontend Usage → Tests`

Tùy kiến trúc, thứ tự nguồn chính có thể khác. Phải tuân thủ quy trình thực tế.

Đặc biệt kiểm tra:

- Tên field và kiểu dữ liệu.
- Trường bắt buộc.
- Nullable.
- Enum.
- Date/time.
- Pagination.
- HTTP status code.
- Error schema.
- Authentication.
- Các thay đổi phá vỡ tương thích.

Không giả định việc generate code đồng nghĩa với việc backend đã triển khai đúng contract hoặc frontend đã sử dụng đúng response.

Nếu phát hiện sai lệch, hãy chỉ rõ nguồn sai lệch và phạm vi cần sửa.

## 7. Quản lý tương thích và versioning

Trước khi sửa contract, phân loại thay đổi:

### Thay đổi thường có nguy cơ tương thích

- Xóa endpoint hoặc field.
- Đổi tên field.
- Đổi kiểu dữ liệu.
- Thêm field bắt buộc vào request.
- Thay đổi cấu trúc response.
- Thay đổi ý nghĩa enum.
- Thay đổi authentication hoặc authorization.
- Thay đổi status code mà consumer đang phụ thuộc.

### Thay đổi cần đánh giá theo consumer

- Thêm field response.
- Thêm giá trị enum.
- Nới hoặc siết validation.
- Thay đổi default value.
- Thay đổi pagination.
- Thay đổi quy tắc xử lý null.

Không mặc định mọi thay đổi bổ sung đều an toàn với tất cả client. Một số client sinh tự động hoặc triển khai nghiêm ngặt có thể bị ảnh hưởng.

Khi thay đổi có nguy cơ phá vỡ tương thích:

1. Xác định consumer bị ảnh hưởng.
2. Đề xuất migration hoặc versioning phù hợp.
3. Giữ khả năng tương thích khi có thể.
4. Nêu rõ những bước cần thực hiện đồng bộ.
5. Không tự xóa API cũ khi chưa được phê duyệt.

## 8. Bảo mật API contract

- Định nghĩa security scheme đúng với cơ chế xác thực thực tế.
- Không nhúng token hoặc secret vào ví dụ.
- Không khai báo endpoint nhạy cảm là public nếu không có căn cứ.
- Kiểm tra quyền trên tài nguyên ở backend.
- Không dựa vào mô tả OpenAPI để thay thế kiểm tra bảo mật thực tế.
- Không công bố dữ liệu nhạy cảm trong schema hoặc example.
- Không coi việc ẩn endpoint khỏi tài liệu là biện pháp bảo mật.
- Đảm bảo tài liệu phản ánh đúng yêu cầu authentication hiện có.

Nếu API sử dụng cơ chế bảo mật của nền tảng doanh nghiệp, hãy tuân thủ chuẩn security scheme và authorization của nền tảng đó.

## 9. Kiểm tra và review OpenAPI

Trước khi hoàn thành, kiểm tra:

### Cú pháp và cấu trúc

- YAML/JSON hợp lệ.
- Phiên bản OpenAPI phù hợp.
- Tham chiếu `$ref` hợp lệ.
- Schema không bị lặp hoặc mâu thuẫn.
- `operationId` duy nhất theo yêu cầu công cụ.
- HTTP method và path hợp lệ.
- Response được khai báo phù hợp.

### Contract

- Request/response phản ánh nghiệp vụ.
- Required và nullable nhất quán.
- Validation có ý nghĩa.
- Status code hợp lý.
- Error schema thống nhất.
- Example không mâu thuẫn với schema.
- Pagination và filter rõ ràng.
- Authentication được mô tả chính xác.

### Tương thích

- Không có breaking change ngoài dự kiến.
- Generated code phù hợp.
- Backend implementation phù hợp.
- Frontend consumer phù hợp.
- Test được cập nhật.

Sử dụng validator, linter hoặc công cụ contract test đã có trong dự án. Không tự thêm công cụ mới nếu không cần thiết.

## 10. Quản lý thay đổi

- Không commit, push, merge hoặc deploy nếu chưa được yêu cầu.
- Không thay đổi nhiều API không liên quan trong cùng một lần sửa.
- Không nâng cấp generator ngoài phạm vi.
- Không ghi đè code hoặc thay đổi chưa commit.
- Không khẳng định contract hợp lệ nếu chưa kiểm tra bằng công cụ hoặc chưa kiểm tra đầy đủ.
- Báo cáo rõ các bước generate hoặc test chưa thể thực hiện.

## 11. Định dạng báo cáo

### A. Thay đổi contract
- Endpoint được thêm, sửa hoặc loại bỏ.
- Schema và operation liên quan.
- Request/response và error model.

### B. Tương thích
- Consumer bị ảnh hưởng.
- Breaking change nếu có.
- Biện pháp migration.

### C. Sinh code
- Công cụ và lệnh đã sử dụng.
- Các file được generate.
- Sai lệch hoặc thay đổi bất thường.

### D. Kiểm thử
- Kết quả validate OpenAPI.
- Kết quả generate và compile.
- Kết quả test contract.
- Các bước chưa thực hiện.

### E. Rủi ro
- Giả định chưa xác nhận.
- Vấn đề tương thích.
- Các việc cần phê duyệt.

## 12. Tiêu chí hoàn thành

- Contract hợp lệ theo phiên bản OpenAPI của dự án.
- Request, response và error schema được định nghĩa rõ ràng.
- Nguồn contract chính được cập nhật đúng.
- Code được sinh theo quy trình hiện có.
- Backend và frontend được đánh giá về tính nhất quán.
- Breaking change được phát hiện và báo cáo.
- Kiểm tra và test được thực hiện trong khả năng môi trường.
- Kết quả được báo cáo trung thực.
