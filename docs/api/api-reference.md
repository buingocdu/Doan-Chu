---
title: "Tham chiếu REST API"
document_id: "DOC-002"
status: "Draft"
version: "0.2"
owner_role: "Backend Lead"
last_updated: "2026-10-24"
related_documents: ["DOC-001", "DOC-003", "DOC-005"]
---

# Tham chiếu REST API — game-word-server

## 1. Mục đích và phạm vi

- **Mục đích:** Mô tả các endpoint REST **hiện có (Current)**, viết thủ công từ controller vì dự án chưa có OpenAPI.
- **Đối tượng đọc:** Lập trình viên frontend/mobile, tester.
- **Base URL:** `http://localhost:8080/api` (local), `/api` qua Nginx hoặc Vite proxy.
- **Định dạng:** JSON, UTF-8. Không có versioning API.

## 2. Xác thực

- Header: `Authorization: Bearer <token>` — token lấy từ `/auth/login` hoặc `/auth/register`.
- Subject của token là **username** (từ 2026-10-24; trước đó là email gây lỗi R-01).
- Token sai/hết hạn không làm request lỗi: `JwtAuthFilter` bỏ qua và xử lý như khách.
- Token mang claim `ver` = `users.token_version` lúc cấp (từ 2026-10-28). Đổi/đặt lại mật khẩu làm tăng `token_version`, mọi JWT cũ bị coi như khách. Token cũ không có `ver` được coi là version 0.
- Không có phân quyền theo vai trò (authorities rỗng). Người chơi luôn được xác định từ token, không nhận `userId` từ client.

| Nhóm | Quy tắc (`SecurityConfig`) |
|------|---------------------------|
| `/api/auth/change-password` | Cần JWT hợp lệ (khai báo trước `/api/auth/**`) |
| `/api/auth/**`, `/api/words/**`, `/api/leaderboard/**`, `/api/game/**` | Public (game: có token thì được cộng điểm, không có token = khách) |
| `/api/history/**`, còn lại | Cần JWT hợp lệ |

## 3. Tổng hợp endpoint

| Method | Path | Auth | Controller method | Mô tả |
|--------|------|------|-------------------|-------|
| POST | `/api/auth/register` | Public | `AuthController.register` | Đăng ký, trả JWT |
| POST | `/api/auth/login` | Public | `AuthController.login` | Đăng nhập bằng tên tài khoản hoặc email, trả JWT |
| POST | `/api/auth/forgot-password` | Public | `AuthController.forgotPassword` | Gửi link đặt lại mật khẩu qua email |
| POST | `/api/auth/reset-password` | Public (token trong body) | `AuthController.resetPassword` | Đặt mật khẩu mới bằng token từ link |
| POST | `/api/auth/change-password` | JWT | `AuthController.changePassword` | Đổi mật khẩu, trả JWT mới |
| GET | `/api/words/random` | Public | `WordController.random` | Từ ngẫu nhiên |
| GET | `/api/words/random/{level}` | Public | `WordController.randomByLevel` | Từ ngẫu nhiên theo cấp độ |
| POST | `/api/game/start` | Public / JWT | `GameController.start` | Bắt đầu ván |
| GET | `/api/game/current` | Public / JWT | `GameController.current` | Ván đang chơi dở (khôi phục sau khi tải lại trang) |
| POST | `/api/game/guess` | Public / JWT | `GameController.guess` | Gửi lượt đoán |
| GET | `/api/history/user/{userId}` | JWT | `HistoryController.history` | Lịch sử của người dùng |
| GET | `/api/history/correct/user/{userId}` | JWT | `HistoryController.correct` | Các lượt đoán đúng |
| GET | `/api/leaderboard` | Public | `LeaderboardController.leaderboard` | Bảng xếp hạng |

## 4. Chi tiết endpoint

### 4.1 `POST /api/auth/register`

Request (`RegisterRequest`):

```json
{ "username": "player1", "password": "<password>", "email": "player1@example.com" }
```

Response 200 (`AuthResponse`):

```json
{ "token": "<jwt>", "userId": 1, "username": "player1" }
```

Lỗi 400: `"Username already exists"`, `"Email already exists"`. Không có validation định dạng/độ dài (DTO không có annotation `@Valid`/constraint).

### 4.2 `POST /api/auth/login`

Request (`LoginRequest`): `{ "username": "...", "password": "..." }`

Trường `username` nhận **tên tài khoản hoặc email** (từ 2026-10-28): giá trị chứa `@` được tra theo `email` (khớp chính xác, đã trim), ngược lại tra theo `username`. Tên tài khoản hợp lệ không chứa `@` nên không bị nhầm.

Response 200: `AuthResponse` như trên. Lỗi 400 `"Invalid credentials"` (ném `RuntimeException`, không phải 401).

### 4.2a `POST /api/auth/forgot-password`

Request (`ForgotPasswordRequest`): `{ "email": "player1@example.com" }`

Nếu email tồn tại (khớp chính xác, đã trim):

