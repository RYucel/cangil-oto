const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Vehicle = require('./Vehicle');

const Appointment = sequelize.define('Appointment', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    customerName: {
        type: DataTypes.STRING(200),
        allowNull: false,
        field: 'customer_name'
    },
    customerPhone: {
        type: DataTypes.STRING(20),
        allowNull: false,
        field: 'customer_phone'
    },
    vehicleId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'vehicle_id',
        references: {
            model: 'vehicles',
            key: 'id'
        }
    },
    appointmentDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'appointment_date'
    },
    appointmentTime: {
        type: DataTypes.TIME,
        allowNull: false,
        field: 'appointment_time'
    },
    status: {
        type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed'),
        defaultValue: 'pending'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    source: {
        type: DataTypes.ENUM('whatsapp', 'admin', 'phone'),
        defaultValue: 'whatsapp'
    }
}, {
    tableName: 'appointments',
    timestamps: true,
    underscored: true,
    indexes: [
        { fields: ['appointment_date'] },
        { fields: ['status'] },
        { fields: ['customer_phone'] }
    ]
});

// Associations
Appointment.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });
Vehicle.hasMany(Appointment, { foreignKey: 'vehicleId', as: 'appointments' });

module.exports = Appointment;
