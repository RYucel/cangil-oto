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
            where.price = {};
            if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
            if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
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

module.exports = router;
