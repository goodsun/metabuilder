interface StoredWallet {
  encryptedData: string;
  expiry: number;
}

const WALLET_STORAGE_KEY = 'ardrive_wallet_temp';
const WALLET_EXPIRY_MINUTES = 30;

function generateKey(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

async function encryptData(data: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const keyBuffer = Uint8Array.from(key.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const algorithm = { name: 'AES-GCM', iv: iv };
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  
  const encryptedBuffer = await crypto.subtle.encrypt(algorithm, cryptoKey, dataBuffer);
  const encryptedArray = new Uint8Array(encryptedBuffer);
  
  const combined = new Uint8Array(iv.length + encryptedArray.length);
  combined.set(iv);
  combined.set(encryptedArray, iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

async function decryptData(encryptedData: string, key: string): Promise<string> {
  const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);
  
  const keyBuffer = Uint8Array.from(key.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
  const algorithm = { name: 'AES-GCM', iv: iv };
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
  
  const decryptedBuffer = await crypto.subtle.decrypt(algorithm, cryptoKey, encrypted);
  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

export async function saveWallet(walletJWK: any): Promise<void> {
  try {
    const key = generateKey();
    sessionStorage.setItem('wallet_key', key);
    
    const walletData = JSON.stringify(walletJWK);
    const encryptedData = await encryptData(walletData, key);
    
    const expiry = Date.now() + (WALLET_EXPIRY_MINUTES * 60 * 1000);
    
    const storedWallet: StoredWallet = {
      encryptedData,
      expiry
    };
    
    localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(storedWallet));
  } catch (error) {
    console.error('Failed to save wallet:', error);
  }
}

export async function loadWallet(): Promise<any | null> {
  try {
    const storedData = localStorage.getItem(WALLET_STORAGE_KEY);
    const key = sessionStorage.getItem('wallet_key');
    
    if (!storedData || !key) {
      return null;
    }
    
    const storedWallet: StoredWallet = JSON.parse(storedData);
    
    if (Date.now() > storedWallet.expiry) {
      clearWallet();
      return null;
    }
    
    const decryptedData = await decryptData(storedWallet.encryptedData, key);
    return JSON.parse(decryptedData);
  } catch (error) {
    console.error('Failed to load wallet:', error);
    clearWallet();
    return null;
  }
}

export function clearWallet(): void {
  localStorage.removeItem(WALLET_STORAGE_KEY);
  sessionStorage.removeItem('wallet_key');
}

export function isWalletExpired(): boolean {
  const storedData = localStorage.getItem(WALLET_STORAGE_KEY);
  if (!storedData) return true;
  
  try {
    const storedWallet: StoredWallet = JSON.parse(storedData);
    return Date.now() > storedWallet.expiry;
  } catch {
    return true;
  }
}