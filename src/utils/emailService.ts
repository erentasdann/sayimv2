import { InventoryItem } from '../types';
import * as XLSX from 'xlsx';

// API Endpoint
const API_URL = process.env.REACT_APP_API_URL || 'http://37.148.212.133:3001/api';

// Excel dosyası oluştur
const createExcelFile = (inventoryItems: InventoryItem[]): File => {
  // Sadeleştirilmiş Excel verilerini hazırla
  const excelData = inventoryItems.map(item => ({
    'Barkod': item.barcode,
    'Ürün Adı': item.name,
    'Adet': item.count,
    'Sayan Kişi': item.countedBy
  }));
  
  // XLSX çalışma sayfası oluştur
  const worksheet = XLSX.utils.json_to_sheet(excelData);
  
  // Başlıkları Türkçe ve sıralı yap
  XLSX.utils.sheet_add_aoa(worksheet, [
    ['Barkod', 'Ürün Adı', 'Adet', 'Sayan Kişi']
  ], { origin: 'A1' });
  
  // Kolon genişliklerini ayarla
  const cols = [
    { wch: 15 },  // Barkod
    { wch: 30 },  // Ürün Adı
    { wch: 10 },  // Adet
    { wch: 20 }   // Sayan Kişi
  ];
  worksheet['!cols'] = cols;
  
  // Workbook oluştur
  const workbook = XLSX.utils.book_new();
  
  // Sayfayı ekle
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Stok Sayım');
  
  // Excel'i array buffer olarak al
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  
  // Array buffer'ı Blob ve sonra File'a çevir
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  // Excel dosya adı
  const date = new Date();
  const excelFileName = `Stok_Sayim_${date.getDate()}_${date.getMonth() + 1}_${date.getFullYear()}.xlsx`;
  
  // Blob'dan File oluştur
  return new File([blob], excelFileName, { type: blob.type });
};

