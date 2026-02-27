import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.1.32:5151';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
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
    let message = 'Something went wrong';
    if (error.code === 'ECONNABORTED') {
      message = 'Request timed out. Please check your connection.';
    } else if (!error.response) {
      message = 'Unable to reach the server. Please check your connection.';
    } else {
      message = error.response.data?.message || message;
    }
    return Promise.reject(new Error(message));
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
};

export const verseAPI = {
  completeOnboarding: (data) => api.post('/verses/onboarding', data),
  getBooks: () => api.get('/verses/books'),
  getBookChapters: (bookId) => api.get(`/verses/book/${bookId}/chapters`),
  setupBook: (bookId, data) => api.post(`/verses/book/${bookId}/setup`, data),
  getSessionVerses: (bookId) => api.get(`/verses/book/${bookId}/session`),
};

export const progressAPI = {
  completeReading: (data) => api.post('/progress/complete-reading', data),
  submitQuiz: (data) => api.post('/progress/quiz', data),
  submitReflection: (data) => api.post('/progress/reflection', data),
  getStatus: () => api.get('/progress/status'),
  getAnalytics: () => api.get('/progress/analytics'),
  resetQuiz: (data) => api.post('/progress/reset-quiz', data),
};

export const leaderboardAPI = {
  getLeaderboard: (type = 'streak') => api.get(`/leaderboard?type=${type}`),
};

export const disciplineAPI = {
  update: (data) => api.post('/discipline/update', data),
  getPrompt: (bookId) => api.get(`/discipline/prompt${bookId ? `?bookId=${bookId}` : ''}`),
};

export default api;
