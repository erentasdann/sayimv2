# V2Son Stok Sayım Uygulaması - Docker Kurulum Rehberi

Bu rehber, V2Son stok sayım uygulamasını Docker Desktop kullanarak nasıl çalıştıracağınızı adım adım açıklar.

## 📋 Önkoşullar

### 1. Docker Desktop Kurulumu

#### MacOS için:
1. [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/) linkinden indirin
2. İndirilen `.dmg` dosyasını çalıştırın
3. Docker'ı Applications klasörüne sürükleyin
4. Docker Desktop'ı başlatın

#### Windows için:
1. [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/) linkinden indirin
2. WSL 2 etkin olduğundan emin olun
3. İndirilen kurulum dosyasını çalıştırın
4. Docker Desktop'ı başlatın

#### Linux için:
1. [Docker Engine kurulum rehberini](https://docs.docker.com/engine/install/) takip edin
2. Docker Compose'u ayrıca kurun

### 2. Sistem Gereksinimleri
- **RAM**: En az 4GB (önerilen 8GB)
- **Disk**: En az 10GB boş alan
- **İşletim Sistemi**: macOS 10.15+, Windows 10/11, Linux (Ubuntu 18.04+)

## 🚀 Kurulum ve Çalıştırma

### Adım 1: Proje Klasörüne Gidin
```bash
cd /Users/tasdaneren/Desktop/v2son
```

### Adım 2: Docker Container'ları Build Edin ve Başlatın
```bash
# Tüm servisleri build edip başlat
docker-compose up --build -d

# Veya ayrı ayrı:
# docker-compose build
# docker-compose up -d
```

### Adım 3: Servislerin Durumunu Kontrol Edin
```bash
# Çalışan container'ları görüntüle
docker-compose ps

# Logları takip et
docker-compose logs -f
```

### Adım 4: Uygulamaya Erişin
- **Frontend**: http://localhost:8080 (Port 8080)
- **Backend API**: http://localhost:3001
- **PostgreSQL**: localhost:5432

## 🔧 Önemli Konfigürasyon Notları

### 1. Veritabanı Bağlantısı
Uygulama otomatik olarak PostgreSQL container'ına bağlanacak. Eğer harici bir veritabanı kullanmak istiyorsanız:

1. `docker-compose.yml` dosyasındaki environment değişkenlerini güncelleyin:
```yaml
environment:
  - DB_HOST=your_external_db_host
  - DB_PORT=5432
  - DB_USER=your_username
  - DB_PASSWORD=your_password
  - DB_NAME=your_database
```

### 2. MSSQL Bağlantısı (ERP Entegrasyonu)
Backend kodundaki MSSQL bağlantı ayarları Docker container'ından erişilebilir olmalı:

1. `backend/index.js` dosyasında `accountingDbConfig` section'ını kontrol edin
2. MSSQL server'ınızın Docker network'ünden erişilebilir olduğundan emin olun

### 3. Email Konfigürasyonu
Gmail SMTP ayarları backend container'ında çalışacak. Kendi email ayarlarınızı kullanmak için:

1. `backend/index.js` dosyasındaki transporter konfigürasyonunu güncelleyin
2. Container'ı yeniden build edin

## 🎯 Varsayılan Kullanıcı Bilgileri

Uygulama ilk çalıştırıldığında şu kullanıcılar otomatik oluşturulur:

- **Admin**: 
  - Kullanıcı adı: `admin`
  - Şifre: `admin`
  
- **Test Kullanıcı**:
  - Kullanıcı adı: `test`
  - Şifre: `test`

## 🛠️ Geliştirme ve Debugging

### Container'ları Yeniden Başlatma
```bash
# Tüm servisleri durdur
docker-compose down

# Yeniden başlat
docker-compose up -d
```

### Logları İzleme
```bash
# Tüm servislerin logları
docker-compose logs -f

# Sadece backend logları
docker-compose logs -f backend

# Sadece frontend logları  
docker-compose logs -f frontend
```

### Container İçine Erişim
```bash
# Backend container'ına bağlan
docker-compose exec backend sh

# PostgreSQL container'ına bağlan
docker-compose exec postgres psql -U tasdaneren -d postgres
```

### Veritabanı Yedekleme
```bash
# PostgreSQL dump al
docker-compose exec postgres pg_dump -U tasdaneren postgres > backup.sql

# Dump'ı geri yükle
docker-compose exec -T postgres psql -U tasdaneren postgres < backup.sql
```

## 🔧 Sorun Giderme

### 1. Port Çakışması
Eğer 80, 3001 veya 5432 portları kullanılıyorsa:

1. `docker-compose.yml` dosyasında port mapping'leri değiştirin:
```yaml
ports:
  - "8080:80"  # Frontend için
  - "3002:3001"  # Backend için
  - "5433:5432"  # PostgreSQL için
```

### 2. Container Build Sorunları
```bash
# Cache'i temizleyip yeniden build et
docker-compose build --no-cache

# Dangling image'ları temizle
docker system prune
```

### 3. Volume Sorunları
```bash
# Volume'ları yeniden oluştur
docker-compose down -v
docker-compose up -d
```

### 4. Network Sorunları
```bash
# Network'ü yeniden oluştur
docker-compose down
docker network prune
docker-compose up -d
```

## 🚪 Uygulamayı Durdurma

### Geçici Durdurma
```bash
docker-compose stop
```

### Tamamen Kaldırma (veriler korunur)
```bash
docker-compose down
```

### Verilerle Birlikte Tamamen Kaldırma
```bash
docker-compose down -v
```

## 📊 Performance İzleme

### Kaynak Kullanımını İzleme
```bash
# Container'ların kaynak kullanımı
docker stats

# Disk kullanımı
docker system df
```

## 🔐 Güvenlik Notları

1. **Üretim Ortamı**: Varsayılan şifreleri mutlaka değiştirin
2. **SSL**: Üretimde HTTPS kullanın
3. **Firewall**: Gerekli portları dışarıya açmayın
4. **Backup**: Düzenli veritabanı yedeklemeleri alın

## 📞 Destek

Sorun yaşadığınızda:
1. Önce logları kontrol edin: `docker-compose logs -f`
2. Container durumlarını kontrol edin: `docker-compose ps`
3. Bu rehberdeki sorun giderme adımlarını deneyin

---

**Not**: Bu Docker kurulumu tam olarak çalışan bir üretim ortamı sağlar. Geliştirme sırasında kod değişikliklerini görmek için volume mounting ekleyebilirsiniz.
