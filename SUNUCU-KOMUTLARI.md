# 🖥️ sayimv2.tasdanlar.com.tr - Manuel Kurulum Komutları

## 📝 Sunucunuzda Sırayla Çalıştırın:

### 1. Sunucuya Bağlan
```bash
ssh root@your-server-ip
```

### 2. Docker Kurulumu
```bash
apt update && apt upgrade -y
curl -fsSL https://get.docker.com | sh
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
systemctl start docker && systemctl enable docker
```

### 3. Nginx Kurulumu
```bash
apt install -y nginx
systemctl start nginx && systemctl enable nginx
```

### 4. Proje Klasörü
```bash
mkdir -p /opt/v2son && cd /opt/v2son
```

### 5. Docker Compose Dosyası
```bash
cat > docker-compose.production.yml << 'EOF'
version: '3.8'
services:
  backend:
    image: erentasdann/v2son-backend:latest
    container_name: v2son_backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DB_HOST=localhost
      - DB_PORT=5432
      - DB_USER=tasdaneren
      - DB_PASSWORD=41Tasdan41
      - DB_NAME=postgres
    volumes:
      - backend_uploads:/app/uploads
    networks:
      - v2son_network
    restart: unless-stopped
  frontend:
    image: erentasdann/v2son-frontend:latest
    container_name: v2son_frontend
    ports:
      - "8080:80"
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

### 6. Nginx Site Konfigürasyonu
```bash
rm -f /etc/nginx/sites-enabled/default

cat > /etc/nginx/sites-available/sayimv2.tasdanlar.com.tr << 'EOF'
server {
    listen 80;
    server_name sayimv2.tasdanlar.com.tr;
    
    location / {
        proxy_pass http://localhost:8080;
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

ln -s /etc/nginx/sites-available/sayimv2.tasdanlar.com.tr /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx
```

### 7. V2Son Başlat
```bash
cd /opt/v2son
docker-compose -f docker-compose.production.yml pull
docker-compose -f docker-compose.production.yml up -d
```

### 8. SSL Sertifikası (Domain ayarlandıktan sonra)
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d sayimv2.tasdanlar.com.tr
```

### 9. Firewall
```bash
apt install -y ufw
ufw allow ssh && ufw allow 80/tcp && ufw allow 443/tcp
ufw --force enable
```

## ✅ Test
```bash
# Backend test
curl http://localhost:3001/api/test

# Frontend test  
curl http://sayimv2.tasdanlar.com.tr

# Container durumu
docker ps
```
