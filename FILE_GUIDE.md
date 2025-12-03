# NYC Birthday Adventure - File Guide 📁

## 🎯 Start Here

**First time?** Read these in order:
1. **GETTING_STARTED.txt** - Quick visual overview
2. **PROJECT_SUMMARY.md** - Complete project overview
3. **QUICKSTART.md** - 5-minute setup guide

## 📱 Application Files (Core)

### index.html
The main application file containing:
- Beautiful UI with celebration theme
- Pink/gold color scheme
- Header with location button
- Modal for adding places
- Responsive design for mobile

**What to customize:**
- Change colors in CSS variables (line 25)
- Modify title/subtitle (search for "Happy 40th Birthday")

### app.js
JavaScript application logic:
- Mapbox GL integration
- Geolocation API
- Place management (add/save/display)
- Geocoding for addresses
- Custom markers and popups

**REQUIRED CHANGE:**
- Line 5: Add your Mapbox token!
- Lines 15-30: Customize initial places

### manifest.json
PWA configuration:
- App name and description
- Theme colors
- Icon references
- Install behavior

**What to customize:**
- App name and description
- Colors (must match CSS)

### sw.js
Service worker for offline functionality:
- Caches map tiles
- Caches app assets
- Enables offline usage
- Background sync ready

**Usually no changes needed**

## 🖼️ Assets

### icon-192.png
PWA icon (192x192 pixels)
- Pink/gold birthday theme
- Shows "🎂 40"

**Customize:** Use generate_icons.py or design your own

### icon-512.png
PWA icon (512x512 pixels)
- Same design as 192px version
- Higher resolution

**Customize:** Use generate_icons.py or design your own

## 🚀 Deployment Files

### Dockerfile
Production container configuration:
- Nginx-based
- Optimized for static serving
- Gzip compression enabled
- Security headers included
- PWA-friendly caching

**For Coolify deployment**

### docker-compose.yml
Optional Docker Compose configuration:
- Easy local testing with Docker
- Port mapping configured
- Volume mounts for development

**For local Docker testing**

### package.json
NPM package configuration:
- Dev dependencies
- Convenience scripts
- Project metadata

**Scripts available:**
```bash
npm run dev    # Start local server
npm start      # Production server
```

## 📚 Documentation

### PROJECT_SUMMARY.md (START HERE!)
Complete project overview including:
- What you've built
- Design philosophy
- Technical highlights
- Next steps
- Troubleshooting
- Cost breakdown

**Read this first for big picture!**

### QUICKSTART.md
5-minute setup guide:
- Get Mapbox token
- Test locally
- Deploy to Coolify
- Share with friends

**Follow step-by-step for quick start**

### DEPLOYMENT.md
Detailed deployment instructions:
- Coolify setup
- Environment configuration
- HTTPS setup
- Domain configuration
- Troubleshooting
- Performance tips

**Use when deploying to production**

### README.md
Comprehensive documentation:
- Features overview
- Setup instructions
- Usage guide
- Customization options
- Browser support
- Tech stack details

**Reference documentation**

### GETTING_STARTED.txt
Visual quick start guide:
- ASCII art formatting
- 5-step quick start
- Key reminders
- Cost breakdown

**Quick visual reference**

## 🛠️ Utility Files

### generate_icons.py
Python script to generate PWA icons:
- Creates 192x192 and 512x512 icons
- Pink/gold birthday theme
- Includes "🎂 40" design

**Usage:**
```bash
python3 generate_icons.py
```

### .env.example
Environment variable template:
- Mapbox token placeholder
- Configuration options
- Backend URLs (for future)

**Copy to .env and fill in values**

### .dockerignore
Docker build optimization:
- Excludes node_modules
- Excludes git files
- Reduces image size

**No changes needed**

## 📋 File Checklist

Before deploying, ensure:

- [ ] **app.js** - Added Mapbox token (line 5)
- [ ] **app.js** - Customized initial places (optional)
- [ ] **index.html** - Updated title/colors (optional)
- [ ] **manifest.json** - Updated app name (optional)
- [ ] **icon-*.png** - Generated or replaced with custom icons
- [ ] **Dockerfile** - Ready for deployment
- [ ] **README.md** - Read and understood

## 🎨 Customization Quick Reference

### Change Colors
**File:** index.html (lines 25-32)
```css
:root {
    --primary: #FF6B9D;      /* Main color */
    --secondary: #FFD700;    /* Accent color */
    --bg: #FFF8F0;          /* Background */
}
```

### Change Map Style
**File:** app.js (line 28)
```javascript
style: 'mapbox://styles/mapbox/light-v11'
```
Options: dark-v11, streets-v12, outdoors-v12, satellite-v9

### Change Starting Location
**File:** app.js (lines 8-9)
```javascript
const NYC_CENTER = [-73.9712, 40.7831];
const DEFAULT_ZOOM = 12;
```

### Add Initial Places
**File:** app.js (lines 15-30)
```javascript
let places = [
    {
        id: 1,
        name: 'Your Place',
        type: 'visit',
        lat: 40.7589,
        lng: -73.9851,
        message: '',
        from: '',
        link: 'https://maps.google.com/...'
    }
];
```

## 🔍 Finding Things Fast

**Need to...**
- **Deploy?** → DEPLOYMENT.md
- **Test locally?** → QUICKSTART.md
- **Change colors?** → index.html (line 25)
- **Add Mapbox token?** → app.js (line 5)
- **Add places?** → app.js (line 15)
- **Generate icons?** → generate_icons.py
- **See overview?** → PROJECT_SUMMARY.md
- **Quick reference?** → GETTING_STARTED.txt

## 📦 File Sizes

- **index.html** - ~18KB (includes all CSS)
- **app.js** - ~12KB (all JavaScript logic)
- **sw.js** - ~4KB (service worker)
- **icon-512.png** - ~5KB (PWA icon)
- **Total app** - ~40KB (super lightweight!)

## 🌟 What Makes Each File Special

**index.html**
- Single file with embedded CSS
- No external stylesheet dependencies
- Fast initial load
- Beautiful celebratory design

**app.js**
- Clean, well-commented code
- Modular functions
- Easy to understand and modify
- LocalStorage persistence

**sw.js**
- Smart caching strategy
- Network-first for API calls
- Cache-first for static assets
- Offline support

**Dockerfile**
- Production-optimized nginx
- Gzip compression
- Security headers
- PWA-friendly caching rules

## 🚨 Critical Files (Don't Delete!)

These files are REQUIRED for the app to work:

1. **index.html** - Main application
2. **app.js** - JavaScript logic
3. **manifest.json** - PWA config
4. **sw.js** - Offline support
5. **icon-192.png** - PWA icon
6. **icon-512.png** - PWA icon

Everything else is documentation or optional tooling.

## ✅ Ready to Deploy?

1. ✓ Read GETTING_STARTED.txt
2. ✓ Add Mapbox token to app.js
3. ✓ Test locally with `npx serve`
4. ✓ Customize places (optional)
5. ✓ Follow DEPLOYMENT.md
6. ✓ Share with friends!

---

**Questions?** Check the specific documentation file or the PROJECT_SUMMARY.md for complete details!
