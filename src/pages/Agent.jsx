/*
  File: Agent.jsx (Portal Pasien)
  Update: 
  - Desain PDF di 'handleDownloadEncryptedPdf' diubah menjadi 
    format Nota Resep, lengkap dengan logo dan header.
*/

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext'; 
import { useNavigate } from 'react-router-dom'; 
import * as Crypto from '../utils/crypto'; 
import { LSB } from '../utils/crypto';
import jsPDF from 'jspdf'; // <-- Import jsPDF
import CryptoJS from 'crypto-js'; 

// --- PENTING: Import logo untuk PDF ---
// Pastikan path ini benar dan bundler Anda (seperti Vite) 
// dapat memproses impor gambar ini.
import logoForPdf from '../assets/logo2.png'; // Ganti dari 'src/assets/logo2.png'

// --- Ikon ---

const LogoMediSafe = () => (
<img 
  src={logoForPdf} // <-- DIPERBAIKI: Gunakan variabel import
  alt="Logo MediSafe"
  className="w-20 h-20 mx-auto" 
/>
);
// Komponen Navbar
const Navbar = ({ name }) => {
  const { logout } = useAuth();
  return (
    <nav className="bg-white text-gray-800 p-2 flex justify-between items-center shadow-md font-['Poppins']">
      <div className="flex items-center">
        <LogoMediSafe />
        <h1 className="text-xl font-bold">Portal Pasien - Selamat Datang, {name}</h1>
      </div>
      <button
        onClick={logout}
        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition"
      >
        Logout
      </button>
    </nav>
  );
};

// --- Fungsi Helper (Sama seperti di Admin.jsx) ---
function arrayBufferToWordArray(ab) { /* ... (kode sama) ... */ }
function wordArrayToBlob(wordArray, mimeType) { /* ... (kode sama) ... */ }
// (Fungsi helper di-collapse untuk keringkasan)


