#!/bin/bash

# V2Son Production Update Script
# Bu script her kod değişikliğinde otomatik deployment yapar

echo "🚀 V2Son Production Update Başlatılıyor..."

# Renkli output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Hata durumunda durdur
set -e

echo -e "${BLUE}📋 Süreç adımları:${NC}"
echo "1. 🔨 Image build"
echo "2. 📤 Docker Hub push"
echo "3. 🚀 Production deployment"
echo ""

# Docker Hub username
DOCKER_HUB_USERNAME="erentasdann"

# Yeni version tag'i (timestamp)
VERSION=$(date +%Y%m%d_%H%M%S)

echo -e "${YELLOW}🔨 1/3 - Image'lar build ediliyor...${NC}"

# Backend build
echo "📦 Backend build..."
docker build -t $DOCKER_HUB_USERNAME/v2son-backend:latest ./backend
docker build -t $DOCKER_HUB_USERNAME/v2son-backend:$VERSION ./backend

# Frontend build  
echo "🎨 Frontend build..."
docker build -t $DOCKER_HUB_USERNAME/v2son-frontend:latest ./frontend
docker build -t $DOCKER_HUB_USERNAME/v2son-frontend:$VERSION ./frontend

echo -e "${GREEN}✅ Build tamamlandı!${NC}"

echo -e "${YELLOW}📤 2/3 - Docker Hub'a push ediliyor...${NC}"

# Push latest
docker push $DOCKER_HUB_USERNAME/v2son-backend:latest
docker push $DOCKER_HUB_USERNAME/v2son-frontend:latest

# Push versioned
docker push $DOCKER_HUB_USERNAME/v2son-backend:$VERSION
docker push $DOCKER_HUB_USERNAME/v2son-frontend:$VERSION

echo -e "${GREEN}✅ Push tamamlandı!${NC}"

echo -e "${YELLOW}🚀 3/3 - Production deployment...${NC}"

# GitHub'a push (otomatik deployment tetiklenir)
if [ -d ".git" ]; then
    echo "📤 GitHub'a push ediliyor..."
    git add .
    git commit -m "🔄 Auto deployment v$VERSION

- Updated: $(date)
- Images: $DOCKER_HUB_USERNAME/v2son-*:$VERSION
- Ready for production"
    
    # Git remote varsa push et
    if git remote get-url origin 2>/dev/null; then
        git push origin main 2>/dev/null || git push origin master 2>/dev/null || echo "⚠️ Git push failed"
    else
        echo "⚠️ Git remote bulunamadı. Manuel push gerekli."
    fi
fi

echo ""
echo -e "${GREEN}🎉 Update tamamlandı!${NC}"
echo ""
echo -e "${BLUE}📊 Deployment bilgileri:${NC}"
echo "🏷️  Version: $VERSION"
echo "📦 Backend: $DOCKER_HUB_USERNAME/v2son-backend:$VERSION"
echo "🎨 Frontend: $DOCKER_HUB_USERNAME/v2son-frontend:$VERSION"
echo "🔗 Docker Hub: https://hub.docker.com/u/$DOCKER_HUB_USERNAME"
echo ""
echo -e "${YELLOW}📋 Sunucuda güncelleme için:${NC}"
echo "cd /opt/v2son"
echo "docker-compose -f docker-compose.prod.yml pull"
echo "docker-compose -f docker-compose.prod.yml up -d"
echo "docker system prune -af"
echo ""
echo -e "${GREEN}✨ Production'a geçmeye hazır!${NC}"
