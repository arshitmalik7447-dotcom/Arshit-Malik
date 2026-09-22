# Tiona Assistant - Hostinger Deployment Guide

This guide explains how to deploy **Tiona Assistant** (Node.js full-stack backend + embeddable WordPress chatbot widget) on **Hostinger**.

---

## 1. Hosting Architecture Overview

Hostinger supports two deployment models for Tiona Assistant:

1. **Hostinger VPS / Cloud Server (Recommended for Full Production)**:
   - Run Node.js with PM2 or Docker.
   - Run full PostgreSQL or embedded SQLite/PGlite.
   - Embed script onto your WordPress site (`tionasilver.com`) via `https://your-vps-subdomain.com/widget.js`.

2. **Hostinger Business Web Hosting / Cloud Hosting (Node.js Application Manager via hPanel)**:
   - Use Hostinger's built-in **Node.js Selector** / **Node.js App** feature in hPanel.
   - Runs on Node.js 18 or 20+ via Passenger / reverse proxy.

3. **Frontend-Only on WordPress + Hosted Backend**:
   - You can also keep the backend running on any Node host (VPS, Render, Railway, or Cloud Run) and embed `<script async src="https://YOUR_BACKEND/widget.js" data-api="https://YOUR_BACKEND"></script>` directly into your Hostinger WordPress site (`tionasilver.com`) without modifying your WordPress theme code.

---

## 2. Option A: Deploying on Hostinger VPS (Ubuntu / Debian)

This is the cleanest and fastest setup for Hostinger VPS (KVM 1 / KVM 2 / KVM 4).

### Step 1: Connect to your Hostinger VPS via SSH
```bash
ssh root@YOUR_HOSTINGER_VPS_IP
```

### Step 2: Install Node.js (v20 LTS), Git, and PM2
```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs git build-essential

# Verify versions
node -v
npm -v

# Install PM2 process manager
npm install -g pm2
```

### Step 3: Clone / Upload the Code to the VPS
Upload your repository or ZIP to `/var/www/tiona-assistant`:
```bash
mkdir -p /var/www/tiona-assistant
cd /var/www/tiona-assistant
# (Copy files or clone git repository here)
```

### Step 4: Install Dependencies & Build
```bash
cd /var/www/tiona-assistant
npm install
npm run build
```
This builds both the static front-end assets into `dist/` and compiles `server.ts` into `dist/server.cjs`.

### Step 5: Configure Environment Variables
Create `/var/www/tiona-assistant/.env`:
```bash
cp .env.example .env
nano .env
```
Fill in your configuration:
```ini
PORT=3000
NODE_ENV=production
ADMIN_API_KEY=your_secure_admin_password
LEAD_NOTIFICATION_EMAIL=arshitmalik@tionasilver.com

# If using Hostinger Titan Email for sending enquiries:
SMTP_HOST=smtp.titan.email
SMTP_PORT=465
SMTP_USER=no-reply@tionasilver.com
SMTP_PASS=your_email_password
SMTP_FROM=Tiona Assistant <no-reply@tionasilver.com>

# Optional: Hostinger PostgreSQL / Remote Database URL:
# DATABASE_URL=postgres://user:password@localhost:5432/tionadb
# If left blank, the app will use embedded persistent storage in ./data/tiona_pg
```

### Step 6: Start with PM2
```bash
pm2 start dist/server.cjs --name "tiona-assistant"
pm2 save
pm2 startup
```

### Step 7: Configure Nginx Reverse Proxy with Free SSL (Certbot)
Install Nginx and Certbot:
```bash
apt install -y nginx certbot python3-certbot-nginx
```

Create `/etc/nginx/sites-available/assistant.tionasilver.com`:
```nginx
server {
    server_name assistant.tionasilver.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and obtain SSL:
```bash
ln -s /etc/nginx/sites-available/assistant.tionasilver.com /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# Run certbot to install free Let's Encrypt SSL
certbot --nginx -d assistant.tionasilver.com
```

Your backend and widget are now live at `https://assistant.tionasilver.com`!

---

## 3. Option B: Hostinger hPanel "Node.js Application"

If your Hostinger plan includes the **Node.js** icon in hPanel:

1. In Hostinger hPanel, go to **Websites** > **Manage** > **Advanced** > **Node.js**.
2. Click **Create Application**:
   - **Node.js version**: Choose `20.x` or `18.x`.
   - **Application root**: `tiona-assistant`
   - **Application URL**: `assistant.tionasilver.com` (or your domain/subdomain).
   - **Application startup file**: `dist/server.cjs` (or `server.js` if running pre-bundled).
3. Upload project files via File Manager or Git deployment.
4. Run `npm install` and `npm run build` in the hPanel Terminal.
5. In hPanel Environment Variables, add:
   - `NODE_ENV=production`
   - `ADMIN_API_KEY=your_secure_password`
   - `LEAD_NOTIFICATION_EMAIL=arshitmalik@tionasilver.com`
   - (SMTP credentials if using Hostinger Titan email)
6. Click **Restart Application**.

---

## 4. How to Embed on WordPress (tionasilver.com)

Once deployed, add this **one single script** to your WordPress site without modifying any PHP files:

```html
<!-- Tiona Assistant WordPress Embed (Shadow DOM) -->
<script async 
  src="https://assistant.tionasilver.com/widget.js" 
  data-api="https://assistant.tionasilver.com">
</script>
```

### Installation Methods on WordPress:
1. **Method 1 (Recommended)**: Install free plugin **WPCode** (Insert Headers and Footers) -> Go to **Code Snippets** -> **Header & Footer** -> Paste the snippet into the **Footer** box -> Save.
2. **Method 2**: In **Elementor** (if installed): Go to **Elementor** -> **Custom Code** -> Add New -> Location: `End of <body>` -> Paste snippet -> Publish.
3. **Method 3**: In your active child theme's `footer.php`, paste right before `</body>`.

---

## 5. Hostinger Titan Email SMTP Settings for Lead Notifications

Hostinger provides professional email powered by Titan. Here are the exact SMTP parameters to place in `.env`:

| Setting | Value |
|---|---|
| `SMTP_HOST` | `smtp.titan.email` |
| `SMTP_PORT` | `465` (SSL) or `587` (TLS) |
| `SMTP_USER` | Your Hostinger email (e.g., `no-reply@tionasilver.com`) |
| `SMTP_PASS` | Your Hostinger email account password |
| `SMTP_FROM` | `Tiona Assistant <no-reply@tionasilver.com>` |
| `LEAD_NOTIFICATION_EMAIL` | `arshitmalik@tionasilver.com` |

---

## 6. Verification Checklist

- [ ] Health check: `curl https://assistant.tionasilver.com/api/health` returns `{"status":"ok"}`
- [ ] Widget JS loads: Open `https://assistant.tionasilver.com/widget.js` in browser
- [ ] Products endpoint: `curl https://assistant.tionasilver.com/api/products` returns catalogue items
- [ ] Chat endpoint: Test enquiry or question through widget on WordPress
- [ ] Admin Portal: Access `https://assistant.tionasilver.com` to review enquiries and delivery logs
