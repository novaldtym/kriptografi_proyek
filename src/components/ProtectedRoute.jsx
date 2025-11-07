import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, role }) => {
  const { isAuthenticated, role: userRole } = useAuth();

  if (!isAuthenticated) {
    // Jika belum login, tendang ke halaman login
    return <Navigate to="/" replace />;
  }

  if (role && userRole !== role) {
    // Jika sudah login TAPI role-nya salah
    return <Navigate to="/" replace />;
  }

  // Jika lolos semua, tampilkan halaman
  return children;
};

export default ProtectedRoute;