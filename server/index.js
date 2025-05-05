const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Geçici dosya depolama için multer ayarları
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, 'uploads');
    
    // Uploads klasörü yoksa oluştur
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
    }
    
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, 'StokSayim_' + Date.now() + '.xlsx');
  }
});

const upload = multer({ storage: storage });

// Gmail için SMTP transporter konfigürasyonu
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'e.tasdanclub@gmail.com', // Gmail adresiniz
    pass: 'slgx qgqn lhpk cyek'     // Gmail şifreniz veya App Password
  }
});

// Renk sabitleri
const COLORS = {
  PRIMARY: '4A6BFF',       // Mavi
  SECONDARY: 'E8EBF7',     // Açık Mavi
  ACCENT: '2ECC71',        // Yeşil
  BORDER: 'E1E8F5',        // Açık Gri
  TEXT_DARK: '2C3E50',     // Koyu Gri
  TEXT_LIGHT: '7F8C8D',    // Açık Gri
  WHITE: 'FFFFFF'          // Beyaz
};

// Test API endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Mail servisi çalışıyor' });
});

// Mail gönderme API endpoint'i
app.post('/api/send-email', upload.single('excelFile'), async (req, res) => {
  try {
    const { recipientEmail, senderName, subject, htmlContent } = req.body;
    
    // Request kontrol
    if (!recipientEmail || !htmlContent) {
      return res.status(400).json({ success: false, message: 'Eksik parametreler: recipientEmail ve htmlContent gereklidir' });
    }
    
    // Dosya tam yolu ve adı
    let excelFilePath = null;
    let excelFileName = null;
    
    // Eğer dosya yüklendiyse, Excel'i iyileştirmek için işle
    if (req.file) {
      excelFilePath = req.file.path;
      excelFileName = req.file.filename;
      
      try {
        // Excel dosyasını oku
        const workbook = XLSX.readFile(excelFilePath);
        
        // Stil fonksiyonlarını tanımla
        const applyHeaderStyle = (worksheet, cellRef) => {
          if (worksheet[cellRef]) {
            worksheet[cellRef].s = {
              font: { bold: true, color: { rgb: COLORS.WHITE } },
              fill: { patternType: 'solid', fgColor: { rgb: COLORS.PRIMARY } },
              alignment: { horizontal: 'center', vertical: 'center' },
              border: {
                top: { style: 'thin', color: { rgb: COLORS.BORDER } },
                bottom: { style: 'thin', color: { rgb: COLORS.BORDER } },
                left: { style: 'thin', color: { rgb: COLORS.BORDER } },
                right: { style: 'thin', color: { rgb: COLORS.BORDER } }
              }
            };
          }
        };
        
        const applyZebraStyle = (worksheet, cellRef, rowIndex, isAltRow) => {
          if (worksheet[cellRef]) {
            worksheet[cellRef].s = {
              fill: { patternType: 'solid', fgColor: { rgb: isAltRow ? COLORS.SECONDARY : COLORS.WHITE } },
              border: {
                top: { style: 'thin', color: { rgb: COLORS.BORDER } },
                bottom: { style: 'thin', color: { rgb: COLORS.BORDER } },
                left: { style: 'thin', color: { rgb: COLORS.BORDER } },
                right: { style: 'thin', color: { rgb: COLORS.BORDER } }
              }
            };
          }
        };
        
        // "Stok Sayım Formu" sayfasını iyileştir
        if (workbook.Sheets['Stok Sayım Formu']) {
          const worksheet = workbook.Sheets['Stok Sayım Formu'];
          
          // Form başlığı stilini uygula
          if (worksheet['A1']) {
            worksheet['A1'].s = {
              font: { bold: true, sz: 14, color: { rgb: COLORS.WHITE } },
              fill: { patternType: 'solid', fgColor: { rgb: COLORS.PRIMARY } },
              alignment: { horizontal: 'center', vertical: 'center' }
            };
          }
          
          // Tablo başlıkları stilini uygula (3. satır)
          for (let i = 0; i < 8; i++) {
            const colLetter = String.fromCharCode(65 + i); // A, B, C...
            applyHeaderStyle(worksheet, `${colLetter}3`);
          }
          
          // Veri satırlarını işle
          const range = XLSX.utils.decode_range(worksheet['!ref']);
          for (let row = 4; row <= range.e.r; row++) { // 4. satırdan itibaren (başlıktan sonra)
            const isAltRow = (row - 4) % 2 === 1; // Alternatif satır kontrolü
            
            for (let col = 0; col <= 7; col++) {
              const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
              let cellStyle = {};
              
              // Temel zebra stili
              applyZebraStyle(worksheet, cellRef, row, isAltRow);
              
              // Özel sütun stilleri
              if (worksheet[cellRef]) {
                if (col === 1) { // Ürün Kodu (B sütunu)
                  worksheet[cellRef].s = {
                    ...worksheet[cellRef].s,
                    font: { bold: true, color: { rgb: COLORS.PRIMARY } },
                    alignment: { horizontal: 'center' }
                  };
                } else if (col === 3) { // Adet (D sütunu)
                  worksheet[cellRef].s = {
                    ...worksheet[cellRef].s,
                    font: { bold: true, color: { rgb: COLORS.ACCENT } },
                    alignment: { horizontal: 'center' }
                  };
                } else if (col === 6) { // Sayım Tarihi (G sütunu)
                  worksheet[cellRef].s = {
                    ...worksheet[cellRef].s,
                    font: { color: { rgb: COLORS.TEXT_LIGHT } },
                    alignment: { horizontal: 'center' }
                  };
                }
              }
            }
          }
        }
        
        // Özet sayfasını iyileştir
        if (workbook.Sheets['Özet']) {
          const summaryWs = workbook.Sheets['Özet'];
          
          // Başlık stilini uygula
          if (summaryWs['A1']) {
            summaryWs['A1'].s = {
              font: { bold: true, sz: 16, color: { rgb: COLORS.PRIMARY } },
              alignment: { horizontal: 'center' }
            };
          }
          
          // Özet Başlığını uygula
          if (summaryWs['A6']) {
            summaryWs['A6'].s = {
              font: { bold: true, color: { rgb: COLORS.PRIMARY } },
              border: { bottom: { style: 'thin', color: { rgb: COLORS.PRIMARY } } }
            };
          }
          
          // Değer stilleri
          ['B7', 'B8', 'B9'].forEach(cell => {
            if (summaryWs[cell]) {
              summaryWs[cell].s = {
                font: { bold: true, color: { rgb: COLORS.ACCENT } }
              };
            }
          });
        }
        
        // "Veri" sayfasını iyileştir
        if (workbook.Sheets['Veri']) {
          const dataWs = workbook.Sheets['Veri'];
          
          // Başlık satırı stilini uygula
          const colNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
          colNames.forEach(col => {
            applyHeaderStyle(dataWs, `${col}1`);
          });
          
          // Veri satırlarını işle
          const range = XLSX.utils.decode_range(dataWs['!ref']);
          for (let row = 2; row <= range.e.r; row++) { // 2. satırdan itibaren (başlıktan sonra)
            const isAltRow = (row - 2) % 2 === 1; // Alternatif satır kontrolü
            
            for (let col = 0; col <= 7; col++) {
              const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
              
              // Temel zebra stili
              applyZebraStyle(dataWs, cellRef, row, isAltRow);
              
              // Özel sütun stilleri 
              if (dataWs[cellRef]) {
                if (col === 1) { // Ürün Kodu (B sütunu)
                  dataWs[cellRef].s = {
                    ...dataWs[cellRef].s,
                    font: { color: { rgb: COLORS.PRIMARY } },
                    alignment: { horizontal: 'center' }
                  };
                } else if (col === 3) { // Adet (D sütunu)
                  dataWs[cellRef].s = {
                    ...dataWs[cellRef].s,
                    font: { color: { rgb: COLORS.ACCENT } },
                    alignment: { horizontal: 'center' }
                  };
                }
              }
            }
          }
        }
        
        // İyileştirilen Excel'i kaydet
        XLSX.writeFile(workbook, excelFilePath);
        
      } catch (excelError) {
        console.error('Excel dosyası işlenirken hata:', excelError);
        // Hata olursa orijinal dosyayı kullan
      }
    }
    
    // Mail seçenekleri
    const mailOptions = {
      from: `"Stok Sayım Uygulaması" <${transporter.options.auth.user}>`,
      to: recipientEmail,
      subject: subject || `Stok Sayım Raporu - ${new Date().toLocaleDateString('tr-TR')}`,
      html: htmlContent,
      attachments: []
    };
    
    // Eğer dosya yüklenmişse, eki ekle
    if (excelFilePath) {
      mailOptions.attachments.push({
        filename: excelFileName,
        path: excelFilePath
      });
    }
    
    // Mail gönder
    await transporter.sendMail(mailOptions);
    
    // Yüklenen dosyayı temizle
    if (excelFilePath && fs.existsSync(excelFilePath)) {
      fs.unlinkSync(excelFilePath);
    }
    
    res.json({ success: true, message: 'Email başarıyla gönderildi' });
  } catch (error) {
    console.error('Email gönderilirken hata oluştu:', error);
    res.status(500).json({ success: false, message: 'Email gönderilirken hata oluştu', error: error.toString() });
  }
});

// Server'ı başlat
app.listen(port, () => {
  console.log(`Mail API servisi http://localhost:${port} adresinde çalışıyor`);
}); 