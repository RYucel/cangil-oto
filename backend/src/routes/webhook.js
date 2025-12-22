const express = require('express');
const chatbotService = require('../services/chatbot');
const logger = require('../config/logger');

const router = express.Router();

/**
 * Evolution API Webhook Handler
 * Receives events from Evolution API
 */
router.post('/', async (req, res) => {
    try {
        const { event, data, instance } = req.body;

        logger.info(`Webhook received: ${event} from ${instance}`);

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
                logger.info('QR Code updated');
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

    // Could emit events or update status in database here
}

module.exports = router;