1. Bỏ qua nếu tài khoản đã được gửi link trong 2 phút gần nhất (chống spam, dựa trên `password_reset_tokens.created_at`).
2. Xóa các token cũ của tài khoản, sinh token ngẫu nhiên 256 bit (base64url), **chỉ lưu SHA-256** vào `password_reset_tokens`, hạn 30 phút.
3. Gửi email chứa link `${app.frontend-url}/reset-password?token=<token>`. Gửi lỗi thì rollback, token không được lưu.

Mật khẩu hiện tại **không đổi** cho tới khi link được dùng, nên người khác biết email cũng không khóa được tài khoản.

Response 200 (`MessageResponse`) luôn giống nhau dù email có tồn tại hay không (chống dò tài khoản):

```json
{ "message": "If the email exists, a reset link has been sent" }
```

Lỗi 400: `"Email is required"`, `"Email service not configured"` (chưa đặt `SPRING_MAIL_HOST`), `"Email sending failed"` (SMTP lỗi).

### 4.2b `POST /api/auth/reset-password`

Request (`ResetPasswordRequest`): `{ "token": "<token từ link>", "newPassword": "..." }`
Response 200: `{ "message": "Password reset" }`. Token bị xóa sau khi dùng (dùng 1 lần), `token_version` tăng → đăng xuất mọi thiết bị.
Lỗi 400: `"Invalid or expired reset token"` (sai, hết hạn hoặc đã dùng), `"New password too short"` (< 6 ký tự).

### 4.2c `POST /api/auth/change-password` (JWT)

Request (`ChangePasswordRequest`): `{ "currentPassword": "...", "newPassword": "..." }`
Response 200: `AuthResponse` với **JWT mới**. `token_version` tăng nên JWT cũ (thiết bị khác) hết hiệu lực; client phải thay token đang lưu.
Lỗi 400: `"Current password is incorrect"`, `"New password too short"` (< 6 ký tự). Không có JWT/JWT bị thu hồi: 403.

### 4.3 `GET /api/words/random` và `GET /api/words/random/{level}`

| Tham số | Vị trí | Bắt buộc | Mô tả |
|---------|--------|----------|-------|
| `level` | path | Có (endpoint thứ hai) | Cấp độ 1–3 theo dữ liệu seed |
| `excludedIds` | query, lặp lại | Không | Danh sách `id` từ cần loại trừ |

Response 200 (`WordResponse`):

```json
{ "id": 6, "value": "THUVIEN", "phrase": "thư viện", "wordLength": 7, "level": 3, "maxAttempts": null }
```

> ⚠ Response trả về cả đáp án (`value`) cho client (R-03). Nếu tất cả từ bị loại trừ, server bỏ qua `excludedIds` và chọn lại trong toàn bộ kho.

### 4.4 ~~`GET /api/words`~~ (đã gỡ 2026-10-24)

Endpoint trả toàn bộ danh sách từ (~4 MB với ~45.000 từ) đã bị gỡ vì ứng dụng không sử dụng và làm lộ đáp án.

### 4.5 `POST /api/game/start`

Tham số query: `excludedIds` (danh sách Long, lặp lại `excludedIds=1&excludedIds=2`, không bắt buộc). Không có body. Server tạo bản ghi bắt đầu ván và trả `gameId`.

Response 200 (`GuessResponse`):

```json
{
  "gameId": 12, "wordId": 3, "wordLength": 7, "partLengths": [4, 3], "guess": "", "attempt": 0, "maxAttempts": 10,
  "correct": false, "gameOver": false, "cells": [], "score": null,
  "message": "Bat dau choi. Ban co 10 lan doan.", "answer": null
}
```

### 4.5a `GET /api/game/current`

Trả về ván đang chơi dở để frontend khôi phục sau khi tải lại trang.

| Người gọi | Ván được chọn |
|-----------|---------------|
| Có JWT | Ván có hoạt động gần nhất (bắt đầu hoặc đoán) của người dùng; tham số `gameId` bị bỏ qua. Hoạt động trên mọi thiết bị/trình duyệt |
| Khách | Ván có `gameId` (query) do frontend lưu ở `localStorage` (`gw.currentGame`), chỉ khi đó là ván của khách (`user_id` null) |

Chỉ trả về nếu ván **chưa đoán đúng và còn lượt**; ngược lại trả **204 No Content** (frontend bắt đầu ván mới).

Response 200 (`GameStateResponse`):

```json
{
  "gameId": 224, "wordId": 1532, "wordLength": 7, "partLengths": [4, 3], "maxAttempts": 10, "attempt": 2,
  "rows": [
    [ { "index": 0, "letter": "A", "color": "BLACK", "label": "den" } ],
    [ { "index": 0, "letter": "O", "color": "YELLOW", "label": "vang" } ]
  ]
}
```

(`rows` rút gọn; mỗi hàng có `wordLength` ô, dựng lại từ `game_histories.guess` + `result`.)

### 4.6 `POST /api/game/guess`

Request (`GuessRequest`):

```json
{ "gameId": 12, "guess": "LẠNH ĐẦU" }
```

