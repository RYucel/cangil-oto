const vehicles = [
    {
        brand: "Toyota",
        model: "Hilux 2.4 D",
        year: 2025,
        mileage: 20846,
        color: "Siyah",
        fuelType: "dizel",
        transmission: "otomatik",
        bodyType: "pickup",
        condition: "2el",
        steeringType: "sag",
        location: "Girne",
        status: "active"
    },
    {
        brand: "BMW",
        model: "1 Serisi 120i",
        year: 2011,
        price: 9500,
        mileage: 159207,
        color: "Beyaz",
        fuelType: "benzin",
        transmission: "otomatik",
        bodyType: "hatchback",
        condition: "2el",
        steeringType: "sag",
        location: "Girne",
        status: "active"
    },
    {
        brand: "Toyota",
        model: "Hilux 2.4 D",
        year: 2023,
        mileage: 32008,
        color: "Beyaz",
        fuelType: "dizel",
        transmission: "otomatik",
        bodyType: "pickup",
        condition: "2el",
        steeringType: "sag",
        location: "Girne",
        status: "active"
    },
    {
        brand: "Mitsubishi",
        model: "Triton",
        year: 2025,
        mileage: 1024,
        color: "Beyaz",
        fuelType: "dizel",
        transmission: "otomatik",
        bodyType: "pickup",
        condition: "sifir",
        steeringType: "sag",
        location: "Girne",
        status: "active"
    },
    {
        brand: "Toyota",
        model: "Hilux 2.4 D",
        year: 2023,
        mileage: 29493,
        color: "Beyaz",
        fuelType: "dizel",
        transmission: "otomatik",
        bodyType: "pickup",
        condition: "2el",
        steeringType: "sag",
        location: "Girne",
        status: "active"
    },
    {
        brand: "Honda",
        model: "Fit 1.5 Crosstar",
        year: 2021,
        mileage: 45000,
        color: "Lacivert",
        fuelType: "benzin",
        transmission: "otomatik",
        bodyType: "hatchback",
        condition: "2el",
        steeringType: "sag",
        location: "Girne",
        status: "active"
    },
    {
        brand: "Toyota",
        model: "Land Cruiser ZX",
        year: 2024,
        mileage: 25024,
        color: "Beyaz",
        fuelType: "dizel",
        transmission: "otomatik",
        bodyType: "suv",
        condition: "2el",
        steeringType: "sag",
        location: "Girne",
        status: "active"
    },
    {
        brand: "Maserati",
        model: "Levante 3.0 V6",
        year: 2017,
        price: 41000,
        mileage: 46473,
        color: "Mavi-Parlement",
        fuelType: "benzin",
        transmission: "otomatik",
        bodyType: "suv",
        condition: "2el",
        steeringType: "sag",
        location: "Girne",
        status: "active"
    }
];

async function seedVehicles() {
    const { sequelize } = require('./src/config/database');
    const Vehicle = require('./src/models/Vehicle');

    try {
        await sequelize.authenticate();
        console.log('Database connected');

        await sequelize.sync({ alter: true });
        console.log('Tables synced');

        for (const vehicle of vehicles) {
            const created = await Vehicle.create(vehicle);
            console.log(`Created: ${created.brand} ${created.model}`);
        }

        console.log(`\n✅ ${vehicles.length} vehicles added successfully!`);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

seedVehicles();
