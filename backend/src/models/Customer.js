const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Customer = sequelize.define('Customer', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    name: {
        type: DataTypes.STRING(200),
        allowNull: true
    },
    chatState: {
        type: DataTypes.JSONB,
        defaultValue: {},
        field: 'chat_state',
        comment: 'Current chatbot conversation state'
    },
    lastInteraction: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_interaction'
    },
    totalMessages: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'total_messages'
    }
}, {
    tableName: 'customers',
    timestamps: true,
    underscored: true,
    indexes: [
        { fields: ['phone'], unique: true }
    ]
});

module.exports = Customer;
