# Cangil Oto WhatsApp Chatbot

M. Cangil Auto Trading Ltd. için WhatsApp tabanlı müşteri hizmetleri chatbot sistemi.

## Özellikler

- 🚗 **Araç Arama**: Müşteriler marka, model ve tipine göre araç arayabilir
- 📅 **Randevu Sistemi**: WhatsApp üzerinden otomatik randevu alma
- 📱 **Admin Panel**: Araç ve randevu yönetimi için modern web arayüzü
- 🔄 **Gerçek Zamanlı**: Evolution API ile anlık mesajlaşma

## Teknolojiler

- **Backend**: Node.js, Express, Sequelize ORM
- **Database**: PostgreSQL
- **Cache**: Redis
- **WhatsApp**: Evolution API
- **Frontend**: React, Vite
- **Deployment**: Docker, Coolify

## Kurulum

### 1. Ortam Değişkenlerini Ayarlayın

```bash
cp .env.example .env
# .env dosyasını düzenleyin
```

### 2. Docker ile Çalıştırın

```bash
docker-compose up -d
```

### 3. Admin Paneline Giriş

`http://localhost:3001` adresine gidin ve `.env` dosyasındaki bilgilerle giriş yapın.

### 4. WhatsApp Bağlantısı

Admin panelinde "WhatsApp" sekmesine gidin ve QR kodu tarayın.

## Ortam Değişkenleri

| Değişken | Açıklama |
|----------|----------|
| `POSTGRES_USER` | PostgreSQL kullanıcı adı |
| `POSTGRES_PASSWORD` | PostgreSQL şifresi |
| `POSTGRES_DB` | Veritabanı adı |
| `EVOLUTION_API_KEY` | Evolution API anahtarı |
| `EVOLUTION_INSTANCE_NAME` | WhatsApp instance adı |
| `JWT_SECRET` | JWT token şifresi |
| `ADMIN_USERNAME` | Admin kullanıcı adı |
| `ADMIN_PASSWORD` | Admin şifresi |

## Coolify Deployment

1. GitHub'a push edin
2. Coolify'da yeni "Docker Compose" projesi oluşturun
3. Bu repo'yu bağlayın
4. Environment değişkenlerini ekleyin
5. Deploy edin

## API Endpoints

### Araçlar
- `GET /api/vehicles` - Araç listesi
- `POST /api/vehicles` - Yeni araç
- `PUT /api/vehicles/:id` - Araç güncelle
- `DELETE /api/vehicles/:id` - Araç sil

### Randevular
- `GET /api/appointments` - Randevu listesi
- `POST /api/appointments` - Yeni randevu
- `PATCH /api/appointments/:id/status` - Durum güncelle

### WhatsApp
- `GET /api/evolution/status` - Bağlantı durumu
- `GET /api/evolution/qrcode` - QR kod
- `POST /api/evolution/init` - Instance oluştur

## Lisans

© 2024 M. Cangil Auto Trading Ltd.
