---
title: "Tham chiếu REST API"
document_id: "DOC-002"
status: "Draft"
version: "0.1"
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
- Subject của token là **email** người dùng (`UserService` gọi `jwtUtil.generateToken(user.getEmail())`).
- Không có phân quyền theo vai trò (authorities rỗng).

| Nhóm | Quy tắc (`SecurityConfig`) |
|------|---------------------------|
| `/api/auth/**`, `/api/words/**`, `/api/leaderboard/**` | Public |
| `/api/game/**`, `/api/history/**`, còn lại | Cần JWT hợp lệ |

> ⚠ Đã xác định qua phân tích tĩnh: endpoint cần xác thực hiện không dùng được với token phát hành (R-01, [DOC-005](../analysis/project-analysis-report.md)).

## 3. Tổng hợp endpoint

| Method | Path | Auth | Controller method | Mô tả |
|--------|------|------|-------------------|-------|
| POST | `/api/auth/register` | Public | `AuthController.register` | Đăng ký, trả JWT |
| POST | `/api/auth/login` | Public | `AuthController.login` | Đăng nhập, trả JWT |
| GET | `/api/words` | Public | `WordController.all` | Danh sách từ đang active |
| GET | `/api/words/random` | Public | `WordController.random` | Từ ngẫu nhiên |
| GET | `/api/words/random/{level}` | Public | `WordController.randomByLevel` | Từ ngẫu nhiên theo cấp độ |
| POST | `/api/game/start` | JWT | `GameController.start` | Bắt đầu ván |
| POST | `/api/game/guess` | JWT | `GameController.guess` | Gửi lượt đoán |
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
Response 200: `AuthResponse` như trên. Lỗi 400 `"Invalid credentials"` (ném `RuntimeException`, không phải 401).

### 4.3 `GET /api/words/random` và `GET /api/words/random/{level}`

| Tham số | Vị trí | Bắt buộc | Mô tả |
|---------|--------|----------|-------|
| `level` | path | Có (endpoint thứ hai) | Cấp độ 1–3 theo dữ liệu seed |
| `excludedIds` | query, lặp lại | Không | Danh sách `id` từ cần loại trừ |

Response 200 (`WordResponse`):

```json
{ "id": 3, "value": "LANHDAU", "wordLength": 7, "level": 2, "maxAttempts": null }
```

> ⚠ Response trả về cả đáp án (`value`) cho client (R-03). Nếu tất cả từ bị loại trừ, server bỏ qua `excludedIds` và chọn lại trong toàn bộ kho.

### 4.4 `GET /api/words`

Response 200: mảng `WordResponse` (gồm `value`), sắp xếp theo `level`, `id`.

### 4.5 `POST /api/game/start`

Tham số query: `userId` (Long, không bắt buộc), `excludedIds` (danh sách Long, không bắt buộc). Không có body.

Response 200 (`GuessResponse`):

```json
{
  "wordId": 3, "wordLength": 7, "guess": "", "attempt": 0, "maxAttempts": 10,
  "correct": false, "gameOver": false, "cells": [], "score": null,
  "message": "Bat dau choi. Ban co 10 lan doan."
}
```

### 4.6 `POST /api/game/guess`

Request (`GuessRequest`):

```json
{ "wordId": 3, "guess": "lanhdau", "userId": 1 }
```

`guess` được `trim()` và chuyển chữ hoa phía server. Response 200 (`GuessResponse`):

```json
{
  "wordId": 3, "wordLength": 7, "guess": "LANHDAU", "attempt": 2, "maxAttempts": 10,
  "correct": true, "gameOver": true,
  "cells": [ { "index": 0, "letter": "L", "color": "GREEN", "label": "xanh la" } ],
  "score": 91,
  "message": "Chuan! Ban doan dung tai lan thu 2. Duoc cong 91 diem."
}
```

(`cells` rút gọn; thực tế có `wordLength` phần tử.)

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `cells[].color` | `GREEN` \| `YELLOW` \| `BLUE` \| `BLACK` | Xem luật màu trong [DOC-001 §7](../architecture/architecture-overview.md#7-luật-chơi-được-cài-đặt--current) |
| `score` | Integer \| null | Chỉ có giá trị khi đoán đúng |
| `gameOver` | Boolean | `true` khi đúng hoặc hết lượt |

Lỗi 400: `"Word not found"`.

### 4.7 `GET /api/history/user/{userId}` và `/api/history/correct/user/{userId}`

Response 200: mảng entity `GameHistory` trả trực tiếp (không qua DTO):

```json
[ { "id": 10, "userId": 1, "wordId": 3, "guess": "LANHDAU", "result": "GREEN,GREEN,...",
    "attempt": 2, "correct": true, "playedAt": "2026-10-24T10:00:00" } ]
```

Không kiểm tra `userId` trên path có trùng người dùng của token hay không (R-02).

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
- `OPEN QUESTION:` `userId` nên lấy từ token thay vì tham số do client gửi?

## 7. Lịch sử thay đổi

| Phiên bản | Ngày | Mô tả |
|-----------|------|-------|
| 0.1 | 2026-10-24 | Khởi tạo từ controller/DTO |
