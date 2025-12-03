# Deployment Guide: Coolify on Hetzner

This guide will help you deploy the NYC Birthday Adventure PWA to your self-hosted Coolify instance on Hetzner.

## Prerequisites

- Coolify installed on your Hetzner server
- A Mapbox account (free tier is fine)
- Basic familiarity with Coolify dashboard

## Step 1: Get Your Mapbox Token

1. Sign up at https://account.mapbox.com/auth/signup/
2. Navigate to https://account.mapbox.com/access-tokens/
3. Copy your default public token (starts with `pk.`)
4. Keep this token handy - you'll need it in Step 3

## Step 2: Prepare Your Repository

### Option A: GitHub/GitLab Repository (Recommended)

1. Create a new repository on GitHub or GitLab
2. Push all files from this project to your repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - NYC Birthday Adventure"
   git remote add origin YOUR_REPO_URL
   git push -u origin main
   ```

### Option B: Direct File Upload

If you prefer not to use git, you can upload files directly to your server.

## Step 3: Configure the Application

### Update Mapbox Token

**IMPORTANT:** Before deploying, update the token in `app.js`:

```javascript
// Line 5 in app.js
const MAPBOX_TOKEN = 'pk.eyJ1IjoieW91cnRva2VuaGVyZSI...'; // Replace with your actual token
```

### Customize Initial Places (Optional)

Edit the `places` array in `app.js` to add your favorite NYC spots:

```javascript
let places = [
    {
        id: 1,
        name: 'Your Favorite Restaurant',
        type: 'visit',
        lat: 40.7589, // Replace with actual coordinates
        lng: -73.9851,
        message: '',
        from: '',
        link: 'https://goo.gl/maps/...' // Google Maps link
    }
];
```

**Pro Tip:** To get coordinates from Google Maps:
1. Right-click on any location in Google Maps
2. Click the coordinates that appear
3. They'll be copied to your clipboard as `latitude, longitude`

## Step 4: Deploy to Coolify

### Method 1: Git Repository (Recommended)

1. **Log into Coolify Dashboard**
   - Go to your Coolify URL (e.g., `https://coolify.yourdomain.com`)

2. **Create New Application**
   - Click "New Resource" → "Application"
   - Select your server/destination

3. **Connect Repository**
   - Choose "Public Repository" or "Private Repository"
   - Enter your repository URL
   - For private repos, add your deploy key in Coolify

4. **Configure Build Settings**
   - **Build Pack:** Select "Dockerfile" or "Static"
   - **Branch:** `main` (or your branch name)
   - **Port:** `80` (for Docker) or leave default for static

5. **Environment Variables (Optional)**
   - If you want to use env vars instead of hardcoding the token
   - Add: `MAPBOX_TOKEN` = `your_token_here`
   - Note: You'll need to modify `app.js` to read from env vars

6. **Domain Configuration**
   - Add your custom domain (e.g., `birthday.yourdomain.com`)
   - Enable HTTPS (required for geolocation to work!)
   - Coolify will automatically provision SSL via Let's Encrypt

7. **Deploy!**
   - Click "Deploy"
   - Wait for build to complete (usually 1-2 minutes)
   - Monitor logs for any errors

### Method 2: Docker Deployment

If using Docker directly:

```bash
# Build the image
docker build -t nyc-birthday .

# Run the container
docker run -d \
  --name nyc-birthday \
  -p 8080:80 \
  --restart unless-stopped \
  nyc-birthday

# Check if it's running
docker ps | grep nyc-birthday
```

In Coolify:
1. Choose "Docker Image"
2. Use the image you built
3. Configure port mapping (80:80)

### Method 3: Static Site Deployment

For the simplest deployment:

1. In Coolify, select "Static Site"
2. Point to your repository
3. Set publish directory to `/` (root)
4. Deploy

This method serves files directly without Docker overhead.

## Step 5: Configure HTTPS (Critical!)

**Geolocation API requires HTTPS** (except on localhost)

In Coolify:
1. Go to your application settings
2. Click on "Domains"
3. Add your domain
4. Enable "Force HTTPS"
5. Coolify automatically provisions SSL certificates

Your app will now be available at `https://yourdomain.com`

## Step 6: Test the Application

1. **Open in Browser**
   - Visit your deployed URL
   - Should see the map centered on NYC

