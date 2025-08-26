import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import CreatePath from './pages/CreatePath';
import PathDetails from './pages/PathDetails';
import ProtectedRoute from './components/ProtectedRoute';
import ChatTutor from './pages/ChatTutor';
import InterviewSimulator from './pages/InterviewSimulator';
import ResumeAnalyzer from './pages/ResumeAnalyzer';
import Flashcards from './pages/FlashCards';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route path="/" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />

      <Route path="/create" element={
        <ProtectedRoute>
          <CreatePath />
        </ProtectedRoute>
      } />

      <Route path="/paths/:id" element={
        <ProtectedRoute>
          <PathDetails />
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
      <Route path="/chat" element={<ProtectedRoute><ChatTutor/></ProtectedRoute>} />
      <Route path="/interview" element={<ProtectedRoute><InterviewSimulator/></ProtectedRoute>} />
      <Route path="/resume" element={<ProtectedRoute><ResumeAnalyzer/></ProtectedRoute>} />
      <Route path="/flashcards" element={<ProtectedRoute><Flashcards/></ProtectedRoute>} />


    </Routes>
  );
}
