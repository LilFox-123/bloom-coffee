import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.message || err.message || 'Đã có lỗi xảy ra, vui lòng thử lại';
    return Promise.reject({ ...err, message, status: err.response?.status });
  }
);

export default api;
