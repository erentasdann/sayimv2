# Node.js 18 resmi imajını kullan
FROM node:18-alpine as build

# Çalışma dizinini oluştur
WORKDIR /app

# Package dosyalarını kopyala
COPY package*.json ./

# Dependencies'leri yükle
RUN npm ci

# Uygulama kodunu kopyala
COPY . .

# Uygulamayı build et
RUN npm run build

# Nginx ile serve et
FROM nginx:alpine

# Build edilmiş dosyaları Nginx'e kopyala
COPY --from=build /app/build /usr/share/nginx/html

# Nginx konfigürasyonu
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Port'u expose et
EXPOSE 80

# Nginx'i başlat
CMD ["nginx", "-g", "daemon off;"]
