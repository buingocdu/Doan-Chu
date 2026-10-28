import axios from 'axios';
import type {
  ApiErrorBody,
  AuthResponse,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  GameHistory,
  GameStateResponse,
  GuessRequest,
  GuessResponse,
  LeaderboardEntry,
  LoginRequest,
  MessageResponse,
  RegisterRequest,
  ResetPasswordRequest,
} from '../types/api';

export const TOKEN_KEY = 'token';

const API = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api' });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Phát khi server từ chối token (vd đã đổi mật khẩu ở thiết bị khác); AuthProvider nghe để đăng xuất
export const SESSION_REJECTED_EVENT = 'auth:session-rejected';

API.interceptors.response.use(undefined, (error: unknown) => {
  const status = getHttpStatus(error);
  if (axios.isAxiosError(error) && error.config?.headers?.Authorization && (status === 401 || status === 403)) {
    window.dispatchEvent(new Event(SESSION_REJECTED_EVENT));
  }
  return Promise.reject(error);
});

export const authLogin = (data: LoginRequest) =>
  API.post<AuthResponse>('/auth/login', data).then((r) => r.data);

export const authRegister = (data: RegisterRequest) =>
  API.post<AuthResponse>('/auth/register', data).then((r) => r.data);

export const authForgotPassword = (data: ForgotPasswordRequest) =>
  API.post<MessageResponse>('/auth/forgot-password', data).then((r) => r.data);

export const authResetPassword = (data: ResetPasswordRequest) =>
  API.post<MessageResponse>('/auth/reset-password', data).then((r) => r.data);

// Trả token mới: các token cũ bị vô hiệu hóa sau khi đổi mật khẩu
export const authChangePassword = (data: ChangePasswordRequest) =>
  API.post<AuthResponse>('/auth/change-password', data).then((r) => r.data);

export const startGame = (excludedIds: number[]) =>
  API.post<GuessResponse>('/game/start', null, {
    params: { excludedIds },
    paramsSerializer: { indexes: null },
  }).then((r) => r.data);

// null khi không có ván dở (204). Khách gửi gameId đã lưu; người đăng nhập được server tự tìm ván gần nhất.
export const getCurrentGame = (gameId: number | null) =>
  API.get<GameStateResponse | ''>('/game/current', { params: gameId === null ? {} : { gameId } }).then((r) =>
    r.status === 204 || !r.data ? null : r.data,
  );

export const makeGuess = (data: GuessRequest) =>
  API.post<GuessResponse>('/game/guess', data).then((r) => r.data);

export const getHistory = (userId: number) =>
  API.get<GameHistory[]>(`/history/user/${userId}`).then((r) => r.data);

export const getLeaderboard = () =>
  API.get<LeaderboardEntry[]>('/leaderboard').then((r) => r.data);

// Thông báo lỗi backend (tiếng Anh/không dấu) -> tiếng Việt cho người dùng
const KNOWN_MESSAGES: Record<string, string> = {
  'Invalid credentials': 'Sai tên tài khoản/email hoặc mật khẩu.',
  'Current password is incorrect': 'Mật khẩu hiện tại không đúng.',
  'New password too short': 'Mật khẩu mới cần ít nhất 6 ký tự.',
  'Email is required': 'Vui lòng nhập email.',
  'Email service not configured': 'Máy chủ chưa cấu hình gửi email. Vui lòng liên hệ quản trị viên.',
  'Email sending failed': 'Không gửi được email. Vui lòng thử lại sau.',
  'Invalid or expired reset token': 'Link đặt lại mật khẩu không hợp lệ, đã hết hạn hoặc đã được dùng. Hãy yêu cầu link mới.',
  'Username already exists': 'Tên tài khoản đã được sử dụng.',
  'Email already exists': 'Email đã được sử dụng.',
  'Game not found': 'Ván chơi không còn hợp lệ. Hãy bắt đầu ván mới.',
  'No words available': 'Kho từ đang trống.',
};

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return typeof value === 'object' && value !== null && typeof (value as ApiErrorBody).message === 'string';
}

export function getHttpStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}

export function getErrorMessage(error: unknown, fallback = 'Đã có lỗi xảy ra. Vui lòng thử lại.'): string {
  if (!axios.isAxiosError(error)) return fallback;
  if (!error.response) return 'Không kết nối được máy chủ. Kiểm tra mạng và thử lại.';
  const body: unknown = error.response.data;
  if (isApiErrorBody(body)) {
    if (KNOWN_MESSAGES[body.message]) return KNOWN_MESSAGES[body.message];
    const length = /^Tu doan phai co (\d+) ki tu$/.exec(body.message);
    if (length) return `Từ đoán phải có ${length[1]} chữ cái.`;
    const parts = /^Tu doan phai gom (\d+) tieng: ([\d +]+) chu cai$/.exec(body.message);
    if (parts) return `Từ đoán phải gồm ${parts[1]} tiếng: ${parts[2]} chữ cái.`;
  }
  if (error.response.status >= 500) return 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.';
  return fallback;
}
