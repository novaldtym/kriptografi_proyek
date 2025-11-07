/*
  File: Admin.jsx
  Deskripsi: Portal Staf Medis (Dokter)
  Update: 
  - Fungsi handleFileDecrypt diubah untuk generate "Nota Resep" (seperti Agent.jsx)
  - PDF Nota Resep sekarang mengambil 'umur' pasien dari state.
*/

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; 
import * as Crypto from '../utils/crypto'; 
import { LSB } from '../utils/crypto';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import CryptoJS from 'crypto-js';

// --- PENTING: Import logo untuk PDF ---
// Pastikan path ini benar dan bundler Anda (seperti Vite) 
// dapat memproses impor gambar ini.
import logoForPdf from '../assets/logo2.png'; // Ganti dari 'src/assets/logo2.png'


// --- Ikon (Sama seperti sebelumnya) ---
const ShieldCheckIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-blue-600 mr-2" ><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.623 0-1.662-.36-3.26-.998-4.751A11.95 11.95 0 0012 2.764h.001z" /></svg> );
const PencilIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg> );
const ArchiveBoxIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg> );
const QrCodeIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5A.75.75 0 014.5 3.75h4.5a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-4.5zM3.75 15a.75.75 0 01.75-.75h4.5a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-4.5zM15 3.75a.75.75 0 01.75-.75h4.5a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-4.5zM16.5 15a.75.75 0 01.75-.75h1.5a.75.75 0 01.75.75v1.5a.75.75 0 01-.75.75h-1.5a.75.75 0 01-.75-.75v-1.5zM15 18a.75.75 0 01.75-.75h4.5a.75.75 0 01.75.75v1.5a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-1.5zM18 15a.75.75 0 01.75-.75h1.5a.75.75 0 01.75.75v1.5a.75.75 0 01-.75.75h-1.5a.75.75 0 01-.75-.75v-1.5z" /></svg> );
const KeyIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg> );
const EyeIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> );
const LockClosedIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 00-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg> );
const TrashIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.226 2.077H8.064a2.25 2.25 0 01-2.226-2.077L3.102 5.79A2.25 2.25 0 015.328 3H18.672a2.25 2.25 0 012.228 2.79zM11.5 5.79V5.25a2.25 2.25 0 00-2.25-2.25h-1.5a2.25 2.25 0 00-2.25 2.25v.54" /></svg> );

const LogoMediSafe = () => (
<img 
  src={logoForPdf} // <-- DIPERBAIKI: Menggunakan var import
  alt="Logo MediSafe"
  className="w-20 h-20 mx-auto" 
/>
);
// --- Navbar ---
const Navbar = () => {
  const { logout } = useAuth();
  return (
    <nav className="bg-white text-gray-800 p-4 flex justify-between items-center shadow-md font-['Poppins']">
      <div className="flex items-center">
        <LogoMediSafe />
        <h1 className="text-xl font-bold">Portal Staf Medis - MediSafe</h1>
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

// --- FUNGSI HELPER (Dipinjam dari Agent.jsx) ---
function arrayBufferToWordArray(ab) {
  const u8a = new Uint8Array(ab);
  return CryptoJS.lib.WordArray.create(u8a);
}
function wordArrayToBlob(wordArray, mimeType) { 
  const base64String = CryptoJS.enc.Base64.stringify(wordArray);
  try {
    const byteCharacters = atob(base64String);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType || 'application/octet-stream' });
  } catch (e) {
    console.error("Gagal konversi Base64 ke Blob", e);
    return null;
  }
}
// --- AKHIR HELPER ---


