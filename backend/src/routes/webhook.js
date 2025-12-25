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
        logger.info('=== MESSAGE EVENT RECEIVED ===');
        logger.info('Raw data type:', typeof data);
        logger.info('Raw data:', JSON.stringify(data, null, 2).substring(0, 1000));

        // Evolution API v2 can send data in different formats
        let messages = [];

        if (Array.isArray(data)) {
            messages = data;
        } else if (data.data && Array.isArray(data.data)) {
            messages = data.data;
        } else if (data.message || data.key) {
            messages = [data];
        } else {
            logger.warn('Unknown message format, trying to extract...');
            messages = [data];
        }

        logger.info(`Processing ${messages.length} message(s)`);

        for (const messageData of messages) {
            logger.info('Message data keys:', Object.keys(messageData || {}));

            // Extract key and message from various possible locations
            const key = messageData.key || messageData.data?.key || {};
            const message = messageData.message || messageData.data?.message || messageData;

            logger.info('Key:', JSON.stringify(key));
            logger.info('FromMe:', key.fromMe);

            // Skip if from us
            if (key.fromMe === true) {
                logger.info('Skipping outgoing message');
                continue;
            }

            // Get phone number
            const remoteJid = key.remoteJid || messageData.remoteJid || messageData.data?.remoteJid;
            if (!remoteJid) {
                logger.warn('No remoteJid found in message');
                continue;
            }

            logger.info('RemoteJid:', remoteJid);

            // Skip group messages
            if (remoteJid.includes('@g.us')) {
                logger.info(`Skipping group message`);
                continue;
            }

            const phone = remoteJid.replace('@s.whatsapp.net', '');

            // Extract message text from various possible locations
            let text = '';
            const msgContent = message.message || message;

            logger.info('Message content keys:', Object.keys(msgContent || {}));

            if (typeof msgContent === 'string') {
                text = msgContent;
            } else if (msgContent.conversation) {
                text = msgContent.conversation;
            } else if (msgContent.extendedTextMessage?.text) {
                text = msgContent.extendedTextMessage.text;
            } else if (msgContent.buttonsResponseMessage?.selectedDisplayText) {
                text = msgContent.buttonsResponseMessage.selectedDisplayText;
            } else if (msgContent.listResponseMessage?.title) {
                text = msgContent.listResponseMessage.title;
            } else if (msgContent.text) {
                text = msgContent.text;
            }

            if (!text) {
                logger.info(`No text content found in message from ${phone}`);
                logger.info('Full message content:', JSON.stringify(msgContent).substring(0, 500));
                continue;
            }

            logger.info(`=== PROCESSING MESSAGE ===`);
            logger.info(`Phone: ${remoteJid}`);
            logger.info(`Text: ${text}`);
            logger.info(`Message Key: ${JSON.stringify(key)}`);

            // Process with chatbot - pass the full key for quoted replies
            await chatbotService.handleMessage(remoteJid, text, key);
            logger.info('Message processed successfully');
        }
    } catch (error) {
        logger.error('Error processing message event:', error);
        logger.error('Error stack:', error.stack);
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
