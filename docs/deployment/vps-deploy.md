# Triển khai trên VPS dùng chung (InterData)

| Thông tin | Giá trị |
|---|---|
| Địa chỉ | <https://doanchu.157-10-52-46.sslip.io> (chưa có tên miền thì dùng sslip.io) |
| Server | Ubuntu 24.04, IP `157.10.52.46`, SSH alias `dongy-vps` (khoá `~/.ssh/dongy_vps`) |
| Thư mục | `/opt/doanchu`. `.env.prod` chứa bí mật sinh ngẫu nhiên trên server, quyền 600, **không commit** |
| Thành phần | `docker-compose.prod.yml`: `db` (Postgres 17), `backend` (Spring Boot, profile `prod`), `web` (Nginx: frontend + proxy `/api`) |

## Cổng vào dùng chung

VPS chạy nhiều ứng dụng. Một Caddy chung ở `/opt/edge` giữ cổng 80/443, tự cấp HTTPS và chuyển tiếp theo tên miền tới từng ứng dụng. Nguồn cấu hình nằm trong repo dong-y, thư mục `deploy/edge`.

Compose của Doan-Chu **không mở cổng nào ra host**, vì cổng Docker mở ra sẽ bỏ qua tường lửa ufw. Container `web` chỉ nối vào mạng Docker `edge` với alias `doanchu-web`.

## Cập nhật phiên bản

Repo private, nên từ máy dev chạy:

```bash
bash deploy/push-to-vps.sh
```

Script chép nhánh `main` lên server rồi build và khởi động lại. DB nằm trong Docker volume nên không bị ảnh hưởng.

## Email quên mật khẩu

Chưa cấu hình. Điền các biến `SPRING_MAIL_*` và `MAIL_FROM` trong `/opt/doanchu/.env.prod` (mẫu: `deploy/.env.prod.example`), rồi chạy:

`docker compose -f docker-compose.prod.yml --env-file .env.prod up -d backend`

## Dữ liệu

Dữ liệu ban đầu được chép từ Supabase (2026-10-29), gồm người dùng, 44.930 từ và lịch sử chơi.
Từ thời điểm này **DB trên VPS là bản chính**. Bản Render/Vercel/Supabase cũ không còn được dùng; job `.github/workflows/keep-alive.yml` chỉ dành cho Render và có thể tắt.

Sao lưu thủ công:

```bash
ssh dongy-vps 'cd /opt/doanchu && docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T db pg_dump -U gameword -d game_word_db -Fc' > doanchu-$(date +%Y%m%d).dump
```

## Đổi sang tên miền thật

1. Trỏ bản ghi A của tên miền về `157.10.52.46`.
2. Trong `/opt/edge/Caddyfile`, đổi tên miền của khối `doanchu...`, rồi chạy `docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile` trong `/opt/edge`.
3. Sửa `SITE_URL` trong `/opt/doanchu/.env.prod` (dùng cho CORS và link trong email), rồi `up -d backend`.
