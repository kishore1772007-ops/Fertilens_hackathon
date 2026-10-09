import { apiClient } from '../../services/apiClient';

export const authService = {
  async login(email, password) {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  async loginHospital(email, password) {
    const response = await apiClient.post('/auth/hospital/login', { email, password });
    return response.data;
  },

  async loginPatient(email, password) {
    const response = await apiClient.post('/auth/patient/login', { email, password });
    return response.data;
  },

  async getMe() {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  async refreshToken() {
    const response = await apiClient.post('/auth/refresh');
    return response.data;
  },

  async logout() {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },
};
