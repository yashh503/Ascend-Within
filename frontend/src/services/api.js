import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.1.32:5151';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
};

export const verseAPI = {
  getDailyVerses: () => api.get('/verses/daily'),
  getBonusVerses: () => api.get('/verses/bonus'),
  completeOnboarding: (data) => api.post('/verses/onboarding', data),
};

export const progressAPI = {
  completeReading: () => api.post('/progress/complete-reading'),
  submitQuiz: (data) => api.post('/progress/quiz', data),
  submitReflection: (data) => api.post('/progress/reflection', data),
  getStatus: () => api.get('/progress/status'),
  getAnalytics: () => api.get('/progress/analytics'),
  resetQuiz: () => api.post('/progress/reset-quiz'),
};

export const leaderboardAPI = {
  getLeaderboard: (type = 'streak') => api.get(`/leaderboard?type=${type}`),
};

export const disciplineAPI = {
  update: (data) => api.post('/discipline/update', data),
  getPrompt: () => api.get('/discipline/prompt'),
};

export default api;