2. **Test Location Services**
   - Click the location button in the header
   - Allow location permissions when prompted
   - Map should center on your location

3. **Test Adding Places**
   - Click "✨ Add Place"
   - Fill out the form
   - Paste a Google Maps URL
   - Submit and verify it appears on the map

4. **Test on Mobile**
   - Open on your phone
   - Should prompt to "Add to Home Screen"
   - Test offline by turning off wifi/data

## Step 7: Share with Friends & Family

1. **Share the URL**
   ```
   🎂 Help celebrate a special 40th birthday!
   Add your birthday wishes to our NYC adventure map:
   https://your-app-url.com
   
   Click "Add Place" and choose a meaningful NYC location 
   with a birthday message! 🗽✨
   ```

2. **Instructions for Contributors**
   - Open the link
   - Click "✨ Add Place"
   - Select "Birthday Message"
   - Enter their message and name
   - Add a Google Maps link (e.g., a restaurant with memories)
   - Submit!

## Troubleshooting

### Map Not Loading
- **Check Mapbox Token:** Verify it's correct in `app.js`
- **Check Console:** Open browser dev tools (F12) and look for errors
- **Token Limits:** Free tier = 50,000 loads/month (should be plenty)

### Location Not Working
- **HTTPS Required:** Make sure you're using HTTPS, not HTTP
- **Permissions:** Check browser location permissions
- **Device Settings:** Ensure location services are enabled on the device

### App Not Installing (PWA)
- **HTTPS Required:** PWA requires HTTPS
- **Service Worker:** Check that `sw.js` is being served correctly
- **Manifest:** Verify `manifest.json` loads without errors

### Docker Build Fails
```bash
# Check Docker logs
docker logs nyc-birthday

# Rebuild without cache
docker build --no-cache -t nyc-birthday .

# Check if nginx is running
docker exec nyc-birthday nginx -t
```

### Changes Not Appearing
- **Hard Refresh:** Press Ctrl+Shift+R (or Cmd+Shift+R on Mac)
- **Clear Service Worker:** 
  - Dev Tools → Application → Service Workers → Unregister
  - Then refresh the page

## Performance Tips

### Optimize for Mobile Data
The app automatically caches map tiles and assets for offline use.

### Monitor Performance
- Open Dev Tools → Lighthouse
- Run audit on mobile
- Should score 90+ on Performance

### Reduce Mapbox API Calls
- Map tiles are cached by service worker
- Geocoding is cached in browser
- Should stay well under free tier limits

## Updating the App

### Via Git
```bash
# Make changes locally
git add .
git commit -m "Update places and styling"
git push

# In Coolify
# Go to your app → Click "Redeploy"
```

### Direct Updates
- Edit `app.js` or `index.html` in your repository
- Coolify can auto-deploy on git push (enable in settings)

## Cost Breakdown

- **Hetzner VPS:** ~€5-20/month (depending on specs)
- **Coolify:** Free (self-hosted)
- **Mapbox:** Free tier (50k loads/month)
- **Domain:** ~$10-15/year (optional)
- **SSL Certificate:** Free (Let's Encrypt via Coolify)

**Total:** ~€5-20/month + domain cost

## Security Checklist

- ✅ HTTPS enabled
- ✅ Force HTTPS redirect
- ✅ Security headers configured (in Dockerfile)
- ✅ No sensitive data in client-side code
- ✅ Mapbox token is public token (safe to expose)
- ✅ CORS properly configured

## Next Steps

1. **Add Backend (Optional):**
   - Use Firebase Realtime Database for real-time updates
   - Or Supabase for a SQL backend
   - Or build custom API with Node.js/Python

2. **Enable Analytics:**
   - Add Plausible or Simple Analytics
   - Track page views and popular locations

3. **Add Photos:**
   - Allow friends to upload photos with messages
   - Store in Cloudinary or S3

4. **Social Sharing:**
   - Add share buttons for Twitter/Facebook
   - Generate OG image previews

## Support

If you run into issues:
1. Check the README.md for common solutions
2. Review Coolify logs in the dashboard
3. Check browser console (F12) for JavaScript errors
4. Verify Mapbox token is valid

## Have an Amazing Birthday! 🎂

Enjoy your NYC adventure! The map will capture all the special moments and messages from loved ones. 🗽✨

---

**Questions?** Check the main README.md or leave a note in the issues section of your repository.
