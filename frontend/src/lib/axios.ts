import axios from 'axios';
import { auth } from '@/config/firebase';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user && config.headers) {
    try {
      const token = await user.getIdToken();
      if (typeof config.headers.set === 'function') {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        (config.headers as any).Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting Firebase ID token:', error);
    }
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Session expired or unauthorized, redirect to login
    if (error.response?.status === 401) {
      console.error('🔴 401 Unauthorized Intercepted:', {
        url: error.config?.url,
        method: error.config?.method,
        responseData: error.response?.data,
        statusText: error.response?.statusText,
      });
      localStorage.removeItem('finverse_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
