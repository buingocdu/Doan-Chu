# Game Đoán Chữ (Word Guessing Game)

Trò chơi đoán từ ghép tiếng Việt (không dấu) trên web: hệ thống chọn ngẫu nhiên một từ ghép, người chơi có tối đa 10 lượt đoán và nhận phản hồi màu cho từng ký tự.

> Trạng thái: đang phát triển (Phase 1). Khách chơi được ngay; đăng nhập để được cộng điểm và lên bảng xếp hạng. Các vấn đề còn tồn tại: [Báo cáo phân tích](docs/analysis/project-analysis-report.md).

## Cấu trúc repository

```
.
├── backend/game-word-server/   # Spring Boot REST API
├── frontend/game-word-web/     # React + TypeScript + Vite SPA, đóng gói mobile bằng Capacitor (android/, ios/)
├── docs/                       # Tài liệu dự án
├── docker-compose.yml          # PostgreSQL + backend + frontend (Nginx)
├── .env.example                # Mẫu biến môi trường cho Docker Compose
└── start.bat                   # Script chạy local trên Windows (cần sửa đường dẫn)
```

## Công nghệ

| Thành phần | Công nghệ |
|-----------|-----------|
| Backend | Java 17, Spring Boot 3.2.5, Spring Data JPA, Spring Security + JWT (jjwt 0.12.3), Liquibase, Lombok |
| Frontend | React 18, TypeScript 5, React Router 6, Axios, Vite 5, Vitest |
| Database | PostgreSQL 15 |
| Mobile | Capacitor 6 (Android, iOS) |
| Triển khai | Docker, Docker Compose, Nginx |

## Bắt đầu nhanh

### Docker Compose

```bash
cp .env.example .env    # đặt POSTGRES_PASSWORD và JWT_SECRET (>= 32 ký tự)
docker compose up -d --build
```

Truy cập `http://localhost/`. API được Nginx proxy tại `/api/`.

### Chạy local

Yêu cầu: JDK 17, Maven, Node.js 20, PostgreSQL với database `game_word_db`.

```bash
# Backend — http://localhost:8080
cd backend/game-word-server
mvn spring-boot:run

# Frontend — http://localhost:3000 (proxy /api tới :8080)
cd frontend/game-word-web
npm install
npm run dev

# Kiểm tra
npm run typecheck
npm test
npm run build
```

Thông tin kết nối DB local nằm trong `backend/game-word-server/src/main/resources/application.properties`. Không commit mật khẩu thật. Chi tiết: [Runbook triển khai](docs/deployment/deployment-runbook.md).

## Luật chơi (hiện tại)

- Mỗi ván có một từ ghép (ví dụ `MAYTINH` = `MAY` + `TINH`), người chơi biết độ dài từ.
- Tối đa 10 lượt đoán.
- Màu phản hồi: **xanh lá** — đúng vị trí; **vàng** — có trong từ nhưng sai vị trí; **xanh dương** — đúng chữ cái, đúng vị trí nhưng sai dấu thanh (A/Ă/Â, E/Ê, O/Ô/Ơ, U/Ư, D/Đ là các chữ cái khác nhau); **đen** — không có trong từ.
- Đoán đúng ở lượt *n* được tính điểm từ 100 (lượt 1) giảm dần; người đã đăng nhập được cộng điểm vào bảng xếp hạng.

Chi tiết cài đặt và giới hạn: [Kiến trúc §7](docs/architecture/architecture-overview.md#7-luật-chơi-được-cài-đặt--current).

### App mobile (Android, iOS)

```bash
cd frontend/game-word-web
cp .env.mobile.example .env.mobile   # sửa IP máy chạy backend
npm run build:mobile                 # build web + đồng bộ vào android/ và ios/
```

APK Android: build bằng Gradle trong `android/`. iOS: cần macOS + Xcode. Chi tiết: [Build app mobile](docs/deployment/mobile-build.md).

## API

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| POST | `/api/auth/register` | — | Đăng ký |
| POST | `/api/auth/login` | — | Đăng nhập, trả JWT |
| GET | `/api/words/random` | — | Từ ngẫu nhiên (`excludedIds`) |
| GET | `/api/words/random/{level}` | — | Từ ngẫu nhiên theo cấp độ |
| POST | `/api/game/start` | Tùy chọn | Bắt đầu ván (có JWT thì được tính điểm) |
| GET | `/api/game/current` | Tùy chọn | Ván đang chơi dở + các lượt đã đoán (khôi phục khi tải lại trang) |
| POST | `/api/game/guess` | Tùy chọn | Gửi lượt đoán (`gameId`, `guess`) |
| GET | `/api/history/user/{userId}` | JWT | Lịch sử chơi |
| GET | `/api/history/correct/user/{userId}` | JWT | Các lượt đoán đúng |
| GET | `/api/leaderboard` | — | Bảng xếp hạng |

Request/response chi tiết: [Tham chiếu API](docs/api/api-reference.md).

## Tài liệu

Danh mục đầy đủ: [docs/documentation-catalog.md](docs/documentation-catalog.md)

| Tài liệu | Nội dung |
|----------|----------|
| [Kiến trúc tổng thể](docs/architecture/architecture-overview.md) | Module, luồng xử lý, luật chơi |
| [Tham chiếu API](docs/api/api-reference.md) | Endpoint, DTO, mã lỗi |
| [Thiết kế CSDL](docs/database/database-design.md) | ERD, data dictionary, migration |
| [Runbook triển khai](docs/deployment/deployment-runbook.md) | Biến môi trường, chạy local/Docker |
| [Build app mobile](docs/deployment/mobile-build.md) | Capacitor, build APK Android, iOS |
| [Báo cáo phân tích](docs/analysis/project-analysis-report.md) | Lỗi và rủi ro đã biết |

## Lộ trình (Phase 2)

- Ứng dụng mobile: đã đóng gói bằng Capacitor (APK debug); còn icon, HTTPS, ký release.
- Hoàn thiện đăng nhập, xếp hạng và lưu điểm tổng kết.
