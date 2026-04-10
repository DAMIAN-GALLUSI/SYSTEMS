import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TransactionEntry from './pages/TransactionEntry';
import RegisteredDetails from './pages/RegisteredDetails';
import DailyBalancing from './pages/DailyBalancing';
import Reports from './pages/Reports';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (token: string, role: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            isAuthenticated ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />
          } 
        />
        <Route 
          path="/login" 
          element={
            isAuthenticated ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />
          } 
        />
        <Route 
          path="/register" 
          element={
            isAuthenticated ? <Navigate to="/dashboard" /> : <Register onRegister={handleLogin} />
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
      </Routes>
    </Router>
  );
}

export default App;
