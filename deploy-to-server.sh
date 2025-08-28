#!/bin/bash

# V2Son Production Deployment Script
echo "🚀 V2Son Production Deployment Başlatılıyor..."

# Renkli output için
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Hata durumunda durma
set -e

# Docker Hub kullanıcı adı
DOCKER_HUB_USERNAME=${DOCKER_HUB_USERNAME:-"tasdaneren"}

echo -e "${BLUE}🔨 Image'lar build ediliyor...${NC}"

# Backend image build ve push
echo -e "${YELLOW}📦 Backend image build ediliyor...${NC}"
docker build -t $DOCKER_HUB_USERNAME/v2son-backend:latest ./backend
docker build -t $DOCKER_HUB_USERNAME/v2son-backend:$(date +%Y%m%d_%H%M%S) ./backend

# Frontend image build ve push  
echo -e "${YELLOW}🎨 Frontend image build ediliyor...${NC}"
docker build -t $DOCKER_HUB_USERNAME/v2son-frontend:latest ./frontend
docker build -t $DOCKER_HUB_USERNAME/v2son-frontend:$(date +%Y%m%d_%H%M%S) ./frontend

echo -e "${BLUE}📤 Docker Hub'a push ediliyor...${NC}"

# Docker Hub'a login (token gerekli)
echo -e "${YELLOW}🔑 Docker Hub'a login olunuyor...${NC}"
echo $DOCKER_HUB_TOKEN | docker login -u $DOCKER_HUB_USERNAME --password-stdin

# Push işlemleri
docker push $DOCKER_HUB_USERNAME/v2son-backend:latest
docker push $DOCKER_HUB_USERNAME/v2son-frontend:latest

echo -e "${GREEN}✅ Image'lar başarıyla Docker Hub'a gönderildi!${NC}"

echo -e "${BLUE}📋 Sunucuda çalıştırılacak komutlar:${NC}"
echo -e "${YELLOW}"
echo "1. Sunucunuza SSH ile bağlanın:"
echo "   ssh user@your-server-ip"
echo ""
echo "2. Proje klasörünü oluşturun:"
echo "   sudo mkdir -p /opt/v2son"
echo "   cd /opt/v2son"
echo ""
echo "3. Docker Compose dosyalarını indirin:"
echo "   wget https://raw.githubusercontent.com/your-username/v2son/main/docker-compose.prod.yml"
echo "   wget https://raw.githubusercontent.com/your-username/v2son/main/production.env"
echo ""
echo "4. Environment dosyasını düzenleyin:"
echo "   nano production.env"
echo "   # Sunucunuza göre DB bilgilerini güncelleyin"
echo ""
echo "5. Uygulamayı başlatın:"
echo "   docker-compose -f docker-compose.prod.yml --env-file production.env up -d"
echo ""
echo "6. Durumu kontrol edin:"
echo "   docker-compose -f docker-compose.prod.yml ps"
echo "   docker-compose -f docker-compose.prod.yml logs -f"
echo -e "${NC}"

echo -e "${GREEN}🎉 Deployment hazır! Yukarıdaki adımları sunucunuzda uygulayın.${NC}"
