import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clearToken, getToken } from '../services/auth';

export default function Header() {
  const navigate = useNavigate();
  const token = getToken();

  function handleLogout() {
    clearToken();
    navigate('/login');
  }

  return (
    <div className="header container">
      <div className="brand">
        <div className="logo">CG</div>
        <div>
          <div className="app-title">Career Guidance</div>
          <div className="small-muted">AI-driven learning paths & assessments</div>
        </div>
      </div>

      <div className="actions">
        {token ? (
          <>
            <Link to="/create" className="btn small">+ Create Path</Link>
            <button onClick={handleLogout} className="btn ghost small">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn ghost small">Login</Link>
            <Link to="/signup" className="btn small">Sign up</Link>
          </>
        )}
      </div>
    </div>
  );
}
