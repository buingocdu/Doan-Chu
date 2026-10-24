---
title: "Runbook cấu hình và triển khai"
document_id: "DOC-004"
status: "Draft"
version: "0.1"
owner_role: "DevOps"
last_updated: "2026-10-24"
related_documents: ["DOC-001", "DOC-003", "DOC-005"]
---

# Runbook cấu hình và triển khai

## 1. Mục đích và phạm vi

- **Mục đích:** Hướng dẫn chạy hệ thống ở môi trường local và bằng Docker Compose, dựa trên cấu hình **hiện có** trong repository.
- **Đối tượng đọc:** Lập trình viên, người vận hành.
- **Ngoài phạm vi:** CI/CD — repository chưa có pipeline.

## 2. Ma trận môi trường

| Môi trường | Cách chạy | Profile Spring | Frontend | API |
|-----------|-----------|----------------|----------|-----|
| Local dev | Maven + Vite | mặc định (`application.properties`) | `http://localhost:3000` | `http://localhost:8080` (Vite proxy `/api`) |
| Docker Compose | `docker compose up` | `prod` (`application-prod.properties`) | `http://localhost:${FRONTEND_PORT:-80}` | Nginx proxy `/api/` → `backend:8080`; cổng `${BACKEND_PORT:-8080}` cũng mở ra host |

## 3. Yêu cầu

| Công cụ | Phiên bản | Nguồn |
|---------|-----------|-------|
| JDK | 17 | `pom.xml` (`java.version`) |
| Maven | 3.9.x (image build `maven:3.9.9-eclipse-temurin-17`) | Backend `Dockerfile` |
| Node.js | 20 (image build `node:20-alpine`) | Frontend `Dockerfile` |
| PostgreSQL | 15 | `docker-compose.yml` |
| Docker + Compose v2 | — | Chỉ cho môi trường Compose |

## 4. Biến môi trường (Docker Compose)

Sao chép `.env.example` thành `.env` ở thư mục gốc và đặt giá trị thật. `.env` đã nằm trong `.gitignore`.

| Biến | Dùng bởi | Mô tả |
|------|----------|-------|
| `POSTGRES_DB` | db, backend | Tên database (mặc định `game_word_db`) |
| `POSTGRES_USER` | db, backend | User database |
| `POSTGRES_PASSWORD` | db, backend | **Bí mật** — bắt buộc đặt giá trị mạnh |
| `POSTGRES_PORT` | db | Cổng publish ra host (mặc định 5432) |
| `BACKEND_PORT` | backend | Cổng publish ra host (mặc định 8080) |
| `FRONTEND_PORT` | frontend | Cổng publish ra host (mặc định 80); chưa có trong `.env.example` |
| `JWT_SECRET` | backend | **Bí mật** — khóa HMAC, tối thiểu 32 byte (yêu cầu của `Keys.hmacShaKeyFor`) |
| `CORS_ALLOWED_ORIGINS` | backend | Đọc vào `spring.mvc.cors.allowed-origins` nhưng **không có hiệu lực** do `SecurityConfig` tự cấu hình CORS (R-08) |

> ⚠ `docker-compose.yml` và `application-prod.properties` có giá trị mặc định cho mật khẩu DB và JWT secret. Nếu thiếu `.env`, hệ thống vẫn khởi động với giá trị mặc định công khai — không dùng cho production (R-09).

Frontend `Dockerfile` khai báo `ARG VITE_API_BASE_URL`, nhưng `src/services/api.js` hard-code `baseURL: '/api'`, nên biến này hiện không có tác dụng.

## 5. Chạy local

1. Tạo database PostgreSQL `game_word_db` và user tương ứng (hoặc chỉ chạy service db: `docker compose up -d db`).
2. Cập nhật thông tin kết nối trong `backend/game-word-server/src/main/resources/application.properties` cho máy local. Không commit mật khẩu thật.
3. Backend:
   ```bash
   cd backend/game-word-server
   mvn spring-boot:run
   # hoặc
   mvn -DskipTests package
   java -jar target/game-word-server-1.0.0.jar
   ```
   Liquibase tự tạo schema; từ mẫu được seed khi bảng `words` rỗng.
4. Frontend:
   ```bash
   cd frontend/game-word-web
   npm install
   npm run dev
   ```

`start.bat` hard-code đường dẫn `D:\Working\Game word\...` không còn đúng với vị trí repository hiện tại; cần sửa đường dẫn trước khi dùng.

## 6. Triển khai bằng Docker Compose

```bash
cp .env.example .env      # sửa giá trị bí mật
docker compose up -d --build
docker compose ps
```

Thứ tự khởi động: `db` (healthcheck `pg_isready`) → `backend` (`depends_on: service_healthy`) → `frontend`. Backend container chạy bằng user không phải root (`appuser`, UID 1001). Log Docker: driver `json-file`, tối đa 3 file × 10 MB mỗi service.

## 7. Kiểm tra sau triển khai (smoke check)

| Kiểm tra | Lệnh / thao tác | Kết quả mong đợi |
|----------|-----------------|------------------|
| Container | `docker compose ps` | 3 service ở trạng thái running, `db` healthy |
| SPA | Mở `http://localhost/` | Hiển thị "Game Do An Chu" |
| API public | `curl http://localhost/api/leaderboard` | HTTP 200, mảng JSON |
| Đăng ký | `POST /api/auth/register` | HTTP 200, có `token` |

Backend chưa có Spring Boot Actuator nên không có endpoint health riêng. Các kiểm tra trên **chưa được chạy** khi viết tài liệu này.

## 8. Rollback và khôi phục

- Rollback ứng dụng: checkout commit trước đó và `docker compose up -d --build`.
- Liquibase chưa định nghĩa `rollback` cho changeset; rollback schema phải thực hiện thủ công.
- `OPEN QUESTION:` Chưa có quy trình backup/restore volume `game_word_db_data`.

## 9. Lệnh build/test

| Mục đích | Lệnh | Ghi chú |
|----------|------|---------|
| Build backend | `mvn -B clean package` | |
| Test backend | `mvn test` | Chưa có test nào trong repository |
| Build frontend | `npm run build` | |
| Lint / type-check frontend | — | Chưa cấu hình ESLint/TypeScript |

## 10. Lịch sử thay đổi

| Phiên bản | Ngày | Mô tả |
|-----------|------|-------|
| 0.1 | 2026-10-24 | Khởi tạo từ Dockerfile, docker-compose.yml, properties |
