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
        // Check if req.body exists
        if (!req.body) {
            context.log.error('Request body is undefined');
            context.res.status = 400;
            context.res.body = {
                success: false,
                message: 'Request body is missing'
            };
            return;
        }

        // Validate required fields
        const { name, email, organization, message, consent } = req.body;

        context.log('Request body:', { name, email, organization: organization || 'Not provided', hasMessage: !!message, consent });

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

        // Log the submission for now (until email service is configured)
        context.log('Contact Form Submission:', {
            timestamp: new Date().toISOString(),
            name,
            email,
            organization: organization || 'Not provided',
            message
        });

        // TODO: In production, you can:
        // 1. Store in Cosmos DB for retrieval
        // 2. Integrate with SendGrid, Azure Communication Services, or another email service
        // 3. Send to a webhook or notification service

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
