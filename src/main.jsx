import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Impor halaman
import Login from './pages/Login';
import Admin from './pages/Admin';
import Agent from './pages/Agent';
import Steganography from './pages/Steganography';
import Register from './pages/Register'; // <-- 1. TAMBAHKAN IMPORT INI

import './index.css'; // Pastikan Tailwind CSS diimpor

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider> {/* Membungkus seluruh aplikasi */}
        <Routes>
          {/* Rute Publik */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} /> {/* <-- 2. TAMBAHKAN RUTE INI */}

          {/* Rute Admin (Dilindungi) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <Admin />
              </ProtectedRoute>
            }
          />

          {/* Rute Agen (Dilindungi) */}
          <Route
            path="/agent"
            element={
              <ProtectedRoute role="agent">
                <Agent />
              </ProtectedRoute>
            }
          />
          
          {/* Rute Steganografi (Dilindungi) - HARUSNYA INI UNTUK 'agent' */}
          <Route
            path="/steganography"
            element={
              <ProtectedRoute role="agent"> 
                <Steganography />
              </ProtectedRoute>
            }
          />
          
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);