#!/bin/bash

# V2Son Docker Başlatma Script'i
echo "🚀 V2Son Stok Sayım Uygulaması Docker Kurulumu Başlatılıyor..."

# Docker'ın çalışıp çalışmadığını kontrol et
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker çalışmıyor. Lütfen Docker Desktop'ı başlatın."
    exit 1
fi

echo "✅ Docker çalışıyor..."

# Mevcut container'ları durdur (varsa)
echo "🛑 Mevcut container'lar durduruluyor..."
docker-compose down 2>/dev/null

# Image'ları build et ve container'ları başlat
echo "🔨 Docker image'ları build ediliyor..."
docker-compose build

echo "🚀 Container'lar başlatılıyor..."
docker-compose up -d

# Container'ların hazır olmasını bekle
echo "⏳ Servisler başlatılıyor..."
sleep 10

# Servis durumlarını kontrol et
echo "📊 Servis durumları:"
docker-compose ps

echo ""
echo "🎉 Kurulum tamamlandı!"
echo ""
echo "📱 Uygulamaya erişim:"
echo "   Frontend: http://localhost:8080"
echo "   Backend API: http://localhost:3001"
echo "   PostgreSQL: localhost:5432"
echo ""
echo "👤 Varsayılan kullanıcı bilgileri:"
echo "   Admin - Kullanıcı: admin, Şifre: admin"
echo "   Test - Kullanıcı: test, Şifre: test"
echo ""
echo "📝 Logları izlemek için: docker-compose logs -f"
echo "⏹️  Durdurmak için: docker-compose down"
echo ""
echo "✨ İyi kullanımlar!"
