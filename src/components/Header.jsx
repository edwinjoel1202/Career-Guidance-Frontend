// src/components/Header.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clearToken, getToken } from '../services/auth';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { motion } from 'framer-motion';

export default function Header() {
  const navigate = useNavigate();
  const token = getToken();

  function handleLogout() {
    clearToken();
    navigate('/login');
  }

  // small-button style used for left-side action buttons
  const smallBtnProps = {
    variant: 'outline-secondary',
    size: 'sm',
    className: 'fw-semibold py-1 px-2'
  };

  return (
    <Navbar expand="lg" className="shadow-sm bg-white" sticky="top">
      <Container fluid="md" className="px-3">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="d-flex align-items-center"
        >
          <Navbar.Brand as={Link} to="/" className="d-flex align-items-center gap-3 mb-0">
            <div className="logo display-4 fw-bold text-info" style={{ lineHeight: 1 }}>CG</div>
            <div className="d-flex flex-column">
              <div className="app-title h5 fw-bold mb-0">Career Guidance</div>
              <small className="text-muted">AI-driven learning paths & assessments</small>
            </div>
          </Navbar.Brand>
        </motion.div>

        <Navbar.Toggle aria-controls="main-nav" />
        <Navbar.Collapse id="main-nav" className="align-items-center">
          {/* Left navigation shown as compact small buttons */}
          <Nav className="me-auto align-items-center d-flex gap-2">
            <Button as={Link} to="/chat" {...smallBtnProps}>Chat Tutor</Button>
            <Button as={Link} to="/interview" {...smallBtnProps}>Mock Interview</Button>
            <Button as={Link} to="/resume" {...smallBtnProps}>Resume Analyzer</Button>
            <Button as={Link} to="/flashcards" {...smallBtnProps}>Flashcards</Button>
            <Button as={Link} to="/dashboard" className="btn btn-secondary btn-lg fw-semi-bold" style={{ lineHeight: 1.2 }} >Dashboard</Button>
          </Nav>
          
          {/* Right side actions - keep buttons styled exactly like before */}
          <div className="d-flex align-items-center gap-3">
            {token ? (
              <>
                {/* Primary action remains large button */}
                <Link to="/create" className="btn btn-success btn-lg fw-bold" style={{ lineHeight: 1.2 }}>
                  + Create Path
                </Link>
                <Button variant="outline-danger" size="lg" className="fw-bold" onClick={handleLogout} style={{ lineHeight: 1.2 }}>
                  Logout
                </Button>
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
