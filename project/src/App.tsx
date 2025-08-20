import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './Contexts/AuthContext';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import FacebookContent from './components/FacebookContent';
import FacebookAdGenerator from './components/FacebookAdGenerator';
import CredentialVault from './components/CredentialVault';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/facebook-content" 
            element={
              <PrivateRoute>
                <FacebookContent platform="facebook" />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/facebook-ads" 
            element={
              <PrivateRoute>
                <FacebookAdGenerator />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/instagram-content" 
            element={
              <PrivateRoute>
                <FacebookContent platform="instagram" />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/linkedin-content" 
            element={
              <PrivateRoute>
                <FacebookContent platform="linkedin" />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/credential-vault" 
            element={
              <PrivateRoute>
                <CredentialVault />
              </PrivateRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;