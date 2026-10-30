import axios from 'axios';
import type {
  ApiErrorBody,
  AuthResponse,
  ChangePasswordRequest,
  ChatMessage,
  ForgotPasswordRequest,
  FriendList,
  FriendSummary,
  GameHistory,
  GameType,
  GameStateResponse,
  GuessRequest,
  GuessResponse,
  LeaderboardEntry,
  LoginRequest,
  MessageResponse,
  RegisterRequest,
  ResetPasswordRequest,
  RoomState,
  RoomSummary,
  UserSearchResult,
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

// ===== Phòng chơi (DOC-007) =====

const roomPath = (code: string) => `/rooms/${encodeURIComponent(code)}`;

export const createRoom = (gameType: GameType) =>
  API.post<RoomState>('/rooms', { gameType }).then((r) => r.data);

export const getMyRooms = () => API.get<RoomSummary[]>('/rooms/mine').then((r) => r.data);

export const joinRoom = (code: string) => API.post<RoomState>(`${roomPath(code)}/join`).then((r) => r.data);

export const leaveRoom = (code: string) => API.post<MessageResponse>(`${roomPath(code)}/leave`).then((r) => r.data);

// since: version đã có -> server trả { changed: false } nếu không đổi
export const getRoomState = (code: string, since: number | null, afterMessageId: number | null) =>
  API.get<RoomState>(roomPath(code), {
    params: { ...(since !== null && { since }), ...(afterMessageId !== null && { afterMessageId }) },
  }).then((r) => r.data);

export const startMatch = (code: string, gameType: GameType) =>
  API.post<RoomState>(`${roomPath(code)}/start`, { gameType }).then((r) => r.data);

export const roomGuess = (code: string, guess: string, afterMessageId: number | null) =>
  API.post<RoomState>(`${roomPath(code)}/guess`, { guess }, {
    params: afterMessageId !== null ? { afterMessageId } : {},
  }).then((r) => r.data);

export const roomChain = (code: string, word: string, afterMessageId: number | null) =>
  API.post<RoomState>(`${roomPath(code)}/chain`, { word }, {
    params: afterMessageId !== null ? { afterMessageId } : {},
  }).then((r) => r.data);

export const sendRoomMessage = (code: string, content: string) =>
  API.post<ChatMessage>(`${roomPath(code)}/messages`, { content }).then((r) => r.data);

export const inviteToRoom = (code: string, friendId: number) =>
  API.post<MessageResponse>(`${roomPath(code)}/invite`, { friendId }).then((r) => r.data);

// ===== Bạn bè, tin nhắn riêng =====

export const getFriends = () => API.get<FriendList>('/friends').then((r) => r.data);

export const getFriendSummary = () => API.get<FriendSummary>('/friends/summary').then((r) => r.data);

export const searchUsers = (q: string) =>
  API.get<UserSearchResult[]>('/friends/search', { params: { q } }).then((r) => r.data);

export const sendFriendRequest = (username: string) =>
  API.post<MessageResponse>('/friends/requests', { username }).then((r) => r.data);

export const acceptFriendRequest = (userId: number) =>
  API.post<MessageResponse>(`/friends/requests/${userId}/accept`).then((r) => r.data);

// Từ chối lời mời đến hoặc hủy lời mời đã gửi
export const removeFriendRequest = (userId: number) =>
  API.delete<MessageResponse>(`/friends/requests/${userId}`).then((r) => r.data);

export const unfriend = (userId: number) => API.delete<MessageResponse>(`/friends/${userId}`).then((r) => r.data);

export const getConversation = (friendId: number, afterId: number | null) =>
  API.get<ChatMessage[]>(`/messages/${friendId}`, { params: afterId !== null ? { afterId } : {} }).then((r) => r.data);

export const sendDirectMessage = (friendId: number, content: string) =>
  API.post<ChatMessage>(`/messages/${friendId}`, { content }).then((r) => r.data);

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
  // Phòng chơi
  'Invalid game type': 'Chế độ chơi không hợp lệ.',
  'Room not found': 'Không tìm thấy phòng hoặc phòng đã đóng.',
  'Room is full': 'Phòng đã đủ người.',
  'Not a room member': 'Bạn không ở trong phòng này.',
  'Only the host can start': 'Chỉ chủ phòng mới bắt đầu được ván.',
  'Match already in progress': 'Ván đang diễn ra.',
  'Not enough players': 'Cần ít nhất 2 người để bắt đầu.',
  'No match in progress': 'Ván đã kết thúc.',
  'Wrong game type': 'Ván hiện tại không phải chế độ này.',
  'Not a player in this match': 'Bạn đang xem, sẽ được chơi từ ván sau.',
  'No attempts left': 'Bạn đã hết lượt đoán.',
  'Not your turn': 'Chưa tới lượt của bạn.',
  'Word must have 2 syllables': 'Từ nối phải gồm đúng 2 tiếng.',
  'Could not create room': 'Không tạo được phòng, hãy thử lại.',
  // Chat, bạn bè
  'Message is empty': 'Tin nhắn trống.',
  'Message too long': 'Tin nhắn dài quá 500 ký tự.',
  'Sending too fast': 'Bạn gửi nhanh quá, đợi một chút.',
  'User not found': 'Không tìm thấy người dùng.',
  'Cannot add yourself': 'Không thể kết bạn với chính mình.',
  'Already friends': 'Hai bạn đã là bạn bè.',
  'Request already sent': 'Bạn đã gửi lời mời rồi.',
  'Too many pending requests': 'Bạn có quá nhiều lời mời đang chờ.',
  'Friend request not found': 'Lời mời không còn tồn tại.',
  'Not friends': 'Chỉ nhắn tin / mời được bạn bè.',
  'Invalid username': 'Tên tài khoản dài 3–30 ký tự, chỉ gồm chữ không dấu, số, dấu chấm hoặc gạch dưới.',
  'Invalid email': 'Email không hợp lệ.',
  'Invalid password': 'Mật khẩu cần ít nhất 6 ký tự.',
  'Password too long': 'Mật khẩu quá dài (tối đa 72 ký tự không dấu).',
  'Invalid request': 'Yêu cầu không hợp lệ.',
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
  // Nginx giới hạn tần suất (chống dò mật khẩu / spam); body là HTML nên kiểm tra mã trước
  if (error.response.status === 429) return 'Bạn thao tác quá nhanh. Vui lòng đợi một chút rồi thử lại.';
  const body: unknown = error.response.data;
  if (isApiErrorBody(body)) {
    if (KNOWN_MESSAGES[body.message]) return KNOWN_MESSAGES[body.message];
    const length = /^Tu doan phai co (\d+) ki tu$/.exec(body.message);
    if (length) return `Từ đoán phải có ${length[1]} chữ cái.`;
    const parts = /^Tu doan phai gom (\d+) tieng: ([\d +]+) chu cai$/.exec(body.message);
    if (parts) return `Từ đoán phải gồm ${parts[1]} tiếng: ${parts[2]} chữ cái.`;
    const syllable = /^Word must start with: (.+)$/.exec(body.message);
    if (syllable) return `Từ nối phải bắt đầu bằng "${syllable[1]}".`;
  }
  if (error.response.status >= 500) return 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.';
  return fallback;
}
