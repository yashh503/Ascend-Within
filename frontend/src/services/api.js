import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://localhost:5151';

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
  completeOnboarding: (data) => api.post('/verses/onboarding', data),
};

export const progressAPI = {
  submitQuiz: (data) => api.post('/progress/quiz', data),
  submitReflection: (data) => api.post('/progress/reflection', data),
  getStatus: () => api.get('/progress/status'),
  recordBlocked: () => api.post('/progress/blocked'),
  getAnalytics: () => api.get('/progress/analytics'),
};

export const disciplineAPI = {
  update: (data) => api.post('/discipline/update', data),
  getPrompt: () => api.get('/discipline/prompt'),
};

export default api;
