/*
  File: AuthContext.jsx
  Update: 
  - PERBAIKAN: Menambahkan 'savePrescription' dan 'deletePrescription' 
    ke dalam 'value' yang diekspor.
*/
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Crypto from '../utils/crypto';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [role, setRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState(null);
  
  const [appData, setAppData] = useState({});
  const [fileVault, setFileVault] = useState({});
  const [prescriptionVault, setPrescriptionVault] = useState({});
  
  const [desKey, setDesKey] = useState(null);
  const [aesKey, setAesKey] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    const keys = Crypto.loadAllKeys();
    setDesKey(keys.desKey);
    setAesKey(keys.aesKey);

    const fetchDb = async () => {
      const data = await Crypto.loadData();
      setAppData(data);
    };
    
    const loadVault = () => {
      const savedVault = localStorage.getItem('fileVault');
      if (savedVault) setFileVault(JSON.parse(savedVault));
      
      const savedPrescriptions = localStorage.getItem('prescriptionVault');
      if (savedPrescriptions) setPrescriptionVault(JSON.parse(savedPrescriptions));
    };
    
    fetchDb();
    loadVault();
  }, []);

  const loginAdmin = (user, pass) => {
    if (user === 'admin' && pass === 'admin') {
      setIsAuthenticated(true);
      setRole('admin');
      setUsername('admin');
      navigate('/admin');
    } else {
      alert('Login Staf Medis Gagal: Username atau Password salah.');
    }
  };

  const loginPatient = (usernameInput, password) => {
    const hashedInputPassword = Crypto.hashData(password); 
    let userKey = null;
    let userData = null;

    for (const encryptedNameHex of Object.keys(appData)) {
      try {
        const decryptedName = Crypto.decryptName(desKey, encryptedNameHex);
        if (decryptedName === usernameInput) {
          userKey = encryptedNameHex;
          userData = appData[userKey];
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (userData && userData.password === hashedInputPassword) {
      setIsAuthenticated(true);
      setRole('agent'); 
      setUsername(userKey); 
      navigate('/agent'); 
    } else {
      alert('Login Gagal! Nama Pasien atau password salah.');
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setRole(null);
    setUsername(null);
    navigate('/');
  };

  const addPatient = (name, nik, password) => {
    const { encryptedName, encryptedData } = Crypto.encryptAgentData(desKey, name, nik, '', '', '');
    
    if (appData[encryptedName]) {
        throw new Error("Nama pasien ini sudah terdaftar.");
    }

    const hashedPassword = Crypto.hashData(password); 
    const newData = {
      ...appData,
      [encryptedName]: {
        password: hashedPassword,
        encrypted_data: encryptedData,
        super_teks: "", 
        patient_message: "", 
        pending_recipe_aes: "", 
        lsb_file_url: "" 
      },
    };
    setAppData(newData);
    Crypto.saveData(newData);
  };
  
  const updatePatientDetails = (patientEncryptedName, nik, age, position, bpjs_id) => {
     const name = Crypto.decryptName(desKey, patientEncryptedName);
     const { encryptedData } = Crypto.encryptAgentData(desKey, name, nik, age, position, bpjs_id);
     
     const newData = {
        ...appData,
        [patientEncryptedName]: {
            ...appData[patientEncryptedName],
            encrypted_data: encryptedData
        }
     };
     setAppData(newData);
     Crypto.saveData(newData);
     alert('Data diri berhasil diperbarui!');
  };

  const deletePatient = (encryptedNameHex) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus data pasien ini?")) {
      const newData = { ...appData };
      delete newData[encryptedNameHex];
      setAppData(newData);
      Crypto.saveData(newData);
      alert('Data pasien berhasil dihapus.');
    }
  };

  const resetAplikasi = () => {
    if (window.confirm("RESET APLIKASI? Ini akan menghapus SEMUA data pasien dan kunci enkripsi.")) {
      localStorage.clear(); 
      window.location.reload(); 
      alert('Aplikasi telah direset.');
    }
  };

  const saveSecretNote = (patientEncryptedName, encryptedTeks) => {
    if (!encryptedTeks) {
      alert("Tidak ada catatan terenkripsi untuk disimpan.");
      return;
    }
    const newData = {
      ...appData,
      [patientEncryptedName]: {
        ...appData[patientEncryptedName],
        patient_message: encryptedTeks 
      }
    };
    setAppData(newData);
    Crypto.saveData(newData);
    alert('Balasan Anda berhasil dikirim!');
  };
  
  const sendRecipeToPatient = (patientKey, rc4Dosis, aesResep) => {
    const newData = {
      ...appData,
      [patientKey]: {
        ...appData[patientKey],
        super_teks: rc4Dosis, 
        pending_recipe_aes: aesResep 
      }
    };
    setAppData(newData);
    Crypto.saveData(newData);
    alert('Resep (Dosis dan File AES) berhasil dikirim ke pasien!');
  };
  
  const clearPatientRecipe = (patientKey) => {
    const newData = {
      ...appData,
      [patientKey]: {
        ...appData[patientKey],
        super_teks: "", 
        pending_recipe_aes: "" 
      }
    };
    setAppData(newData);
    Crypto.saveData(newData);
  };
  
  const saveLsbFileToPatient = (patientKey, fileDataUrl) => {
    const newData = {
      ...appData,
      [patientKey]: {
        ...appData[patientKey],
        lsb_file_url: fileDataUrl 
      }
    };
    setAppData(newData);
    Crypto.saveData(newData);
    alert('File BPJS (LSB) berhasil dikirim ke pasien!');
  };

  const saveFileToVault = (storageName, payload) => {
    const newVault = { ...fileVault, [storageName]: payload };
    setFileVault(newVault);
    localStorage.setItem('fileVault', JSON.stringify(newVault));
    alert('Dokumen berhasil dienkripsi dan disimpan di brankas.');
  };
  const deleteFileFromVault = (storageName) => {
    if (window.confirm(`Yakin ingin menghapus dokumen "${storageName}" dari brankas?`)) {
      const newVault = { ...fileVault };
      delete newVault[storageName];
      setFileVault(newVault);
      localStorage.setItem('fileVault', JSON.stringify(newVault));
      alert('Dokumen berhasil dihapus dari brankas.');
    }
  };
  
  // --- FUNGSI INI YANG MEMPERBAIKI TOMBOL HAPUS ---
  const deletePrescription = (prescriptionId) => {
    if (window.confirm(`Yakin ingin menghapus resep ${prescriptionId}?`)) {
      const newVault = { ...prescriptionVault };
      delete newVault[prescriptionId];
      setPrescriptionVault(newVault); // Memperbarui state
      localStorage.setItem('prescriptionVault', JSON.stringify(newVault)); // Memperbarui storage
      alert('Resep berhasil dihapus.');
    }
  };
  // ------------------------------------------------
  
  // --- FUNGSI INI YANG MEMPERBAIKI TOMBOL SIMPAN ---
  const savePrescription = (patientName, encryptedRecipeData) => {
    const newId = `RSP${Date.now()}`;
    const newVault = {
      ...prescriptionVault,
      [newId]: {
        patientName: patientName,
        date: new Date().toISOString().split('T')[0],
        status: "Baru",
        encryptedData: encryptedRecipeData
      }
    };
    setPrescriptionVault(newVault);
    localStorage.setItem('prescriptionVault', JSON.stringify(newVault));
    alert('Resep berhasil disimpan di brankas!');
  };
  // -------------------------------------------------


  const value = {
    isAuthenticated,
    role,
    username,
    appData,
    desKey,
    aesKey,
    loginAdmin,
    loginPatient,
    logout,
    addPatient,
    updatePatientDetails,
    deletePatient,
    resetAplikasi,
    saveSecretNote,
    sendRecipeToPatient,
    clearPatientRecipe,
    saveLsbFileToPatient,
    
    fileVault,
    saveFileToVault,
    deleteFileFromVault,

    // === SEMUA FUNGSI INI HARUS ADA DI SINI ===
    prescriptionVault,
    savePrescription,
    deletePrescription,
    // ==========================================
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};