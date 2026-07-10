import axiosInstance from '@/lib/axios';

export const reportService = {
  async generate(data: any) {
    const res = await axiosInstance.post('/reports/generate', data);
    return res.data;
  },
};

export default reportService;
