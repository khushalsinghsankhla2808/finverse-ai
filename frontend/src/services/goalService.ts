import axiosInstance from '@/lib/axios';

export const goalService = {
  async getAll() {
    const res = await axiosInstance.get('/goals');
    return res.data;
  },

  async create(data: any) {
    const res = await axiosInstance.post('/goals', data);
    return res.data;
  },

  async update(id: string, data: any) {
    const res = await axiosInstance.put(`/goals/${id}`, data);
    return res.data;
  },

  async delete(id: string) {
    const res = await axiosInstance.delete(`/goals/${id}`);
    return res.data;
  },

  async addMoney(id: string, amount: number) {
    const res = await axiosInstance.post(`/goals/${id}/add-money`, { amount });
    return res.data;
  },
};

export default goalService;
