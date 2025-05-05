import { Product } from '../types';

// Örnek ürünler (gerçek bir uygulamada bu veriler API'den gelecektir)
const sampleProducts: Product[] = [
  {
    id: '1',
    barcode: '8690123456789',
    name: 'Ürün A',
    description: 'Ürün A açıklaması',
    category: 'Kategori 1',
    stockQuantity: 100
  },
  {
    id: '2',
    barcode: '8690987654321',
    name: 'Ürün B',
    description: 'Ürün B açıklaması',
    category: 'Kategori 2',
    stockQuantity: 50
  },
  {
    id: '3',
    barcode: '8690123123123',
    name: 'Ürün C',
    description: 'Ürün C açıklaması',
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

// Barkodla ürün arama, eğer yoksa otomatik oluşturma
export const getProductByBarcode = (barcode: string): Promise<Product> => {
  return new Promise((resolve) => {
    const products = getStoredProducts();
    // Ürünü bul
    let product = products.find((p) => p.barcode === barcode);
    
    // Ürün bulunamadıysa, yeni bir ürün oluştur
    if (!product) {
      const newProduct: Product = {
        id: Date.now().toString(), // Basit bir ID oluştur
        barcode,
        name: `Barkod: ${barcode}`, // Barkod numarasını isim olarak kullan
        stockQuantity: 0
      };
      
      // Yeni ürünü listeye ekle ve kaydet
      products.push(newProduct);
      saveProducts(products);
      
      // Çözümlemek için oluşturulan ürünü kullan
      product = newProduct;
    }
    
    // Bu noktada product kesinlikle tanımlı olacak
    setTimeout(() => {
      resolve(product!);
    }, 300);
  });
}; 