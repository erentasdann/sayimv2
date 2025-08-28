#!/bin/bash

# V2Son Tek Tıkla Sunucu Kurulum Script'i
# sayimv2.tasdanlar.com.tr için hazırlanmıştır

echo "🚀 V2Son sayimv2.tasdanlar.com.tr Deployment Başlatılıyor..."

# Renkli output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Root kontrolü
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Bu script root olarak çalıştırılmalıdır!${NC}"
    echo "Kullanım: sudo $0"
    exit 1
fi

echo -e "${BLUE}📋 Kurulum Adımları:${NC}"
echo "1. 🐳 Docker kurulumu"
echo "2. 🌐 Nginx kurulumu"  
echo "3. 📁 Proje klasörü oluşturma"
echo "4. ⚙️ Konfigürasyon dosyaları"
echo "5. 🚀 V2Son başlatma"
echo "6. 🔒 SSL sertifikası"
echo "7. 🛡️ Firewall ayarları"
echo ""

read -p "Devam etmek için ENTER'a basın..."

# Adım 1: Docker Kurulumu
echo -e "${YELLOW}🐳 1/7 - Docker kurulumu...${NC}"
apt update && apt upgrade -y
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
systemctl start docker
systemctl enable docker
echo -e "${GREEN}✅ Docker kuruldu!${NC}"

# Adım 2: Nginx Kurulumu
echo -e "${YELLOW}🌐 2/7 - Nginx kurulumu...${NC}"
apt install -y nginx
systemctl start nginx
systemctl enable nginx
echo -e "${GREEN}✅ Nginx kuruldu!${NC}"

# Adım 3: Proje Klasörü
echo -e "${YELLOW}📁 3/7 - Proje klasörü oluşturuluyor...${NC}"
mkdir -p /opt/v2son
cd /opt/v2son
echo -e "${GREEN}✅ Proje klasörü hazır!${NC}"

# Adım 4: Konfigürasyon Dosyaları
echo -e "${YELLOW}⚙️ 4/7 - Konfigürasyon dosyaları oluşturuluyor...${NC}"

# Docker Compose dosyası
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

# Environment dosyası
cat > .env << 'EOF'
DOCKER_HUB_USERNAME=erentasdann
DB_HOST=localhost
DB_PORT=5432
DB_USER=tasdaneren
DB_PASSWORD=41Tasdan41
DB_NAME=postgres
NODE_ENV=production
EOF

# Nginx site konfigürasyonu
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
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
    }

    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
}
EOF

ln -s /etc/nginx/sites-available/sayimv2.tasdanlar.com.tr /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

echo -e "${GREEN}✅ Konfigürasyon dosyaları hazır!${NC}"

# Adım 5: V2Son Başlatma
echo -e "${YELLOW}🚀 5/7 - V2Son başlatılıyor...${NC}"
docker-compose -f docker-compose.production.yml pull
docker-compose -f docker-compose.production.yml --env-file .env up -d

echo -e "${GREEN}✅ V2Son başlatıldı!${NC}"

# Adım 6: SSL Sertifikası
echo -e "${YELLOW}🔒 6/7 - SSL sertifikası kuruluyor...${NC}"
apt install -y certbot python3-certbot-nginx

echo -e "${BLUE}SSL sertifikası için sayimv2.tasdanlar.com.tr domain'inin sunucunuza yönlendirilmiş olması gerekiyor.${NC}"
read -p "Domain ayarlandı mı? (y/n): " domain_ready

if [ "$domain_ready" = "y" ] || [ "$domain_ready" = "Y" ]; then
    certbot --nginx -d sayimv2.tasdanlar.com.tr --non-interactive --agree-tos --email admin@tasdanlar.com.tr
    echo -e "${GREEN}✅ SSL sertifikası kuruldu!${NC}"
else
    echo -e "${YELLOW}⚠️ SSL kurulumu atlandı. Domain ayarlandıktan sonra çalıştırın:${NC}"
    echo "certbot --nginx -d sayimv2.tasdanlar.com.tr"
fi

# Adım 7: Firewall
echo -e "${YELLOW}🛡️ 7/7 - Firewall ayarlanıyor...${NC}"
apt install -y ufw
ufw --force reset
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo -e "${GREEN}✅ Firewall ayarlandı!${NC}"

# Güncelleme script'i
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

# Final test
echo ""
echo -e "${BLUE}🧪 Sistem testleri...${NC}"

# Container durumu
echo "📦 Container durumu:"
docker-compose -f docker-compose.production.yml ps

# Port kontrolü
echo ""
echo "🔌 Port kontrolü:"
netstat -tlnp | grep -E ":80|:443|:3001|:8080"

# Backend test
echo ""
echo "🔧 Backend API test:"
sleep 5
curl -s http://localhost:3001/api/test || echo "❌ Backend henüz hazır değil"

echo ""
echo -e "${GREEN}🎉 V2Son kurulumu tamamlandı!${NC}"
echo ""
echo -e "${BLUE}📱 Erişim bilgileri:${NC}"
echo "🌐 HTTP: http://sayimv2.tasdanlar.com.tr"
echo "🔒 HTTPS: https://sayimv2.tasdanlar.com.tr (SSL kurulduysa)"
echo "🔧 Backend: http://sayimv2.tasdanlar.com.tr/api/test"
echo ""
echo -e "${YELLOW}📋 Yönetim komutları:${NC}"
echo "📊 Durum: docker-compose -f /opt/v2son/docker-compose.production.yml ps"
echo "📝 Loglar: docker-compose -f /opt/v2son/docker-compose.production.yml logs -f"
echo "🔄 Güncelle: /opt/v2son/update.sh"
echo "⏹️ Durdur: docker-compose -f /opt/v2son/docker-compose.production.yml down"
echo ""
echo -e "${GREEN}✨ sayimv2.tasdanlar.com.tr hazır!${NC}"
