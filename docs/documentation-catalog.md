---
title: "Danh mục tài liệu dự án"
document_id: "DOC-000"
status: "Draft"
version: "0.1"
owner_role: "Technical Lead"
last_updated: "2026-10-24"
related_documents: []
---

# Danh mục tài liệu dự án — Game Đoán Chữ

## Quy ước

- Mọi tài liệu dùng metadata front-matter theo [templates/document-template.md](templates/document-template.md).
- Trạng thái: `Draft` → `In Review` → `Approved` → `Deprecated`. Chưa tài liệu nào được review/phê duyệt.
- Nguồn sự thật (source of truth): mã nguồn trong `backend/` và `frontend/`, Liquibase changelog, `docker-compose.yml`. Khi tài liệu mâu thuẫn với mã nguồn, mã nguồn đúng và tài liệu phải được cập nhật.
- Nhãn: `Current` (đã xác minh trong code), `Target`/`Proposed` (chưa triển khai), `ASSUMPTION`, `OPEN QUESTION`.
- Không ghi mật khẩu, JWT secret hay dữ liệu người dùng thật vào tài liệu.

## Danh mục

| ID | Tài liệu | Mô tả | Trạng thái | Phiên bản | Cập nhật |
|----|----------|-------|-----------|-----------|----------|
| DOC-000 | [documentation-catalog.md](documentation-catalog.md) | Danh mục và quy ước tài liệu | Draft | 0.1 | 2026-10-24 |
| DOC-001 | [architecture/architecture-overview.md](architecture/architecture-overview.md) | Kiến trúc tổng thể, module, luồng xử lý | Draft | 0.2 | 2026-10-24 |
| DOC-002 | [api/api-reference.md](api/api-reference.md) | Tham chiếu REST API | Draft | 0.2 | 2026-10-24 |
| DOC-003 | [database/database-design.md](database/database-design.md) | Schema, ERD, data dictionary, migration | Draft | 0.3 | 2026-10-24 |
| DOC-004 | [deployment/deployment-runbook.md](deployment/deployment-runbook.md) | Cấu hình môi trường, chạy local, Docker Compose | Draft | 0.1 | 2026-10-24 |
| DOC-006 | [deployment/mobile-build.md](deployment/mobile-build.md) | Build app mobile Android/iOS bằng Capacitor | Draft | 0.1 | 2026-10-24 |
| DOC-005 | [analysis/project-analysis-report.md](analysis/project-analysis-report.md) | Báo cáo phân tích dự án, lỗi và rủi ro đã phát hiện | Draft | 0.2 | 2026-10-24 |
| — | [../README.md](../README.md) | Giới thiệu nhanh và hướng dẫn khởi động | — | — | 2026-10-24 |

## Tài liệu còn thiếu (chưa tạo)

| Tài liệu | Lý do / điều kiện |
|----------|-------------------|
| Yêu cầu nghiệp vụ (SRS) | Chưa có yêu cầu được phê duyệt; luật chơi hiện chỉ suy ra từ code và README cũ |
| Chiến lược kiểm thử | Frontend có 13 test Vitest; backend chưa có test |
| OpenAPI contract | Chưa có file OpenAPI; DOC-002 được viết thủ công từ controller |
