import api from '../api/axios';

export async function signup(email, password) {
  const resp = await api.post('/api/auth/signup', { email, password });
  return resp.data;
}

export async function login(email, password) {
  const resp = await api.post('/api/auth/login', { email, password });
  return resp.data;
}

export function saveToken(token) {
  localStorage.setItem('cg_token', token);
}

export function clearToken() {
  localStorage.removeItem('cg_token');
}

export function getToken() {
  return localStorage.getItem('cg_token');
}
