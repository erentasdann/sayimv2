import { User } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';



// Giriş yapma işlemi - Sadece belirli kullanıcı adı kabul edilecek
export const login = async (username: string, password: string): Promise<User | null> => {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (data.success && data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
      return data.user;
    }
    return null;
  } catch (error) {
    return null;
  }
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
