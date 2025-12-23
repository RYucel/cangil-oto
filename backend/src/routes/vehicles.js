const express = require('express');
const { Op } = require('sequelize');
const { Vehicle } = require('../models');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all vehicles with filtering
router.get('/', async (req, res) => {
    try {
        const {
            brand,
            bodyType,
            minYear,
            maxYear,
            minPrice,
            maxPrice,
            transmission,
            fuelType,
            status = 'active',
            search,
            page = 1,
            limit = 20
        } = req.query;

        const where = {};

        if (status) where.status = status;
        if (brand) where.brand = { [Op.iLike]: `%${brand}%` };
        if (bodyType) where.bodyType = bodyType;
        if (transmission) where.transmission = transmission;
        if (fuelType) where.fuelType = fuelType;

        if (minYear || maxYear) {
            where.year = {};
            if (minYear) where.year[Op.gte] = parseInt(minYear);
            if (maxYear) where.year[Op.lte] = parseInt(maxYear);
        }

        if (minPrice || maxPrice) {
            where.priceGBP = {};
            if (minPrice) where.priceGBP[Op.gte] = parseFloat(minPrice);
            if (maxPrice) where.priceGBP[Op.lte] = parseFloat(maxPrice);
        }

        if (search) {
            where[Op.or] = [
                { brand: { [Op.iLike]: `%${search}%` } },
                { model: { [Op.iLike]: `%${search}%` } },
                { description: { [Op.iLike]: `%${search}%` } }
            ];
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows } = await Vehicle.findAndCountAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset
        });

        res.json({
            vehicles: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching vehicles:', error);
        res.status(500).json({ error: 'Failed to fetch vehicles' });
    }
});

// Get single vehicle
router.get('/:id', async (req, res) => {
    try {
        const vehicle = await Vehicle.findByPk(req.params.id);
        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }
        res.json(vehicle);
    } catch (error) {
        console.error('Error fetching vehicle:', error);
        res.status(500).json({ error: 'Failed to fetch vehicle' });
    }
});

// Create vehicle (protected)
router.post('/', authenticateToken, async (req, res) => {
    try {
        const vehicle = await Vehicle.create(req.body);
        res.status(201).json(vehicle);
    } catch (error) {
        console.error('Error creating vehicle:', error);
        res.status(500).json({ error: 'Failed to create vehicle' });
    }
});

// Update vehicle (protected)
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const vehicle = await Vehicle.findByPk(req.params.id);
        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }
        await vehicle.update(req.body);
        res.json(vehicle);
    } catch (error) {
        console.error('Error updating vehicle:', error);
        res.status(500).json({ error: 'Failed to update vehicle' });
    }
});

// Delete vehicle (protected)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const vehicle = await Vehicle.findByPk(req.params.id);
        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }
        await vehicle.destroy();
        res.json({ message: 'Vehicle deleted successfully' });
    } catch (error) {
        console.error('Error deleting vehicle:', error);
        res.status(500).json({ error: 'Failed to delete vehicle' });
    }
});

// Get available brands (for filtering)
router.get('/meta/brands', async (req, res) => {
    try {
        const brands = await Vehicle.findAll({
            attributes: ['brand'],
            where: { status: 'active' },
            group: ['brand'],
            order: [['brand', 'ASC']]
        });
        res.json(brands.map(b => b.brand));
    } catch (error) {
        console.error('Error fetching brands:', error);
        res.status(500).json({ error: 'Failed to fetch brands' });
    }
});

// Seed sample vehicles (protected - one-time use)
router.post('/seed', authenticateToken, async (req, res) => {
    try {
        const sampleVehicles = [
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
                priceGBP: 9500,
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
                priceGBP: 41000,
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

        const created = await Vehicle.bulkCreate(sampleVehicles);
        res.json({
            success: true,
            message: `${created.length} vehicles added successfully`,
            vehicles: created.map(v => ({ brand: v.brand, model: v.model }))
        });
    } catch (error) {
        console.error('Error seeding vehicles:', error);
        res.status(500).json({ error: 'Failed to seed vehicles', details: error.message });
    }
});

module.exports = router;

