const { EmailClient } = require('@azure/communication-email');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_ORIGINS = new Set([
    'https://www.contextworksdigital.com',
    'https://contextworksdigital.com',
    'http://localhost:4280',
    'http://localhost:3000'
]);

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

    const internalPoller = await client.beginSend({
        senderAddress: emailConfig.senderAddress,
        recipients: { to: [{ address: emailConfig.notifyTo }] },
        content: { subject, plainText, html }
    });

    const internalResult = await internalPoller.pollUntilDone();
    if (!internalResult || (internalResult.status && internalResult.status.toLowerCase() !== 'succeeded')) {
        throw new Error(`Contact notification email failed with status ${internalResult && internalResult.status ? internalResult.status : 'unknown'}.`);
    }

    const ackPoller = await client.beginSend({
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
    });

    const ackResult = await ackPoller.pollUntilDone();
    if (!ackResult || (ackResult.status && ackResult.status.toLowerCase() !== 'succeeded')) {
        throw new Error(`Contact acknowledgement email failed with status ${ackResult && ackResult.status ? ackResult.status : 'unknown'}.`);
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
        context.log.error('Error processing contact form:', {
            message: error && error.message ? error.message : 'Unknown error'
        });

        context.res.status = 500;
        context.res.body = {
            success: false,
            message: 'An error occurred while sending your message. Please try again later or email us directly at maruthikiran@contextworksdigital.com'
        };
    }
};
