---
title: "Báo cáo phân tích dự án"
document_id: "DOC-005"
status: "Draft"
version: "0.1"
owner_role: "Technical Lead"
last_updated: "2026-10-24"
related_documents: ["DOC-001", "DOC-002", "DOC-003", "DOC-004"]
---

# Báo cáo phân tích dự án — Game Đoán Chữ

## 1. Mục đích và phạm vi

- **Mục đích:** Ghi nhận hiện trạng repository, các lỗi và rủi ro phát hiện qua **phân tích tĩnh** mã nguồn tại commit `2417a6d` (2026-10-21).
- **Đối tượng đọc:** Technical Lead, lập trình viên sẽ sửa lỗi.
- **Giới hạn:** Không build, không chạy ứng dụng hay test trong quá trình phân tích. Các phát hiện là suy luận từ code, cần tái hiện trước khi sửa.

## 2. Tổng quan hiện trạng

| Hạng mục | Hiện trạng |
|----------|-----------|
| Cấu trúc | Monorepo: `backend/game-word-server` (Spring Boot), `frontend/game-word-web` (React + Vite), `docker-compose.yml` ở gốc |
| Quy mô | 31 file Java, 8 file JS/JSX |
| Test | Không có (`src/test` không tồn tại; frontend không có test runner) |
| CI/CD | Không có |
| Lint/format | Không cấu hình |
| OpenAPI | Không có |
| Tài liệu trước đây | Chỉ có `README.md` (đường dẫn sai, chứa mật khẩu mẫu, thiếu endpoint) |

Chi tiết kiến trúc: [DOC-001](../architecture/architecture-overview.md).

## 3. Danh sách lỗi và rủi ro

Mức độ: **Cao** = chức năng chính không hoạt động hoặc lỗ hổng bảo mật; **Trung bình** = sai nghiệp vụ; **Thấp** = chất lượng/vận hành.

| ID | Mức | Hạng mục | Mô tả | Bằng chứng |
|----|-----|---------|-------|-----------|
| R-01 | Cao | Bảo mật / chức năng | JWT được phát với subject = **email**, nhưng `JwtAuthFilter` gọi `loadUserByUsername(email)` và `UserDetailServiceImpl` tra cứu bằng `findByUsername`. Trừ khi username trùng email, request có token sẽ lỗi (`UsernameNotFoundException` trong filter). Kết hợp với việc `/api/game/**` yêu cầu xác thực, chức năng chơi game có khả năng không dùng được với cả khách lẫn người đã đăng nhập | `UserService.register/login`, `JwtAuthFilter.doFilterInternal`, `UserDetailServiceImpl` |
| R-02 | Cao | Bảo mật (IDOR) | `/api/history/user/{userId}`, `/api/game/start?userId=`, `GuessRequest.userId` nhận `userId` từ client, không đối chiếu với người dùng trong token | `HistoryController`, `GameController`, `GameService` |
| R-03 | Cao | Nghiệp vụ / gian lận | `GET /api/words`, `/api/words/random*` là public và trả `value` (đáp án) | `WordController`, `WordResponse` |
| R-04 | Trung bình | Nghiệp vụ | Số lượt = số bản ghi `game_histories` theo `word_id` của **mọi người chơi và mọi ván** (kể cả bản ghi bắt đầu `attempt=0`). Người chơi sau có thể bị báo hết lượt ngay | `GameService.makeGuess` (`findByWordId`) |
| R-05 | Trung bình | Nghiệp vụ | Điểm được tính nhưng không lưu: `UserService.addScore` / `incrementPlayed` không được gọi ở đâu. `total_score`, `games_played` luôn 0 nên leaderboard luôn rỗng (lọc `gamesPlayed > 0`) | `GameService`, `UserService`, `LeaderboardService` |
| R-06 | Trung bình | Cấu hình | Khóa `game.guess.max-attempts`, `game.score.min`, `game.score.max` không khớp binding của `GameConfig` (`game.max-attempts`, `game.score-min`, `game.score-max`); thay đổi cấu hình không có tác dụng | `GameConfig`, `application*.properties` |
| R-07 | Trung bình | Truy vấn | `findRandomNotIn` trả `Optional<Word>` nhưng JPQL trả nhiều dòng; Spring Data sẽ ném lỗi kết quả không duy nhất khi có > 1 từ phù hợp. `ASSUMPTION:` chưa chạy kiểm chứng; hành vi `NOT IN` với danh sách rỗng trên Hibernate 6 cũng cần kiểm tra | `WordRepository` |
| R-08 | Trung bình | Bảo mật | CORS cho phép mọi origin kèm `allowCredentials=true`; `@CrossOrigin("*")` trên mọi controller; `CORS_ALLOWED_ORIGINS` không có tác dụng | `SecurityConfig`, các controller |
| R-09 | Trung bình | Bí mật | Mật khẩu DB và JWT secret có giá trị literal trong `application.properties`, `liquibase.properties` (được commit) và giá trị mặc định trong `application-prod.properties`, `docker-compose.yml` | Các file cấu hình nêu trên |
| R-10 | Thấp | Validation | DTO không có constraint, controller không dùng `@Valid`; mọi `RuntimeException` → HTTP 400 với message nội bộ; sai mật khẩu trả 400 thay vì 401 | `dto/*`, `GlobalExceptionHandler` |
| R-11 | Thấp | Frontend | Frontend cho khách chơi nhưng backend yêu cầu JWT; không có route guard; `HistoryPage` hiển thị `wordId` thay vì từ; `getRandomWord`, `getLeaderboard`, `navigate`, `token` import/khai báo nhưng không dùng | `App.jsx` |
| R-12 | Thấp | Vận hành | `start.bat` và README cũ hard-code `D:\Working\Game word`; `VITE_API_BASE_URL` không được dùng; không có Actuator/health check backend | `start.bat`, `api.js`, `pom.xml` |
| R-13 | Thấp | Chất lượng | Không có test tự động cho logic quan trọng (`evaluateGuess`, `computeScore`); code chết: `HistoryService.getExcludedWordIds`, `GameService.getWordsForHistory` | `service/*` |

## 4. Đề xuất ưu tiên — Proposed

Các đề xuất dưới đây **chưa được triển khai** và cần thống nhất trước khi làm:

1. Sửa R-01: thống nhất subject JWT (username hoặc email) giữa `UserService` và `UserDetailServiceImpl`; quyết định chính sách khách chơi (OPEN QUESTION trong DOC-001).
2. Sửa R-02/R-03: lấy người dùng từ `SecurityContext`; bỏ `value` khỏi response public.
3. Sửa R-04/R-05: đưa khái niệm "ván chơi" (game session) để đếm lượt và cập nhật điểm — cần migration mới (xem DOC-003 §4).
4. Sửa R-06, R-07, R-08, R-09 (cấu hình, truy vấn `LIMIT 1`/`Pageable`, CORS theo môi trường, bỏ bí mật khỏi repository và xoay vòng giá trị đã lộ).
5. Bổ sung unit test cho `GameService` trước khi refactor (R-13).

## 5. Câu hỏi mở

- `OPEN QUESTION:` Repository có được chia sẻ công khai không? Nếu có, mật khẩu/secret đã commit (R-09) cần được xem là đã lộ.
- `OPEN QUESTION:` Ai là owner phê duyệt các tài liệu `docs/`?

## 6. Lịch sử thay đổi

| Phiên bản | Ngày | Mô tả |
|-----------|------|-------|
| 0.1 | 2026-10-24 | Khởi tạo từ phân tích tĩnh |
