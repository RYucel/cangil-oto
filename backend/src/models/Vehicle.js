const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Vehicle = sequelize.define('Vehicle', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    brand: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    model: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    year: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        comment: 'Price in local currency, null means "call for price"'
    },
    mileage: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Mileage in kilometers'
    },
    color: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    fuelType: {
        type: DataTypes.ENUM('benzin', 'dizel', 'elektrik', 'hibrit', 'lpg'),
        allowNull: true,
        field: 'fuel_type'
    },
    transmission: {
        type: DataTypes.ENUM('manuel', 'otomatik'),
        allowNull: true
    },
    bodyType: {
        type: DataTypes.ENUM('sedan', 'hatchback', 'suv', 'pickup', 'minivan', 'coupe', 'cabrio', 'panelvan', 'motosiklet', 'karavan', 'atv'),
        allowNull: true,
        field: 'body_type'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    images: {
        type: DataTypes.JSONB,
        defaultValue: [],
        comment: 'Array of image URLs'
    },
    status: {
        type: DataTypes.ENUM('active', 'sold', 'reserved', 'inactive'),
        defaultValue: 'active'
    },
    externalId: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'external_id',
        comment: 'ID from kktcarabam.com if synced'
    },
    featured: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'vehicles',
    timestamps: true,
    underscored: true,
    indexes: [
        { fields: ['brand'] },
        { fields: ['status'] },
        { fields: ['year'] },
        { fields: ['body_type'] }
    ]
});

module.exports = Vehicle;
