import React, { useState } from 'react';
import { signup } from '../services/auth';
import { useNavigate, Link } from 'react-router-dom';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e){
    e.preventDefault();
    setErr(''); setMsg('');
    setLoading(true);
    try {
      const res = await signup(email, password);
      setMsg(res?.token || 'Registered successfully');
      // after signup, redirect to login
      setTimeout(()=> navigate('/login'), 900);
    } catch (e) {
      setErr(e.response?.data?.error || e.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <div style={{ maxWidth:480, margin:'24px auto' }}>
        <div className="card">
          <h2>Create account</h2>
          <p className="small-muted">Join Career Guidance</p>

          <form onSubmit={handleSubmit} style={{ marginTop:12 }}>
            <div className="form-row">
              <input placeholder="Email" className="input" value={email} onChange={e=>setEmail(e.target.value)} />
            </div>
            <div className="form-row">
              <input placeholder="Password" type="password" className="input" value={password} onChange={e=>setPassword(e.target.value)} />
            </div>

            {msg && <div className="alert">{msg}</div>}
            {err && <div className="alert">{err}</div>}

            <div style={{ display:'flex', gap:8 }}>
              <button className="btn" disabled={loading}>{loading ? 'Creating...' : 'Sign up'}</button>
              <Link to="/login" className="btn ghost">Already have account?</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
