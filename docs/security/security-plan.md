---
title: "Đánh giá và phương án bảo mật (VPS)"
document_id: "DOC-008"
status: "In Review"
version: "0.1"
owner_role: "Technical Lead"
last_updated: "2026-10-30"
related_documents: ["DOC-002", "DOC-004", "DOC-007"]
---

# Đánh giá và phương án bảo mật — triển khai trên VPS

## 1. Mục đích và phạm vi

- **Mục đích:** Liệt kê lỗ hổng đã xác minh và phương án xử lý để giảm nguy cơ bị tấn công sau khi chuyển từ Render/Supabase/Vercel sang VPS riêng (`doanchu.157-10-52-46.sslip.io`).
- **Phạm vi đã kiểm tra (2026-10-30):**
  - Mã nguồn backend/frontend nhánh `main` (đang chạy trên VPS) và `feature/phase2-multiplayer`.
  - `docker-compose.prod.yml`, `deploy/`, `nginx.conf`, `application-prod.properties`.
  - Kiểm tra **từ bên ngoài** site đang chạy: header, CORS, thông báo lỗi, giới hạn đăng nhập (chỉ request GET/POST thông thường, 12 lần đăng nhập sai với tài khoản không tồn tại).
  - `npm audit` frontend.
- **Chưa kiểm tra được:** bên trong VPS (SSH, tường lửa, Caddy, các ứng dụng khác dùng chung) vì máy dev này không có quyền SSH. Mục 6 là checklist để chủ server tự chạy.
- Không có hệ thống nào an toàn tuyệt đối; tài liệu này giảm rủi ro ở mức hợp lý cho một game cộng đồng.

## 2. Tài sản và ranh giới tin cậy

| Tài sản | Mức độ | Hậu quả nếu bị lộ / sửa |
|---------|--------|-------------------------|
| Tài khoản người dùng (hash mật khẩu BCrypt, email) | Cao | Lộ email, dò mật khẩu yếu, chiếm tài khoản |
| `JWT_SECRET` | **Rất cao** | Giả mạo token của **bất kỳ** người dùng |
| `DB_PASSWORD`, dữ liệu PostgreSQL | Cao | Lộ/xóa toàn bộ dữ liệu |
| Tài khoản Gmail gửi mail (App Password) | Cao | Gửi thư rác/lừa đảo dưới tên game; Google khóa tài khoản |
| VPS dùng chung (Docker, Caddy, ứng dụng khác) | **Rất cao** | Chiếm 1 ứng dụng có thể lan sang toàn bộ server |
| Bảng xếp hạng, chat, kết bạn | Trung bình | Gian lận điểm, spam, quấy rối |

```text
Internet ──HTTPS──► Caddy (/opt/edge, cổng 80/443, TLS) ──mạng docker "edge"──► web (Nginx: SPA + proxy /api)
                                                                              └─► backend (Spring Boot, JWT) ──► db (PostgreSQL)
```

Ranh giới tin cậy: mọi thứ từ trình duyệt/app đều **không tin cậy**; Caddy → Nginx → backend là mạng nội bộ Docker (không mở cổng ra host — đúng).

## 3. Những điểm đã làm tốt (giữ nguyên)

- Compose production **không mở cổng nào ra host**, DB không lộ ra Internet; HTTP tự chuyển HTTPS (308) qua Caddy.
- Bí mật (`DB_PASSWORD`, `JWT_SECRET`, `SITE_URL`) **bắt buộc** đặt trong `.env.prod` (cú pháp `:?`), file quyền 600, không commit.
- Mật khẩu băm BCrypt; JWT có hạn 24h và bị thu hồi khi đổi/đặt lại mật khẩu (`token_version`).
- Quên mật khẩu dùng link một lần, chỉ lưu SHA-256 của token, hạn 30 phút; phản hồi giống nhau dù email có tồn tại hay không.
- Truy vấn DB qua JPA/tham số hóa, không ghép chuỗi SQL. Backend container chạy user không phải root.
- Phân quyền theo dữ liệu: lịch sử chỉ xem của mình; phòng chỉ thành viên xem; tin nhắn riêng chỉ giữa bạn bè; đáp án không gửi về client khi ván đang chơi.
- React tự escape nội dung (không có `dangerouslySetInnerHTML`), tin nhắn chat hiển thị dạng văn bản thuần.

