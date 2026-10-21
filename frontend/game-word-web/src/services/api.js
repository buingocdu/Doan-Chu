import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authRegister = (data) => API.post('/auth/register', data);
export const authLogin = (data) => API.post('/auth/login', data);

export const getRandomWord = (excludedIds) => API.get('/words/random', { params: { excludedIds } });
export const getRandomWordByLevel = (level, excludedIds) => API.get(`/words/random/${level}`, { params: { excludedIds } });

export const startGame = (userId, excludedIds) => API.post('/game/start', null, { params: { userId, excludedIds } });
export const makeGuess = (data) => API.post('/game/guess', data);

export const getHistory = (userId) => API.get(`/history/user/${userId}`);
export const getLeaderboard = () => API.get('/leaderboard');
