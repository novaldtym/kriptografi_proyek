/*
  File: Register.jsx
  Deskripsi: Halaman registrasi pasien baru (Publik).
  Hanya meminta Nama, NIK, dan Password.
*/

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

// Ikon
const UserPlusIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A1.25 1.25 0 0115.25 21H8.75A1.25 1.25 0 017 19.235z" /></svg> );
const LogoMediSafe = () => (
<img 
  src="src/assets/logo.png" // GANTI PATH INI DENGAN PATH YANG SESUAI DI PROYEK ANDA
  alt="Logo MediSafe"
  className="w-40 h-40 mx-auto" // Ukuran disesuaikan agar terlihat lebih besar dari ikon sebelumnya
/>
);

export default function Register() {
  const { addPatient } = useAuth(); // Hanya perlu addPatient
  const navigate = useNavigate();

  // State untuk form registrasi
  const [regName, setRegName] = useState('');
  const [regNik, setRegNik] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Handler untuk registrasi
  const handleAddPatient = (e) => {
    e.preventDefault();
    if (!regName || !regNik || !regPassword) {
      alert('Semua field registrasi harus diisi!');
      return;
    }
    try {
      // Panggil fungsi baru (hanya 3 parameter)
      addPatient(regName, regNik, regPassword);
      
      alert('Registrasi berhasil! Silakan login dengan Nama dan Password Anda.');
      navigate('/'); // Arahkan kembali ke Login
    } catch (e) {
      alert('Registrasi Gagal: ' + e.message);
    }
  };

  return (
    <div className="flex items-stretch justify-center min-h-screen bg-white font-['Poppins']">
      
      {/* Panel Kiri: Branding (Tema BIRU) */}
      <div className="hidden lg:flex w-full max-w-lg items-center justify-center bg-gradient-to-br from-blue-600 to-blue-700 p-12 text-white">
        <div className="text-center">
          <LogoMediSafe />
          <h1 className="text-4xl font-bold mt-6">Portal Medis Aman</h1>
          <p className="mt-3 text-lg text-blue-100">
            Daftarkan diri Anda untuk mengakses rekam medis digital.
          </p>
        </div>
      </div>

      {/* Panel Kanan: Form Registrasi */}
      <div className="w-full lg:max-w-xl flex items-center justify-center bg-gray-50 p-8 sm:p-12">
        <div className="w-full max-w-md">
          <form onSubmit={handleAddPatient} className="space-y-4">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center flex items-center justify-center">
              <UserPlusIcon /> Registrasi Pasien Baru
            </h2>
            
            <div>
              <label className="text-sm font-medium text-gray-700">Nama Pasien Lengkap:</label>
              <input 
                type="text" 
                value={regName} 
                onChange={(e) => setRegName(e.target.value)} 
                className="w-full mt-1 p-3 border border-gray-300 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder="Digunakan untuk login"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">NIK:</label>
              <input 
                type="text" 
                value={regNik} 
                onChange={(e) => setRegNik(e.target.value)} 
                className="w-full mt-1 p-3 border border-gray-300 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder="Nomor Induk Kependudukan"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Buat Password:</label>
              <input 
                type="password" 
                value={regPassword} 
                onChange={(e) => setRegPassword(e.target.value)} 
                className="w-full mt-1 p-3 border border-gray-300 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder="Password untuk login"
              />
            </div>
            
            <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700 transition">
              Daftar Akun
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Sudah punya akun?{' '}
            <Link to="/" className="font-semibold text-blue-600 hover:text-blue-500">
              Login di sini
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}