# Azure Function Contact Form Setup Instructions

## Prerequisites
- Azure subscription
- Azure CLI installed
- Node.js 18.x or later

## Step 1: Create Azure Communication Services Resource

1. **Create Communication Services in Azure Portal:**
   ```bash
   az communication create \
     --name contextworks-communication \
     --location global \
     --data-location unitedstates \
     --resource-group <your-resource-group>
   ```

2. **Get the connection string:**
   ```bash
   az communication list-key \
     --name contextworks-communication \
     --resource-group <your-resource-group>
   ```
   Copy the `primaryConnectionString`

3. **Set up Email Domain:**
   - In Azure Portal, go to your Communication Services resource
   - Navigate to "Email" → "Domains"
   - Click "Add Domain"
   - Choose either:
     - **Azure Managed Domain** (quick setup, uses *.azurecomm.net)
     - **Custom Domain** (requires DNS configuration, uses your domain)

4. **Configure Email Domain:**
   - If using Azure Managed Domain, it will provide a sender address like:
     `DoNotReply@xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.azurecomm.net`
   - If using Custom Domain (contextworksdigital.com):
     - Add DNS records as shown in portal
     - Wait for verification (can take up to 24 hours)
     - Sender address will be: `noreply@contextworksdigital.com`

## Step 2: Configure Azure Static Web App

1. **Update Static Web App Configuration:**
   
   Edit `staticwebapp.config.json`:
   ```json
   {
     "routes": [
       {
         "route": "/api/*",
         "allowedRoles": ["anonymous"]
       }
     ],
     "navigationFallback": {
       "rewrite": "/index.html"
     }
   }
   ```

2. **Deploy the API:**
   
   The Azure Static Web Apps will automatically deploy the `/api` folder when you push to GitHub.

## Step 3: Configure Environment Variables in Azure

1. **Go to Azure Portal → Your Static Web App → Configuration**

2. **Add Application Settings:**
   - Name: `COMMUNICATION_SERVICES_CONNECTION_STRING`
     Value: `<your-connection-string-from-step-1>`
   
   - Name: `SENDER_EMAIL_ADDRESS`
     Value: `DoNotReply@xxxxxxxx.azurecomm.net` (or your custom domain email)

3. **Save and restart**

## Step 4: Install Dependencies Locally (for testing)

```bash
cd api
npm install
```

## Step 5: Test Locally (Optional)

1. **Update `local.settings.json` with your actual values**

2. **Start Azure Functions locally:**
   ```bash
   cd api
   npm start
   ```

3. **Test the endpoint:**
   ```bash
   curl -X POST http://localhost:7071/api/contact \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test User",
       "email": "test@example.com",
       "organization": "Test Org",
       "message": "This is a test message",
       "consent": "yes"
     }'
   ```

## Step 6: Deploy to Production

1. **Commit and push all changes:**
   ```bash
   git add api/ staticwebapp.config.json contact.html
   git commit -m "Add Azure Function for contact form"
   git push origin main
   ```

2. **Azure Static Web Apps will automatically:**
   - Build and deploy the API
   - Configure routing
   - Connect to your Communication Services

## Step 7: Verify Deployment

1. **Check GitHub Actions:**
   - Go to your GitHub repository
   - Click "Actions" tab
   - Verify the deployment succeeded

2. **Test the live form:**
   - Visit: https://white-meadow-00535f600.1.azurestaticapps.net/contact.html
   - Submit a test message
   - Check maruthikiran@contextworksdigital.com for the email

## Troubleshooting

### Email not received?
- Check Communication Services → Email → Logs in Azure Portal
- Verify connection string and sender address in Static Web App Configuration
- Check spam/junk folder

### API not working?
- Check Azure Static Web App → Functions in Azure Portal
- View function logs for errors
- Verify CORS settings if testing from different domain

### 404 on /api/contact?
- Ensure `api/` folder is committed to git
- Check `staticwebapp.config.json` routes configuration
- Verify GitHub Actions deployment completed successfully

## Cost Estimation

- **Azure Communication Services Email:** 
  - First 250 emails/month: FREE
  - After that: $0.00025 per email
  
- **Azure Functions (in Static Web Apps):** 
  - Included in Static Web Apps pricing (Free tier available)

For your use case (contact form), this will essentially be **FREE** unless you receive 250+ form submissions per month.

## Security Considerations

1. **Rate Limiting:** Consider adding rate limiting to prevent spam
2. **CAPTCHA:** Add reCAPTCHA or hCaptcha for bot protection
3. **Input Validation:** Already implemented in the function
4. **Email Sanitization:** HTML encoding is handled automatically

## Next Steps

1. Set up custom domain email if desired
2. Add email notification for successful submissions (auto-reply)
3. Integrate with CRM (optional)
4. Add analytics tracking for form submissions
