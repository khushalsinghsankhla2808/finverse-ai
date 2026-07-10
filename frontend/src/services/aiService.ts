import axiosInstance from '@/lib/axios';

export const aiService = {
  async chat(message: string, sessionId?: string) {
    const res = await axiosInstance.post('/ai/chat', { message, sessionId });
    return res.data;
  },

  async getHistory() {
    const res = await axiosInstance.get('/ai/history');
    return res.data;
  },

  async clearHistory() {
    const res = await axiosInstance.delete('/ai/history');
    return res.data;
  },

  async getInsights() {
    const res = await axiosInstance.get('/ai/insights');
    return res.data;
  },

  async getSuggestions() {
    const res = await axiosInstance.get('/ai/suggestions');
    return res.data;
  },
};

export default aiService;
