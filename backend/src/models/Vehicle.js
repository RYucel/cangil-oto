const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Vehicle = sequelize.define('Vehicle', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    // Temel Bilgiler
    brand: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Marka'
    },
    model: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Model'
    },
    year: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Yıl'
    },
    price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        comment: 'Fiyat - null ise "Fiyat Sorunuz" anlamına gelir'
    },

    // Araç Durumu ve Detaylar
    condition: {
        type: DataTypes.ENUM('sifir', '2el'),
        defaultValue: '2el',
        comment: 'Araç Durumu: Sıfır veya 2.El'
    },
    mileage: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Kilometre'
    },
    color: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Renk'
    },

    // Motor ve Şanzıman
    fuelType: {
        type: DataTypes.ENUM('benzin', 'dizel', 'elektrik', 'hibrit', 'lpg'),
        allowNull: true,
        field: 'fuel_type',
        comment: 'Yakıt Türü'
    },
    transmission: {
        type: DataTypes.ENUM('manuel', 'otomatik', 'yari_otomatik'),
        allowNull: true,
        comment: 'Vites Tipi'
    },
    engineCapacity: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'engine_capacity',
        comment: 'Motor Hacmi (cc)'
    },
    enginePower: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'engine_power',
        comment: 'Motor Gücü (hp)'
    },

    // Kasa ve Direksiyon
    bodyType: {
        type: DataTypes.ENUM('sedan', 'hatchback', 'suv', 'pickup', 'minivan', 'coupe', 'cabrio', 'panelvan', 'station_wagon', 'crossover', 'mpv', 'roadster'),
        allowNull: true,
        field: 'body_type',
        comment: 'Kasa Tipi'
    },
    steeringType: {
        type: DataTypes.ENUM('sol', 'sag'),
        defaultValue: 'sol',
        field: 'steering_type',
        comment: 'Direksiyon Tipi: Sol veya Sağ'
    },

    // Konum
    location: {
        type: DataTypes.STRING(200),
        allowNull: true,
        comment: 'Konum (örn: Girne / Alsancak)'
    },

    // Açıklama ve Görseller
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Açıklama'
    },
    images: {
        type: DataTypes.JSONB,
        defaultValue: [],
        comment: 'Görsel URL dizisi'
    },

    // İlan Durumu
    status: {
        type: DataTypes.ENUM('active', 'sold', 'reserved', 'inactive'),
        defaultValue: 'active',
        comment: 'İlan Durumu'
    },
    externalId: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'external_id',
        comment: 'Harici İlan No (kktcarabam.com vb.)'
    },
    featured: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Öne çıkan ilan mı?'
    }
}, {
    tableName: 'vehicles',
    timestamps: true,
    underscored: true,
    indexes: [
        { fields: ['brand'] },
        { fields: ['status'] },
        { fields: ['year'] },
        { fields: ['body_type'] },
        { fields: ['condition'] },
        { fields: ['location'] }
    ]
});

module.exports = Vehicle;
