import axiosInstance from '@/lib/axios';

export const transactionService = {
  async getAll(params: any = {}) {
    const res = await axiosInstance.get('/transactions', { params });
    return res.data;
  },

  async getById(id: string) {
    const res = await axiosInstance.get(`/transactions/${id}`);
    return res.data;
  },

  async create(data: any) {
    const res = await axiosInstance.post('/transactions', data);
    return res.data;
  },

  async update(id: string, data: any) {
    const res = await axiosInstance.put(`/transactions/${id}`, data);
    return res.data;
  },

  async delete(id: string) {
    const res = await axiosInstance.delete(`/transactions/${id}`);
    return res.data;
  },

  async deleteBulk(ids: string[]) {
    const res = await axiosInstance.delete('/transactions/bulk', { data: { ids } });
    return res.data;
  },

  async getMonthSummary() {
    const res = await axiosInstance.get('/transactions/summary/month');
    return res.data;
  },
};

export default transactionService;
