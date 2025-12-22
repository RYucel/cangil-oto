const { Sequelize } = require('sequelize');

// Get database URL from environment
const databaseUrl = process.env.DATABASE_URL;

// Log for debugging
console.log('DATABASE_URL exists:', !!databaseUrl);
console.log('DATABASE_URL prefix:', databaseUrl ? databaseUrl.substring(0, 20) + '...' : 'undefined');

if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is not set!');
    console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('POSTGRES')));
}

const sequelize = new Sequelize(databaseUrl || 'postgres://localhost:5432/cangiloto', {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    dialectOptions: {
        ssl: false
    }
});

module.exports = { sequelize };
