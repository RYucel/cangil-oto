const express = require('express');
const chatbotService = require('../services/chatbot');
const logger = require('../config/logger');

const router = express.Router();

// In-memory cache for QR code (simple solution, could use Redis in production)
let cachedQRCode = null;
let qrCodeTimestamp = null;

/**
 * Evolution API Webhook Handler
 * Receives events from Evolution API
 */
router.post('/', async (req, res) => {
    try {
        const { event, data, instance } = req.body;

        logger.info(`Webhook received: ${event} from ${instance}`);
        logger.info('Webhook data:', JSON.stringify(data).substring(0, 500));

        switch (event) {
            case 'messages.upsert':
            case 'MESSAGES_UPSERT':
                await handleMessageEvent(data);
                break;

            case 'connection.update':
            case 'CONNECTION_UPDATE':
                await handleConnectionEvent(data);
                break;

            case 'qrcode.updated':
            case 'QRCODE_UPDATED':
                await handleQRCodeEvent(data);
                break;

            default:
                logger.info(`Unhandled event: ${event}`);
        }

        res.status(200).json({ received: true });
    } catch (error) {
        logger.error('Webhook error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

/**
 * Handle QR code update events
 */
async function handleQRCodeEvent(data) {
    try {
        logger.info('QR Code update received!');
        logger.info('QR data keys:', Object.keys(data || {}));

        // Extract QR code from various possible locations in Evolution API v2 response
        let qrBase64 = null;

        if (data.qrcode) {
            qrBase64 = data.qrcode.base64 || data.qrcode;
        } else if (data.base64) {
            qrBase64 = data.base64;
        } else if (data.qr) {
            qrBase64 = data.qr.base64 || data.qr;
        } else if (typeof data === 'string') {
            qrBase64 = data;
        }

        if (qrBase64) {
            // Remove data:image prefix if present
            const cleanBase64 = qrBase64.replace(/^data:image\/[a-z]+;base64,/, '');
            cachedQRCode = cleanBase64;
            qrCodeTimestamp = Date.now();
            logger.info('QR Code cached successfully! Length:', cleanBase64.length);
        } else {
            logger.warn('No QR code found in webhook data:', JSON.stringify(data));
        }
    } catch (error) {
        logger.error('Error handling QR code event:', error);
    }
}

/**
 * Get cached QR code (called by evolution routes)
 */
function getCachedQRCode() {
    // QR codes expire after 60 seconds
    if (cachedQRCode && qrCodeTimestamp && (Date.now() - qrCodeTimestamp < 60000)) {
        return { base64: cachedQRCode };
    }
    return { count: 0 };
}

/**
 * Clear cached QR code
 */
function clearCachedQRCode() {
    cachedQRCode = null;
    qrCodeTimestamp = null;
}

/**
 * Handle incoming message events
 */
async function handleMessageEvent(data) {
    try {
        // Handle array or single message
        const messages = Array.isArray(data) ? data : [data];

        for (const messageData of messages) {
            // Skip if not a regular message or is from us
            const message = messageData.message || messageData;

            if (!message || message.fromMe) {
                continue;
            }

            // Get phone number (remove @s.whatsapp.net)
            const remoteJid = message.key?.remoteJid || messageData.remoteJid;
            if (!remoteJid) continue;

            const phone = remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '');

            // Skip group messages
            if (remoteJid.includes('@g.us')) {
                logger.info(`Skipping group message from ${phone}`);
                continue;
            }

            // Extract message text
            let text = '';
            const msgContent = message.message || {};

            if (msgContent.conversation) {
                text = msgContent.conversation;
            } else if (msgContent.extendedTextMessage?.text) {
                text = msgContent.extendedTextMessage.text;
            } else if (msgContent.buttonsResponseMessage?.selectedDisplayText) {
                text = msgContent.buttonsResponseMessage.selectedDisplayText;
            } else if (msgContent.listResponseMessage?.title) {
                text = msgContent.listResponseMessage.title;
            }

            if (!text) {
                logger.info(`No text content in message from ${phone}`);
                continue;
            }

            logger.info(`Processing message from ${phone}: ${text.substring(0, 50)}...`);

            // Process with chatbot
            await chatbotService.handleMessage(phone, text);
        }
    } catch (error) {
        logger.error('Error processing message event:', error);
    }
}

/**
 * Handle connection status updates
 */
async function handleConnectionEvent(data) {
    const state = data.state || data.status;
    logger.info(`Connection state: ${state}`);

    // Clear QR code when connected
    if (state === 'open') {
        clearCachedQRCode();
        logger.info('Connection established! QR code cache cleared.');
    }
}

// Export the router and helper functions
router.getCachedQRCode = getCachedQRCode;
router.clearCachedQRCode = clearCachedQRCode;

module.exports = router;
