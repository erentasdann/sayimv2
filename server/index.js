const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { Pool } = require('pg');
const sql = require('mssql');

const pool = new Pool({
  user: 'tasdaneren',         // Kendi oluşturduğun kullanıcı adı
  host: 'localhost',
  database: 'postgres',       // Oluşturduğun veritabanı adı
  password: '41Tasdan41', // Kendi belirlediğin şifre
  port: 5432,               // Varsayılan port
});

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

// Kullanıcı girişi endpoint'i (PostgreSQL)
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Kullanıcı adı ve şifre gereklidir.' });
  }
  try {
    const result = await pool.query(
      'SELECT id, username, name, role FROM users WHERE username = $1 AND password = $2',
      [username, password]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Kullanıcı adı veya şifre hatalı.' });
    }
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Sunucu hatası.' });
  }
});

// Kullanıcı listesini dönen endpoint
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT username, name FROM users ORDER BY username');
    res.json({ success: true, users: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Kullanıcılar alınamadı.' });
  }
});

// Excel ile sayım listesi yükleme endpoint'i
app.post('/api/upload-count-list', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Dosya yok' });
    }
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Başlıklar kontrolü
    if (!data[0] || !data[0].includes('Ürün Kodu') || !data[0].includes('Ürün Adı')) {
      return res.status(400).json({ success: false, message: 'Başlıklar eksik' });
    }

    // Sadece ürün kodlarını al
    const productCodes = data.slice(1).map(row => row[0]).filter(Boolean);

    res.json({ success: true, productCodes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
});

// Muhasebe veritabanı bağlantı ayarları (KENDİ BİLGİLERİNİZLE DOLDURUN)
const accountingDbConfig = {
  user: 'tasdaneren', // <-- BURAYA KENDİ KULLANICINIZI YAZIN
  password: '41Tasdan41', // <-- BURAYA KENDİ ŞİFRENİZİ YAZIN
  server: '100.84.101.54', // örn: '192.168.1.10'
  database: 'MikroDB_V16_001_2019', // <-- BURAYA MUHASEBE DB ADINI YAZIN
  options: {
    encrypt: false, // true ise SSL kullanılır, genelde local için false
    trustServerCertificate: true
  }
};

