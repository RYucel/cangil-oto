# 🚗 Cangil Oto - WhatsApp Chatbot & Admin Panel

KKTC'de araç satışı yapan Cangil Oto için geliştirilen WhatsApp chatbot sistemi ve yönetim paneli.

## 📋 Proje Özeti

Bu proje, müşterilerin WhatsApp üzerinden araç sorgulama ve randevu alma işlemlerini otomatikleştiren bir chatbot sistemidir. Admin paneli üzerinden araç envanteri ve randevular yönetilebilir.

## ✅ Tamamlanan Özellikler

### Admin Paneli
- [x] Kullanıcı girişi (JWT tabanlı)
- [x] Dashboard (istatistikler görünümü)
- [x] Araç yönetimi (CRUD işlemleri)
  - Marka, Model, Yıl, Fiyat
  - Araç Durumu (Sıfır/2.El)
  - Kilometre, Renk
  - Yakıt Türü, Vites Tipi
  - Motor Hacmi (cc), Motor Gücü (hp)
  - Kasa Tipi, Direksiyon Tipi (Sol/Sağ)
  - Konum (KKTC bölgeleri)
  - İlan Durumu, Öne Çıkan
- [x] Randevu yönetimi
- [x] WhatsApp bağlantı ayarları

### Backend API
- [x] RESTful API endpoints
- [x] PostgreSQL veritabanı entegrasyonu
- [x] JWT kimlik doğrulama
- [x] Evolution API entegrasyonu
- [x] Webhook endpoint (WhatsApp mesajları için)

### Altyapı
- [x] Docker Compose yapılandırması
- [x] Coolify üzerinde deployment
- [x] PostgreSQL & Redis (Coolify managed)
- [x] Evolution API entegrasyonu

## 🔲 Yapılacaklar (TODO)

### WhatsApp Chatbot
- [ ] WhatsApp bağlantısı (QR kod tarama)
- [ ] Chatbot mesaj akışları:
  - [ ] Karşılama mesajı
  - [ ] Ana menü (Araç Ara, Randevu Al, İletişim)
  - [ ] Araç sorgulama (marka, model, fiyat aralığı)
  - [ ] Veritabanından araç arama
  - [ ] Randevu oluşturma akışı
- [ ] Webhook işleme (gelen mesajları chatbot'a yönlendirme)

### Chatbot Özellikleri
- [ ] Doğal dil anlama (basit anahtar kelime eşleştirme)
- [ ] Araç önerisi algoritması
- [ ] Fiyat formatlaması (Türkçe)
- [ ] Resim gönderimi (araç görselleri)

### Ek Özellikler
- [ ] Araç görseli yükleme
- [ ] Birden fazla görsel desteği
- [ ] kktcarabam.com entegrasyonu (opsiyonel)
- [ ] SMS/E-posta bildirimleri

## 🌐 Canlı URL'ler

| Servis | URL |
|--------|-----|
| Admin Panel | https://xowkc88s840ok8scwsoggss0.rustuyucel.cloud |
| Backend API | https://ug0sks4kggscsgw8o8ckog84.rustuyucel.cloud |
| Evolution API | https://bg00o0kw8cgscgwkw40w48wk.rustuyucel.cloud |

## 🔑 Giriş Bilgileri

- **Kullanıcı:** `admin`
- **Şifre:** `CangilAdmin2024!`

## 🛠 Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Cache | Redis |
| WhatsApp | Evolution API |
| Deployment | Coolify (Docker) |
| VPS | Hostinger |

## 📁 Proje Yapısı

```
CangilOto/
├── admin/                 # React Admin Paneli
│   ├── src/
│   │   ├── pages/        # Sayfa bileşenleri
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Vehicles.jsx
│   │   │   ├── Appointments.jsx
│   │   │   ├── WhatsAppSettings.jsx
│   │   │   └── Login.jsx
│   │   ├── App.jsx
│   │   └── index.css
│   ├── Dockerfile
│   └── nginx.conf
├── backend/               # Node.js API
│   ├── src/
│   │   ├── config/       # Database config
│   │   ├── models/       # Sequelize models
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   └── index.js
│   └── Dockerfile
├── docker-compose.yml     # Container orchestration
└── README.md
```

## 🚀 Deployment Talimatları

1. **Coolify'da proje oluştur**
2. **GitHub repo'yu bağla**
3. **PostgreSQL ve Redis ekle** (Coolify Resources)
4. **docker-compose.yml içindeki database URL'lerini güncelle**
5. **Deploy et**

## 📞 Sonraki Adımlar

1. **WhatsApp'ı Bağla:**
   - Admin Panel → WhatsApp sekmesi
   - "Bağlantı Başlat" butonuna tıkla
   - QR kodu telefonla tara

2. **Test Araçları Ekle:**
   - Admin Panel → Araçlar sekmesi
   - "Yeni Araç" butonuyla araç ekle

3. **Chatbot'u Test Et:**
   - Bağlanan WhatsApp numarasına mesaj gönder
   - Chatbot cevabını kontrol et

---

**Geliştirici:** Cangil Oto IT Team  
**Versiyon:** 1.0.0  
**Son Güncelleme:** Aralık 2025
