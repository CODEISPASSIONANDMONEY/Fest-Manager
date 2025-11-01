# Fest Manager - Deployment Guide

## 🚀 Quick Deployment Options

This guide covers deploying your Fest Manager application to various cloud platforms.

---

## Option 1: Render (Recommended - Free Tier Available)

### Prerequisites

- GitHub account (✅ Already done)
- Render account (Sign up at https://render.com)
- MySQL database (can use Render's PostgreSQL or external MySQL)

### Steps:

1. **Create a Web Service on Render:**

   - Go to https://render.com/dashboard
   - Click "New +" → "Web Service"
   - Connect your GitHub repository: `CODEISPASSIONANDMONEY/Fest-Manager`
   - Configure:
     - **Name:** fest-manager
     - **Environment:** Node
     - **Build Command:** `npm install`
     - **Start Command:** `npm start`
     - **Plan:** Free

2. **Set Environment Variables:**
   Add these in Render Dashboard → Environment:

   ```
   NODE_ENV=production
   PORT=3000
   DB_HOST=<your-mysql-host>
   DB_PORT=3306
   DB_NAME=fest_manager
   DB_USER=<your-db-username>
   DB_PASSWORD=<your-db-password>
   JWT_SECRET=<generate-random-string>
   SESSION_SECRET=<generate-random-string>
   CLIENT_URL=<your-render-url>
   ```

3. **Database Options:**

   - **Option A:** Use Railway/PlanetScale for free MySQL
   - **Option B:** Use Render PostgreSQL (modify your app to use PostgreSQL)
   - **Option C:** Use your own MySQL server

4. **Deploy:**
   - Click "Create Web Service"
   - Render will automatically deploy from your GitHub repo

---

## Option 2: Railway (Free Tier Available)

### Steps:

1. **Create Railway Account:**

   - Go to https://railway.app
   - Sign in with GitHub

2. **Create New Project:**

   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `CODEISPASSIONANDMONEY/Fest-Manager`

3. **Add MySQL Database:**

   - Click "+ New"
   - Select "Database" → "MySQL"
   - Railway will provision a MySQL database

4. **Configure Environment Variables:**

   - Click on your service
   - Go to "Variables" tab
   - Add the same variables as above (Railway auto-fills database variables)

5. **Deploy:**
   - Railway automatically deploys on push to main branch

---

## Option 3: Heroku (Paid)

### Steps:

1. **Install Heroku CLI:**

   ```powershell
   # Download from https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Login and Create App:**

   ```bash
   heroku login
   heroku create fest-manager-app
   ```

3. **Add MySQL Add-on:**

   ```bash
   heroku addons:create jawsdb:kitefin
   ```

4. **Set Environment Variables:**

   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your-secret-here
   heroku config:set SESSION_SECRET=your-session-secret
   ```

5. **Deploy:**
   ```bash
   git push heroku main
   ```

---

## Option 4: Vercel (Serverless - Requires Modifications)

Vercel is great for frontend, but requires serverless function setup for backend.

---

## Option 5: DigitalOcean App Platform

### Steps:

1. **Create DigitalOcean Account:**

   - Go to https://www.digitalocean.com

2. **Create App:**

   - Apps → Create App
   - Connect GitHub: `CODEISPASSIONANDMONEY/Fest-Manager`
   - Select branch: `main`

3. **Configure:**

   - Auto-detected as Node.js
   - Build Command: `npm install`
   - Run Command: `npm start`

4. **Add Database:**

   - Add a Managed MySQL Database
   - Configure environment variables

5. **Deploy:**
   - Click "Create Resources"

---

## 📋 Pre-Deployment Checklist

- [ ] Update CORS settings in `server.js`
- [ ] Set proper environment variables
- [ ] Database is accessible from deployment platform
- [ ] Test database connection
- [ ] Update `CLIENT_URL` in environment variables
- [ ] Remove any hardcoded secrets
- [ ] Set up database migrations/initialization
- [ ] Configure file upload storage (local won't work on some platforms)

---

## 🗄️ Database Setup

After deployment, initialize your database:

1. **SSH into your server or use platform console:**
   ```bash
   npm run init-db
   ```

Or run SQL directly in your database:

- Create tables using Sequelize sync
- Insert initial admin user
- Set up teams and initial data

---

## 🔐 Security Notes

1. **Always use environment variables for:**

   - Database credentials
   - JWT secrets
   - API keys

2. **Enable HTTPS** (most platforms do this automatically)

3. **Set up proper CORS** for your frontend domain

4. **Use strong JWT and session secrets**

---

## 📦 File Upload Configuration

For production, consider using:

- **AWS S3** for file storage
- **Cloudinary** for images
- **DigitalOcean Spaces**

The current local file storage won't persist on serverless platforms.

---

## 🔗 Useful Links

- **Render:** https://render.com
- **Railway:** https://railway.app
- **Heroku:** https://heroku.com
- **DigitalOcean:** https://digitalocean.com
- **PlanetScale (MySQL):** https://planetscale.com
- **MongoDB Atlas:** https://mongodb.com/atlas (if switching to MongoDB)

---

## Need Help?

Check the logs on your deployment platform if something goes wrong!
