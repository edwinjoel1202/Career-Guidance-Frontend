import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clearToken, getToken } from '../services/auth';
import { Navbar, Container, Button } from 'react-bootstrap';
import { motion } from 'framer-motion';

export default function Header() {
  const navigate = useNavigate();
  const token = getToken();

  function handleLogout() {
    clearToken();
    navigate('/login');
  }

  return (
    <Navbar expand="lg" className="shadow-lg bg-white" sticky="top">
      <Container fluid="md">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Navbar.Brand as={Link} to="/" className="d-flex align-items-center gap-3">
            <div className="logo display-4 fw-bold text-info">CG</div>
            <div>
              <div className="app-title h3 fw-bold mb-0">Career Guidance</div>
              <small className="text-muted">AI-driven learning paths & assessments</small>
            </div>
          </Navbar.Brand>
        </motion.div>
        <Navbar.Collapse className="justify-content-end">
          <div className="d-flex align-items-center gap-3">
            {token ? (
              <>
                <Link to="/create" className="btn btn-info btn-lg fw-bold">+ Create Path</Link>
                <Button variant="outline-secondary" size="lg" className="fw-bold" onClick={handleLogout}>Logout</Button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline-secondary btn-lg fw-bold">Login</Link>
                <Link to="/signup" className="btn btn-info btn-lg fw-bold">Sign up</Link>
              </>
            )}
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}