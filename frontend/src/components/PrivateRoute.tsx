import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Kimlik doğrulama gerektiren sayfalar için özel route
const PrivateRoute: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  // Kullanıcı kontrolü devam ediyorsa hiçbir şey gösterme
  if (loading) {
    return null;
  }

  // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute; 