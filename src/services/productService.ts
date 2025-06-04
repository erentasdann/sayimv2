import { Product } from '../types';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://37.148.212.133:3001/api';

// Örnek ürünler (gerçek bir uygulamada bu veriler API'den gelecektir)
const sampleProducts: Product[] = [
  {
    id: '1',
    barcode: 'MKO-064420188000',
    name: 'Ürün X',
    description: 'Ürün X açıklaması',
    category: 'Kategori 1',
    stockQuantity: 100
  },
  {
    id: '2',
    barcode: 'MKO-869098765432',
    name: 'Ürün Y',
    description: 'Ürün Y açıklaması',
    category: 'Kategori 2',
    stockQuantity: 50
  },
  {
    id: '3',
    barcode: 'MKO-869012312312',
    name: 'Ürün Z',
    description: 'Ürün Z açıklaması',
    category: 'Kategori 1',
    stockQuantity: 75
  }
];

// Lokalda depolanan ürünleri alma
const getStoredProducts = (): Product[] => {
  const storedProducts = localStorage.getItem('products');
  if (storedProducts) {
    return JSON.parse(storedProducts);
  }
  // İlk kullanımda örnek ürünleri kaydet
  localStorage.setItem('products', JSON.stringify(sampleProducts));
  return sampleProducts;
};

// Ürünleri kaydetme
const saveProducts = (products: Product[]): void => {
  localStorage.setItem('products', JSON.stringify(products));
};

// Tüm ürünleri getirme
export const getAllProducts = (): Promise<Product[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getStoredProducts());
    }, 300);
  });
};

// Barkod normalize fonksiyonu (prefix, baştaki sıfırlar ve son 00099'u at)
export function normalizeBarcode(code: string): string {
  if (!code) return '';
  let b = code.trim();
  // Sadece rakamları al
  b = b.replace(/\D/g, '');
  // Sonu 99 ise bu iki haneyi at
  if (b.endsWith('99')) b = b.slice(0, -2);
  // Baştaki sıfırları at
  b = b.replace(/^0+/, '');
  return b;
}

// Barkodla ürün arama, eğer yoksa otomatik oluşturma
export const getProductByBarcode = async (barcode: string): Promise<Product> => {
  const normalized = normalizeBarcode(barcode);

  // Önce orijinal barkod ile, sonra normalize edilmiş barkod ile dene (API)
  try {
    let res = await axios.get<{ success: boolean; product?: Product }>(`${API_URL}/products/${barcode}`);
    if (res.data && res.data.product) {
      return res.data.product;
    }
  } catch {}

  try {
    if (normalized !== barcode) {
      let res2 = await axios.get<{ success: boolean; product?: Product }>(`${API_URL}/products/${normalized}`);
      if (res2.data && res2.data.product) {
        return res2.data.product;
      }
    }
  } catch {}

  // API'de bulunamazsa, localdeki tüm ürünlerde normalize karşılaştırma yap
  const allProducts = getStoredProducts();
  const product = allProducts.find(p => normalizeBarcode(p.barcode) === normalized);
  if (product) return product;

  // Ürün bulunamazsa dummy ürün döndür
  return {
    id: Date.now().toString(),
    barcode,
    name: `Bilinmeyen Ürün`,
    stockQuantity: 0
  };
}; 