## 4. Lỗ hổng đã xác minh

Mức: **Cao** = cần xử lý ngay; **TB** = trong tuần; **Thấp** = khi có thời gian.

| # | Lỗ hổng | Mức | Bằng chứng | Kịch bản tấn công |
|---|---------|-----|-----------|-------------------|
| S1 | **Không giới hạn tần suất** đăng nhập, đăng ký, quên mật khẩu, tạo ván | **Cao** | 12 lần đăng nhập sai liên tiếp đều được xử lý (400), không có 429; không có `limit_req` trong `nginx.conf` | Dò mật khẩu hàng loạt; tạo hàng nghìn tài khoản rác; spam email quên mật khẩu qua nhiều tài khoản → Gmail khóa; `POST /api/game/start` (không cần đăng nhập) ghi DB liên tục làm đầy ổ đĩa |
| S2 | **Thiếu toàn bộ header bảo mật** trên VPS (HSTS, CSP, X-Frame-Options, nosniff, Referrer-Policy); lộ phiên bản `nginx/1.27.5` | **Cao** | `curl -I` trang chủ chỉ có `Server: nginx/1.27.5`, `Via: 1.1 Caddy`. Các header này từng có trong `vercel.json` nhưng không được chuyển sang `nginx.conf` | Clickjacking (nhúng site vào iframe); nếu có XSS thì không có CSP chặn → **đánh cắp JWT trong localStorage** |
| S3 | **CORS chấp nhận mọi origin, kèm credentials** | TB | Request với `Origin: https://evil.example` nhận `Access-Control-Allow-Origin: https://evil.example`, `Allow-Credentials: true`. Nguồn: `SecurityConfig.java:31,34` (`*`), `@CrossOrigin("*")` ở 8 controller; biến `CORS_ALLOWED_ORIGINS` trong compose **không được dùng** | Hiện token nằm trong header (không phải cookie) nên chưa khai thác trực tiếp được, nhưng mọi website đều gọi được API thay người dùng nếu có token, và rủi ro tăng ngay khi đổi sang cookie |
| S4 | **Thông báo lỗi lộ chi tiết nội bộ** | TB | Gửi JSON sai → `"JSON parse error: Unexpected character ('b' (code 98))…"`. `GlobalExceptionHandler.java:16-18` trả `ex.getMessage()` của **mọi** `RuntimeException`, kể cả lỗi SQL/ràng buộc DB (tên bảng, tên constraint) | Dò cấu trúc hệ thống để chuẩn bị tấn công khác |
| S5 | **Đăng ký không kiểm tra dữ liệu ở backend** | TB | `UserService.register` (`UserService.java:59`) chỉ kiểm tra trùng; quy tắc độ dài/định dạng chỉ có ở frontend | Gọi API trực tiếp tạo username chứa `@`, ký tự lạ, chuỗi rất dài (lỗi 500 + lộ lỗi DB theo S4), email không hợp lệ, mật khẩu 1 ký tự |
| S6 | **JWT secret mặc định nằm công khai trong repo** | TB (Cao nếu VPS dùng nhầm) | `application.properties:22`, `application-prod.properties:23` (giá trị fallback), `docker-compose.yml:42` | Nếu môi trường nào chạy thiếu `JWT_SECRET`, ai đọc repo cũng **ký được token của bất kỳ ai**. Compose production bắt buộc biến này nên VPS hiện an toàn — cần xác nhận `.env.prod` dùng chuỗi ngẫu nhiên ≥ 32 ký tự |
| S7 | **Danh sách `excludedIds` không giới hạn** ở endpoint công khai | TB | `GET /api/words/random`, `POST /api/game/start` nhận `excludedIds` tùy ý, đưa vào `NOT IN (:excludedIds)` | Gửi hàng chục nghìn id → truy vấn nặng / vượt giới hạn tham số PostgreSQL → làm chậm server (DoS) |
| S8 | **Spring Boot 3.2.5 đã hết hỗ trợ** | TB | `pom.xml:8` | Không nhận bản vá bảo mật cho Spring/Tomcat/Jackson phát hiện sau ngày hết hỗ trợ |
| S9 | `GET /api/words/random` **trả cả đáp án** cho khách | Thấp | Response có `"value":"MOTVAI","phrase":"một vài"`; frontend không dùng endpoint này | Không trực tiếp gian lận được ván đang chơi (từ của ván do server chọn riêng), nhưng là bề mặt tấn công thừa |
| S10 | Ván của **khách** truy cập được bằng `gameId` tuần tự | Thấp | `GameService.currentGame`/`makeGuess`: ván có `user_id = null` thì khách nào có `gameId` cũng xem/đoán được | Phá ván của khách khác (không ảnh hưởng điểm xếp hạng) |
| S11 | Đăng ký tiết lộ email đã tồn tại | Thấp | Lỗi `"Email already exists"` | Kiểm tra một email có tài khoản hay không (đánh đổi phổ biến để dễ dùng) |
| S12 | Phase 2: một người tạo **không giới hạn số phòng** | Thấp | `RoomService.create` không giới hạn | Spam tạo phòng làm phình DB |
| S13 | Tài khoản DB của ứng dụng là **superuser** PostgreSQL | Thấp | `POSTGRES_USER: gameword` của image chính thức là superuser | Nếu một ngày có SQL injection, kẻ tấn công có toàn quyền DB (đọc file, tạo extension…) |
| S14 | App mobile cấu hình `androidScheme: 'http'`, `cleartext: true` | Thấp (mobile) | `capacitor.config.ts` | Bản production nếu giữ nguyên sẽ cho phép gọi HTTP không mã hóa |
| S15 | Mật khẩu Gmail đã bị dán vào cuộc trò chuyện với trợ lý AI | **Cao** | 2026-10-30 | Phải coi là đã lộ: đổi mật khẩu, bật xác minh 2 bước, chỉ dùng App Password cho SMTP |

