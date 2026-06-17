import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TransactionEntry from './pages/TransactionEntry';
import RegisteredDetails from './pages/RegisteredDetails';
import DailyBalancing from './pages/DailyBalancing';
import Reports from './pages/Reports';
import Services from './pages/Services';
import Benefits from './pages/Benefits';
import Landing from './pages/Landing';
import Preferences from './pages/Preferences';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { clearAuthSession, getStoredAuthToken, storeAuthSession } from './utils/authStorage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = getStoredAuthToken();
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (token: string, role: string, rememberMe = true) => {
    storeAuthSession(token, role, rememberMe);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    clearAuthSession();
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            isAuthenticated ? <Navigate to="/daily-balancing" /> : <Landing />
          } 
        />
        <Route 
          path="/login" 
          element={
            isAuthenticated ? <Navigate to="/daily-balancing" /> : <Login onLogin={handleLogin} />
          } 
        />
        <Route
          path="/forgot-password"
          element={isAuthenticated ? <Navigate to="/daily-balancing" /> : <ForgotPassword />}
        />
        <Route
          path="/reset-password"
          element={isAuthenticated ? <Navigate to="/daily-balancing" /> : <ResetPassword />}
        />
        <Route 
          path="/register" 
          element={
            isAuthenticated ? <Navigate to="/daily-balancing" /> : <Register onRegister={handleLogin} />
          } 
        />
        <Route 
          path="/services" 
          element={
            isAuthenticated ? <Navigate to="/daily-balancing" /> : <Services />
          } 
        />
        <Route 
          path="/benefits" 
          element={
            isAuthenticated ? <Navigate to="/daily-balancing" /> : <Benefits />
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            isAuthenticated ? <Dashboard onLogout={handleLogout} /> : <Navigate to="/login" />
          } 
        />
        <Route 
          path="/transactions" 
          element={
            isAuthenticated ? <TransactionEntry onLogout={handleLogout} /> : <Navigate to="/login" />
          } 
        />
        <Route 
          path="/registered-details" 
          element={
            isAuthenticated ? <RegisteredDetails onLogout={handleLogout} /> : <Navigate to="/login" />
          } 
        />
        <Route
          path="/daily-balancing"
          element={
            isAuthenticated ? <DailyBalancing onLogout={handleLogout} /> : <Navigate to="/login" />
          }
        />
        <Route 
          path="/reports" 
          element={
            isAuthenticated ? <Reports onLogout={handleLogout} /> : <Navigate to="/login" />
          } 
        />
        <Route
          path="/preferences"
          element={
            isAuthenticated ? <Preferences onLogout={handleLogout} /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/profile"
          element={
            isAuthenticated ? <Profile onLogout={handleLogout} /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/settings"
          element={
            isAuthenticated ? <Navigate to="/preferences" replace /> : <Navigate to="/login" />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
