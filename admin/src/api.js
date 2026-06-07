import axios from 'axios';

// Saat dev pakai VITE_API_URL (mis. http://localhost:3000); saat build di-serve
// backend → string kosong → '/api' relatif ke origin yang sama.
const BASE = (import.meta.env.VITE_API_URL || '') + '/api';

const api = axios.create({ baseURL: BASE });

// Sisipkan token admin ke setiap request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rivereye_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Token kedaluwarsa → balik ke halaman login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && localStorage.getItem('rivereye_token')) {
      localStorage.removeItem('rivereye_token');
      if (!window.location.hash.includes('/login')) window.location.hash = '#/login';
    }
    return Promise.reject(err);
  },
);

export default api;

// Helper kecil agar pesan error dari server tampil rapi
export const errMsg = (err, fallback = 'Terjadi kesalahan.') =>
  err.response?.data?.message || err.message || fallback;
