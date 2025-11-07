/*
  File ini sekarang adalah Portal Steganografi (LSB).
  Tema diubah menjadi BIRU agar konsisten.
*/

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { LSB } from '../utils/crypto'; 

// --- IKON BARU (ShieldCheckIcon) ---
const ShieldCheckIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className="w-8 h-8 text-blue-600 mr-2"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.623 0-1.662-.36-3.26-.998-4.751A11.95 11.95 0 0012 2.764h.001z" />
  </svg>
);
// --- AKHIR IKON ---

// Komponen Navbar (Tema Cerah)
const Navbar = () => {
  const navigate = useNavigate();
  return (
    <nav className="bg-white text-gray-800 p-4 flex justify-between items-center shadow-md font-['Poppins']">
      <div className="flex items-center">
        <ShieldCheckIcon />
        <h1 className="text-xl font-bold">Alat Steganografi (LSB)</h1>
      </div>
      <button
        onClick={() => navigate('/agent')} // Path tetap '/agent'
        className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-medium transition"
      >
        Kembali ke Portal
      </button>
    </nav>
  );
};


export default function Steganography() {
  const [message, setMessage] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [decodedMessage, setDecodedMessage] = useState('');
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  const handleImageChange = (e) => {
    if (e.target.files.length > 0) {
      setImageFile(e.target.files[0]);
    } else {
      setImageFile(null);
    }
    setResultImage(null);
    setDecodedMessage('');
  };

  const handleEncode = () => {
    if (!imageFile || !message) {
      alert('Pilih gambar dan masukkan data rahasia.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        const bits = LSB.messageToBits(message);
        if (bits.length > (pixels.length / 4) * 3) {
          alert('Data terlalu panjang untuk gambar ini!');
          return;
        }
        LSB.hideBitsInPixels(pixels, bits);
        ctx.putImageData(imageData, 0, 0);
        setResultImage(canvas.toDataURL('image/png'));
        alert('Data berhasil disisipkan ke dalam gambar!');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(imageFile);
  };

  const handleDecode = () => {
    if (!imageFile) {
      alert('Pilih gambar yang akan diekstrak datanya.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        const msg = LSB.bitsToMessage(pixels);
        setDecodedMessage(msg || 'Tidak ada data tersembunyi ditemukan.');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(imageFile);
  };

  return (
    <div className="bg-gray-100 text-gray-900 min-h-screen font-['Poppins']">
      <Navbar />

      <div className="container mx-auto p-4 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Sembunyikan Data (Encode)</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Pilih Foto Profil (PNG):</label>
              <input 
                type="file" 
                accept="image/png" 
                onChange={handleImageChange} 
                className="w-full p-2 mt-1 border border-gray-300 rounded bg-white text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition file:cursor-pointer" 
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Data Rahasia (ID Pasien, dll):</label>
              <textarea 
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
                className="w-full p-3 mt-1 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                rows="4"
              ></textarea>
            </div>
            <button 
              onClick={handleEncode} 
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
            >
              Sembunyikan Data
            </button>
            {resultImage && (
              <div className="mt-4 text-center">
                <h3 className="font-semibold text-gray-900">Gambar Hasil:</h3>
                <img src={resultImage} alt="Hasil Enkripsi" className="max-w-full mx-auto border border-gray-200 rounded shadow-sm" />
                <a 
                  href={resultImage} 
                  download="foto_dengan_id.png" 
                  className="inline-block mt-4 px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition"
                >
                  Download Gambar
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Ekstrak Data (Decode)</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Pilih Gambar (PNG):</label>
              <input 
                type="file" 
                accept="image/png" 
                onChange={handleImageChange} 
                className="w-full p-2 mt-1 border border-gray-300 rounded bg-white text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition file:cursor-pointer" 
              />
            </div>
            <button 
              onClick={handleDecode} 
              className="w-full py-3 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-800 transition"
            >
              Ekstrak Data
            </button>
            {decodedMessage && (
              <div className="mt-4">
                <h3 className="font-semibold text-gray-900">Data Tersembunyi:</h3>
                <p className="bg-gray-100 p-4 rounded font-mono text-gray-800 border border-gray-200 break-words">
                  {decodedMessage}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden"></canvas>
    </div>
  );
}