export default function Admin() {
  // === STATE GLOBAL ADMIN ===
  const [currentTab, setCurrentTab] = useState('resep');
  const { 
    aesKey, desKey, appData, 
    prescriptionVault, savePrescription, deletePrescription,
    sendRecipeToPatient, 
    saveLsbFileToPatient, 
    deletePatient,
    resetAplikasi, 
  } = useAuth();
  const canvasRef = useRef(null);

  // === STATE TAB 1: RESEP ===
  const [patientList, setPatientList] = useState([]);
  const [selectedPatientKey, setSelectedPatientKey] = useState('');
  const [recipeDosis, setRecipeDosis] = useState(''); 
  const [recipeDetails, setRecipeDetails] = useState(''); 
  const [encryptedRecipeRC4, setEncryptedRecipeRC4] = useState(''); // Dosis
  const [encryptedRecipeAES, setEncryptedRecipeAES] = useState(''); // Detail Resep
  const [qrData, setQrData] = useState('');
  
  // === STATE PANEL 3 (LSB) ===
  const [lsbFile, setLsbFile] = useState(null);
  const [lsbMessage, setLsbMessage] = useState('');
  const [lsbResultImg, setLsbResultImg] = useState(null);
  const [lsbDecodedMsg, setLsbDecodedMsg] = useState('');
  const [lsbStatus, setLsbStatus] = useState('');
  const [lsbSelectedPatientKey, setLsbSelectedPatientKey] = useState(''); 

  // === STATE TAB 3: ALAT DEKRIPSI (AES) ===
  const [selectedFile, setSelectedFile] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [downloadFilename, setDownloadFilename] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);


  // Efek untuk memuat daftar pasien
  useEffect(() => {
    if (appData && desKey) {
      try {
        const decryptedList = Crypto.decryptAllData(appData, desKey);
        setPatientList(decryptedList);
      } catch (e) {
        console.error("Gagal dekripsi daftar pasien:", e);
      }
    }
  }, [appData, desKey]);

  // Efek untuk QR code (Tab Resep)
  useEffect(() => {
    setQrData(encryptedRecipeRC4); // QR Code akan berisi Dosis (RC4)
  }, [encryptedRecipeRC4]);


  // --- HANDLER TAB 1: RESEP ---
  const handleEncryptPreview = () => { 
    if (!recipeDetails || !recipeDosis) { 
        alert('Isi Dosis dan Detail Resep.'); 
        return; 
    }
    const encryptedRC4 = Crypto.encryptSuperTeks(recipeDosis);
    setEncryptedRecipeRC4(encryptedRC4);
    
    const encryptedAES = Crypto.aesEncryptText(aesKey, recipeDetails);
    setEncryptedRecipeAES(encryptedAES);
  };
  
  const handleSaveRecipe = () => { 
    const selectedPatient = patientList.find(p => p.key === selectedPatientKey);
    if (!selectedPatient) { alert('Pilih pasien.'); return; }
    if (!encryptedRecipeAES) { alert('Enkripsi resep dulu (klik preview).'); return; }
    
    savePrescription(selectedPatient.name, encryptedRecipeAES);
  };
  
  const handleSendToPatient = () => {
    if (!selectedPatientKey) { alert('Pilih pasien.'); return; }
    if (!encryptedRecipeRC4 || !encryptedRecipeAES) {
      alert('Enkripsi resep dulu (klik preview).');
      return;
    }
    
    sendRecipeToPatient(selectedPatientKey, encryptedRecipeRC4, encryptedRecipeAES);
    
    setSelectedPatientKey(''); 
    setRecipeDetails(''); 
    setRecipeDosis('');
    setEncryptedRecipeRC4(''); 
    setEncryptedRecipeAES(''); 
    setQrData('');
  };
  
  const handleOpenRecipe = (encryptedData) => { 
    try {
      const decrypted = Crypto.aesDecryptText(aesKey, encryptedData);
      alert(`Resep Terdekripsi:\n\n${decrypted}`);
    } catch (e) { alert('Gagal dekripsi.'); }
  };
  
  // --- HANDLER PANEL 3 (LSB) ---
  const handleLsbFileChange = (e) => {
    if (e.target.files.length > 0) {
      setLsbFile(e.target.files[0]);
    } else {
      setLsbFile(null);
    }
    setLsbResultImg(null);
    setLsbStatus('');
    setLsbDecodedMsg('');
  };
  
  const handleLsbEncodeAndSend = () => {
    if (!lsbFile || !lsbMessage) {
      alert('Pilih gambar (PNG) dan masukkan pesan rahasia.');
      return;
    }
    if (!lsbSelectedPatientKey) {
      alert('Pilih pasien untuk dikirimkan file LSB.');
      return;
    }
    
    setLsbStatus('Memproses enkripsi...');
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
        const bits = LSB.messageToBits(lsbMessage);
        
        if (bits.length > (pixels.length / 4) * 3) {
          alert('Pesan terlalu panjang untuk gambar ini!');
          setLsbStatus('Gagal: Pesan terlalu panjang.');
          return;
        }
        LSB.hideBitsInPixels(pixels, bits);
        ctx.putImageData(imageData, 0, 0);
        
        const resultDataUrl = canvas.toDataURL('image/png');
        setLsbResultImg(resultDataUrl);
        setLsbStatus('Pesan berhasil disembunyikan!');
        setLsbDecodedMsg('');
        
        saveLsbFileToPatient(lsbSelectedPatientKey, resultDataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(lsbFile);
  };
  
  const handleLsbDecode = () => {
    if (!lsbFile) {
      alert('Pilih gambar (PNG) yang akan diekstrak.');
      return;
    }
    setLsbStatus('Memproses dekripsi...');
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
        setLsbDecodedMsg(msg || 'Tidak ada pesan tersembunyi ditemukan.');
        setLsbStatus('Ekstraksi selesai.');
        setLsbResultImg(null);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(lsbFile);
  };

  // --- HANDLER PANEL 4 (BAGIKAN) ---
  const handleDownloadEncryptedRecipeFile = () => { 
    if (!encryptedRecipeAES) {
      alert('Enkripsi resep dulu (klik preview).');
      return;
    }
    const selectedPatient = patientList.find(p => p.key === selectedPatientKey);
    const patientName = selectedPatient ? selectedPatient.name : "Pasien";
    const cleanPatientName = patientName.replace(/[^a-z0-9]/gi, '_');

    try {
      const payload = {
        filename: `Resep_${cleanPatientName}.txt`, // Nama file internal
        mimeType: 'text/plain',
        data: encryptedRecipeAES 
      };
      const jsonString = JSON.stringify(payload);
      const blob = new Blob([jsonString], { type: 'application/json' }); 
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      // Nama file yang di-download (ekstensi .pdf agar mudah dibuka Agent/Admin)
      link.download = `resep_terenkripsi_${cleanPatientName}.pdf`; 
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(href);
    } catch (e) {
        alert("Gagal membuat file terenkripsi.");
    }
  };
  
  // --- HANDLER TAB 3: ALAT DEKRIPSI (AES) ---
  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
    setDownloadUrl(null);
    setDownloadFilename('');
  };
  
  // === FUNGSI DEKRIPSI (Buka Dokumen) - DIPERBARUI ===
  const handleFileDecrypt = () => {
    if (!selectedFile || !aesKey) {
      alert('Silakan pilih file terenkripsi (.pdf) untuk didekripsi.');
      return;
    }
    setIsProcessing(true);
    setDownloadUrl(null);
    setDownloadFilename('');

    const reader = new FileReader();
    reader.readAsText(selectedFile); 
    
    reader.onload = (e) => {
      let payload;
      try {
        const jsonString = e.target.result;
        payload = JSON.parse(jsonString); 
        if (!payload.data || !payload.filename || !payload.mimeType) {
          throw new Error('File JSON tidak memiliki format payload yang benar.');
        }
      } catch (parseError) {
        alert('Dekripsi Gagal. File ini bukan file terenkripsi yang valid (Gagal Parsing JSON).');
        setIsProcessing(false);
        return; 
      }

      try {
        const decryptedWordArray = Crypto.aesDecryptFile(aesKey, payload.data);
        
        if (payload.mimeType === 'text/plain') {
            const decryptedText = decryptedWordArray.toString(CryptoJS.enc.Utf8);
            
            if (!decryptedText) { 
                throw new Error('Hasil dekripsi kosong. Kemungkinan Kunci AES salah.');
            }

            // --- MULAI TAMPILAN NOTA RESEP PDF ---
            
            // Ekstrak nama pasien dari filename (Contoh: "Resep_John_Doe.txt")
            const nameMatch = payload.filename.match(/^Resep_(.*)\.txt$/);
            const cleanPatientName = (nameMatch && nameMatch[1]) ? nameMatch[1] : "Pasien";
            const patientName = cleanPatientName.replace(/_/g, ' '); // Ganti underscore jadi spasi

            // --- PERUBAHAN DI SINI ---
            // Cari pasien di state 'patientList' untuk mendapatkan umurnya
            const patientFromList = patientList.find(p => p.name === patientName);
            const patientAge = patientFromList ? (patientFromList.age || '-') : '-';
            // --- AKHIR PERUBAHAN ---

            const doc = new jsPDF();
            const tglHariIni = new Date().toLocaleDateString('id-ID', {
              day: '2-digit', month: 'long', year: 'numeric'
            });

            // --- Header Nota (Kop Surat) ---
            try {
              // Parameter: (data_gambar, format, x, y, width, height)
              doc.addImage(logoForPdf, 'PNG', 15, 10, 30, 30); 
            } catch (imgError) {
              console.error("Gagal memuat logo ke PDF:", imgError);
              doc.setFontSize(10);
              doc.text("[Logo Gagal Dimuat]", 20, 25);
            }

            // Info "Klinik"
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
            doc.text(patientName || 'Tidak diketahui', 60, 58);

            doc.setFont('Helvetica', 'bold');
            doc.text("Umur:", 20, 65);
            doc.setFont('Helvetica', 'normal');
            doc.text(patientAge, 60, 65); // <-- DIUBAH DARI "-"

            doc.setFont('Helvetica', 'bold');
            doc.text("Tanggal Dekripsi:", 130, 58);
            doc.setFont('Helvetica', 'normal');
            doc.text(tglHariIni, 165, 58);

            // --- Detail Resep ---
            doc.setFontSize(16);
            doc.setFont('Helvetica', 'bold');
            doc.text("Resep", 20, 85); 

            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(12);
            const textLines = doc.splitTextToSize(decryptedText, 150); 
            doc.text(textLines, 30, 93);

            // --- Tanda Tangan Dokter (Contoh) ---
            doc.setFontSize(11);
            doc.text("Hormat kami,", 140, 150);
            doc.setFont('Helvetica', 'bold');
            doc.text("Dokter Penanggung Jawab", 140, 175);
            
            // --- AKHIR TAMPILAN NOTA RESEP PDF ---

            doc.save(`resep_dekripsi_${cleanPatientName}_${Date.now()}.pdf`);
            alert('Resep berhasil didekripsi dan di-download sebagai "Nota Resep".');

        } else {
            // Ini adalah block 'else'
            const blob = wordArrayToBlob(decryptedWordArray, payload.mimeType);
            if (!blob) throw new Error("Gagal membuat blob dari data dekripsi.");
            if (downloadUrl) URL.revokeObjectURL(downloadUrl);
            setDownloadUrl(URL.createObjectURL(blob));
            setDownloadFilename(payload.filename); 
            alert('Dokumen berhasil didekripsi! Siap diunduh.');
        }
        setIsProcessing(false);
      } catch (decryptError) {
        console.error("AES Decrypt Error:", decryptError);
        alert(`Dekripsi Gagal: ${decryptError.message}\n\nPastikan Kunci AES Anda benar. Jika Anda baru saja me-reset aplikasi, Anda harus membuat file resep baru.`);
        setIsProcessing(false);
      }
    };
    
    reader.onerror = () => { 
      alert('Gagal membaca file.'); 
      setIsProcessing(false); 
    };
  };


  // --- FUNGSI RENDER KONTEN UTAMA ---
  const renderContent = () => {
    switch (currentTab) {
      // === TAB 1: MANAJEMEN RESEP ===
      case 'resep':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PANEL 1: RESEP BARU */}
            <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center"><PencilIcon /> Pembuatan Resep Digital Baru</h2>
              <div>
                <label className="text-sm font-medium text-gray-700">Nama Pasien:</label>
                <select value={selectedPatientKey} onChange={(e) => setSelectedPatientKey(e.target.value)} className="w-full mt-1 p-3 border border-gray-300 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="" disabled>-- Pilih Pasien --</option>
                  {patientList.length > 0 ? ( patientList.map(patient => (<option key={patient.key} value={patient.key}>{patient.name} (NIK: {patient.nik || 'N/A'})</option>)) ) : ( <option disabled>...Memuat/Tidak ada pasien...</option> )}
                </select>
              </div>
              {/* --- INPUT DOSIS BARU --- */}
              <div>
                <label className="text-sm font-medium text-gray-700">Pesan Dosis (Caesar + RC4):</label>
                <textarea value={recipeDosis} onChange={(e) => setRecipeDosis(e.target.value)} className="w-full p-3 mt-1 border border-gray-300 rounded" rows="3" placeholder="Contoh: 3x1 Sesudah makan"></textarea>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Detail Resep (AES-CBC):</label>
                <textarea value={recipeDetails} onChange={(e) => setRecipeDetails(e.target.value)} className="w-full p-3 mt-1 border border-gray-300 rounded" rows="4" placeholder="Contoh: Paracetamol 500mg (10 tab)"></textarea>
              </div>
              <div className="flex gap-4">
                <button onClick={handleEncryptPreview} className="w-1/2 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">Enkripsi (Preview)</button>
                <button onClick={() => { setRecipeDetails(''); setRecipeDosis(''); setEncryptedRecipeRC4(''); setEncryptedRecipeAES(''); }} className="w-1/2 py-2 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600">Hapus Draft</button>
              </div>
              <textarea readOnly value={encryptedRecipeRC4} className="w-full p-3 mt-1 border border-gray-300 rounded bg-gray-100 font-mono" rows="2" placeholder="Output Dosis (Caesar+RC4)"></textarea>
              <textarea readOnly value={encryptedRecipeAES} className="w-full p-3 mt-1 border border-gray-300 rounded bg-gray-100 font-mono" rows="3" placeholder="Output Resep (AES-CBC)"></textarea>
              <button onClick={handleSaveRecipe} className="w-full py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700">Simpan Resep ke Brankas Admin</button>
            </div>
            
            {/* PANEL 2: BRANKAS RESEP */}
            <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center"><ArchiveBoxIcon /> Brankas Resep (Admin)</h2>
              <div className="max-h-[500px] overflow-y-auto space-y-3 pr-2">
                {Object.keys(prescriptionVault).length === 0 ? (<p className="text-gray-500 text-center">Brankas resep kosong.</p>) : (
                  Object.entries(prescriptionVault).map(([id, resep]) => (
                    <div key={id} className="bg-gray-50 border p-3 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="font-bold">{resep.patientName}</p>
                        <p className="text-sm text-gray-600">ID: {id} | Tanggal: {resep.date}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleOpenRecipe(resep.encryptedData)} className="py-2 px-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800">Buka</button>
                        <button onClick={() => deletePrescription(id)} className="py-2 px-3 bg-red-500 text-white rounded-lg hover:bg-red-600">Hapus</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* PANEL 3: LSB (KTP/BPJS) */}
            <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center"><KeyIcon />Kirim BPJS</h2>
              <p className="text-sm text-gray-600">Sembunyikan ID/Pesan di file BPJS (PNG) dan kirim ke pasien.</p>
              <div>
                <label className="text-sm font-medium text-gray-700">Pilih Pasien Tujuan:</label>
                <select value={lsbSelectedPatientKey} onChange={(e) => setLsbSelectedPatientKey(e.target.value)} className="w-full mt-1 p-3 border border-gray-300 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="" disabled>-- Pilih Pasien --</option>
                  {patientList.length > 0 ? ( patientList.map(patient => (<option key={patient.key} value={patient.key}>{patient.name}</option>)) ) : ( <option disabled>...Memuat...</option> )}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Pilih Gambar (PNG):</label>
                <input type="file" accept="image/png" onChange={handleLsbFileChange} className="w-full p-2 border rounded file:bg-blue-600 file:text-white file:border-0 file:rounded-lg file:px-4 file:py-2 file:font-semibold" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">ID BPJS, dll:</label>
                <textarea value={lsbMessage} onChange={(e) => setLsbMessage(e.target.value)} className="w-full p-3 mt-1 border border-gray-300 rounded" rows="3" placeholder="Tulis pesan rahasia di sini..."></textarea>
              </div>
              <div className="flex gap-4">
                <button onClick={handleLsbEncodeAndSend} disabled={!lsbFile || !lsbMessage || !lsbSelectedPatientKey} className="w-1/2 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50">Sembunyikan & Kirim</button>
                <button onClick={handleLsbDecode} disabled={!lsbFile} className="w-1/2 py-3 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-800 disabled:opacity-50">Ekstrak (Cek Ulang)</button>
              </div>
              {lsbStatus && (<p className="text-sm text-center font-medium">{lsbStatus}</p>)}
              {lsbDecodedMsg && ( <div><h3 className="font-semibold">Pesan Terekstrak:</h3><p className="bg-gray-100 p-2 rounded border font-mono">{lsbDecodedMsg}</p></div> )}
            </div>
            
            {/* PANEL 4: QR CODE & KIRIM */}
            <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center"><QrCodeIcon /> Bagikan Resep ke Pasien</h2>
              <p className="text-sm text-gray-600">Pindai QR ini untuk Dosis (RC4) atau klik tombol di bawah.</p>
              <div className="w-full flex justify-center items-center bg-gray-50 p-4 rounded-lg border min-h-[200px]">
                {qrData ? (<QRCodeSVG value={qrData} size={180} level={"L"} className="w-full max-w-[180px] h-auto"/>) : (<p className="text-gray-500">Generate resep di Panel 1.</p>)}
              </div>
              <div className="flex gap-4">
                <button onClick={handleSendToPatient} className="w-1/2 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">Kirim Resep ke Pasien</button>
                <button onClick={handleDownloadEncryptedRecipeFile} className="w-1/2 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700">Download (File .pdf AES)</button>
              </div>
            </div>
          </div>
        );

      // === TAB 2: PROFIL PASIEN (BARU) ===
      case 'profil':
        return (
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">Profil Pasien (Data Terdekripsi)</h2>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {patientList.length === 0 ? (
                <p className="text-gray-500 text-center">Belum ada data pasien.</p>
              ) : (
                patientList.map((item) => (
                  <div key={item.key} className="bg-gray-50 p-4 rounded-lg flex justify-between items-center shadow-sm border border-gray-200">
                    <div>
                      <p className="font-bold text-lg text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600"><strong>NIK (3DES):</strong> {item.nik || 'N/A'}</p>
                      <p className="text-sm text-gray-600"><strong>Umur (3DES):</strong> {item.age || 'N/A'}</p>
                      <p className="text-sm text-gray-600"><strong>Gol. Darah (3DES):</strong> {item.position || 'N/A'}</p>
                      <p className="text-sm text-gray-600"><strong>ID BPJS (3DES):</strong> {item.bpjs_id || 'N/A'}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => deletePatient(item.key)}
                        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-lg transition-colors flex items-center"
                        title="Hapus Pasien"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      // === TAB 3: DATABASE PASIEN (BARU) ===
      case 'database':
        return (
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">Database Pasien (Data Mentah Terenkripsi)</h2>
            <div className="space-y-3 max-h-[70vh] overflow-y-auto bg-gray-900 text-green-400 p-4 rounded-lg font-mono border border-gray-700 text-sm">
              {Object.keys(appData).length === 0 ? <p className="text-gray-500">Data Kosong</p> : 
                Object.entries(appData).map(([key, value]) => (
                  <div key={key} className="border-b border-gray-700 pb-3">
                    <p className="break-all"><span className="text-gray-400">Nama (3DES):</span> {key}</p>
                    <p className="break-all"><span className="text-gray-400">Data (3DES):</span> {value.encrypted_data}</p>
                    <p className="break-all"><span className="text-gray-400">Password (SHA-512):</span> {value.password}</p>
                    <p className="break-all"><span className="text-gray-400">Resep Dosis (RC4):</span> {value.super_teks || '""'}</p>
                    <p className="break-all"><span className="text-gray-400">Resep File (AES):</span> {value.pending_recipe_aes ? '...Data Hex...' : '""'}</p>
                    <p className="break-all"><span className="text-gray-400">File LSB (URL):</span> {value.lsb_file_url ? '...Data URL...' : '""'}</p>
                  </div>
                ))
              }
            </div>
          </div>
        );


      // === TAB 4: ALAT DEKRIPSI (AES) ===
      case 'brankas':
        return (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">Alat Dekripsi Dokumen (AES)</h2>
                <p className="text-sm text-gray-600 -mt-2 mb-4">
                  Gunakan alat ini untuk membuka (mendekripsi) file <strong>.pdf</strong> terenkripsi yang di-download dari Tab 1 atau Pasien.
                </p>
                <div>
                  <label className="text-sm font-medium text-gray-700">Pilih File .pdf Terenkripsi:</label>
                  <input type="file" onChange={handleFileChange} className="w-full p-2 mt-1 border rounded file:bg-blue-600 file:text-white file:border-0 file:rounded-lg file:px-4 file:py-2 file:font-semibold" />
                </div>
                
                <button 
                    onClick={handleFileDecrypt} 
                    disabled={isProcessing || !selectedFile} 
                    className="w-full py-3 bg-gray-700 text-white font-bold rounded-lg disabled:opacity-50 hover:bg-gray-800"
                >
                  {isProcessing ? 'Memproses...' : 'Buka Dokumen (Dekripsi)'}
                </button>
                
                {downloadUrl && (
                  <div className="text-center pt-4 border-t">
                    <h3 className="text-lg font-semibold">Hasil Dekripsi (File Asli):</h3>
                    <a href={downloadUrl} download={downloadFilename} className="inline-block mt-2 px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700">
                      Download {downloadFilename}
                    </a>
                  </div>
                )}
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-lg space-y-4 h-fit">
                  <h3 className="text-2xl font-bold mb-2 text-red-600">Reset Aplikasi</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Gunakan ini jika Anda mendapat error "Kunci AES salah". Tombol ini akan menghapus semua data dan kunci dari Local Storage.
                  </p>
                  <button
                    onClick={resetAplikasi} 
                    className="w-full p-3 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition"
                  >
                    Reset Aplikasi Sekarang
                  </button>
              </div>

            </div>
          </>
        );

      default:
        return null;
    }
  };

  // --- JSX UTAMA ---
  return (
    <div className="bg-gray-100 min-h-screen font-['Poppins']">
      <Navbar />
      <canvas ref={canvasRef} className="hidden"></canvas>
      
      {/* --- Navigasi Tab --- */}
      <div className="container mx-auto p-4 md:px-8 pt-6">
        <div className="flex flex-wrap space-x-1 bg-blue-600 p-1 rounded-lg shadow-md">
          <button
            onClick={() => setCurrentTab('resep')}
            className={`flex-1 py-3 font-bold rounded-md transition text-sm ${
              currentTab === 'resep' ? 'bg-white text-blue-700 shadow' : 'bg-blue-600 text-blue-100 hover:bg-blue-500'
            }`}
          >
            Manajemen Resep
          </button>
          
          <button
            onClick={() => setCurrentTab('profil')}
            className={`flex-1 py-3 font-bold rounded-md transition text-sm ${
              currentTab === 'profil' ? 'bg-white text-blue-700 shadow' : 'bg-blue-600 text-blue-100 hover:bg-blue-500'
            }`}
          >
            Profil Pasien
          </button>
          
          <button
            onClick={() => setCurrentTab('database')}
            className={`flex-1 py-3 font-bold rounded-md transition text-sm ${
              currentTab === 'database' ? 'bg-white text-blue-700 shadow' : 'bg-blue-600 text-blue-100 hover:bg-blue-500'
            }`}
          >
            Database Pasien
          </button>

          <button
            onClick={() => setCurrentTab('brankas')}
            className={`flex-1 py-3 font-bold rounded-md transition text-sm ${
              currentTab === 'brankas' ? 'bg-white text-blue-700 shadow' : 'bg-blue-600 text-blue-100 hover:bg-blue-500'
            }`}
          >
            Alat Dekripsi (AES)
          </button>
        </div>
      </div>

      {/* --- Konten Tab --- */}
      <div className="container mx-auto p-4 md:p-8">
        {renderContent()}
      </div>
    </div>
  );
}