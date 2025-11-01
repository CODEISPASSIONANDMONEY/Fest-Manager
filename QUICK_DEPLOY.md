# 🚀 Quick Deploy to Render

## Step 1: Sign Up for Render

1. Go to https://render.com
2. Click "Get Started"
3. Sign up with your GitHub account

## Step 2: Deploy Your App

### Option A: One-Click Deploy (Easiest)

1. Go to https://render.com/deploy
2. Enter your GitHub repo URL: `https://github.com/CODEISPASSIONANDMONEY/Fest-Manager`
3. Render will automatically detect the `render.yaml` file
4. Click "Apply" to deploy

### Option B: Manual Deploy

1. Login to Render Dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub account
4. Select repository: `CODEISPASSIONANDMONEY/Fest-Manager`
5. Configure:
   - **Name:** fest-manager
   - **Environment:** Node
   - **Branch:** main
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free (or starter for better performance)

## Step 3: Set Up Database

### Option 1: PlanetScale (Free MySQL)

1. Go to https://planetscale.com
2. Create account and new database
3. Get connection details
4. Copy connection string

### Option 2: Railway MySQL (Free)

1. Go to https://railway.app
2. Create new project → Add MySQL
3. Copy connection details

### Option 3: Render PostgreSQL (Free)

Note: You'll need to modify the app to use PostgreSQL instead of MySQL

1. In Render Dashboard: "New +" → "PostgreSQL"
2. Create database
3. Copy internal connection string

## Step 4: Configure Environment Variables

In Render Dashboard → Your Service → Environment:

```
NODE_ENV=production
PORT=3000
DB_HOST=<from-your-database>
DB_PORT=3306
DB_NAME=fest_manager
DB_USER=<from-your-database>
DB_PASSWORD=<from-your-database>
JWT_SECRET=<click-generate-to-create>
SESSION_SECRET=<click-generate-to-create>
CLIENT_URL=<your-render-url>
```

### Generate Secrets:

- Click "Generate" next to JWT_SECRET
- Click "Generate" next to SESSION_SECRET
- Or use: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## Step 5: Deploy!

1. Click "Create Web Service" or "Manual Deploy"
2. Wait for deployment (2-5 minutes)
3. Your app will be live at: `https://fest-manager-xxxx.onrender.com`

## Step 6: Initialize Database

After first deployment:

1. Open Render Shell (in Dashboard → Shell tab)
2. Run: `npm run init-db`

Or manually create tables by visiting your app - Sequelize will auto-sync.

## Step 7: Create Admin User

Either:

- Run the initialization script
- Register through the UI and manually update the role in database
- Use SQL:
  ```sql
  UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
  ```

## 🎉 Done!

Your Fest Manager is now live on the internet!

## Troubleshooting

### Build Failed?

- Check logs in Render Dashboard
- Ensure all dependencies are in package.json
- Verify Node version compatibility

### Database Connection Error?

- Double-check environment variables
- Ensure database is accessible from internet
- Check DB_HOST format (might need SSL parameters)

### App Crashes?

- Check logs in Render Dashboard → Logs tab
- Verify all environment variables are set
- Check database is running

## Free Tier Limitations

Render free tier:

- Spins down after 15 minutes of inactivity
- First request may take 30-60 seconds (cold start)
- 750 hours/month free
- Limited bandwidth

Upgrade to paid tier ($7/month) for:

- No spin-down
- Faster performance
- More resources

## Alternative: Railway

1. Go to https://railway.app
2. "New Project" → "Deploy from GitHub"
3. Select your repo
4. Add MySQL service
5. Connect and deploy

Railway automatically sets database variables!

---

**Need help?** Check DEPLOYMENT.md for detailed guides!
