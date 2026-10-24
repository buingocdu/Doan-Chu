---
title: "Build app mobile (Android, iOS)"
document_id: "DOC-006"
status: "Draft"
version: "0.1"
owner_role: "Frontend Lead"
last_updated: "2026-10-24"
related_documents: ["DOC-001", "DOC-004"]
---

# Build app mobile (Android, iOS)

## 1. Mục đích và phạm vi

- **Mục đích:** Hướng dẫn build app Game Đoán Chữ cho Android và iOS.
- **Đối tượng đọc:** Lập trình viên frontend/mobile.
- **Cách tiếp cận (Current):** [Capacitor 6](https://capacitorjs.com/) đóng gói bản build web React (`frontend/game-word-web/dist`) thành app native. Giao diện và logic dùng chung 100% với bản web; app gọi cùng REST API.
- **Ngoài phạm vi:** phát hành lên Google Play / App Store (ký release, icon, splash chưa làm).

## 2. Cấu trúc

| Đường dẫn (trong `frontend/game-word-web/`) | Vai trò |
|------|---------|
| `capacitor.config.ts` | `appId` `com.gameword.app`, tên app, `webDir: dist`, cho phép http (dev) |
| `.env.mobile.example` → `.env.mobile` | `VITE_API_BASE_URL` nhúng vào app lúc build (không commit `.env.mobile`) |
| `android/` | Project Android Studio (Gradle 8.2.1, AGP 8.2.1, compileSdk/targetSdk 34, minSdk 22) |
| `ios/` | Project Xcode (CocoaPods). `Info.plist` có `NSAppTransportSecurity` cho phép http trong LAN (chỉ dùng dev) |

Mã nguồn web dùng chung; `android/app/src/main/assets/public` và `ios/App/App/public` do `cap sync` sinh ra, không sửa tay.

## 3. Yêu cầu môi trường

| Thành phần | Android | iOS |
|-----------|---------|-----|
| Hệ điều hành | Windows / macOS / Linux | **Chỉ macOS** |
| Node.js | 18+ | 18+ |
| JDK | 17–20 (Gradle 8.2.1 chưa hỗ trợ JDK 21+ để chạy) — máy dev dùng JDK 19 | — |
| SDK | Android SDK: `platform-tools`, `platforms;android-34`, `build-tools;34.0.0` | Xcode 15+, CocoaPods |

Máy dev Windows hiện tại: SDK cài ở `D:\Android\Sdk` (command-line tools, không có Android Studio), Gradle cache ở `D:\.gradle`. `android/local.properties` (đã gitignore) trỏ `sdk.dir` tới SDK.

## 4. API URL cho app

Trên điện thoại, `localhost` là chính điện thoại, nên app phải gọi backend qua IP LAN hoặc domain:

```bash
cp .env.mobile.example .env.mobile
# sửa VITE_API_BASE_URL, ví dụ:
#   máy thật cùng Wi-Fi : http://192.168.1.45:8080/api
#   Android emulator    : http://10.0.2.2:8080/api
#   production          : https://<domain>/api
```

Mỗi lần đổi URL phải build lại app.

Backend phải nhận kết nối từ mạng LAN:
- Spring Boot mặc định lắng nghe mọi interface (cổng 8080).
- Windows Firewall cần cho phép inbound TCP 8080 (chạy PowerShell **Administrator**):
  ```powershell
  New-NetFirewallRule -DisplayName "Game Doan Chu API 8080" -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow -Profile Private,Public
  ```
  Nếu máy đang ở profile mạng `Public`, nên chuyển mạng Wi-Fi/Ethernet nhà sang `Private` và chỉ mở cho `Private`. Gỡ rule: `Remove-NetFirewallRule -DisplayName "Game Doan Chu API 8080"`.
- CORS: `SecurityConfig` đang cho phép mọi origin nên WebView (`http://localhost`, `capacitor://localhost`) gọi được. Production cần giới hạn lại (R-08 trong [DOC-005](../analysis/project-analysis-report.md)).

## 5. Build Android

```bash
cd frontend/game-word-web
npm install
npm run build:mobile                     # tsc + vite build --mode mobile + cap sync
cd android
# Windows (Git Bash), dùng JDK 17–20:
JAVA_HOME="/c/Program Files/Java/jdk-19" ANDROID_HOME='D:\Android\Sdk' GRADLE_USER_HOME='D:\.gradle' ./gradlew.bat assembleDebug
```

Kết quả: `android/app/build/outputs/apk/debug/app-debug.apk`.

Cài lên điện thoại:
- **USB:** bật *Developer options → USB debugging*, rồi `D:\Android\Sdk\platform-tools\adb install -r app-debug.apk`.
- **Thủ công:** chép file APK sang điện thoại và mở, cho phép "cài từ nguồn không xác định".

Hoặc mở bằng Android Studio: `npm run cap:open:android`.

## 6. Build iOS (trên macOS)

```bash
cd frontend/game-word-web
npm install
npm run build:mobile
cd ios/App && pod install && cd ../..
npm run cap:open:ios                     # mở Xcode
```

Trong Xcode: chọn *Team* (Apple ID) ở *Signing & Capabilities*, chọn thiết bị/simulator, bấm Run. Muốn cài lên iPhone thật cần Apple ID; muốn phát hành cần Apple Developer Program.

Project iOS được tạo trên Windows nên bước `pod install` chưa chạy và chưa được build thử (`OPEN QUESTION`: cần một máy Mac để kiểm chứng).

## 7. Quy trình khi sửa giao diện

1. Sửa code trong `src/` như web, kiểm tra bằng `npm run dev`, `npm test`.
2. `npm run build:mobile` để copy bản build mới vào `android/` và `ios/`.
3. Build lại APK / chạy lại trong Xcode.

## 8. Việc còn lại trước khi phát hành

| Việc | Ghi chú |
|------|--------|
| HTTPS cho backend | Bỏ `cleartext`, `androidScheme: 'http'` và khối `NSAppTransportSecurity` |
| Icon, splash screen | Hiện dùng icon mặc định Capacitor (có thể dùng `@capacitor/assets`) |
| Ký release | Android: keystore + `assembleRelease`/`bundleRelease`; iOS: Archive trong Xcode |
| Lưu token | Đang dùng `localStorage` của WebView như bản web |

## 9. Lịch sử thay đổi

| Phiên bản | Ngày | Mô tả |
|-----------|------|-------|
| 0.1 | 2026-10-24 | Khởi tạo: Capacitor 6, build APK debug trên Windows, tạo project iOS |
