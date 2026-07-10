import axiosInstance from '@/lib/axios';

export const analyticsService = {
  async getDashboardMetrics() {
    const res = await axiosInstance.get('/analytics/dashboard');
    return res.data;
  },

  async getSpendingBreakdown(period?: string) {
    const res = await axiosInstance.get('/analytics/spending', { params: { period } });
    return res.data;
  },

  async getTrends(period?: string) {
    const res = await axiosInstance.get('/analytics/trends', { params: { period } });
    return res.data;
  },

  async getMonthlyComparison() {
    const res = await axiosInstance.get('/analytics/monthly');
    return res.data;
  },

  async getCashFlow() {
    const res = await axiosInstance.get('/analytics/cashflow');
    return res.data;
  },
};

export default analyticsService;
