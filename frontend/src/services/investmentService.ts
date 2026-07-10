import axiosInstance from '@/lib/axios';

export const investmentService = {
  async getAll() {
    const res = await axiosInstance.get('/investments');
    return res.data;
  },

  async create(data: any) {
    const res = await axiosInstance.post('/investments', data);
    return res.data;
  },

  async update(id: string, data: any) {
    const res = await axiosInstance.put(`/investments/${id}`, data);
    return res.data;
  },

  async delete(id: string) {
    const res = await axiosInstance.delete(`/investments/${id}`);
    return res.data;
  },
};

export default investmentService;