export default function Agent() {
  const { 
    username, appData, desKey, aesKey, 
    updatePatientDetails, clearPatientRecipe 
  } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef(null); 

  // === STATE GLOBAL PASIEN ===
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [patientData, setPatientData] = useState(null); 
  const [dbData, setDbData] = useState(null); 

  // === STATE TAB DASHBOARD ===
  const [incomingDosisDecrypted, setIncomingDosisDecrypted] = useState('');
  const [pendingRecipeAES, setPendingRecipeAES] = useState(''); // Hex string AES
  const [adminLsbFileUrl, setAdminLsbFileUrl] = useState('');

  // === STATE TAB DATA DIRI ===
  const [formAge, setFormAge] = useState('');
  const [formPosition, setFormPosition] = useState(''); // Gol. Darah
  const [bpjsFile, setBpjsFile] = useState(null);
  const [decodedBpjsId, setDecodedBpjsId] = useState(''); // Hasil dekode LSB

  // Efek untuk memuat data pasien
  useEffect(() => {
    if (username && desKey && appData[username]) {
      const patientDb = appData[username];
      setDbData(patientDb); 
      
      try {
        const name = Crypto.decryptName(desKey, username); 
        const { nik, age, position, bpjs_id } = Crypto.decryptAgentDetails(desKey, patientDb.encrypted_data);
        
        setPatientData({ name, nik, age, position, bpjs_id });
        
        setFormAge(age || '');
        setFormPosition(position || '');
        setDecodedBpjsId(bpjs_id || ''); 

        // --- Muat Resep/Dosis (RC4) ---
        const encryptedDosis = patientDb.super_teks || '';
        if(encryptedDosis) {
          try {
            const decrypted = Crypto.decryptSuperTeks(encryptedDosis);
            setIncomingDosisDecrypted(decrypted);
          } catch (e) {
            setIncomingDosisDecrypted("[Pesan Dosis dari dokter korup]");
          }
        } else {
          setIncomingDosisDecrypted("Tidak ada pesan dosis baru dari dokter.");
        }
        
        // --- Muat Resep File (AES) ---
        setPendingRecipeAES(patientDb.pending_recipe_aes || '');
        
        // --- Muat File LSB Admin ---
        setAdminLsbFileUrl(patientDb.lsb_file_url || '');

      } catch (e) {
        console.error('Gagal dekripsi data diri (3DES):', e);
      }
    }
  }, [username, desKey, appData]);

  // --- HANDLER TAB DASHBOARD ---
  
  // === HANDLER DOWNLOAD YANG DIPERBAIKI (DESAIN NOTA RESEP) ===
  const handleDownloadEncryptedPdf = () => {
    if (!pendingRecipeAES || !patientData) {
      alert('Tidak ada file resep (AES) baru dari dokter.');
      return;
    }
    if (!aesKey) {
      alert('Kunci AES tidak ditemukan. Silakan coba login ulang.');
      return;
    }

    try {
      // 1. Dekripsi teks resep (AES Hex -> Teks Biasa)
      const decryptedText = Crypto.aesDecryptText(aesKey, pendingRecipeAES);

      if (!decryptedText) {
        throw new Error('Hasil dekripsi kosong. Kemungkinan Kunci AES Anda salah.');
      }

      // 2. Buat PDF baru dengan desain "NOTA RESEP"
      const doc = new jsPDF();
      const cleanPatientName = patientData.name.replace(/[^a-z0-9]/gi, '_');
      const tglHariIni = new Date().toLocaleDateString('id-ID', {
        day: '2-digit', month: 'long', year: 'numeric'
      });

      // --- Header Nota (Kop Surat) ---
      
      // Tambahkan Logo
      // Catatan: Ini HANYA akan berfungsi jika 'import logoForPdf' di atas
      // berhasil diproses oleh bundler Anda (Vite/CRA).
      try {
        // Parameter: (data_gambar, format, x, y, width, height)
        doc.addImage(logoForPdf, 'PNG', 15, 10, 30, 30); 
      } catch (imgError) {
        console.error("Gagal memuat logo ke PDF:", imgError);
        // Fallback jika logo gagal dimuat
        doc.setFontSize(10);
        doc.text("[Logo Gagal Dimuat]", 20, 25);
      }

      // Info "Klinik" (Contoh)
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(16);
      doc.text("KLINIK MEDISAFE SEHAT", 105, 15, { align: 'center' });
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.text("Jl. Buntu No. 123, Jomokerto", 105, 22, { align: 'center' });
      doc.text("Telp: (062) 555-1234 | Email: info@medisafe.com", 105, 27, { align: 'center' });
      
      // Garis Pemisah
      doc.setLineWidth(1);
      doc.line(10, 45, 200, 45); // Garis tebal
      doc.setLineWidth(0.2);
      doc.line(10, 46, 200, 46); // Garis tipis

      // --- Detail Pasien ---
      doc.setFontSize(11);
      doc.setFont('Helvetica', 'bold');
      doc.text("Nama Pasien:", 20, 58);
      doc.setFont('Helvetica', 'normal');
      doc.text(patientData.name || 'Tidak diketahui', 60, 58);

      doc.setFont('Helvetica', 'bold');
      doc.text("Umur:", 20, 65);
      doc.setFont('Helvetica', 'normal');
      doc.text(patientData.age ? `${patientData.age} tahun` : '-', 60, 65);

      doc.setFont('Helvetica', 'bold');
      doc.text("Tanggal Resep:", 130, 58);
      doc.setFont('Helvetica', 'normal');
      doc.text(tglHariIni, 165, 58);

      // --- Detail Resep ---
      doc.setFontSize(16);
      doc.setFont('Helvetica', 'bold');
      doc.text("Resep", 20, 85); // Simbol Resep

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(12);
      // (Split text untuk resepnya)
      const textLines = doc.splitTextToSize(decryptedText, 150); // Lebar dikurangi
      doc.text(textLines, 30, 93);

      // --- Tanda Tangan Dokter (Contoh) ---
      doc.setFontSize(11);
      doc.text("Hormat kami,", 140, 150);
      // (Area kosong untuk ttd)
      doc.setFont('Helvetica', 'bold');
      doc.text("Dokter Penanggung Jawab", 140, 175);


      // 3. Simpan PDF yang bisa dibaca
      doc.save(`resep_medis_${cleanPatientName}.pdf`);

      // 4. Bersihkan resep dari database
      clearPatientRecipe(username);
      alert('Resep berhasil didekripsi dan di-download.');

    } catch (e) {
      console.error("Gagal mendekripsi resep:", e);
      alert("Gagal mendekripsi resep. Pastikan kunci Anda benar atau hubungi admin. " + e.message);
    }
  };
  
  // --- HANDLER TAB DATA DIRI ---
  const handleBpjsFileChange = (e) => {
    if (e.target.files.length > 0) {
      setBpjsFile(e.target.files[0]);
    } else {
      setBpjsFile(null);
    }
  };

  const handleDecodeBpjsId = () => {
    if (!bpjsFile) {
      alert('Pilih file PNG BPJS Anda terlebih dahulu.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        const msg = LSB.bitsToMessage(pixels);
        
        if (msg) {
          setDecodedBpjsId(msg);
          alert(`ID BPJS Ditemukan: ${msg}`);
        } else {
          alert('Tidak ada ID BPJS tersembunyi ditemukan di dalam file PNG ini.');
          setDecodedBpjsId('');
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(bpjsFile);
  };

  const handleDataDiriSubmit = (e) => {
    e.preventDefault();
    if (!patientData || !username) {
        alert('Data pasien belum dimuat, silakan tunggu.');
        return;
    }
    updatePatientDetails(
        username, 
        patientData.nik, 
        formAge, 
        formPosition, 
        decodedBpjsId 
    );
  };

  // --- RENDER KONTEN DINAMIS ---
  const renderContent = () => {
    if (currentTab === 'dashboard') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Panel 1: Data Vital */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Data Vital Anda (dari 3DES)</h2>
            {patientData ? (
              <div className="space-y-3">
                <p className="text-lg"><strong>Nama:</strong> {patientData.name}</p>
                <p className="text-lg"><strong>NIK:</strong> {patientData.nik || <span className="text-gray-400 italic">Belum diisi</span>}</p>
                <p className="text-lg"><strong>Umur:</strong> {patientData.age || <span className="text-gray-400 italic">Belum diisi</span>}</p>
                <p className="text-lg"><strong>Gol. Darah:</strong> {patientData.position || <span className="text-gray-400 italic">Belum diisi</span>}</p>
                <p className="text-lg"><strong>ID BPJS:</strong> {patientData.bpjs_id || <span className="text-gray-400 italic">Belum diisi</span>}</p>
              </div>
            ) : <p className="text-gray-500">Memuat data...</p> }
          </div>
          
          {/* Panel 2: Kotak Pesan (DIROMBAK) */}
          <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Kotak Pesan (Caesar + RC4)</h2>
            <div>
                <h3 className="text-lg font-semibold text-gray-800">Pesan Dosis dari Dokter:</h3>
                <textarea 
                  readOnly 
                    value={incomingDosisDecrypted} 
                    className="w-full p-3 mt-1 border border-gray-300 rounded bg-gray-100 text-gray-700" 
                    rows="4"
                    placeholder="Tidak ada pesan dosis baru..."
                ></textarea>
                
                {/* --- TOMBOL DIPERBARUI --- */}
                <button
                    onClick={handleDownloadEncryptedPdf}
                    disabled={!pendingRecipeAES}
                    className="w-full py-2 mt-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                    Download & Dekripsi Resep Lengkap (.pdf)
                </button>
            </div>
          </div>
          
          {/* Panel 3: File BPJS (BARU) */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">File BPJS</h2>
            {adminLsbFileUrl ? (
                <div>
                    <p className="text-gray-600 mb-4">Dokter telah mengirimkan file BPJS terenkripsi LSB.</p>
                    <a 
                        href={adminLsbFileUrl} 
                        download="BPJS_dari_RumahSakit.png"
                        className="w-full block text-center py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
                    >
                        Download File BPJS
                    </a>
                </div>
            ) : (
                <p className="text-gray-500">Belum ada file BPJS yang dikirim oleh staff medis.</p>
            )}
          </div>
        </div>
      );
    } 
    
    if (currentTab === 'datadiri') {
      return (
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-lg">
            <canvas ref={canvasRef} className="hidden"></canvas> {/* Canvas untuk LSB */}
            
            <form onSubmit={handleDataDiriSubmit} className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">Lengkapi Data Diri Anda</h2>
                <p className="text-sm text-gray-600">
                    Lengkapi data umur dan golongan darah. Anda juga bisa mengupload file PNG BPJS untuk mengekstrak ID BPJS Anda secara otomatis.
                </p>

                {/* Bagian Data Diri */}
              <div className="pt-4 border-t">
                    <label className="text-sm font-medium text-gray-700">Nama Lengkap (Terkunci):</label>
                    <input type="text" readOnly value={patientData?.name || '...'} className="w-full mt-1 p-3 border border-gray-300 bg-gray-100 text-gray-500 rounded-lg" />
                </div>
                <div>
                <label className="text-sm font-medium text-gray-700">NIK (Terkunci):</label>
                    <input type="text" readOnly value={patientData?.nik || '...'} className="w-full mt-1 p-3 border border-gray-300 bg-gray-100 text-gray-500 rounded-lg" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                        <label className="text-sm font-medium text-gray-700">Umur:</label>
                        <input type="number" value={formAge} onChange={(e) => setFormAge(e.target.value)} className="w-full mt-1 p-3 border border-gray-300 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                        <label className="text-sm font-medium text-gray-700">Golongan Darah:</label>
                        <input type="text" value={formPosition} onChange={(e) => setFormPosition(e.target.value)} placeholder="Contoh: A+" className="w-full mt-1 p-3 border border-gray-300 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                </div>

                {/* Bagian Upload BPJS (LSB) */}
                <div className="pt-4 border-t">
                    <h3 className="text-lg font-semibold text-gray-800">Upload Kartu BPJS (LSB)</h3>
                    <p className="text-sm text-gray-600 mb-2">Upload file PNG kartu BPJS Anda untuk mengekstrak ID BPJS yang tersembunyi.</p>
                    <div>
                        <label className="text-sm font-medium text-gray-700">Pilih File BPJS (.png):</label>
                        <input type="file" accept="image/png" onChange={handleBpjsFileChange} className="w-full p-2 mt-1 border rounded file:bg-blue-600 file:text-white file:border-0 file:rounded-lg file:px-4 file:py-2 file:font-semibold" />
                    </div>
                    <button 
                        type="button" 
                        onClick={handleDecodeBpjsId} 
                        disabled={!bpjsFile}
                        className="w-full py-2 mt-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
                    >
                        Ekstrak ID BPJS
                    </button>
                    <div>
                        <label className="text-sm font-medium text-gray-700">ID BPJS Terekstrak (akan disimpan):</label>
                        <input type="text" readOnly value={decodedBpjsId} className="w-full mt-1 p-3 border border-gray-300 bg-gray-100 text-gray-500 rounded-lg" placeholder="Hasil ekstraksi LSB akan muncul di sini..." />
                    </div>
                </div>

                <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700 transition">
                    Simpan Perubahan Data Diri
                </button>
            </form>
        </div>
      );
    }
  };


  return (
    <div className="bg-gray-100 text-gray-900 min-h-screen font-['Poppins']">
      <Navbar name={patientData ? patientData.name : '...'} />

      {/* --- Navigasi Tab --- */}
      <div className="container mx-auto p-4 md:px-8 pt-6">
        <div className="flex space-x-1 bg-blue-600 p-1 rounded-lg shadow-md">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`w-1/2 py-3 font-bold rounded-md transition ${
              currentTab === 'dashboard' ? 'bg-white text-blue-700 shadow' : 'bg-blue-600 text-blue-100 hover:bg-blue-500'
            }`}
          >
            Dashboard Utama
          </button>
          <button
            onClick={() => setCurrentTab('datadiri')}
            className={`w-1/2 py-3 font-bold rounded-md transition ${
              currentTab === 'datadiri' ? 'bg-white text-blue-700 shadow' : 'bg-blue-600 text-blue-100 hover:bg-blue-500'
            }`}
          >
            Lengkapi Data Diri
          </button>
        </div>
      </div>

      {/* --- Konten Dinamis --- */}
      <div className="container mx-auto p-4 md:p-8">
        {renderContent()}
      </div>
    </div>
  );
}