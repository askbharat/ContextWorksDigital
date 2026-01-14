const { EmailClient } = require("@azure/communication-email");

module.exports = async function (context, req) {
    context.log('Contact form submission received');

    // CORS headers
    context.res = {
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    };

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        context.res.status = 200;
        return;
    }

    try {
        // Validate required fields
        const { name, email, organization, message, consent } = req.body;

        if (!name || !email || !message || !consent) {
            context.res.status = 400;
            context.res.body = {
                success: false,
                message: 'Missing required fields'
            };
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            context.res.status = 400;
            context.res.body = {
                success: false,
                message: 'Invalid email address'
            };
            return;
        }

        // Initialize Azure Communication Services Email Client
        const connectionString = process.env.COMMUNICATION_SERVICES_CONNECTION_STRING;
        const emailClient = new EmailClient(connectionString);

        // Compose email
        const emailMessage = {
            senderAddress: process.env.SENDER_EMAIL_ADDRESS, // e.g., "DoNotReply@<your-domain>.azurecomm.net"
            content: {
                subject: "New Contact Form Submission - ContextWorks Digital",
                plainText: `
New contact form submission:

Name: ${name}
Email: ${email}
Organization: ${organization || 'Not provided'}

Message:
${message}

Consent: Yes
                `.trim(),
                html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0078d4 0%, #005a9e 100%); color: white; padding: 20px; border-radius: 5px 5px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #0078d4; }
        .value { margin-top: 5px; }
        .message-box { background: white; padding: 15px; border-left: 4px solid #0078d4; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>New Contact Form Submission</h2>
        </div>
        <div class="content">
            <div class="field">
                <div class="label">Name:</div>
                <div class="value">${name}</div>
            </div>
            <div class="field">
                <div class="label">Email:</div>
                <div class="value"><a href="mailto:${email}">${email}</a></div>
            </div>
            <div class="field">
                <div class="label">Organization:</div>
                <div class="value">${organization || 'Not provided'}</div>
            </div>
            <div class="field">
                <div class="label">Message:</div>
                <div class="message-box">${message.replace(/\n/g, '<br>')}</div>
            </div>
            <div class="field">
                <div class="label">Consent:</div>
                <div class="value">Yes - Agreed to be contacted</div>
            </div>
        </div>
    </div>
</body>
</html>
                `.trim()
            },
            recipients: {
                to: [
                    {
                        address: "maruthikiran@contextworksdigital.com",
                        displayName: "ContextWorks Digital"
                    }
                ]
            }
        };

        // Send email
        const poller = await emailClient.beginSend(emailMessage);
        const result = await poller.pollUntilDone();

        context.log('Email sent successfully:', result);

        context.res.status = 200;
        context.res.body = {
            success: true,
            message: 'Your message has been sent successfully. We will get back to you within 1 business day.'
        };

    } catch (error) {
        context.log.error('Error processing contact form:', error);
        
        context.res.status = 500;
        context.res.body = {
            success: false,
            message: 'An error occurred while sending your message. Please try again later or email us directly at maruthikiran@contextworksdigital.com'
        };
    }
};
