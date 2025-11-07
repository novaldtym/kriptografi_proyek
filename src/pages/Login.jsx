/*
  File: Login.jsx
  Update: Mengganti ikon SVG dengan logo PNG (logo polos.png).
*/
import logoPolos from '../assets/logo.png'
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

// --- GANTI: IKON BARU (LogoMediSafe) ---
// Perlu diingat: Karena ini adalah file PNG, kita harus menggunakan tag <img>.
// Asumsikan file 'logo polos.png' diletakkan di folder 'public' atau sudah diimport
// (Jika Anda menggunakan bundler seperti Webpack/Vite, Anda perlu melakukan import yang benar).
// Untuk contoh ini, saya asumsikan logo berada di lokasi yang dapat diakses (misalnya, di folder public/assets).
const LogoMediSafe = () => (
<img 
  src="src/assets/logo.png" // GANTI PATH INI DENGAN PATH YANG SESUAI DI PROYEK ANDA
  alt="Logo MediSafe"
  className="w-40 h-40 mx-auto" // Ukuran disesuaikan agar terlihat lebih besar dari ikon sebelumnya
/>
);
// --- AKHIR IKON ---


export default function Login() {
  const [loginMode, setLoginMode] = useState('agent'); // Default ke Pasien
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const { loginAdmin, loginPatient } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loginMode === 'admin') {
      loginAdmin(username, password);
    } else {
      // Login Pasien sekarang menggunakan NAMA (username)
      loginPatient(username, password);
    }
  };

  // Logika warna dinamis
  const activeColorClass =
    loginMode === 'admin'
      ? 'bg-gray-700 text-white shadow-lg'
      : 'bg-blue-600 text-white shadow-lg';
  
  const ringColorClass =
    loginMode === 'admin'
      ? 'focus:ring-gray-500 focus:border-gray-500'
      : 'focus:ring-blue-500 focus:border-blue-500';

  const buttonColorClass =
    loginMode === 'admin'
      ? 'bg-gray-700 hover:bg-gray-800'
      : 'bg-blue-600 hover:bg-blue-700';

  return (
    <div className="flex items-stretch justify-center min-h-screen bg-white font-['Poppins']">
      
      {/* Panel Kiri: Branding (Tema BIRU) */}
      <div className="hidden lg:flex w-full max-w-lg items-center justify-center bg-gradient-to-br from-blue-600 to-blue-700 p-12 text-white">
        <div className="text-center">
          {/* PENGGUNAAN KOMPONEN LOGO BARU */}
          <LogoMediSafe />
          <h1 className="text-4xl font-bold mt-6">Portal Medis Aman</h1>
          <p className="mt-3 text-lg text-blue-100">
            Menjaga kerahasiaan data rekam medis digital Anda.
          </p>
        </div>
      </div>

      {/* Panel Kanan: Form Login */}
      <div className="w-full lg:max-w-xl flex items-center justify-center bg-gray-50 p-8 sm:p-12">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Selamat Datang
          </h1>
          <p className="text-gray-500 mb-6">
            Pilih portal login Anda di bawah ini.
          </p>

          <div className="flex justify-center mb-6 rounded-lg bg-gray-200 p-1">
            <button
              onClick={() => setLoginMode('admin')}
              className={`w-1/2 py-2 rounded-lg font-semibold transition ${
                loginMode === 'admin'
                  ? activeColorClass
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Login Staf Medis
            </button>
            <button
              onClick={() => setLoginMode('agent')}
              className={`w-1/2 py-2 rounded-lg font-semibold transition ${
                loginMode === 'agent'
                  ? activeColorClass
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Login Pasien
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-y-4">
            <h2 className="text-2xl font-semibold text-center text-gray-800">
              {loginMode === 'admin'
                ? 'Login sebagai Staf Medis'
                : 'Login sebagai Pasien'}
            </h2>

            <div>
              <label className="text-sm font-medium text-gray-600">
                {loginMode === 'admin'
                  ? 'Username'
                  : 'Nama Lengkap Pasien'}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={
                  loginMode === 'admin'
                    ? 'Masukkan username'
                    : 'Nama Lengkap (sesuai registrasi)'
                }
                className={`w-full mt-1 p-3 border border-gray-300 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 ${ringColorClass}`}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className={`w-full mt-1 p-3 border border-gray-300 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 ${ringColorClass}`}
              />
            </div>

            <button
              type="submit"
              className={`w-full py-3 mt-4 text-white font-bold rounded-lg transition ${buttonColorClass}`}
            >
              Masuk
            </button>
          </form>
          
          {/* === SHORTCUT REGISTER DITAMBAHKAN DI SINI === */}
          <p className="text-center text-sm text-gray-600 mt-6">
            Belum punya akun pasien?{' '}
            <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-500">
              Daftar di sini
            </Link>
          </p>
          {/* === AKHIR SHORTCUT === */}

        </div>
      </div>
    </div>
  );
}