# 🚀 sayimv2.tasdanlar.com.tr - Sunucu Deployment

## 📋 Sunucunuzda Yapılacak İşlemler

### Adım 1: Sunucuya Bağlanın
```bash
ssh root@your-server-ip
# veya
ssh username@your-server-ip
```

### Adım 2: Docker Kurulumu (Ubuntu/Debian)
```bash
# Sistem güncelleme
apt update && apt upgrade -y

# Docker kurulumu
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Docker Compose kurulumu
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Docker servisini başlat
systemctl start docker
systemctl enable docker
```

### Adım 3: Proje Klasörü Oluştur
```bash
mkdir -p /opt/v2son
cd /opt/v2son
```

### Adım 4: Docker Compose Dosyası (sayimv2.tasdanlar.com.tr için)
```bash
cat > docker-compose.production.yml << 'EOF'
version: '3.8'

services:
  # Backend Servisi
  backend:
    image: erentasdann/v2son-backend:latest
    container_name: v2son_backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DB_HOST=${DB_HOST}
      - DB_PORT=${DB_PORT:-5432}
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_NAME=${DB_NAME}
    volumes:
      - backend_uploads:/app/uploads
    networks:
      - v2son_network
    restart: unless-stopped

  # Frontend Servisi
  frontend:
    image: erentasdann/v2son-frontend:latest
    container_name: v2son_frontend
    ports:
      - "8080:80"  # Nginx ile proxy yapacağız
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

### Adım 5: Environment Dosyası
```bash
cat > .env << 'EOF'
# Production Environment Variables
DOCKER_HUB_USERNAME=erentasdann

# Database Configuration (Sunucudaki PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USER=tasdaneren
DB_PASSWORD=41Tasdan41
DB_NAME=postgres

# Server Configuration
NODE_ENV=production
EOF
```

### Adım 6: Nginx Kurulumu ve Konfigürasyonu
```bash
# Nginx kurulumu
apt install -y nginx

# Mevcut default site'ı kaldır
rm -f /etc/nginx/sites-enabled/default

# sayimv2.tasdanlar.com.tr için site konfigürasyonu
cat > /etc/nginx/sites-available/sayimv2.tasdanlar.com.tr << 'EOF'
server {
    listen 80;
    server_name sayimv2.tasdanlar.com.tr;

    # Frontend'i serve et
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
    }

    # Backend API istekleri
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
}
EOF

# Site'ı aktifleştir
ln -s /etc/nginx/sites-available/sayimv2.tasdanlar.com.tr /etc/nginx/sites-enabled/

# Nginx konfigürasyonunu test et
nginx -t

# Nginx'i yeniden başlat
systemctl restart nginx
systemctl enable nginx
```

### Adım 7: Firewall Ayarları
```bash
# UFW kurulumu (Ubuntu)
apt install -y ufw

# Temel portları aç
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp

# UFW'yi aktifleştir
ufw --force enable

# Durumu kontrol et
ufw status
```

### Adım 8: V2Son Uygulamasını Başlat
```bash
cd /opt/v2son

# Docker image'larını çek
docker-compose -f docker-compose.production.yml pull

# Container'ları başlat
docker-compose -f docker-compose.production.yml --env-file .env up -d

# Durumu kontrol et
docker-compose -f docker-compose.production.yml ps
```

### Adım 9: SSL Sertifikası (Let's Encrypt)
```bash
# Certbot kurulumu
apt install -y certbot python3-certbot-nginx

# SSL sertifikası al
certbot --nginx -d sayimv2.tasdanlar.com.tr

# Otomatik yenileme test et
certbot renew --dry-run
```

### Adım 10: Test ve Doğrulama
```bash
# Backend API test
curl http://localhost:3001/api/test

# Frontend test
curl http://localhost:8080/

# Domain test
curl http://sayimv2.tasdanlar.com.tr

# SSL test (sertifika sonrası)
curl https://sayimv2.tasdanlar.com.tr
```

## 🔄 Güncellemeler için

### Manuel Güncelleme
```bash
cd /opt/v2son
docker-compose -f docker-compose.production.yml pull
docker-compose -f docker-compose.production.yml up -d
docker system prune -af
```

### Otomatik Güncelleme Script'i
```bash
cat > /opt/v2son/update.sh << 'EOF'
#!/bin/bash
cd /opt/v2son
echo "🔄 V2Son güncelleniyor..."
docker-compose -f docker-compose.production.yml pull
docker-compose -f docker-compose.production.yml up -d
docker system prune -af
echo "✅ Güncelleme tamamlandı!"
EOF

chmod +x /opt/v2son/update.sh
```

## 📊 Monitoring

### Log İzleme
```bash
# Tüm loglar
docker-compose -f docker-compose.production.yml logs -f

# Sadece backend
docker-compose -f docker-compose.production.yml logs -f backend

# Nginx logları
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### System Status
```bash
# Container durumu
docker ps

# Resource kullanımı
docker stats

# Disk kullanımı
df -h
```

## 🚨 Troubleshooting

### 1. Container başlamıyor
```bash
docker-compose -f docker-compose.production.yml logs backend
```

### 2. Domain erişilemiyor
```bash
# DNS kontrolü
nslookup sayimv2.tasdanlar.com.tr

# Port kontrolü
netstat -tlnp | grep :80
```

### 3. SSL sorunu
```bash
# Sertifika yenileme
certbot renew

# Nginx yeniden başlatma
systemctl restart nginx
```

---

## 🎯 Final Checklist

- [ ] Docker kuruldu
- [ ] Nginx kuruldu ve konfigüre edildi
- [ ] V2Son container'ları çalışıyor
- [ ] Domain erişilebilir (sayimv2.tasdanlar.com.tr)
- [ ] SSL sertifikası kuruldu
- [ ] Firewall ayarlandı
- [ ] Loglar normal

## 🎉 Başarılı!

V2Son artık sayimv2.tasdanlar.com.tr adresinde çalışıyor!

**Erişim:**
- 🌐 Frontend: https://sayimv2.tasdanlar.com.tr
- 🔧 Backend API: https://sayimv2.tasdanlar.com.tr/api/test
EOF
