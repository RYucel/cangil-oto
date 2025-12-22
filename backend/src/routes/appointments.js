const express = require('express');
const { Op } = require('sequelize');
const { Appointment, Vehicle } = require('../models');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all appointments (protected)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const {
            status,
            startDate,
            endDate,
            page = 1,
            limit = 20
        } = req.query;

        const where = {};

        if (status) where.status = status;

        if (startDate || endDate) {
            where.appointmentDate = {};
            if (startDate) where.appointmentDate[Op.gte] = startDate;
            if (endDate) where.appointmentDate[Op.lte] = endDate;
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows } = await Appointment.findAndCountAll({
            where,
            include: [{ model: Vehicle, as: 'vehicle' }],
            order: [['appointmentDate', 'ASC'], ['appointmentTime', 'ASC']],
            limit: parseInt(limit),
            offset
        });

        res.json({
            appointments: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ error: 'Failed to fetch appointments' });
    }
});

// Get single appointment (protected)
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const appointment = await Appointment.findByPk(req.params.id, {
            include: [{ model: Vehicle, as: 'vehicle' }]
        });
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        res.json(appointment);
    } catch (error) {
        console.error('Error fetching appointment:', error);
        res.status(500).json({ error: 'Failed to fetch appointment' });
    }
});

// Create appointment
router.post('/', async (req, res) => {
    try {
        const appointment = await Appointment.create(req.body);
        res.status(201).json(appointment);
    } catch (error) {
        console.error('Error creating appointment:', error);
        res.status(500).json({ error: 'Failed to create appointment' });
    }
});

// Update appointment status (protected)
router.patch('/:id/status', authenticateToken, async (req, res) => {
    try {
        const { status } = req.body;
        const appointment = await Appointment.findByPk(req.params.id);

        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        await appointment.update({ status });
        res.json(appointment);
    } catch (error) {
        console.error('Error updating appointment:', error);
        res.status(500).json({ error: 'Failed to update appointment' });
    }
});

// Update appointment (protected)
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const appointment = await Appointment.findByPk(req.params.id);
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        await appointment.update(req.body);
        res.json(appointment);
    } catch (error) {
        console.error('Error updating appointment:', error);
        res.status(500).json({ error: 'Failed to update appointment' });
    }
});

// Delete appointment (protected)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const appointment = await Appointment.findByPk(req.params.id);
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        await appointment.destroy();
        res.json({ message: 'Appointment deleted successfully' });
    } catch (error) {
        console.error('Error deleting appointment:', error);
        res.status(500).json({ error: 'Failed to delete appointment' });
    }
});

// Get available time slots for a date
router.get('/slots/:date', async (req, res) => {
    try {
        const { date } = req.params;

        // Business hours: 09:00 - 18:00
        const allSlots = [
            '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
            '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
            '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
        ];

        const bookedAppointments = await Appointment.findAll({
            where: {
                appointmentDate: date,
                status: { [Op.notIn]: ['cancelled'] }
            },
            attributes: ['appointmentTime']
        });

        const bookedTimes = bookedAppointments.map(a =>
            a.appointmentTime.substring(0, 5)
        );

        const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));

        res.json({ date, availableSlots });
    } catch (error) {
        console.error('Error fetching time slots:', error);
        res.status(500).json({ error: 'Failed to fetch time slots' });
    }
});

module.exports = router;
