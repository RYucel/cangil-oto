const axios = require('axios');
const logger = require('../config/logger');

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://evolution-api:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
const INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME || 'cangil-whatsapp';

// Log configuration on startup
logger.info(`Evolution API Config: URL=${EVOLUTION_API_URL}, KEY=${EVOLUTION_API_KEY ? 'SET' : 'NOT SET'}, INSTANCE=${INSTANCE_NAME}`);

const evolutionApi = axios.create({
    baseURL: EVOLUTION_API_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
    }
});

/**
 * Send a text message via WhatsApp
 * Uses quoted reply for LID format to bypass the limitation
 */
async function sendMessage(to, text) {
    try {
        // Check if we have a stored message key for quoted reply
        const messageKey = global.lastMessageKey?.[to];

        // For LID format, we MUST use quoted reply
        const isLid = to.includes('@lid');

        let requestBody;

        if (isLid && messageKey) {
            // Use quoted reply for LID - this bypasses the number validation
            logger.info(`Sending QUOTED reply to LID: ${to}`);
            logger.info(`Using message key: ${JSON.stringify(messageKey)}`);

            requestBody = {
                number: to,
                text: text,
                quoted: {
                    key: messageKey
                }
            };
        } else if (isLid) {
            // LID without message key - try direct send (may fail)
            logger.warn(`LID format without message key, trying direct send: ${to}`);
            requestBody = {
                number: to,
                text: text
            };
        } else if (to.includes('@s.whatsapp.net')) {
            // Regular JID - strip suffix
            const number = to.replace('@s.whatsapp.net', '');
            logger.info(`Sending message to number: ${number}`);
            requestBody = {
                number: number,
                text: text
            };
        } else {
            // Plain phone number
            logger.info(`Sending message to: ${to}`);
            requestBody = {
                number: to,
                text: text
            };
        }

        logger.info(`Request body: ${JSON.stringify(requestBody)}`);

        const response = await evolutionApi.post(`/message/sendText/${INSTANCE_NAME}`, requestBody);
        logger.info(`Message sent to ${to}`);
        return response.data;
    } catch (error) {
        logger.error(`Failed to send message to ${to}:`, error.message);
        if (error.response?.data) {
            logger.error('Error response data:', JSON.stringify(error.response.data));
        }
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
        logger.info(`Checking connection status for instance: ${INSTANCE_NAME}`);
        const response = await evolutionApi.get(`/instance/connectionState/${INSTANCE_NAME}`);
        logger.info('Connection status response:', JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        logger.error('Failed to get connection status:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            url: `${EVOLUTION_API_URL}/instance/connectionState/${INSTANCE_NAME}`
        });
        throw error;
    }
}

/**
 * Get QR code for connection
 * Evolution API v2 uses /instance/connect/{instance} endpoint
 * which returns QR code data
 */
async function getQRCode() {
    try {
        logger.info(`Getting QR code for instance: ${INSTANCE_NAME}`);

        // Try fetchInstances first to get QR code from instance data
        const instanceRes = await evolutionApi.get(`/instance/fetchInstances`, {
            params: { instanceName: INSTANCE_NAME }
        });

        logger.info('Instance data received:', JSON.stringify(instanceRes.data));

        // Check for QR code in instance data
        if (instanceRes.data && Array.isArray(instanceRes.data)) {
            const instance = instanceRes.data.find(i => i.name === INSTANCE_NAME || i.instance?.instanceName === INSTANCE_NAME);
            if (instance) {
                // Look for QR in various possible locations
                const qr = instance.qrcode || instance.qr || instance.instance?.qrcode;
                if (qr) {
                    logger.info('Found QR code in instance data');
                    // Handle both base64 with prefix and without
                    const base64 = qr.base64 || qr;
                    const cleanBase64 = base64.replace(/^data:image\/[a-z]+;base64,/, '');
                    return { base64: cleanBase64 };
                }
            }
        }

        // If no QR in instance data, try connect endpoint
        logger.info('Trying connect endpoint...');
        const connectRes = await evolutionApi.get(`/instance/connect/${INSTANCE_NAME}`);
        logger.info('Connect response:', JSON.stringify(connectRes.data));

        // Extract QR code from various possible response formats
        let qrBase64 = null;
        if (connectRes.data.qrcode) {
            qrBase64 = connectRes.data.qrcode.base64 || connectRes.data.qrcode;
        } else if (connectRes.data.base64) {
            qrBase64 = connectRes.data.base64;
        } else if (connectRes.data.code) {
            // Some versions return the raw QR string
            qrBase64 = connectRes.data.code;
        } else if (typeof connectRes.data === 'string') {
            qrBase64 = connectRes.data;
        }

        if (qrBase64) {
            // Clean base64 prefix if present
            const cleanBase64 = qrBase64.replace(/^data:image\/[a-z]+;base64,/, '');
            return { base64: cleanBase64 };
        }

        logger.warn('No QR code found in response');
        return { count: 0 };
    } catch (error) {
        logger.error('Failed to get QR code:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data
        });
        throw error;
    }
}

/**
 * Create instance if not exists
 */
async function createInstance(webhookUrl) {
    try {
        logger.info(`Creating instance: ${INSTANCE_NAME}, webhook: ${webhookUrl}`);
        logger.info(`Using Evolution API URL: ${EVOLUTION_API_URL}`);

        const requestBody = {
            instanceName: INSTANCE_NAME,
            qrcode: true,
            integration: 'WHATSAPP-BAILEYS',
            webhook: {
                url: webhookUrl,
                byEvents: false,
                base64: false,
                events: [
                    'MESSAGES_UPSERT',
                    'QRCODE_UPDATED',
                    'CONNECTION_UPDATE'
                ]
            }
        };

        logger.info('Request body:', JSON.stringify(requestBody));

        const response = await evolutionApi.post('/instance/create', requestBody);
        logger.info('Instance created successfully:', JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        logger.error('Failed to create instance - DETAILED:', {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            code: error.code,
            url: `${EVOLUTION_API_URL}/instance/create`
        });

        if (error.response?.status === 403) {
            logger.info('Instance already exists (403), returning success');
            return { exists: true };
        }

        // If 409 Conflict, instance already exists
        if (error.response?.status === 409) {
            logger.info('Instance already exists (409), returning success');
            return { exists: true };
        }

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

/**
 * Delete instance completely
 */
async function deleteInstance() {
    try {
        logger.info(`Deleting instance: ${INSTANCE_NAME}`);
        const response = await evolutionApi.delete(`/instance/delete/${INSTANCE_NAME}`);
        logger.info('Instance deleted successfully');
        return response.data;
    } catch (error) {
        logger.error('Failed to delete instance:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data
        });
        // If 404, instance doesn't exist which is fine
        if (error.response?.status === 404) {
            return { deleted: true, wasNotFound: true };
        }
        throw error;
    }
}

/**
 * Restart instance (delete and recreate)
 */
async function restartInstance(webhookUrl) {
    try {
        logger.info('Restarting instance...');

        // First try to delete
        try {
            await deleteInstance();
            // Wait a bit for cleanup
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (e) {
            logger.warn('Delete failed, proceeding anyway:', e.message);
        }

        // Now create fresh
        return await createInstance(webhookUrl);
    } catch (error) {
        logger.error('Failed to restart instance:', error.message);
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
    logout,
    deleteInstance,
    restartInstance
};