**Phụ thuộc frontend (`npm audit --omit=dev`):** cảnh báo `critical` của `@capacitor/android|ios` chỉ ảnh hưởng **app mobile**, không ảnh hưởng web trên VPS (cập nhật bằng `npm audit fix` trước khi build APK). Cảnh báo `react-router` (GHSA-337j-9hxr-rhxg) chỉ áp dụng cho **SSR hydration** — ứng dụng là SPA nên không bị ảnh hưởng. Các cảnh báo còn lại thuộc công cụ dev/test (vitest, esbuild, tar), không nằm trong bản build.

## 5. Phương án xử lý trong mã nguồn

> **Trạng thái 2026-10-30:** toàn bộ mục **P0** và giới hạn `excludedIds` (P1) đã sửa trên nhánh `security/p0-hardening`; đã kiểm thử: backend 25 test, frontend 29 test, `nginx -t`, chạy thử Nginx cục bộ (header có đủ; 40 lần đăng nhập đồng thời: 21 qua, 19 bị 429; API thường 40/40 qua). Các mục P1/P2 còn lại chưa làm.

| Ưu tiên | Việc | Xử lý cho | Cách làm |
|---------|------|-----------|----------|
| P0 | Giới hạn tần suất ở Nginx (theo IP thật từ Caddy) | S1, S7 | `limit_req`: đăng nhập/đăng ký/quên/đặt lại mật khẩu **10 lần/phút/IP** (burst 5); `/api/game/start` 30 lần/phút; toàn bộ `/api/` 20 req/s (burst 40, đủ cho polling phòng 1 giây/lần); trả 429 |
| P0 | Header bảo mật + ẩn phiên bản Nginx | S2 | HSTS, CSP (`default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none'…`), X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, `server_tokens off` |
| P0 | CORS chỉ cho phép `SITE_URL` + origin của app mobile (`http://localhost`, `https://localhost`, `capacitor://localhost`) | S3 | Đọc `CORS_ALLOWED_ORIGINS` trong `SecurityConfig`, bỏ `@CrossOrigin("*")`, bỏ `allowCredentials` (không dùng cookie) |
| P0 | Lỗi trả về thông điệp chung, ghi log chi tiết ở server | S4 | Handler riêng cho lỗi parse JSON/sai kiểu tham số (400 "Invalid request"), lỗi DB và lỗi không lường trước (500 "Internal error"); chỉ lỗi nghiệp vụ mới trả message |
| P0 | Validation đăng ký ở backend | S5 | Username `^[a-zA-Z0-9_.]{3,30}$`, email đúng định dạng ≤ 254 ký tự, mật khẩu 6-72 ký tự (BCrypt chỉ dùng 72 byte đầu) |
| P0 | Bỏ JWT secret mặc định; backend từ chối khởi động nếu secret < 32 byte ở profile `prod` | S6 | Xóa fallback trong `application-prod.properties`, `docker-compose.yml`; kiểm tra độ dài lúc khởi động |
| P1 | Giới hạn `excludedIds` ≤ 200 phần tử | S7 | Cắt danh sách trong `WordService` |
| P1 | Ghi log đăng nhập thất bại (username, IP — không ghi mật khẩu) và khóa tạm sau N lần sai | S1 | Log mức WARN để fail2ban/giám sát đọc được; khóa 15 phút sau 10 lần sai trong 15 phút theo tài khoản |
| P1 | Nâng Spring Boot lên 3.4.x/3.5.x | S8 | Nhánh riêng, chạy đủ test (đã có test tích hợp PostgreSQL) trước khi deploy |
| P1 | Gỡ hoặc yêu cầu đăng nhập cho `/api/words/random*` | S9 | Frontend không dùng; gỡ hẳn là gọn nhất |
| P2 | Gắn ván khách với khóa bí mật ngẫu nhiên thay vì `gameId` tuần tự | S10 | Lưu token ngẫu nhiên ở localStorage cùng `gameId` |
| P2 | Giới hạn 5 phòng đang mở / người | S12 | Kiểm tra trong `RoomService.create` |
| P2 | Tài khoản DB riêng không phải superuser cho ứng dụng | S13 | Tạo role sở hữu schema `public`, không có `SUPERUSER`/`CREATEROLE` |
| P2 | Build app mobile production dùng `https`, tắt cleartext | S14 | Sửa `capacitor.config.ts` khi build release |

