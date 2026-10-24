import type { CapacitorConfig } from '@capacitor/cli';

// App mobile đóng gói chính bản build web (dist/) bằng Capacitor.
// API URL được nhúng lúc build qua VITE_API_BASE_URL (xem .env.mobile).
const config: CapacitorConfig = {
  appId: 'com.gameword.app',
  appName: 'Game Đoán Chữ',
  webDir: 'dist',
  server: {
    // Backend dev chạy http trong LAN: dùng scheme http để không bị chặn mixed content,
    // cleartext để Android 9+ cho phép gọi http. Production nên dùng https và bỏ 2 dòng này.
    androidScheme: 'http',
    cleartext: true,
  },
};

export default config;
