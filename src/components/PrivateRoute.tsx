import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from './Header';

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

  // Kullanıcı giriş yapmışsa header ve child routes'ları göster
  return (
    <>
      <Header />
      <Outlet />
    </>
  );
};

export default PrivateRoute; 