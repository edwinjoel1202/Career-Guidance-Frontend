import React, { useState } from 'react';
import { signup } from '../services/auth';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Button, Card, Alert, Spinner } from 'react-bootstrap';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    setMsg('');
    setLoading(true);
    try {
      const res = await signup(email, password);
      setMsg(res?.token || 'Registered successfully');
      // Redirect to login after signup
      setTimeout(() => navigate('/login'), 900);
    } catch (e) {
      setErr(e.response?.data?.error || e.message || 'Signup failed');
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
            <h2 className="fw-bold text-info">Create Account</h2>
            <p className="text-secondary">Join Career Guidance</p>
          </div>

          {msg && <Alert variant="success">{msg}</Alert>}
          {err && <Alert variant="danger">{err}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="formEmail" className="mb-3">
              <Form.Label className="text-light">Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-dark text-light border-secondary"
              />
            </Form.Group>

            <div className="d-grid gap-2">
              <Button variant="info" type="submit" disabled={loading} className="fw-semibold">
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" /> Creating...
                  </>
                ) : (
                  'Sign Up'
                )}
              </Button>

              <Link to="/login" className="btn btn-outline-light fw-semibold">
                Already have an account?
              </Link>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}
