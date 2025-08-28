// Kullanıcı tipi
export interface User {
  username: string;
  name: string;
  role: string;
}

// Envanter öğesi tipi
export interface InventoryItem {
  id: string;
  barcode: string;
  name: string;
  count: number;
  timestamp: string;
  countedBy: string;
}

// Ürün tipi
export interface Product {
  id: string;
  barcode: string;
  name: string;
  description?: string;
  category?: string;
  stockQuantity?: number;
}

// Oturum context tipi
export interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
} 