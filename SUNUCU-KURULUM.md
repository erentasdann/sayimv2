# 🚀 V2Son Sunucu Kurulum Rehberi

## 📋 Adım 1: Sunucuda Docker Kurulumu

### Ubuntu/Debian için:
```bash
# Sistem güncelleme
sudo apt update && sudo apt upgrade -y

# Docker kurulumu
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose kurulumu
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Kullanıcıyı docker grubuna ekle
sudo usermod -aG docker $USER

# Yeniden login ol (veya newgrp docker)
```

### CentOS/RHEL için:
```bash
# Docker kurulumu
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io
sudo systemctl start docker
sudo systemctl enable docker

# Docker Compose kurulumu
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

## 📁 Adım 2: Proje Klasörü Oluşturma

```bash
# Proje klasörü oluştur
sudo mkdir -p /opt/v2son
cd /opt/v2son
sudo chown $USER:$USER /opt/v2son
```

## 📄 Adım 3: Konfigürasyon Dosyaları

### docker-compose.prod.yml oluştur:
```bash
cat > docker-compose.prod.yml << 'EOF'
version: '3.8'

services:
  # Backend Servisi (Production)
  backend:
    image: erentasdann/v2son-backend:latest
    container_name: v2son_backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DB_HOST=\${DB_HOST}
      - DB_PORT=\${DB_PORT:-5432}
      - DB_USER=\${DB_USER}
      - DB_PASSWORD=\${DB_PASSWORD}
      - DB_NAME=\${DB_NAME}
    volumes:
      - backend_uploads:/app/uploads
    networks:
      - v2son_network
    restart: unless-stopped

  # Frontend Servisi (Production)
  frontend:
    image: erentasdann/v2son-frontend:latest
    container_name: v2son_frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - v2son_network
    restart: unless-stopped

volumes:
  backend_uploads:

networks:
  v2son_network:
    driver: bridge
EOF
```

### production.env oluştur:
```bash
cat > production.env << 'EOF'
# Production Environment Variables
DOCKER_HUB_USERNAME=erentasdann

# Database Configuration (Sunucudaki PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USER=YOUR_DB_USER
DB_PASSWORD=YOUR_DB_PASSWORD
DB_NAME=postgres

# Server Configuration
NODE_ENV=production
EOF
```

## ⚙️ Adım 4: Environment Dosyasını Düzenle

```bash
nano production.env
```

**Şu değerleri güncelleyin:**
- `DB_HOST`: Sunucunuzdaki PostgreSQL adresi (localhost/IP)
- `DB_USER`: PostgreSQL kullanıcı adı
- `DB_PASSWORD`: PostgreSQL şifresi
- `DB_NAME`: Veritabanı adı

## 🚀 Adım 5: Uygulamayı Başlat

```bash
# Image'ları çek
docker-compose -f docker-compose.prod.yml pull

# Container'ları başlat
docker-compose -f docker-compose.prod.yml --env-file production.env up -d

# Durumu kontrol et
docker-compose -f docker-compose.prod.yml ps
```

## 🔍 Adım 6: Test ve Kontrol

```bash
# Backend API testi
curl http://localhost:3001/api/test

# Frontend testi
curl http://localhost/

# Logları izle
docker-compose -f docker-compose.prod.yml logs -f

# Sadece backend logları
docker-compose -f docker-compose.prod.yml logs -f backend
```

## 🔄 Adım 7: Güncelleme İşlemleri

### Yeni version geldiğinde:
```bash
cd /opt/v2son

# Yeni image'ları çek
docker-compose -f docker-compose.prod.yml pull

# Container'ları yeniden başlat
docker-compose -f docker-compose.prod.yml up -d

# Eski image'ları temizle
docker system prune -af
```

## 🔒 Adım 8: SSL ve Domain (Opsiyonel)

### Nginx Reverse Proxy:
```bash
# Nginx kurulumu
sudo apt install nginx

# Site konfigürasyonu
sudo tee /etc/nginx/sites-available/v2son << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Site'ı aktifleştir
sudo ln -s /etc/nginx/sites-available/v2son /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL Sertifikası (Let's Encrypt):
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 📊 Adım 9: Monitoring ve Backup

### Otomatik Backup (Crontab):
```bash
# Backup script'i oluştur
cat > /opt/v2son/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/v2son/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Database backup (PostgreSQL'den)
pg_dump -h localhost -U YOUR_DB_USER YOUR_DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# Eski backup'ları temizle (30 günden eski)
find $BACKUP_DIR -name "backup_*.sql" -mtime +30 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /opt/v2son/backup.sh

# Crontab'e ekle (her gün saat 02:00'da)
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/v2son/backup.sh") | crontab -
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
   netstat -tlnp | grep 5432
   ```

3. **Port zaten kullanımda:**
   ```bash
   # 80 portunu kullanan servisi bul
   sudo lsof -i :80
   sudo systemctl stop apache2  # veya nginx
   ```

4. **Disk doldu:**
   ```bash
   docker system prune -af
   docker volume prune
   ```

## 🎯 Hızlı Komutlar

```bash
# Durumu kontrol et
docker-compose -f docker-compose.prod.yml ps

# Logları izle
docker-compose -f docker-compose.prod.yml logs -f

# Yeniden başlat
docker-compose -f docker-compose.prod.yml restart

# Durdur
docker-compose -f docker-compose.prod.yml down

# Güncelle
docker-compose -f docker-compose.prod.yml pull && docker-compose -f docker-compose.prod.yml up -d
```

---

## 🎉 Tebrikler!

V2Son uygulamanız artık production'da çalışıyor!

**Erişim:**
- Frontend: http://your-server-ip
- Backend API: http://your-server-ip:3001

**Destek için:** Bu dosyadaki troubleshooting bölümünü kontrol edin.
EOF