## 6. Việc trên server (chủ VPS thực hiện)

Máy dev không có quyền SSH nên các mục này **chưa được kiểm tra**. Chạy từng lệnh, đối chiếu kết quả mong đợi.

### 6.1 Ngay hôm nay

| Việc | Lệnh kiểm tra / thực hiện | Mong đợi |
|------|---------------------------|----------|
| Đổi mật khẩu Gmail, bật 2FA, tạo App Password mới cho SMTP | myaccount.google.com → Bảo mật | Mật khẩu cũ (đã lộ) vô hiệu |
| SSH chỉ dùng khóa, cấm root đăng nhập bằng mật khẩu | `sudo sshd -T \| grep -E 'passwordauthentication\|permitrootlogin\|pubkeyauthentication'` | `passwordauthentication no`, `permitrootlogin no` (hoặc `prohibit-password`), `pubkeyauthentication yes` |
| Tường lửa chỉ mở SSH, 80, 443 | `sudo ufw status verbose` | `Default: deny (incoming)`; chỉ 22/80/443 ALLOW |
| Không có cổng lạ lắng nghe ra ngoài | `sudo ss -tlnp` | Chỉ sshd và Caddy (80/443) nghe trên `0.0.0.0`/`::`. **Lưu ý:** cổng do Docker mở (`ports:`) bỏ qua ufw — kiểm tra mọi compose của các ứng dụng khác trên VPS |
| Chặn dò mật khẩu SSH | `sudo apt install fail2ban` rồi `sudo systemctl enable --now fail2ban`; `sudo fail2ban-client status sshd` | Jail `sshd` đang chạy |
| Tự cập nhật bản vá bảo mật hệ điều hành | `sudo apt install unattended-upgrades && sudo dpkg-reconfigure -plow unattended-upgrades` | Bật |
| Xác nhận bí mật đủ mạnh | `cd /opt/doanchu && awk -F= '/^(JWT_SECRET\|DB_PASSWORD)=/{print $1, length($2)}' .env.prod && stat -c '%a %U' .env.prod` | Mỗi giá trị ≥ 32 ký tự, quyền `600` |

### 6.2 Trong tuần

