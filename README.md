# 🚀 V2Son Stok Sayım Uygulaması

Modern, responsive ve kullanıcı dostu stok sayım uygulaması. React frontend, Node.js backend ve PostgreSQL veritabanı ile geliştirilmiştir.

## 📱 Özellikler

- ✅ **Barkod Tarama**: Kamera ile hızlı barkod okuma
- ✅ **Gerçek Zamanlı Sayım**: Anlık stok güncelleme
- ✅ **Kullanıcı Yönetimi**: Rol tabanlı erişim kontrolü
- ✅ **Excel Raporlama**: Detaylı raporlar ve dışa aktarma
- ✅ **Email Bildirimleri**: Otomatik rapor gönderimi
- ✅ **PostgreSQL Entegrasyonu**: Güvenli veri saklama
- ✅ **Responsive Tasarım**: Mobil ve desktop uyumlu
- ✅ **Docker Ready**: Kolay deployment

## 🏗️ Teknoloji Stack

### Frontend
- **React 19** + TypeScript
- **Material-UI (MUI)** - Modern UI bileşenleri
- **React Router** - Sayfa yönlendirme
- **ZXing** - Barkod tarama
- **Axios** - HTTP istekleri

### Backend
- **Node.js** + Express
- **PostgreSQL** - Ana veritabanı
- **MSSQL** - ERP entegrasyonu
- **Nodemailer** - Email gönderimi
- **Multer** - Dosya upload
- **XLSX** - Excel işlemleri

### DevOps
- **Docker** + Docker Compose
- **GitHub Actions** - CI/CD
- **Nginx** - Reverse proxy
- **Let's Encrypt** - SSL sertifikası

## 🚀 Hızlı Başlangıç

### Development (Local)

```bash
# Repository'yi clone edin
git clone https://github.com/erentasdann/v2son.git
cd v2son

# Docker ile başlatın
docker-compose up -d

# Veya manuel kurulum:
# Backend
cd backend && npm install && npm start

# Frontend  
cd frontend && npm install && npm start
```

**Erişim:** http://localhost:8080

### Production Deployment

```bash
# Sunucuda Docker kurulumu
curl -fsSL https://get.docker.com | sh

# Proje dosyalarını indirin
git clone https://github.com/erentasdann/v2son.git
cd v2son

# Production'da başlatın
docker-compose -f docker-compose.prod.yml --env-file production.env up -d
```

**Detaylı kurulum:** [SUNUCU-KURULUM.md](SUNUCU-KURULUM.md)

## 📋 Kurulum Rehberleri

- 🐳 **[Docker Kurulumu](README-DOCKER.md)** - Tam Docker rehberi
- 🖥️ **[Sunucu Kurulumu](SUNUCU-KURULUM.md)** - Production deployment
- 🔧 **[Deployment Guide](DEPLOYMENT-GUIDE.md)** - CI/CD ve otomatik deployment

## 👤 Varsayılan Kullanıcılar

**Development:**
- Admin: `admin` / `admin`
- Test: `test` / `test`

**Production:** Kendi PostgreSQL kullanıcılarınız

## 🌐 Demo

- **Frontend:** http://localhost:8080
- **Backend API:** http://localhost:3001
- **API Docs:** http://localhost:3001/api/test

## 📊 API Endpoints

### Kimlik Doğrulama
- `POST /api/login` - Kullanıcı girişi
- `GET /api/users` - Kullanıcı listesi

### Ürün Yönetimi
- `GET /api/products` - Tüm ürünler
- `GET /api/products/:barcode` - Barkod ile ürün arama
- `GET /api/stock-query/:barcode` - ERP'den stok sorgulama

### Raporlama
- `POST /api/send-email` - Excel raporu email gönderimi
- `POST /api/upload-count-list` - Sayım listesi yükleme

## 🔧 Konfigürasyon

### Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=your-username
DB_PASSWORD=your-password
DB_NAME=postgres

# Docker Hub
DOCKER_HUB_USERNAME=erentasdann

# Email (Gmail)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
```

### PostgreSQL Veritabanı

```sql
-- Kullanıcılar tablosu
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ürünler tablosu
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    barcode VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔄 CI/CD Pipeline

Projede GitHub Actions ile otomatik deployment kurulu:

1. **Code Push** → GitHub
2. **Auto Build** → Docker Images
3. **Push to Registry** → Docker Hub
4. **Deploy** → Production Server
5. **Health Check** → Validation

**Workflow:** `.github/workflows/deploy.yml`

## 📦 Docker Images

- **Backend:** `erentasdann/v2son-backend:latest`
- **Frontend:** `erentasdann/v2son-frontend:latest`

## 🛠️ Development

### Gereksinimler
- Node.js 18+
- PostgreSQL 12+
- Docker & Docker Compose
- Git

### Local Development
```bash
# Dependencies
npm install

# Development server
npm run dev

# Build production
npm run build

# Tests
npm test
```

## 🚨 Troubleshooting

### Yaygın Sorunlar

1. **Port çakışması:**
   ```bash
   # Farklı port kullanın
   docker-compose -p v2son up -d
   ```

2. **Database bağlantı sorunu:**
   ```bash
   # PostgreSQL durumunu kontrol edin
   docker-compose logs postgres
   ```

3. **Image güncellenmiyor:**
   ```bash
   # Cache'i temizleyin
   docker-compose build --no-cache
   ```

## 📈 Performance

- **Frontend:** ~87MB (Nginx optimized)
- **Backend:** ~410MB (Node.js Alpine)
- **Startup Time:** ~30 saniye
- **Memory Usage:** ~512MB total

## 🔒 Güvenlik

- ✅ Environment variables ile hassas bilgiler
- ✅ CORS koruması
- ✅ Input validation
- ✅ SQL injection koruması
- ✅ Rate limiting (önerilen)
- ✅ HTTPS support (Let's Encrypt)

## 📞 Destek

### Loglar
```bash
# Tüm servisler
docker-compose logs -f

# Sadece backend
docker-compose logs -f backend

# Sadece frontend
docker-compose logs -f frontend
```

### Debugging
```bash
# Container'a bağlan
docker exec -it v2son_backend sh

# Database'e bağlan
docker exec -it v2son_postgres psql -U tasdaneren -d postgres
```

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 📝 Changelog

### v1.0.0 (2025-01-27)
- ✅ İlk release
- ✅ Docker support
- ✅ CI/CD pipeline
- ✅ Production ready

---

**⭐ Eğer bu proje size yardımcı olduysa, lütfen yıldız verin!**

**🚀 Production'a geçmeye hazır!**