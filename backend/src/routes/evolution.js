const express = require('express');
const evolutionService = require('../services/evolution');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * Get WhatsApp connection status
 */
router.get('/status', async (req, res) => {
    try {
        const status = await evolutionService.getConnectionStatus();
        res.json(status);
    } catch (error) {
        logger.error('Error getting status:', error.message);
        res.status(500).json({ error: 'Failed to get connection status' });
    }
});

/**
 * Get QR code for connection
 */
router.get('/qrcode', async (req, res) => {
    try {
        const qrData = await evolutionService.getQRCode();
        res.json(qrData);
    } catch (error) {
        logger.error('Error getting QR code:', error.message);
        res.status(500).json({ error: 'Failed to get QR code' });
    }
});

/**
 * Initialize/create instance
 */
router.post('/init', async (req, res) => {
    try {
        const { webhookUrl } = req.body;
        const backendUrl = webhookUrl || `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/webhook`;

        const result = await evolutionService.createInstance(backendUrl);
        res.json(result);
    } catch (error) {
        logger.error('Error initializing instance:', error.message);
        res.status(500).json({ error: 'Failed to initialize instance' });
    }
});

/**
 * Update webhook URL
 */
router.post('/webhook', async (req, res) => {
    try {
        const { url } = req.body;
        const result = await evolutionService.setWebhook(url);
        res.json(result);
    } catch (error) {
        logger.error('Error setting webhook:', error.message);
        res.status(500).json({ error: 'Failed to set webhook' });
    }
});

/**
 * Logout/disconnect WhatsApp
 */
router.post('/logout', async (req, res) => {
    try {
        const result = await evolutionService.logout();
        res.json(result);
    } catch (error) {
        logger.error('Error logging out:', error.message);
        res.status(500).json({ error: 'Failed to logout' });
    }
});

/**
 * Send test message
 */
router.post('/test', async (req, res) => {
    try {
        const { phone, message } = req.body;

        if (!phone || !message) {
            return res.status(400).json({ error: 'Phone and message are required' });
        }

        const result = await evolutionService.sendMessage(phone, message);
        res.json(result);
    } catch (error) {
        logger.error('Error sending test message:', error.message);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

module.exports = router;