| Việc | Cách làm |
|------|----------|
| **Sao lưu tự động** + lưu bản sao **ngoài VPS** | Cron hằng ngày chạy lệnh `pg_dump` trong DOC-004/`vps-deploy.md`, giữ 14 bản, mã hóa (`gpg -c` hoặc `age`) rồi đẩy sang máy khác/dịch vụ lưu trữ; **thử khôi phục** 1 lần/tháng |
| Header ở Caddy (lớp thứ hai) | Trong khối site `doanchu…` của `/opt/edge/Caddyfile`: `header { Strict-Transport-Security "max-age=31536000"; -Server }` |
| Cách ly ứng dụng dùng chung VPS | Không mount `/var/run/docker.sock` vào container nào (trừ khi bắt buộc); mỗi ứng dụng một mạng Docker riêng, chỉ `web` nối vào `edge`; user deploy không có `sudo` không cần thiết. Người nào vào được nhóm `docker` coi như có root |
| Giám sát | Uptime monitor ngoài (UptimeRobot/BetterStack miễn phí) cho trang chủ và `/api/leaderboard`; cảnh báo dung lượng đĩa (`df -h`) |
| Log | Giữ cấu hình xoay log hiện có (10 MB × 3); định kỳ xem `docker compose logs backend \| grep -i -E 'warn\|error'` |

### 6.3 Ứng phó khi nghi bị tấn công

1. Đổi ngay `JWT_SECRET` trong `.env.prod` rồi `up -d backend` → mọi phiên đăng nhập bị vô hiệu.
2. Đổi `DB_PASSWORD` (cả trong PostgreSQL bằng `ALTER USER` và `.env.prod`), App Password Gmail.
3. Lưu log (`docker compose logs > incident-<ngày>.log`) trước khi khởi động lại.
4. Khôi phục DB từ bản sao lưu sạch gần nhất nếu dữ liệu bị sửa.
5. Thông báo người dùng đổi mật khẩu nếu nghi lộ bảng `users`.

## 7. Kiểm thử sau khi sửa

| Kiểm tra | Lệnh | Mong đợi |
|----------|------|----------|
| Header | `curl -sI https://<site>/` | Có HSTS, CSP, X-Frame-Options, nosniff; `Server` không có phiên bản |
| CORS | `curl -si -H 'Origin: https://evil.example' https://<site>/api/leaderboard` | **Không** có `Access-Control-Allow-Origin` |
| Giới hạn đăng nhập | 15 lần `POST /api/auth/login` sai liên tiếp | Từ khoảng lần thứ 11-16 trả **429** |
| Lỗi không lộ nội bộ | `POST /api/auth/login` với body `{bad` | `"Invalid request"`, không có chữ "JSON parse error" |
| Validation đăng ký | Gọi API đăng ký username `a@b` / mật khẩu `1` | 400 với thông báo hợp lệ, không phải 500 |
| Ứng dụng vẫn chạy | Đăng nhập, chơi đơn, tạo phòng, chat, nhắn tin, app mobile gọi API | Hoạt động bình thường |

## 8. Rủi ro còn lại (chấp nhận có điều kiện)

- **JWT lưu trong localStorage:** nếu có XSS thì token bị đánh cắp. Giảm thiểu bằng React escape + CSP chặt (S2). Chuyển sang cookie `HttpOnly` cần thay đổi lớn (CSRF, app mobile) — để sau.
- **Không có CAPTCHA** khi đăng ký: rate limit theo IP giảm phần lớn spam; kẻ tấn công nhiều IP vẫn có thể tạo tài khoản rác.
- **VPS dùng chung:** an toàn của game phụ thuộc vào các ứng dụng khác trên cùng server.
- **Mật khẩu tối thiểu 6 ký tự:** nên tăng lên 8 khi người dùng chấp nhận.

## 9. Lịch sử thay đổi

| Phiên bản | Ngày | Mô tả |
|-----------|------|-------|
| 0.1 | 2026-10-30 | Đánh giá ban đầu sau khi chuyển sang VPS; kiểm tra mã nguồn và site đang chạy từ bên ngoài |
| 0.2 | 2026-10-30 | Triển khai P0: rate limit + header (Nginx), CORS theo `SITE_URL`, ẩn lỗi nội bộ, validation đăng ký, bắt buộc `JWT_SECRET` ≥ 32 byte, giới hạn `excludedIds`; thêm nút hiện/ẩn mật khẩu |
