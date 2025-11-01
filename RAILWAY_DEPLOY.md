# 🚂 Railway Deployment Guide - Fest Manager

## Quick Fix for "Unable to connect to database via SSH" Error

Railway uses **internal networking**, not SSH. Here's the correct setup:

---

## ✅ Step-by-Step Railway Deployment

### 1. **Create Railway Account**
- Go to https://railway.app
- Click "Login" → Sign in with GitHub

### 2. **Create New Project**
- Click "New Project"
- Select "Deploy from GitHub repo"
- Choose: `CODEISPASSIONANDMONEY/Fest-Manager`
- Railway will create your service

### 3. **Add MySQL Database**
- In your project dashboard
- Click "+ New" (top right)
- Select "Database" → "MySQL"
- Railway will automatically provision a MySQL database

### 4. **Connect Database to Your App**

Railway provides these automatic variables for the database:
- `MYSQL_URL` - Full connection URL
- `MYSQLHOST` - Database host
- `MYSQLPORT` - Database port
- `MYSQLDATABASE` - Database name
- `MYSQLUSER` - Database user
- `MYSQLPASSWORD` - Database password

**IMPORTANT:** Your app now uses `DATABASE_URL` which Railway doesn't set by default.

#### **Option A: Use Railway's MYSQL_URL (Easiest)**

Add this variable to your app service:

1. Click on your **app service** (not the database)
2. Go to "Variables" tab
3. Click "+ New Variable"
4. Add:
   ```
   DATABASE_URL=${{MySQL.MYSQL_URL}}
   ```

This tells Railway to copy the MySQL connection URL to DATABASE_URL.

#### **Option B: Reference Individual Variables**

Add these to your app service variables:
```
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_NAME=${{MySQL.MYSQLDATABASE}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
```

### 5. **Add Required Environment Variables**

In your app service Variables tab, add:

```
NODE_ENV=production
PORT=3000
DATABASE_URL=${{MySQL.MYSQL_URL}}
JWT_SECRET=<click-generate>
SESSION_SECRET=<click-generate>
```

To generate secrets:
- Click "New Variable"
- Click the dice icon (🎲) to generate random values

**Or use these pre-generated ones:**
```
JWT_SECRET=5c1115f7a307a124a1552add80ed81043802f70d2449e0126fc9f0ce79fb5ffe
SESSION_SECRET=630db379d9a1adf222b7076b4bb4aec074de91aff2d5c977d36019dfd63bc762
```

### 6. **Set CLIENT_URL (Important for CORS)**

Get your Railway app URL (looks like `fest-manager.up.railway.app`), then add:

```
CLIENT_URL=https://fest-manager.up.railway.app
```

Replace with your actual Railway URL.

### 7. **Deploy**

Railway automatically deploys when you:
- Push to GitHub (automatic)
- Or click "Deploy" in Railway dashboard

Watch the logs in the "Deployments" tab.

---

## 🔍 Troubleshooting

### Error: "Unable to connect to database via SSH"

**Solution:** Railway doesn't use SSH for database connections. Make sure you:
1. ✅ Added `DATABASE_URL=${{MySQL.MYSQL_URL}}` to your app variables
2. ✅ The database and app are in the **same project**
3. ✅ Updated your code to use DATABASE_URL (already done!)

### Error: "Connection refused" or "ECONNREFUSED"

**Solution:** 
1. Check that DATABASE_URL is set correctly
2. Ensure both services are in the same Railway project
3. Check database is running (green status)
4. Verify the MySQL service has finished deploying

### Error: "ER_NOT_SUPPORTED_AUTH_MODE"

**Solution:** Add to app variables:
```
DB_SSL=false
```

### App deploys but crashes immediately

**Solution:**
1. Check "Logs" tab in Railway dashboard
2. Ensure all environment variables are set
3. Verify DATABASE_URL format is correct
4. Check that Node version is compatible (Railway uses Node 18+)

### Database tables not created

**Solution:**
1. Railway shell: Click on your app → "Settings" → scroll down
2. Or tables are auto-created on first app start (Sequelize sync)
3. Check logs to see if sync completed

---

## 📊 Railway Variable Reference

### Automatic Database Variables (from MySQL service):
```
MYSQL_URL=mysql://user:pass@host:port/database
MYSQLHOST=containers-us-west-xxx.railway.app
MYSQLPORT=6379
MYSQLDATABASE=railway
MYSQLUSER=root
MYSQLPASSWORD=xxxxxxxxxxxxx
```

### Required App Variables (you must add):
```
NODE_ENV=production
PORT=3000
DATABASE_URL=${{MySQL.MYSQL_URL}}
JWT_SECRET=<generated>
SESSION_SECRET=<generated>
CLIENT_URL=https://<your-app>.up.railway.app
```

---

## 🎯 Complete Variable Setup Checklist

In your **app service** Variables tab, you should have:

- [ ] `NODE_ENV=production`
- [ ] `PORT=3000`
- [ ] `DATABASE_URL=${{MySQL.MYSQL_URL}}`
- [ ] `JWT_SECRET=<long-random-string>`
- [ ] `SESSION_SECRET=<long-random-string>`
- [ ] `CLIENT_URL=https://your-app.up.railway.app`

---

## 🚀 After Successful Deployment

1. **Access your app:** `https://your-app.up.railway.app`
2. **Check logs:** Make sure no errors in deployment logs
3. **Test database:** App should auto-create tables
4. **Register admin:** Create account, then update role to 'admin' in database

### Setting Admin Role:

**Option 1: Railway MySQL Editor**
1. Click on MySQL service → "Data" tab
2. Select `users` table
3. Find your user and change `role` to `admin`

**Option 2: External MySQL Client**
1. Get credentials from MySQL service Variables
2. Use MySQL Workbench or similar
3. Run: `UPDATE users SET role = 'admin' WHERE email = 'your@email.com';`

---

## 💰 Railway Costs

**Free Tier:**
- $5 credit per month
- ~500 hours of runtime
- More than enough for development/testing

**Hobby Plan:** $5/month
- Removes execution limits
- More resources

---

## 🔄 Auto-Deployments

Railway automatically deploys when you push to GitHub:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Railway detects the push and redeploys automatically!

---

## 📝 Common Railway Commands

### View Logs:
Railway Dashboard → Your Service → Logs

### Restart Service:
Railway Dashboard → Your Service → Settings → Restart

### Environment Variables:
Railway Dashboard → Your Service → Variables

---

## ✅ Success Indicators

Your deployment is successful when you see:
- ✅ Green checkmark on app service
- ✅ Green checkmark on MySQL service
- ✅ Logs show "Database connected successfully"
- ✅ App accessible at Railway URL
- ✅ No errors in deployment logs

---

## 🆘 Still Having Issues?

1. **Check Railway Status:** https://railway.app/status
2. **View Logs:** Most issues are visible in logs
3. **Verify Variables:** Double-check all environment variables
4. **Database Connection:** Ensure `DATABASE_URL` is set correctly
5. **Railway Docs:** https://docs.railway.app

---

**🎉 That's it! Your Fest Manager should now be running on Railway!**

Need help with a specific error? Share the error message from Railway logs!
