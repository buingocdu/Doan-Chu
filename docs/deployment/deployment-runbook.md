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

## 11. Phương án miễn phí không cần thẻ: Supabase + Render + Vercel

```
Trình duyệt ──► Vercel (frontend tĩnh, HTTPS)
                  │  /api/* (rewrite cùng tên miền, không cần CORS)
                  ▼
               Render Free, Frankfurt (backend Docker)
                  │  Session pooler, SSL
                  ▼
               Supabase Free, eu-west-1 (Postgres 17)
```

| Thành phần | File cấu hình | Hạn chế của gói miễn phí |
|---|---|---|
| Database | `deploy/supabase-harden.sh`, `deploy/supabase-hardening.sql` | 500 MB. Tự tạm dừng nếu 1 tuần không có truy cập, phải vào dashboard bấm *Restore* |
| Backend | `render.yaml` | 512 MB RAM. Ngủ sau 15 phút không có truy cập, lần đầu mở lại chờ khoảng 1 phút |
| Frontend | `frontend/game-word-web/vercel.json` | Không đáng kể |

Không cần nạp dữ liệu thủ công: lần khởi động đầu tiên, Liquibase tạo bảng và nạp từ điển vào Supabase.

### 11.1. Database (Supabase)

1. Tạo `.env.supabase` ở thư mục gốc repo (file đã gitignore), một dòng:
   `SUPABASE_DB_URL=postgresql://postgres.<project-ref>:<mật-khẩu>@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require`.
   Lấy chuỗi này trong **Connect → Session pooler**. Không dùng *Direct connection* vì địa chỉ đó chỉ có IPv6.
2. Sau khi backend khởi động lần đầu (bước 11.2), chạy `bash deploy/supabase-harden.sh`. Script thu hồi quyền của `anon`/`authenticated` và bật RLS cho mọi bảng, để anon key công khai của Supabase không đọc được bảng `users` (email, hash mật khẩu) qua Data API.
3. Nên tắt hẳn Data API: **Project Settings → Data API → tắt Enable Data API**.
4. Mỗi khi thêm changeset Liquibase tạo bảng mới, chạy lại `deploy/supabase-harden.sh`.

### 11.2. Backend (Render)

1. Đăng nhập <https://dashboard.render.com> bằng GitHub.
2. Chọn **New → Blueprint**, chọn repo, nhánh `main`. Render đọc `render.yaml` và hỏi các biến bí mật:

   | Biến | Giá trị |
   |---|---|
   | `SPRING_DATASOURCE_URL` | `jdbc:postgresql://aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require` |
   | `SPRING_DATASOURCE_USERNAME` | `postgres.<project-ref>` |
   | `SPRING_DATASOURCE_PASSWORD` | Mật khẩu DB Supabase |

   `JWT_SECRET` do Render tự sinh.
3. Chờ build xong (lần đầu khoảng 5–10 phút). Kiểm tra `https://<tên-dịch-vụ>.onrender.com/api/leaderboard` trả JSON.
4. Nếu Render đặt tên khác `game-word-backend`, sửa URL trong `frontend/game-word-web/vercel.json` cho khớp rồi push lại.

### 11.3. Frontend (Vercel)

1. Đăng nhập <https://vercel.com> bằng GitHub.
2. Chọn **Add New → Project**, chọn repo.
3. **Root Directory** chọn `frontend/game-word-web`. Framework tự nhận là Vite. Bấm **Deploy**.
4. Mở `https://<tên-project>.vercel.app`: khách chơi được ngay; bấm **Đăng ký** để tạo tài khoản và xem bảng xếp hạng.

### 11.4. Giữ dịch vụ không ngủ (tuỳ chọn)

Tạo một job miễn phí tại <https://cron-job.org> gọi `https://<tên-dịch-vụ>.onrender.com/api/leaderboard` **mỗi 10 phút**.
Render không ngủ nên không còn phải chờ khi mở trang, và Supabase có truy cập đều đặn nên không bị tạm dừng.
Gói Free của Render có 750 giờ mỗi tháng, đủ cho một dịch vụ chạy liên tục.

### 11.5. Cập nhật

Push lên `main` là Render và Vercel tự build lại. Liquibase tự áp dụng changeset mới khi backend khởi động.

## 12. Lịch sử thay đổi

| Phiên bản | Ngày | Mô tả |
|-----------|------|-------|
| 0.1 | 2026-10-24 | Khởi tạo từ Dockerfile, docker-compose.yml, properties |
| 0.2 | 2026-10-28 | Thêm phương án miễn phí Supabase + Render + Vercel |
