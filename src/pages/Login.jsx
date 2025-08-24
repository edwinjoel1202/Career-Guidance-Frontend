import React, { useState } from 'react';
import { login, saveToken } from '../services/auth';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Button, Card, Alert, Spinner } from 'react-bootstrap';

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
    <div className="d-flex align-items-center justify-content-center vh-100 bg-dark text-light">
      <Card
        className="shadow-lg p-4"
        style={{ maxWidth: '420px', width: '100%', backgroundColor: '#0b1220' }}
      >
        <Card.Body>
          <div className="text-center mb-4">
            <h2 className="fw-bold text-info">Welcome Back</h2>
            <p className="text-secondary">Sign in to access your learning paths</p>
          </div>

          {err && <Alert variant="danger">{err}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="formEmail" className="mb-3">
              <Form.Label className="text-light">Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="bg-dark text-light border-secondary"
              />
            </Form.Group>

            <Form.Group controlId="formPassword" className="mb-4">
              <Form.Label className="text-light">Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="bg-dark text-light border-secondary"
              />
            </Form.Group>

            <div className="d-grid gap-2">
              <Button variant="info" type="submit" disabled={loading} className="fw-semibold">
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" /> Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>

              <Link to="/signup" className="btn btn-outline-light fw-semibold">
                Create Account
              </Link>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}
