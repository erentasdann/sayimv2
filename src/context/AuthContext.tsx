import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { AuthContextType, User } from '../types';
import * as authService from '../services/authService';

// Context oluşturuluyor
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider bileşeni
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Uygulama başladığında localStorage'dan kullanıcı bilgisini kontrol et
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);
  
  // Giriş işlemi
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      if (!username.trim() || !password) return false;
      const loggedInUser = await authService.login(username, password);
      if (!loggedInUser) {
        return false;
      }
      setUser(loggedInUser);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Giriş yapılırken hata oluştu:', error);
      return false;
    }
  };
  
  // Çıkış işlemi
  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };
  
  // Context değerleri
  const value = {
    user,
    login,
    logout,
    isAuthenticated,
    loading
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth hook must be used within an AuthProvider');
  }
  return context;
}; 