// Muhasebe ürünlerini çekip PostgreSQL'e ekleyen endpoint
app.get('/api/import-products-from-accounting', async (req, res) => {
  try {
    // MSSQL'e bağlan
    await sql.connect(accountingDbConfig);
    // Kullanıcının verdiği sorgu ile ürünleri çek
    const result = await sql.query(`
      SELECT 
        s.msg_S_0001 AS UrunKodu,
        s.msg_S_0002 AS UrunAdi,
        ISNULL(SUM(
          CASE 
            WHEN h.sth_tip = 0 THEN h.sth_miktar   -- Giriş
            WHEN h.sth_tip = 1 THEN -h.sth_miktar  -- Çıkış
            ELSE 0
          END
        ), 0) AS Adet
      FROM [MikroDB_V16_001_2019].[dbo].[STOKLAR_CHOOSE_11] s
      LEFT JOIN [MikroDB_V16_001_2019].[dbo].[STOK_HAREKETLERI] h
        ON s.msg_S_0001 = h.sth_stok_kod
      GROUP BY s.msg_S_0001, s.msg_S_0002
    `);

    // Her ürünü PostgreSQL'e ekle (code alanı UNIQUE olmalı)
    for (const row of result.recordset) {
      await pool.query(
        'INSERT INTO products (barcode, name) VALUES ($1, $2) ON CONFLICT (barcode) DO NOTHING',
        [row.UrunKodu, row.UrunAdi]
      );
    }

    res.json({ success: true, count: result.recordset.length });
  } catch (err) {
    console.error('Muhasebe ürünleri aktarılırken hata:', err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    sql.close();
  }
});

// Barkod ile ürün adı getiren endpoint
app.get('/api/products/:barcode', async (req, res) => {
  const { barcode } = req.params;
  // Barkodu normalize et: barkodda tire varsa ilk tireden sonrasını alacak şekilde güncelle
  const normalizeBarcode = (code) => {
    let b = code.trim();
    if (b.includes('-')) b = b.split('-').slice(1).join('-');
    b = b.replace(/^0+/, '');
    return b;
  };
  const normalized = normalizeBarcode(barcode);
  try {
    // 1. Tam eşleşme
    let result = await pool.query('SELECT * FROM products WHERE barcode = $1 LIMIT 1', [barcode]);
    if (result.rows.length > 0) {
      const product = result.rows[0];
      product.id = String(product.id);
      return res.json({ success: true, product });
    }
    // 2. Normalize edilmiş barkod ile eşleşme
    if (normalized !== barcode) {
      let result2 = await pool.query('SELECT * FROM products WHERE barcode = $1 LIMIT 1', [normalized]);
      if (result2.rows.length > 0) {
        const product = result2.rows[0];
        product.id = String(product.id);
        return res.json({ success: true, product });
      }
    }
    // 3. Tüm barkodları çekip normalize ederek karşılaştır
    const allProducts = await pool.query('SELECT * FROM products');
    for (const row of allProducts.rows) {
      const dbNormalized = normalizeBarcode(row.barcode);
      if (dbNormalized === normalized) {
        row.id = String(row.id);
        return res.json({ success: true, product: row });
      }
    }
    return res.status(404).json({ success: false, message: 'Ürün bulunamadı' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Barkod normalize fonksiyonu (frontend ile birebir aynı mantık)
function normalizeBarcode(code) {
  if (!code) return '';
  let b = code.trim();
  // Başındaki harfli prefixleri (örn. MKO-, MAG-) kaldır
  b = b.replace(/^[A-Za-z\-]+/, '');
  // Sadece rakamları al
  b = b.replace(/\D/g, '');
  // Sonu 99 veya 00099 ise bu ekleri at
  if (b.endsWith('00099')) b = b.slice(0, -5);
  else if (b.endsWith('99')) b = b.slice(0, -2);
  // Baştaki sıfırları at
  b = b.replace(/^0+/, '');
  return b;
}

// ERP SQL'den stok sorgulama endpoint'i
app.get('/api/stock-query/:barcode', async (req, res) => {
  const { barcode } = req.params;
  const normalized = normalizeBarcode(barcode);
  try {
    await sql.connect(accountingDbConfig);
    // MSSQL'de normalize edilmiş barkod ile sorgula
    const result = await sql.query`
      SELECT TOP 1
        s.msg_S_0002 AS UrunAdi,
        ISNULL(SUM(
          CASE 
            WHEN h.sth_tip = 0 THEN h.sth_miktar   -- Giriş
            WHEN h.sth_tip = 1 THEN -h.sth_miktar  -- Çıkış
            ELSE 0
          END
        ), 0) AS StokMiktari
      FROM [MikroDB_V16_001_2019].[dbo].[STOKLAR_CHOOSE_11] s
      LEFT JOIN [MikroDB_V16_001_2019].[dbo].[STOK_HAREKETLERI] h
        ON s.msg_S_0001 = h.sth_stok_kod
      WHERE 
        TRY_CAST(
          -- SQL'de de aynı normalize işlemi
          CASE 
            WHEN RIGHT(REPLACE(REPLACE(REPLACE(REPLACE(s.msg_S_0001, '-', ''), 'MKO', ''), 'MAG', ''), 'mag', ''), 5) = '00099'
              THEN LEFT(REPLACE(REPLACE(REPLACE(REPLACE(s.msg_S_0001, '-', ''), 'MKO', ''), 'MAG', ''), 'mag', ''), LEN(REPLACE(REPLACE(REPLACE(REPLACE(s.msg_S_0001, '-', ''), 'MKO', ''), 'MAG', ''), 'mag', '')) - 5)
            WHEN RIGHT(REPLACE(REPLACE(REPLACE(REPLACE(s.msg_S_0001, '-', ''), 'MKO', ''), 'MAG', ''), 'mag', ''), 2) = '99'
              THEN LEFT(REPLACE(REPLACE(REPLACE(REPLACE(s.msg_S_0001, '-', ''), 'MKO', ''), 'MAG', ''), 'mag', ''), LEN(REPLACE(REPLACE(REPLACE(REPLACE(s.msg_S_0001, '-', ''), 'MKO', ''), 'MAG', ''), 'mag', '')) - 2)
            ELSE REPLACE(REPLACE(REPLACE(REPLACE(s.msg_S_0001, '-', ''), 'MKO', ''), 'MAG', ''), 'mag', '')
          END AS bigint
        ) = TRY_CAST(${normalized} AS bigint)
      GROUP BY s.msg_S_0002
    `;
    if (result.recordset.length > 0) {
      const urun = result.recordset[0];
      return res.json({ name: urun.UrunAdi, stock: urun.StokMiktari });
    } else {
      return res.status(404).json({ name: 'Ürün bulunamadı', stock: 0 });
    }
  } catch (err) {
    console.error('Stok sorgulama hatası:', err);
    return res.status(500).json({ name: 'Hata', stock: 0, error: err.message });
  } finally {
    sql.close();
  }
});

// Server'ı başlat
app.listen(port, () => {
  console.log(`Mail API servisi http://localhost:${port} adresinde çalışıyor`);
}); 