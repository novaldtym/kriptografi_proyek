import CryptoJS from 'crypto-js';

const RC4_KEY = 'mysecretkey';

// ===================================
// Fungsi Hash: SHA-512
// ===================================
export const hashData = (data) => {
  return CryptoJS.SHA512(data).toString();
};

// ===================================
// Manajemen Kunci (Umum)
// ===================================
const saveKey = (keyName, keyWordArray) => {
  localStorage.setItem(keyName, keyWordArray.toString(CryptoJS.enc.Hex));
};

const loadKey = (keyName, sizeInBytes) => {
  const keyHex = localStorage.getItem(keyName);
  if (keyHex) {
    return CryptoJS.enc.Hex.parse(keyHex);
  }
  const newKey = CryptoJS.lib.WordArray.random(sizeInBytes);
  saveKey(keyName, newKey);
  return newKey;
};

export const loadAllKeys = () => {
  return {
    desKey: loadKey('desKey', 24), // 192-bit (24 bytes) untuk 3DES
    aesKey: loadKey('aesKey', 16), // 128-bit (16 bytes) untuk AES
  };
};

// ===================================
// Manajemen Database (LocalStorage)
// ===================================
export const saveData = (data) => {
  localStorage.setItem('appData', JSON.stringify(data, null, 2));
};

export const loadData = async () => {
  const localData = localStorage.getItem('appData');
  if (localData) {
    return JSON.parse(localData);
  }
  try {
    const response = await fetch('/data.json');
    const defaultData = await response.json();
    saveData(defaultData);
    return defaultData;
  } catch (e) {
    console.error('Gagal memuat data.json default', e);
    return {};
  }
};

// ===================================
// Algoritma Database: Triple DES
// ===================================
const tripleDesEncrypt = (key, data) => {
  const iv = CryptoJS.lib.WordArray.random(8);
  const encrypted = CryptoJS.TripleDES.encrypt(data, key, {
    iv: iv,
    padding: CryptoJS.pad.Pkcs7,
    mode: CryptoJS.mode.CBC,
  });
  return iv.toString(CryptoJS.enc.Hex) + encrypted.ciphertext.toString(CryptoJS.enc.Hex);
};

const tripleDesDecrypt = (key, combinedHex) => {
  try {
    const iv = CryptoJS.enc.Hex.parse(combinedHex.substring(0, 16));
    const ciphertext = CryptoJS.enc.Hex.parse(combinedHex.substring(16));
    const decrypted = CryptoJS.TripleDES.decrypt({ ciphertext: ciphertext }, key, {
      iv: iv,
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.CBC,
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (e) {
    throw new Error('Dekripsi 3DES gagal, kunci mungkin salah.');
  }
};

export const encryptAgentData = (desKey, name, nik, age, position, bpjs_id) => {
  const rawData = `${nik || ''}|${age || ''}|${position || ''}|${bpjs_id || ''}`;
  const encryptedData = tripleDesEncrypt(desKey, rawData);
  const encryptedName = tripleDesEncrypt(desKey, name);
  return {
    encryptedName: encryptedName,
    encryptedData: encryptedData,
  };
};

export const decryptName = (desKey, encryptedNameHex) => {
  return tripleDesDecrypt(desKey, encryptedNameHex);
};

export const decryptAgentDetails = (desKey, encryptedDataHex) => {
  const decrypted = tripleDesDecrypt(desKey, encryptedDataHex);
  const [nik, age, position, bpjs_id] = decrypted.split('|');
  return { nik, age, position, bpjs_id };
};

// ===================================
// Algoritma Teks Super: Caesar + RC4
// ===================================
// Helper: Caesar Cipher
export const caesarCipher = (text, shift) => {
  let encryptedText = '';
  for (let i = 0; i < text.length; i++) {
    let char = text[i];
    if (char.match(/[a-z]/i)) {
      let code = text.charCodeAt(i);
      let shiftBase = code >= 65 && code <= 90 ? 65 : 97;
      encryptedText += String.fromCharCode(((code - shiftBase + shift) % 26 + 26) % 26 + shiftBase);
    } else {
      encryptedText += char;
    }
  }
  return encryptedText;
};

// Helper: RC4 Cipher
export const rc4Encrypt = (key, text) => {
  let S = Array.from(Array(256).keys());
  let j = 0;
  let out = [];
  for (let i = 0; i < 256; i++) {
    j = (j + S[i] + key.charCodeAt(i % key.length)) % 256;
    [S[i], S[j]] = [S[j], S[i]];
  }
  let i = (j = 0);
  for (let char of text) {
    i = (i + 1) % 256;
    j = (j + S[i]) % 256;
    [S[i], S[j]] = [S[j], S[i]];
    let K = S[(S[i] + S[j]) % 256];
    out.push(String.fromCharCode(char.charCodeAt(0) ^ K));
  }
  return out.join('');
};

export const encryptSuperTeks = (text) => {

  const safeInputBase64 = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(text));

  // 2. Jalankan Algoritma Kustom (Caesar -> RC4)
  const caesar = caesarCipher(safeInputBase64, 3);
  const rc4 = rc4Encrypt(RC4_KEY, caesar);


  return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Latin1.parse(rc4));
};

export const decryptSuperTeks = (base64Cipher) => {
  try {
    const rc4Text = CryptoJS.enc.Latin1.stringify(CryptoJS.enc.Base64.parse(base64Cipher));
    const caesarText = rc4Encrypt(RC4_KEY, rc4Text);
    const originalBase64 = caesarCipher(caesarText, -3);
    return CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(originalBase64));
  } catch (e) {
    console.error("Gagal dekripsi SuperTeks:", e);
    return "[Gagal Dekripsi: Format Data Rusak]";
  }
};


