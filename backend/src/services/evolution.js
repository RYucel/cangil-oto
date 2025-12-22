const axios = require('axios');
const logger = require('../config/logger');

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://evolution-api:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
const INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME || 'cangil-whatsapp';

const evolutionApi = axios.create({
    baseURL: EVOLUTION_API_URL,
    headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
    }
});

/**
 * Send a text message via WhatsApp
 */
async function sendMessage(to, text) {
    try {
        const response = await evolutionApi.post(`/message/sendText/${INSTANCE_NAME}`, {
            number: to,
            text: text
        });
        logger.info(`Message sent to ${to}`);
        return response.data;
    } catch (error) {
        logger.error(`Failed to send message to ${to}:`, error.message);
        throw error;
    }
}

/**
 * Send a message with buttons
 */
async function sendButtonMessage(to, text, buttons) {
    try {
        const response = await evolutionApi.post(`/message/sendButtons/${INSTANCE_NAME}`, {
            number: to,
            title: 'M. Cangil Motors',
            description: text,
            buttons: buttons.map((btn, i) => ({
                buttonId: `btn_${i}`,
                buttonText: { displayText: btn }
            }))
        });
        logger.info(`Button message sent to ${to}`);
        return response.data;
    } catch (error) {
        logger.error(`Failed to send button message to ${to}:`, error.message);
        // Fallback to text message if buttons not supported
        return sendMessage(to, text);
    }
}

/**
 * Send a list message
 */
async function sendListMessage(to, title, description, sections) {
    try {
        const response = await evolutionApi.post(`/message/sendList/${INSTANCE_NAME}`, {
            number: to,
            title: title,
            description: description,
            buttonText: 'Seç',
            sections: sections
        });
        logger.info(`List message sent to ${to}`);
        return response.data;
    } catch (error) {
        logger.error(`Failed to send list message to ${to}:`, error.message);
        // Fallback to text message
        return sendMessage(to, description);
    }
}

/**
 * Send an image with caption
 */
async function sendImage(to, imageUrl, caption) {
    try {
        const response = await evolutionApi.post(`/message/sendMedia/${INSTANCE_NAME}`, {
            number: to,
            mediatype: 'image',
            media: imageUrl,
            caption: caption
        });
        logger.info(`Image sent to ${to}`);
        return response.data;
    } catch (error) {
        logger.error(`Failed to send image to ${to}:`, error.message);
        throw error;
    }
}

/**
 * Get instance connection status
 */
async function getConnectionStatus() {
    try {
        const response = await evolutionApi.get(`/instance/connectionState/${INSTANCE_NAME}`);
        return response.data;
    } catch (error) {
        logger.error('Failed to get connection status:', error.message);
        throw error;
    }
}

/**
 * Get QR code for connection
 */
async function getQRCode() {
    try {
        const response = await evolutionApi.get(`/instance/connect/${INSTANCE_NAME}`);
        return response.data;
    } catch (error) {
        logger.error('Failed to get QR code:', error.message);
        throw error;
    }
}

/**
 * Create instance if not exists
 */
async function createInstance(webhookUrl) {
    try {
        const response = await evolutionApi.post('/instance/create', {
            instanceName: INSTANCE_NAME,
            qrcode: true,
            integration: 'WHATSAPP-BAILEYS',
            webhook: webhookUrl,
            webhookByEvents: false,
            webhookBase64: false,
            webhookEvents: [
                'MESSAGES_UPSERT',
                'QRCODE_UPDATED',
                'CONNECTION_UPDATE'
            ]
        });
        logger.info('Instance created successfully');
        return response.data;
    } catch (error) {
        if (error.response?.status === 403) {
            logger.info('Instance already exists');
            return { exists: true };
        }
        logger.error('Failed to create instance:', error.message);
        throw error;
    }
}

/**
 * Set webhook URL for instance
 */
async function setWebhook(webhookUrl) {
    try {
        const response = await evolutionApi.post(`/webhook/set/${INSTANCE_NAME}`, {
            url: webhookUrl,
            enabled: true,
            webhookByEvents: false,
            events: [
                'MESSAGES_UPSERT',
                'QRCODE_UPDATED',
                'CONNECTION_UPDATE'
            ]
        });
        logger.info('Webhook configured successfully');
        return response.data;
    } catch (error) {
        logger.error('Failed to set webhook:', error.message);
        throw error;
    }
}

/**
 * Logout and disconnect
 */
async function logout() {
    try {
        const response = await evolutionApi.delete(`/instance/logout/${INSTANCE_NAME}`);
        return response.data;
    } catch (error) {
        logger.error('Failed to logout:', error.message);
        throw error;
    }
}

module.exports = {
    sendMessage,
    sendButtonMessage,
    sendListMessage,
    sendImage,
    getConnectionStatus,
    getQRCode,
    createInstance,
    setWebhook,
    logout
};
