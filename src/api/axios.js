import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

const instance = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  },
  // withCredentials: false // not using cookies; your backend set allowCredentials=false
});

// Attach Authorization header automatically if token present
instance.interceptors.request.use(cfg => {
  const token = localStorage.getItem('cg_token');
  if (token) {
    cfg.headers = cfg.headers || {};
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
}, err => Promise.reject(err));

export default instance;
