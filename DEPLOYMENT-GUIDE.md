# 🚀 V2Son Production Deployment Rehberi

Bu rehber V2Son uygulamasını production sunucusuna deploy etmek için hazırlanmıştır.

## 📋 Öngereksinimler

### Sunucuda Olması Gerekenler:
- ✅ Docker (20.10+)
- ✅ Docker Compose (2.0+)
- ✅ PostgreSQL (veritabanı için)
- ✅ Internet bağlantısı

### Local'de Olması Gerekenler:
- ✅ Docker Hub hesabı
- ✅ Git repository (GitHub/GitLab)

## 🔧 Adım 1: Docker Hub Hesabı Oluşturma

1. https://hub.docker.com adresine gidin
2. Hesap oluşturun veya giriş yapın
3. **Settings > Security > New Access Token** ile token oluşturun
4. Token'ı güvenli bir yerde saklayın

## 🚀 Adım 2: Image'ları Build ve Push Etme

### Manuel Deployment:
```bash
# 1. Docker Hub'a login
echo "YOUR_DOCKER_TOKEN" | docker login -u YOUR_USERNAME --password-stdin

# 2. Environment variable set et
export DOCKER_HUB_USERNAME=YOUR_USERNAME
export DOCKER_HUB_TOKEN=YOUR_TOKEN

# 3. Deployment script'ini çalıştır
./deploy-to-server.sh
```

### Otomatik Deployment (GitHub Actions):
1. GitHub repository'nizde **Settings > Secrets** kısmına gidin
2. Şu secret'ları ekleyin:
   - `DOCKER_HUB_USERNAME`: Docker Hub kullanıcı adınız
   - `DOCKER_HUB_TOKEN`: Docker Hub token'ınız
   - `SERVER_HOST`: Sunucu IP adresi
   - `SERVER_USER`: Sunucu kullanıcı adı
   - `SERVER_SSH_KEY`: SSH private key

3. Kod push ettiğinizde otomatik deploy olacak

## 🖥️ Adım 3: Sunucuda Kurulum

### 3.1 Sunucuya Bağlanma:
```bash
ssh user@your-server-ip
```

### 3.2 Docker Kurulumu (Ubuntu/Debian):
```bash
# Docker kurulumu
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Docker Compose kurulumu
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 3.3 Proje Klasörü Oluşturma:
```bash
sudo mkdir -p /opt/v2son
cd /opt/v2son
sudo chown $USER:$USER /opt/v2son
```

### 3.4 Konfigürasyon Dosyalarını İndirme:
```bash
# Docker Compose dosyası
wget https://raw.githubusercontent.com/your-username/v2son/main/docker-compose.prod.yml

# Environment dosyası
wget https://raw.githubusercontent.com/your-username/v2son/main/production.env
```

### 3.5 Environment Konfigürasyonu:
```bash
nano production.env
```

Şu değerleri sunucunuza göre güncelleyin:
```env
DOCKER_HUB_USERNAME=your-username
DB_HOST=localhost
DB_PORT=5432
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=postgres
```

## 🎯 Adım 4: Uygulamayı Başlatma

### 4.1 Container'ları Başlatma:
```bash
docker-compose -f docker-compose.prod.yml --env-file production.env up -d
```

### 4.2 Durum Kontrolü:
```bash
# Container durumu
docker-compose -f docker-compose.prod.yml ps

# Logları izleme
docker-compose -f docker-compose.prod.yml logs -f

# Sadece backend logları
docker-compose -f docker-compose.prod.yml logs -f backend
```

### 4.3 Health Check:
```bash
# Backend API testi
curl http://localhost:3001/api/test

# Frontend testi
curl http://localhost/
```

## 🔄 Adım 5: Güncelleme İşlemleri

### Manuel Güncelleme:
```bash
cd /opt/v2son
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
docker system prune -af
```

### Otomatik Güncelleme:
GitHub'a kod push ettiğinizde otomatik olarak güncellenir.

## 🔒 Adım 6: SSL ve Domain (Opsiyonel)

### Nginx ile Reverse Proxy:
```bash
# Nginx kurulumu
sudo apt install nginx

# Site konfigürasyonu
sudo nano /etc/nginx/sites-available/v2son
```

Nginx konfigürasyonu:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### SSL Sertifikası (Let's Encrypt):
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 📊 Adım 7: Monitoring ve Backup

### Log Monitoring:
```bash
# Gerçek zamanlı loglar
docker-compose -f docker-compose.prod.yml logs -f --tail=100

# Disk kullanımı
docker system df

# Container resource kullanımı
docker stats
```

### Database Backup:
```bash
# Manuel backup
docker exec v2son_backend pg_dump -h DB_HOST -U DB_USER DB_NAME > backup_$(date +%Y%m%d).sql

# Otomatik backup (crontab)
0 2 * * * cd /opt/v2son && docker exec v2son_backend pg_dump -h localhost -U tasdaneren postgres > /opt/v2son/backups/backup_$(date +\%Y\%m\%d).sql
```

## 🚨 Troubleshooting

### Yaygın Sorunlar:

1. **Container başlamıyor:**
   ```bash
   docker-compose -f docker-compose.prod.yml logs backend
   ```

2. **Database bağlantı sorunu:**
   ```bash
   # PostgreSQL durumu
   sudo systemctl status postgresql
   
   # Port kontrolü
   netstat -tlnp | grep 5432
   ```

3. **Image güncellenmiyor:**
   ```bash
   docker-compose -f docker-compose.prod.yml pull --ignore-pull-failures
   docker-compose -f docker-compose.prod.yml up -d --force-recreate
   ```

4. **Disk doldu:**
   ```bash
   docker system prune -af
   docker volume prune
   ```

## 📞 Destek

- ✅ Container durumu: `docker-compose ps`
- ✅ Loglar: `docker-compose logs -f`
- ✅ Resource kullanımı: `docker stats`
- ✅ Disk temizleme: `docker system prune -af`

---

**🎉 Tebrikler! V2Son uygulamanız artık production'da çalışıyor!**
