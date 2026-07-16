import axiosInstance from '@/lib/axios';

export const authService = {
  async syncUser(token: string) {
    const res = await axiosInstance.post('/auth/sync', {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
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

  async updateProfile(data: { name?: string; currency?: string }) {
    const res = await axiosInstance.put('/auth/profile', data);
    return res.data;
  },

  async deleteAccount() {
    const res = await axiosInstance.delete('/auth/account');
    return res.data;
  },
};

export default authService;
