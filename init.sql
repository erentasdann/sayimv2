-- Veritabanı başlangıç scripti
-- Kullanıcılar tablosu
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ürünler tablosu
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    barcode VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Varsayılan kullanıcı ekle (admin/admin)
INSERT INTO users (username, password, name, role) 
VALUES ('admin', 'admin', 'Sistem Yöneticisi', 'admin') 
ON CONFLICT (username) DO NOTHING;

-- Test kullanıcısı ekle
INSERT INTO users (username, password, name, role) 
VALUES ('test', 'test', 'Test Kullanıcı', 'user') 
ON CONFLICT (username) DO NOTHING;
