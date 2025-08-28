import axios from 'axios';

export interface DeliveryProduct {
  id: string;
  productCode: string;
  productName: string;
  expectedQuantity: number;
  countedQuantity: number;
  difference: number;
  status: 'match' | 'shortage' | 'excess';
}

export interface DeliveryNote {
  deliveryNumber: string;
  date: string;
  supplier: string;
  products: DeliveryProduct[];
}

class DeliveryNoteService {
  private baseURL = '/api';

  /**
   * İrsaliye dosyasını yükler ve parse eder
   */
  async uploadDeliveryNote(file: File): Promise<DeliveryNote> {
    try {
      const formData = new FormData();
      formData.append('deliveryNote', file);

      const url = `${this.baseURL}/delivery-notes/upload`;
      console.log('İstek gönderiliyor:', url);
      
      const response = await axios.post<DeliveryNote>(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('İrsaliye dosyası yüklenirken hata oluştu');
    }
  }

  /**
   * İrsaliye karşılaştırma raporu oluşturur
   */
  generateComparisonReport(deliveryNote: DeliveryNote): {
    totalProducts: number;
    matchingProducts: number;
    shortageProducts: number;
    excessProducts: number;
    shortageCount: number;
    excessCount: number;
  } {
    const totalProducts = deliveryNote.products.length;
    const matchingProducts = deliveryNote.products.filter(p => p.status === 'match').length;
    const shortageProducts = deliveryNote.products.filter(p => p.status === 'shortage').length;
    const excessProducts = deliveryNote.products.filter(p => p.status === 'excess').length;
    
    const shortageCount = deliveryNote.products
      .filter(p => p.status === 'shortage')
      .reduce((sum, p) => sum + Math.abs(p.difference), 0);
    
    const excessCount = deliveryNote.products
      .filter(p => p.status === 'excess')
      .reduce((sum, p) => sum + p.difference, 0);

    return {
      totalProducts,
      matchingProducts,
      shortageProducts,
      excessProducts,
      shortageCount,
      excessCount,
    };
  }

  /**
   * Ürün miktarını günceller ve durumunu hesaplar
   */
  updateProductQuantity(
    deliveryNote: DeliveryNote, 
    productId: string, 
    newQuantity: number
  ): DeliveryNote {
    const updatedProducts = deliveryNote.products.map(product => {
      if (product.id === productId) {
        const difference = newQuantity - product.expectedQuantity;
        let status: 'match' | 'shortage' | 'excess' = 'match';
        
        if (difference < 0) status = 'shortage';
        else if (difference > 0) status = 'excess';

        return {
          ...product,
          countedQuantity: newQuantity,
          difference,
          status
        };
      }
      return product;
    });

    return {
      ...deliveryNote,
      products: updatedProducts
    };
  }

  /**
   * Eksik ürünleri getirir
   */
  getShortageProducts(deliveryNote: DeliveryNote): DeliveryProduct[] {
    return deliveryNote.products.filter(p => p.status === 'shortage');
  }

  /**
   * Fazla ürünleri getirir
   */
  getExcessProducts(deliveryNote: DeliveryNote): DeliveryProduct[] {
    return deliveryNote.products.filter(p => p.status === 'excess');
  }

  /**
   * Eşleşen ürünleri getirir
   */
  getMatchingProducts(deliveryNote: DeliveryNote): DeliveryProduct[] {
    return deliveryNote.products.filter(p => p.status === 'match');
  }

  /**
   * İrsaliye verilerini CSV formatında export eder
   */
  exportToCSV(deliveryNote: DeliveryNote): string {
    const headers = [
      'Ürün Kodu',
      'Ürün Adı', 
      'Beklenen Adet',
      'Sayılan Adet',
      'Fark',
      'Durum'
    ];

    const statusText = {
      match: 'Eşleşiyor',
      shortage: 'Eksik', 
      excess: 'Fazla'
    };

    const rows = deliveryNote.products.map(product => [
      product.productCode,
      product.productName,
      product.expectedQuantity.toString(),
      product.countedQuantity.toString(),
      product.difference.toString(),
      statusText[product.status]
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }

  /**
   * CSV dosyasını indirir
   */
  downloadCSV(deliveryNote: DeliveryNote, filename?: string): void {
    const csvContent = this.exportToCSV(deliveryNote);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename || `irsaliye-karsilastirma-${deliveryNote.deliveryNumber}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}

export default new DeliveryNoteService();
