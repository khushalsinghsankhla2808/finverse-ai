import axiosInstance from '@/lib/axios';

export const authService = {
  async register(data: any) {
    const res = await axiosInstance.post('/auth/register', data);
    return res.data;
  },

  async login(data: any) {
    const res = await axiosInstance.post('/auth/login', data);
    return res.data;
  },

  async me() {
    const res = await axiosInstance.get('/auth/me');
    return res.data;
  },

  async logout() {
    const res = await axiosInstance.post('/auth/logout');
    return res.data;
  },
};

export default authService;