// ===================================
// Algoritma File: AES-CBC (128-bit)
// ===================================
export const aesEncryptFile = (key, wordArrayData) => {
  const iv = CryptoJS.lib.WordArray.random(16);
  const encrypted = CryptoJS.AES.encrypt(wordArrayData, key, {
    iv: iv,
    padding: CryptoJS.pad.Pkcs7,
    mode: CryptoJS.mode.CBC,
  });
  return iv.toString(CryptoJS.enc.Hex) + encrypted.ciphertext.toString(CryptoJS.enc.Hex);
};

export const aesDecryptFile = (key, combinedHex) => {
  try {
    const iv = CryptoJS.enc.Hex.parse(combinedHex.substring(0, 32));
    const ciphertext = CryptoJS.enc.Hex.parse(combinedHex.substring(32));
    const decrypted = CryptoJS.AES.decrypt({ ciphertext: ciphertext }, key, {
      iv: iv,
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.CBC,
    });
    return decrypted; 
  } catch (e) {
    console.error("AES Decrypt Error:", e);
    throw new Error('Dekripsi AES-CBC gagal, kunci mungkin salah.');
  }
};

export const aesEncryptText = (key, plainText) => {
  const wordArray = CryptoJS.enc.Utf8.parse(plainText);
  return aesEncryptFile(key, wordArray);
};

export const aesDecryptText = (key, combinedHex) => {
  const decryptedWordArray = aesDecryptFile(key, combinedHex);
  return decryptedWordArray.toString(CryptoJS.enc.Utf8);
};

// ===================================
// Objek Steganografi: LSB (Canvas)
// ===================================
export const LSB = {
  messageToBits: (message) => {
    let output = '';
    for (let i = 0; i < message.length; i++) {
      let charCode = message.charCodeAt(i);
      output += charCode.toString(2).padStart(16, '0');
    }
    output += '0'.repeat(16); 
    return output;
  },

  bitsToMessage: (pixels) => {
    let bitStream = '';
    // Kumpulkan SEMUA bit LSB dari R, G, B
    for (let i = 0; i < pixels.length; i += 4) {
       bitStream += (pixels[i] & 1).toString();
       bitStream += (pixels[i + 1] & 1).toString();
       bitStream += (pixels[i + 2] & 1).toString();
    }
    
    let message = '';
    // Proses bit stream per 16-bit character
    for (let j = 0; j + 16 <= bitStream.length; j += 16) {
      let charBits = bitStream.substring(j, j + 16);
      let charCode = parseInt(charBits, 2);
      
      if (charCode === 0) { 
        return message; 
      }
      message += String.fromCharCode(charCode);
    }
    return message;
  },

  hideBitsInPixels: (pixels, bits) => {
    let bitIndex = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      if (bitIndex < bits.length)
        pixels[i] = (pixels[i] & 0xFE) | parseInt(bits[bitIndex++], 2);
      
      if (bitIndex < bits.length)
        pixels[i + 1] = (pixels[i + 1] & 0xFE) | parseInt(bits[bitIndex++], 2);
      
      if (bitIndex < bits.length)
        pixels[i + 2] = (pixels[i + 2] & 0xFE) | parseInt(bits[bitIndex++], 2);

      pixels[i + 3] = 255; 
    }
    return pixels;
  }
};

// ===================================
// Fungsi Dekripsi Admin
// ===================================
export const decryptAllData = (data, desKey) => {
  const decryptedList = [];
  for (const encryptedNameHex in data) {
    try {
      const agentDbEntry = data[encryptedNameHex];
      
      const name = decryptName(desKey, encryptedNameHex);
      const { nik, age, position, bpjs_id } = decryptAgentDetails(desKey, agentDbEntry.encrypted_data);
      
      const encryptedMessage = agentDbEntry.super_teks || null;

      decryptedList.push({ 
        key: encryptedNameHex,
        name,
        nik,
        age,
        position,
        bpjs_id, 
        message: null, 
        encryptedMessage: encryptedMessage
      });

    } catch (e) {
      console.error(`Gagal mendekripsi data (3DES) untuk ${encryptedNameHex}`, e);
    }
  }
  return decryptedList;
};