`guess` là cả cụm từ người chơi gõ, có thể có dấu tiếng Việt và dấu cách (frontend gửi dạng `"TIẾNG ANH"`). Server:
- tách chữ cái (bỏ dấu cách, ký tự khác), chuyển sang chữ không dấu để chấm (`Ế → E`, `Đ → D`);
- nếu có dấu cách thì số chữ của từng tiếng phải khớp `partLengths`, nếu không trả 400;
- lưu `game_histories.guess` và trả `guess` dạng cụm có dấu tách theo tiếng; `cells[].letter` giữ chữ có dấu, màu được tính trên chữ không dấu. Lượt được đếm theo `gameId`. Người gửi phải trùng người đã bắt đầu ván (cùng user hoặc cùng là khách). Khi đoán đúng hoặc hết lượt, người dùng đã đăng nhập được cập nhật `total_score`, `games_played`, `games_won`. Response 200 (`GuessResponse`):

```json
{
  "gameId": 12, "wordId": 3, "wordLength": 7, "guess": "LANHDAU", "attempt": 2, "maxAttempts": 10,
  "correct": true, "gameOver": true,
  "cells": [ { "index": 0, "letter": "L", "color": "GREEN", "label": "xanh la" } ],
  "score": 91,
  "message": "Chuan! Ban doan dung tai lan thu 2. Duoc cong 91 diem.",
  "answer": "LANHDAU"
}
```

`partLengths`: số chữ cái của từng tiếng (từ `part1`, `part2`; nếu `part1 + part2` khác `value` thì trả `[wordLength]`), có trong mọi `GuessResponse`. `definition` (giải nghĩa từ Wiktionary, các nghĩa cách nhau bởi `
`, có thể null) và `answer` chỉ có giá trị khi `gameOver = true`; là từ có dấu in hoa tách tiếng (vd `"THƯ VIỆN"`), từ cũ không có `phrase` thì là dạng không dấu tách tiếng. Gửi tiếp vào ván đã kết thúc trả 200 với `gameOver = true`, `cells` rỗng.

(`cells` rút gọn; thực tế có `wordLength` phần tử.)

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `cells[].color` | `GREEN` \| `YELLOW` \| `BLUE` \| `BLACK` | Xem luật màu trong [DOC-001 §7](../architecture/architecture-overview.md#7-luật-chơi-được-cài-đặt--current) |
| `score` | Integer \| null | Chỉ có giá trị khi đoán đúng |
| `gameOver` | Boolean | `true` khi đúng hoặc hết lượt |

Lỗi 400: `"Game not found"` (không có ván / ván của người khác), `"Tu doan phai co N ki tu"` (sai độ dài), `"Tu doan phai gom N tieng: a + b chu cai"` (tách tiếng sai).

### 4.7 `GET /api/history/user/{userId}` và `/api/history/correct/user/{userId}`

Response 200: mảng entity `GameHistory` trả trực tiếp (không qua DTO):

```json
[ { "id": 10, "gameId": 9, "userId": 1, "wordId": 3, "guess": "LANHDAU", "result": "GREEN,GREEN,...",
    "attempt": 2, "correct": true, "playedAt": "2026-10-24T10:00:00" } ]
```

Bản ghi `attempt = 0` đánh dấu bắt đầu ván. `userId` trên path phải trùng người dùng của token, nếu không trả 403.

### 4.8 `GET /api/leaderboard`

Response 200: mảng `LeaderboardEntry` (`userId`, `username`, `totalScore`, `gamesPlayed`, `gamesWon`, `rank`), chỉ gồm người dùng có `gamesPlayed > 0`, sắp xếp `totalScore` giảm dần.

## 5. Định dạng lỗi (`GlobalExceptionHandler`)

| Exception | HTTP | Body |
|-----------|------|------|
| `RuntimeException` | 400 | `{ "status": 400, "message": "<ex.getMessage()>" }` |
| `MethodArgumentNotValidException` | 400 | `{ "status": 400, "message": "Validation failed", "errors": { "<field>": "<msg>" } }` |
| `AccessDeniedException` | 403 | `{ "status": 403, "message": "..." }` |
| `BadCredentialsException` | 401 | `{ "status": 401, "message": "Invalid credentials" }` |

Lỗi phát sinh trong filter bảo mật (ví dụ token sai/hết hạn) không đi qua handler này. `ASSUMPTION:` khi đó client nhận phản hồi lỗi mặc định của Spring (chưa chạy kiểm chứng).

## 6. Câu hỏi mở

- `OPEN QUESTION:` Có cần xuất bản OpenAPI (springdoc) làm contract chính thức thay cho tài liệu thủ công này?
- `OPEN QUESTION:` Endpoint `/api/words/random*` vẫn public và trả đáp án (R-03); ứng dụng không gọi tới.

## 7. Lịch sử thay đổi

| Phiên bản | Ngày | Mô tả |
|-----------|------|-------|
| 0.1 | 2026-10-24 | Khởi tạo từ controller/DTO |
| 0.2 | 2026-10-24 | Cập nhật theo bản sửa: `gameId`, `answer`, game public, người chơi lấy từ token, kiểm tra quyền lịch sử |
