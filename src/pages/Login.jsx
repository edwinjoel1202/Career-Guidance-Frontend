import React, { useState } from 'react';
import { login, saveToken } from '../services/auth';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const data = await login(email, password);
      // server returns { token: "..."} or message string in signup
      const token = data?.token;
      if (!token) throw new Error('Invalid server response');
      saveToken(token);
      navigate('/');
    } catch (e) {
      setErr(e.response?.data?.error || e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <div style={{ maxWidth:480, margin:'24px auto' }}>
        <div className="card">
          <h2>Welcome back</h2>
          <p className="small-muted">Sign in to access your learning paths</p>
          <form onSubmit={handleSubmit} style={{ marginTop:12 }}>
            <div className="form-row">
              <input placeholder="Email" className="input" value={email} onChange={e=>setEmail(e.target.value)} />
            </div>
            <div className="form-row">
              <input placeholder="Password" type="password" className="input" value={password} onChange={e=>setPassword(e.target.value)} />
            </div>

            {err && <div className="alert" style={{ marginBottom:10 }}>{err}</div>}

            <div style={{ display:'flex', gap:8 }}>
              <button className="btn" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
              <Link to="/signup" className="btn ghost">Create account</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
