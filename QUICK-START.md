# ⚡ V2Son Hızlı Başlangıç

## 🎯 5 Dakikada Production'a Geçin!

### Adım 1: Sunucunuzda Docker Kurun (2 dk)
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

### Adım 2: V2Son'u İndirin (1 dk)
```bash
git clone https://github.com/erentasdann/v2son.git
cd v2son
```

### Adım 3: Konfigürasyon (1 dk)
```bash
# Environment dosyasını düzenleyin
nano production.env

# Şu satırları kendi bilgilerinizle güncelleyin:
DB_HOST=localhost
DB_USER=your-db-user  
DB_PASSWORD=your-db-password
DB_NAME=postgres
```

### Adım 4: Başlatın! (1 dk)
```bash
docker-compose -f docker-compose.prod.yml --env-file production.env up -d
```

## ✅ Test Edin
- Frontend: http://your-server-ip
- Backend: http://your-server-ip:3001/api/test

## 🔄 Güncellemeler
```bash
cd v2son
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

## 📞 Sorun mu var?
1. `docker-compose logs -f` - Logları kontrol edin
2. `SUNUCU-KURULUM.md` - Detaylı rehber
3. `README.md` - Tam dokümantasyon

**🚀 Bu kadar! Artık production'dasınız!**