// HTML email şablonu oluştur
const createEmailHTML = (inventoryItems: InventoryItem[], senderName: string): string => {
  // Toplam ürün sayısı ve toplam sayılan ürün adedi hesapla
  const totalItems = inventoryItems.length;
  const totalCount = inventoryItems.reduce((sum, item) => sum + item.count, 0);
  
  // Ürün listesini HTML tablosu olarak oluştur
  let itemsHtml = `
    <table style="width:100%; border-collapse: collapse; margin-bottom: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
      <thead>
        <tr style="background: #4A6BFF;">
          <th style="text-align: center; padding: 12px 10px; font-size: 14px; font-weight: 600; color: white; border: 1px solid #E1E8F5;">Barkod</th>
          <th style="text-align: left; padding: 12px 10px; font-size: 14px; font-weight: 600; color: white; border: 1px solid #E1E8F5;">Ürün Adı</th>
          <th style="text-align: center; padding: 12px 10px; font-size: 14px; font-weight: 600; color: white; border: 1px solid #E1E8F5;">Adet</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  // İlk 10 ürünü tabloya ekle
  const maxItems = Math.min(10, inventoryItems.length);
  for (let i = 0; i < maxItems; i++) {
    const item = inventoryItems[i];
    const rowColor = i % 2 === 1 ? '#E8EBF7' : '#FFFFFF';
    
    itemsHtml += `
      <tr style="background-color: ${rowColor};">
        <td style="text-align: center; padding: 10px; font-size: 14px; font-weight: 400; border: 1px solid #E1E8F5;">${item.barcode}</td>
        <td style="text-align: left; padding: 10px; font-size: 14px; border: 1px solid #E1E8F5;">${item.name}</td>
        <td style="text-align: center; padding: 10px; font-size: 14px; font-weight: 700; color: #2ECC71; border: 1px solid #E1E8F5;">${item.count}</td>
      </tr>
    `;
  }
  
  itemsHtml += `
      </tbody>
    </table>
  `;
  
  // Daha fazla ürün varsa mesaj ekle
  if (totalItems > 10) {
    itemsHtml += `<p style="font-style: italic; color: #7F8C8D; text-align: center; margin-bottom: 25px;">...ve ${totalItems - 10} ürün daha listelenmemiştir. Ekte gönderilen Excel dosyasında tüm ürünleri görebilirsiniz.</p>`;
  }
  
  // Rapor özeti HTML
  const summaryHtml = `
    <div style="background-color: #f8faff; border-left: 4px solid #4a6bff; padding: 20px; border-radius: 4px; margin-bottom: 30px;">
      <h2 style="margin-top: 0; color: #2c3e50; font-size: 20px; font-weight: 600;">Rapor Özeti</h2>
      <div style="display: flex; justify-content: space-between; gap: 15px;">
        <div style="text-align: center; padding: 15px 10px; background-color: white; border-radius: 6px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); flex: 1;">
          <p style="font-size: 14px; color: #7f8c8d; margin: 0 0 5px;">Toplam Ürün</p>
          <p style="font-size: 24px; color: #3498db; font-weight: 700; margin: 0;">${totalItems}</p>
        </div>
        <div style="text-align: center; padding: 15px 10px; background-color: white; border-radius: 6px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); flex: 1;">
          <p style="font-size: 14px; color: #7f8c8d; margin: 0 0 5px;">Toplam Adet</p>
          <p style="font-size: 24px; color: #2ecc71; font-weight: 700; margin: 0;">${totalCount}</p>
        </div>
      </div>
    </div>
  `;
  
  // Tam HTML şablonu
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Stok Sayım Raporu</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #444; background-color: #f5f5f5; margin: 0; padding: 0;">
      <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 3px 10px rgba(0,0,0,0.1);">
        <!-- HEADER -->
        <div style="background: linear-gradient(135deg, #4a6bff 0%, #2541b8 100%); padding: 30px; text-align: center; border-radius: 6px 6px 0 0;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">STOK SAYIM RAPORU</h1>
          <p style="color: #ffffff; opacity: 0.9; margin: 10px 0 0; font-size: 16px;">${new Date().toLocaleDateString('tr-TR')}</p>
        </div>
        
        <!-- CONTENT -->
        <div style="padding: 40px 30px; background-color: #ffffff;">
          <p style="font-size: 16px; margin-top: 0;">Sayın İlgili,</p>
          
          <p style="font-size: 16px; margin-bottom: 25px;">${senderName} tarafından gönderilen stok sayım raporu aşağıdadır. Bu raporda ${totalItems} farklı ürün için yapılan sayım bilgileri bulunmaktadır. Tüm detayları ekteki Excel dosyasında görebilirsiniz.</p>
          
          <!-- SUMMARY BOX -->
          ${summaryHtml}
          
          <!-- INVENTORY LIST -->
          <h2 style="margin: 0 0 15px; color: #2c3e50; font-size: 20px; font-weight: 600; border-bottom: 2px solid #eee; padding-bottom: 10px;">Sayım Listesi</h2>
          
          ${itemsHtml}
          
          <!-- FOOTER NOTE -->
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="margin-bottom: 5px;">Saygılarımla,</p>
            <p style="font-weight: 600; font-size: 16px; color: #2c3e50; margin-top: 0;">${senderName}</p>
          </div>
        </div>
        
        <!-- FOOTER -->
        <div style="background-color: #f8faff; padding: 20px; text-align: center; border-top: 1px solid #eee; font-size: 13px; color: #7f8c8d; border-radius: 0 0 6px 6px;">
          <p style="margin: 0;">Bu email otomatik olarak <span style="color: #4a6bff; font-weight: 600;">Taşdanlar Otomotiv V2</span> tarafından gönderilmiştir.</p>
          <p style="margin: 5px 0 0;">© ${new Date().getFullYear()} Tüm Hakları Saklıdır</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// API'nin çalışıp çalışmadığını kontrol et
export const checkApiStatus = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/test`);
    const data = await response.json();
    return !!data.message;
  } catch (error) {
    console.error('API erişim hatası:', error);
    return false;
  }
};

// Stok sayım raporunu email ile gönder
export const sendInventoryReport = async (
  inventoryItems: InventoryItem[],
  recipientEmail: string,
  senderName: string
): Promise<boolean> => {
  try {
    // API'nin çalışıp çalışmadığını kontrol et
    const isApiAvailable = await checkApiStatus();
    if (!isApiAvailable) {
      throw new Error('Mail API servisine erişilemiyor. Lütfen servisi başlattığınızdan emin olun.');
    }
    
    // Excel dosyasını oluştur
    const excelFile = createExcelFile(inventoryItems);
    
    // HTML içeriğini oluştur
    const htmlContent = createEmailHTML(inventoryItems, senderName);
    
    // FormData oluştur
    const formData = new FormData();
    formData.append('excelFile', excelFile);
    formData.append('recipientEmail', recipientEmail);
    formData.append('senderName', senderName);
    formData.append('subject', `Stok Sayım Raporu - ${new Date().toLocaleDateString('tr-TR')}`);
    formData.append('htmlContent', htmlContent);
    
    // API'ye istek gönder
    const response = await fetch(`${API_URL}/send-email`, {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Email gönderilirken bir hata oluştu');
    }
    
    return true;
  } catch (error) {
    console.error('Email gönderilirken hata oluştu:', error);
    return false;
  }
};

// Email servisini başlat
export const initEmailService = async (): Promise<void> => {
  // API'nin çalışıp çalışmadığını kontrol et
  const isApiAvailable = await checkApiStatus();
  if (!isApiAvailable) {
    console.warn('⚠️ Mail API servisi çalışmıyor! Lütfen server klasöründe "npm run dev" komutunu çalıştırın.');
  } else {
    console.log('✅ Mail API servisi bağlantısı başarılı.');
  }
}; 