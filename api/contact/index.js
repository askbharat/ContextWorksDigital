const { EmailClient } = require('@azure/communication-email');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_ORIGINS = new Set([
    'https://www.contextworksdigital.com',
    'https://contextworksdigital.com',
    'http://localhost:4280',
    'http://localhost:3000'
]);

function logError(context, message, details) {
    if (context && context.log && typeof context.log.error === 'function') {
        context.log.error(message, details);
        return;
    }

    if (context && typeof context.log === 'function') {
        context.log(`${message} ${JSON.stringify(details || {})}`);
        return;
    }

    console.error(message, details || {});
}

function getAllowedOrigin(req) {
    const origin = req.headers.origin;
    if (typeof origin === 'string' && ALLOWED_ORIGINS.has(origin)) {
        return origin;
    }

    return 'https://www.contextworksdigital.com';
}

function sanitizeText(value) {
    return String(value || '').trim().replace(/\s+/g, ' ');
}

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getEmailConfig() {
    const connectionString = process.env.COMMUNICATION_SERVICES_CONNECTION_STRING;
    const senderAddress = process.env.SENDER_EMAIL_ADDRESS;
    const notifyTo = process.env.CONTACT_NOTIFY_TO || process.env.PATIENT_INTEREST_NOTIFY_TO || 'maruthikiran@contextworksdigital.com';

    if (!connectionString || !senderAddress || !notifyTo) {
        return null;
    }

    return { connectionString, senderAddress, notifyTo };
}

function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableEmailError(error) {
    const message = error && error.message ? error.message.toLowerCase() : '';
    const statusCode = error && error.statusCode ? error.statusCode : null;
    const code = error && error.code ? String(error.code).toLowerCase() : '';

    return statusCode === 429 || statusCode === 503 || code === 'toomanyrequests' || message.includes('please try again after');
}

async function sendEmailWithRetry(client, message, maxAttempts = 3) {
    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
            const poller = await client.beginSend(message);
            const result = await poller.pollUntilDone();

            if (!result || (result.status && result.status.toLowerCase() !== 'succeeded')) {
                throw new Error(`Email send failed with status ${result && result.status ? result.status : 'unknown'}.`);
            }

            return result;
        } catch (error) {
            lastError = error;
            if (attempt === maxAttempts || !isRetryableEmailError(error)) {
                break;
            }

            await wait(750 * attempt);
        }
    }

    throw lastError;
}

async function sendContactEmails(payload) {
    const emailConfig = getEmailConfig();
    if (!emailConfig) {
        throw new Error('Email configuration is missing.');
    }

    const client = new EmailClient(emailConfig.connectionString);
    const subject = `New Contact Form Submission - ${payload.name}`;
    const plainText = [
        'A new contact form submission was received from contextworksdigital.com.',
        '',
        `Name: ${payload.name}`,
        `Email: ${payload.email}`,
        `Organization: ${payload.organization || 'Not provided'}`,
        `Message: ${payload.message}`,
        `Timestamp (UTC): ${new Date().toISOString()}`
    ].join('\n');

    const html = `
        <h2>New Contact Form Submission</h2>
        <table cellpadding="6" cellspacing="0" border="0">
            <tr><td><strong>Name</strong></td><td>${escapeHtml(payload.name)}</td></tr>
            <tr><td><strong>Email</strong></td><td>${escapeHtml(payload.email)}</td></tr>
            <tr><td><strong>Organization</strong></td><td>${escapeHtml(payload.organization || 'Not provided')}</td></tr>
            <tr><td><strong>Message</strong></td><td>${escapeHtml(payload.message)}</td></tr>
            <tr><td><strong>Timestamp (UTC)</strong></td><td>${escapeHtml(new Date().toISOString())}</td></tr>
        </table>
    `;

    const internalResult = await sendEmailWithRetry(client, {
        senderAddress: emailConfig.senderAddress,
        recipients: { to: [{ address: emailConfig.notifyTo }] },
        content: { subject, plainText, html }
    });

    try {
        await sendEmailWithRetry(client, {
            senderAddress: emailConfig.senderAddress,
            recipients: { to: [{ address: payload.email }] },
            content: {
                subject: 'ContextWorks Digital - We received your message',
                plainText: [
                    `Hello ${payload.name},`,
                    '',
                    'Thank you for contacting ContextWorks Digital.',
                    'We have received your message and will get back to you within 1 business day.',
                    '',
                    'Regards,',
                    'ContextWorks Digital Systems Pvt. Ltd.'
                ].join('\n'),
                html: `
                    <p>Hello ${escapeHtml(payload.name)},</p>
                    <p>Thank you for contacting <strong>ContextWorks Digital</strong>.</p>
                    <p>We have received your message and will get back to you within 1 business day.</p>
                    <p>Regards,<br/>ContextWorks Digital Systems Pvt. Ltd.</p>
                `
            }
        }, 2);
    } catch (error) {
        console.warn('Contact acknowledgement email failed', {
            message: error && error.message ? error.message : 'Unknown error'
        });
    }
}

module.exports = async function (context, req) {
    context.log('Contact form submission received');

    context.res = {
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': getAllowedOrigin(req),
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Cache-Control': 'no-store'
        }
    };

    if (req.method === 'OPTIONS') {
        context.res.status = 200;
        return;
    }

    try {
        if (!req.body) {
            context.res.status = 400;
            context.res.body = {
                success: false,
                message: 'Request body is missing'
            };
            return;
        }

        const name = sanitizeText(req.body.name);
        const email = sanitizeText(req.body.email).toLowerCase();
        const organization = sanitizeText(req.body.organization);
        const message = sanitizeText(req.body.message);
        const consent = req.body.consent === true || req.body.consent === 'yes';

        if (!name || !email || !message || !consent) {
            context.res.status = 400;
            context.res.body = {
                success: false,
                message: 'Missing required fields'
            };
            return;
        }

        if (!EMAIL_REGEX.test(email)) {
            context.res.status = 400;
            context.res.body = {
                success: false,
                message: 'Invalid email address'
            };
            return;
        }

        await sendContactEmails({
            name,
            email,
            organization,
            message,
            consent
        });

        context.res.status = 200;
        context.res.body = {
            success: true,
            message: 'Your message has been sent successfully. We will get back to you within 1 business day.'
        };
    } catch (error) {
        logError(context, 'Error processing contact form:', {
            message: error && error.message ? error.message : 'Unknown error'
        });

        context.res.status = 200;
        context.res.body = {
            success: true,
            message: 'Your message has been received. If you do not hear back within 1 business day, please email maruthikiran@contextworksdigital.com directly.',
            deliveryStatus: 'failed'
        };
    }
};
