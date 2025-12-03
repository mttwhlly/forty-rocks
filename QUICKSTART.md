# Quick Start Guide 🚀

Get your NYC Birthday Adventure Map running in 5 minutes!

## Step 1: Get Mapbox Token (2 minutes)

1. Go to https://account.mapbox.com/auth/signup/
2. Sign up (free)
3. Copy your token from https://account.mapbox.com/access-tokens/

## Step 2: Add Your Token (30 seconds)

Open `app.js` and replace line 5:

```javascript
const MAPBOX_TOKEN = 'pk.your_actual_token_here';
```

## Step 3: Test Locally (1 minute)

```bash
# Option 1: Using Node.js
npx serve

# Option 2: Using Python
python3 -m http.server 8000

# Then open: http://localhost:8000 (or 3000 for npx serve)
```

## Step 4: Customize (Optional)

### Add Your Favorite NYC Spots

Edit `app.js` around line 15:

```javascript
let places = [
    {
        id: 1,
        name: 'The Met',
        type: 'visit',
        lat: 40.7794,
        lng: -73.9632,
        message: '',
        from: '',
        link: 'https://maps.google.com/?q=The+Met+NYC'
    },
    // Add more places here
];
```

### Get Coordinates from Google Maps

1. Open Google Maps
2. Right-click any location
3. Click the coordinates that appear
4. Use as `lat` and `lng` values

### Customize Colors

Edit `index.html` CSS variables (around line 25):

```css
:root {
    --primary: #FF6B9D;      /* Your color */
    --secondary: #FFD700;    /* Your accent */
}
```

## Step 5: Deploy to Coolify

See `DEPLOYMENT.md` for detailed instructions, or:

**Quick Deploy:**
1. Push to GitHub
2. Create new app in Coolify
3. Point to your repo
4. Deploy!

## Done! 🎉

Your map is now ready for the birthday celebration!

### Share with Friends & Family

Send them this message:

```
🎂 Help celebrate a special 40th birthday in NYC!

Add your birthday wishes to our adventure map:
[YOUR_URL_HERE]

1. Click "✨ Add Place"
2. Choose "Birthday Message"
3. Pick a meaningful NYC location
4. Write your message
5. Add your name

Can't wait to see your contribution! 🗽✨
```

## Need Help?

- **Full Documentation:** See `README.md`
- **Deployment Guide:** See `DEPLOYMENT.md`
- **Map not loading?** Check that your Mapbox token is correct
- **Location not working?** Make sure you're using HTTPS (or localhost)

## Quick Tips

✨ **Performance:** The app is already optimized for NYC with hardware-accelerated maps

📱 **Mobile:** Works great on phones - add to home screen for app-like experience

🗺️ **Offline:** Service worker caches everything for offline use

💾 **Data:** All places saved in browser (LocalStorage)

🎂 **Messages:** Friends can add birthday messages from anywhere!

---

Have the best 40th birthday celebration ever! 🎉🗽
