import { User } from '../types';

// Yalnızca izin verilen kullanıcı adı
const AUTHORIZED_USERNAME = 'tasdan2025';

// Giriş yapma işlemi - Sadece belirli kullanıcı adı kabul edilecek
export const login = (username: string): Promise<User | null> => {
  return new Promise((resolve) => {
    // Kullanıcı adını kontrol et
    if (username.trim().toLowerCase() !== AUTHORIZED_USERNAME) {
      // Yetkisiz kullanıcı
      setTimeout(() => {
        resolve(null);
      }, 300);
      return;
    }
    
    // Yetkili kullanıcı bilgilerini oluştur
    const user: User = {
      username: AUTHORIZED_USERNAME,
      name: 'Sistem Yöneticisi',
      role: 'admin'
    };
    
    // Kullanıcı oturumunu localStorage'a kaydet
    localStorage.setItem('user', JSON.stringify(user));
    
    // Bir miktar gecikme ekle, gerçek API çağrısı gibi hissettirmek için
    setTimeout(() => {
      resolve(user);
    }, 300);
  });
};

export const logout = (): void => {
  localStorage.removeItem('user');
};

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    return JSON.parse(userStr);
  }
  return null;
}; 