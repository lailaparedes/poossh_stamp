import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LandingPage from './components/LandingPage';
import Pricing from './components/Pricing';
import Login from './components/Login';
import Signup from './components/Signup';
import PlanSelection from './components/PlanSelection';
import SubscriptionSuccess from './components/SubscriptionSuccess';
import Setup from './components/Setup';
import Dashboard from './components/Dashboard';
import MyCards from './components/MyCards';
import Customers from './components/Customers';
import Profile from './components/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route 
              path="/select-plan" 
              element={
                <ProtectedRoute>
                  <PlanSelection />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/subscription-success" 
              element={
                <ProtectedRoute>
                  <SubscriptionSuccess />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/setup" 
              element={
                <ProtectedRoute>
                  <Setup />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/my-cards" 
              element={
                <ProtectedRoute>
                  <MyCards />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/customers" 
              element={
                <ProtectedRoute>
                  <Customers />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
