import axiosInstance from '@/lib/axios';

export const budgetService = {
  async getAll() {
    const res = await axiosInstance.get('/budgets');
    return res.data;
  },

  async create(data: any) {
    const res = await axiosInstance.post('/budgets', data);
    return res.data;
  },

  async update(id: string, data: any) {
    const res = await axiosInstance.put(`/budgets/${id}`, data);
    return res.data;
  },

  async delete(id: string) {
    const res = await axiosInstance.delete(`/budgets/${id}`);
    return res.data;
  },

  async reset(id: string) {
    const res = await axiosInstance.post(`/budgets/${id}/reset`);
    return res.data;
  },
};

export default budgetService;
