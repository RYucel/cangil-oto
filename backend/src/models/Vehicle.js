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
        allowNull: true
    },
    condition: {
        type: DataTypes.ENUM('sifir', '2el'),
        defaultValue: '2el'
    },
    mileage: {
        type: DataTypes.INTEGER,
        allowNull: true
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
        type: DataTypes.ENUM('manuel', 'otomatik', 'yari_otomatik'),
        allowNull: true
    },
    engineCapacity: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'engine_capacity'
    },
    enginePower: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'engine_power'
    },
    bodyType: {
        type: DataTypes.ENUM('sedan', 'hatchback', 'suv', 'pickup', 'minivan', 'coupe', 'cabrio', 'panelvan', 'station_wagon', 'crossover', 'mpv', 'roadster'),
        allowNull: true,
        field: 'body_type'
    },
    steeringType: {
        type: DataTypes.ENUM('sol', 'sag'),
        defaultValue: 'sol',
        field: 'steering_type'
    },
    location: {
        type: DataTypes.STRING(200),
        allowNull: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    images: {
        type: DataTypes.JSONB,
        defaultValue: []
    },
    status: {
        type: DataTypes.ENUM('active', 'sold', 'reserved', 'inactive'),
        defaultValue: 'active'
    },
    externalId: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'external_id'
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
        { fields: ['body_type'] },
        { fields: ['condition'] },
        { fields: ['location'] }
    ]
});

module.exports = Vehicle;
