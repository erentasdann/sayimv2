import { InventoryItem, Product } from '../types';
import { getProductByBarcode } from './productService';
import * as XLSX from 'xlsx';
import { sendInventoryReport } from '../utils/emailService';

// Lokalde depolanan stok sayım verilerini al
const getStoredInventory = (): InventoryItem[] => {
  const storedInventory = localStorage.getItem('inventory');
  if (storedInventory) {
    return JSON.parse(storedInventory);
  }
  return [];
};

// Stok sayım verilerini kaydet
const saveInventory = (inventory: InventoryItem[]): void => {
  localStorage.setItem('inventory', JSON.stringify(inventory));
};

// Tüm stok sayım verilerini getirme
export const getAllInventoryItems = (): Promise<InventoryItem[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getStoredInventory());
    }, 300);
  });
};

// Barkod ile ürün sayımı ekleme/güncelleme
export const addOrUpdateInventoryItem = async (
  barcode: string,
  count: number,
  userName: string
): Promise<InventoryItem> => {
  try {
    // Ürün bilgisini al (otomatik oluşturma özelliği ile)
    const product = await getProductByBarcode(barcode);
    console.log('addOrUpdateInventoryItem - barcode:', barcode, 'product:', product);
    
    // Barkodları normalize eden fonksiyon
    const normalizeBarcode = (code: string) => {
      let b = code.trim();
      if (b.includes('-')) b = b.split('-').slice(1).join('-');
      b = b.replace(/^0+/, '');
      return b;
    };
    const normalized = normalizeBarcode(product.barcode);

    const currentInventory = getStoredInventory();
    // Barkodları normalize ederek karşılaştır
    const existingItemIndex = currentInventory.findIndex(
      (item) => normalizeBarcode(item.barcode) === normalized
    );
    console.log('addOrUpdateInventoryItem - existingItemIndex:', existingItemIndex);

    // Yeni ürün için temel bilgiler
    const newItem: InventoryItem = {
      id: product.id,
      barcode: product.barcode,
      name: product.name,
      count,  // Varsayılan olarak yeni sayım miktarını kullan
      timestamp: new Date().toISOString(),
      countedBy: userName
    };
    console.log('addOrUpdateInventoryItem - newItem:', newItem);

    // Eğer ürün zaten sayılmışsa, miktarları topla ve güncelle
    if (existingItemIndex >= 0) {
      // Mevcut miktarı al
      const existingCount = currentInventory[existingItemIndex].count;
      
      // Yeni miktarı mevcut miktara ekle
      newItem.count = existingCount + count;
      
      // Mevcut öğeyi güncelle
      currentInventory[existingItemIndex] = newItem;
    } else {
      // Yeni ürünü ekle
      currentInventory.push(newItem);
    }

    saveInventory(currentInventory);
    return newItem;
  } catch (error) {
    console.error('Stok sayım eklenirken hata oluştu:', error);
    throw error;
  }
};

// ID ile stok sayım silme
export const deleteInventoryItem = (id: string): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      const currentInventory = getStoredInventory();
      const updatedInventory = currentInventory.filter(item => item.id !== id);
      
      // Eğer silinen öğe yoksa
      if (updatedInventory.length === currentInventory.length) {
        resolve(false);
        return;
      }
      
      saveInventory(updatedInventory);
      resolve(true);
    } catch (error) {
      console.error('Stok sayım silinirken hata oluştu:', error);
      resolve(false);
    }
  });
};

// ID ile stok sayım güncelleme
export const updateInventoryItem = (id: string, count: number, userName: string): Promise<InventoryItem | null> => {
  return new Promise((resolve) => {
    try {
      const currentInventory = getStoredInventory();
      const itemIndex = currentInventory.findIndex(item => item.id === id);
      
      if (itemIndex === -1) {
        resolve(null);
        return;
      }
      
      // Önceki değerleri koru, sadece sayıyı, tarihi ve sayan kişiyi güncelle
      const updatedItem = {
        ...currentInventory[itemIndex],
        count,
        timestamp: new Date().toISOString(),
        countedBy: userName
      };
      
      currentInventory[itemIndex] = updatedItem;
      saveInventory(currentInventory);
      
      resolve(updatedItem);
    } catch (error) {
      console.error('Stok sayım güncellenirken hata oluştu:', error);
      resolve(null);
    }
  });
};

// Excel dosyası oluştur ve indir
export const exportToExcel = (inventory: InventoryItem[]): void => {
  // Sadece istenen alanları içeren yeni bir dizi oluştur
  const exportData = inventory.map(item => ({
    'Barkod': item.barcode,
    'Ürün Adı': item.name,
    'Adet': item.count,
    'Sayan Kişi': item.countedBy
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // Başlıkları Türkçe ve sıralı yap
  XLSX.utils.sheet_add_aoa(worksheet, [
    ['Barkod', 'Ürün Adı', 'Adet', 'Sayan Kişi']
  ], { origin: 'A1' });

  // Kolon genişliklerini ayarla
  const cols = [
    { wch: 15 }, // Barkod
    { wch: 30 }, // Ürün Adı
    { wch: 10 }, // Adet
    { wch: 20 }  // Sayan Kişi
  ];
  worksheet['!cols'] = cols;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Stok Sayım');

  // Dosya adını tarih ile oluştur
  const date = new Date();
  const fileName = `Stok_Sayim_${date.getDate()}_${date.getMonth() + 1}_${date.getFullYear()}.xlsx`;

  // Dosyayı indir
  XLSX.writeFile(workbook, fileName);
};

// Email ile rapor gönderme
export const sendReportByEmail = async (
  recipientEmail: string,
  inventoryItems: InventoryItem[]
): Promise<boolean> => {
  try {
    // Kullanıcı adını localStorage'dan al
    const userInfo = localStorage.getItem('user');
    const userName = userInfo ? JSON.parse(userInfo).name : 'Kullanıcı';
    
    // Email gönderme işlemini emailService ile yap
    const success = await sendInventoryReport(
      inventoryItems,
      recipientEmail,
      userName
    );
    
    return success;
  } catch (error) {
    console.error('Rapor email ile gönderilirken hata oluştu:', error);
    return false;
  }
};

// Çoklu stok sayım silme
export const deleteInventoryItems = (ids: string[]): Promise<number> => {
  return new Promise((resolve) => {
    try {
      const currentInventory = getStoredInventory();
      const updatedInventory = currentInventory.filter(item => !ids.includes(item.id));
      const deletedCount = currentInventory.length - updatedInventory.length;
      saveInventory(updatedInventory);
      resolve(deletedCount);
    } catch (error) {
      console.error('Toplu stok sayım silinirken hata oluştu:', error);
      resolve(0);
    }
  });
};

// Sayım listesini başka kullanıcıya aktarma
export const transferInventoryToUser = async (fromUser: string, toUser: string): Promise<void> => {
  const currentInventory = getStoredInventory();
  const updatedInventory = currentInventory.map(item =>
    item.countedBy === fromUser ? { ...item, countedBy: toUser } : item
  );
  saveInventory(updatedInventory);
}; 