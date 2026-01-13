# ContextWorks Digital - Microsoft AI & Automation Consulting

A professional B2B consulting website for Microsoft AI, Azure, and Power Platform services targeting healthcare and professional service organizations.

## Project Overview

This website showcases:
- AI & Power Platform Automation services
- Microsoft Copilot Readiness & Governance consulting
- Azure AI & Solution Architecture
- Industry-specific solutions for Healthcare, Legal, and Accounting sectors

## Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Hosting**: Azure Static Web Apps
- **Design**: Responsive, mobile-first design with enterprise-grade appearance

## Project Structure

```
ContextWorksDigital/
├── index.html              # Homepage (trust-first design)
├── services.html           # Productized consulting offerings
├── industries.html         # Industry-specific solutions
├── about.html              # Founder story and company values
├── how-we-work.html        # 5-stage engagement process
├── contact.html            # Contact form and discovery call booking
├── css/
│   └── style.css          # Complete styling
├── js/
│   └── main.js            # JavaScript functionality
├── images/                 # Image assets
└── staticwebapp.config.json  # Azure Static Web Apps configuration

```

## Deployment to Azure Static Web Apps

### Prerequisites
- Azure subscription
- GitHub account (or Azure DevOps)
- Git installed locally
- Azure CLI installed (optional)

### Deployment Steps

1. **Initialize Git Repository** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit - ContextWorks Digital website"
   ```

2. **Create GitHub Repository** and push:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/contextworks-digital.git
   git branch -M main
   git push -u origin main
   ```

3. **Deploy to Azure Static Web Apps**:
   - Go to [Azure Portal](https://portal.azure.com)
   - Click "Create a resource" → Search "Static Web App"
   - Fill in the details:
     - **Resource Group**: Create new or use existing
     - **Name**: contextworks-digital
     - **Region**: Choose closest to your target audience
     - **Source**: GitHub
     - **GitHub Account**: Authorize and select your account
     - **Repository**: Select your repository
     - **Branch**: main
     - **Build Presets**: Custom
     - **App location**: /
     - **Api location**: (leave empty)
     - **Output location**: (leave empty)
   - Click "Review + Create" → "Create"

4. **Automatic Deployment**:
   - Azure will create a GitHub Actions workflow automatically
   - The website will be deployed on every commit to the main branch
   - Get your URL: `https://[your-site-name].azurestaticapps.net`

### Custom Domain Setup (Optional)

1. In Azure Portal, go to your Static Web App resource
2. Click "Custom domains" in the left menu
3. Click "Add" and follow the instructions to:
   - Add CNAME record to your DNS provider
   - Validate domain ownership
   - Enable HTTPS (automatic with Let's Encrypt)

## Local Development

Simply open `index.html` in a web browser, or use a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js (with npx)
npx http-server -p 8000

# Using PHP
php -S localhost:8000
```

Visit: `http://localhost:8000`

## Features

- ✅ Trust-first messaging for B2B consulting
- ✅ SEO optimized with meta descriptions
- ✅ Mobile responsive design
- ✅ Professional enterprise appearance
- ✅ Compliance-aware language (HIPAA, GDPR, SOC 2)
- ✅ Clear CTAs focused on discovery calls
- ✅ Fixed-scope engagement positioning
- ✅ Security headers configured

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Security

- Content Security Policy headers
- X-Frame-Options protection
- HTTPS enforced (when deployed)
- No client-side data storage
- Form submissions require server-side implementation

## Next Steps

1. **Implement Form Handling**:
   - Add Azure Functions for contact form processing
   - Integrate with email service (SendGrid, Azure Communication Services)
   - Add to CRM (HubSpot, Dynamics 365)

2. **Add Analytics**:
   - Microsoft Clarity for user behavior insights
   - Azure Application Insights for performance monitoring
   - Google Analytics (optional)

3. **Calendar Integration**:
   - Replace placeholder with Calendly or Microsoft Bookings
   - Embed booking widget in contact page

4. **Content Management**:
   - Consider headless CMS if content updates are frequent
   - Current setup allows easy HTML edits

## Support

For questions or issues with deployment:
- Azure Static Web Apps Docs: https://docs.microsoft.com/azure/static-web-apps/
- GitHub Issues: [Your repository issues page]

## License

© 2026 ContextWorks Digital. All rights reserved.
