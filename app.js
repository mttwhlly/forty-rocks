// NYC Birthday Adventure Map - With Supabase Backend
// Built with Mapbox GL JS, Geolocation API, and Supabase

// Configuration
const MAPBOX_TOKEN = 'pk.eyJ1IjoibXR0d2hsbHkiLCJhIjoiY2prZngzcGF1MGRhcTNwbzlhYTlza2NicyJ9.Cw82KbQTNdjYdobD3HTK-w';
const NYC_CENTER = [-73.9712, 40.7831];
const DEFAULT_ZOOM = 12;

console.log('Token:', MAPBOX_TOKEN.substring(0, 20) + '...');

// Supabase Configuration
const SUPABASE_URL = 'https://jffzitptaxgpejjakuhk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmZnppdHB0YXhncGVqamFrdWhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3Nzc0NzUsImV4cCI6MjA4MDM1MzQ3NX0.J6w3sHUVFdrlocoJyqcaBEe_69o6gezRbXrKgfL7NDc';

// Initialize Supabase client (using CDN)
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// State
let map;
let markers = [];
let userLocationMarker = null;
let watchId = null;
let places = [];

// Load places from Supabase
async function loadPlaces() {
    try {
        const { data, error } = await supabase
            .from('places')
            .select('*')
            .eq('approved', true)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        places = data || [];
        console.log(`Loaded ${places.length} approved places`);
        
        if (map && map.loaded()) {
            displayPlaces();
            renderPlacesList();
        }
    } catch (error) {
        console.error('Error loading places:', error);
    }
}

// Save place to Supabase (pending approval)
async function savePlaceToSupabase(place) {
    try {
        const { id, ...placeData } = place;
        
        const { data, error } = await supabase
            .from('places')
            .insert([{
                ...placeData,
                approved: false
            }])
            .select();
        
        if (error) throw error;
        
        console.log('Place submitted for approval:', data);
        return data[0];
    } catch (error) {
        console.error('Error saving place:', error);
        throw error;
    }
}

if (!mapboxgl.supported()) {
    alert('WebGL not supported');
}

// Initialize map
function initMap() {
    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v12',
        center: NYC_CENTER,
        zoom: DEFAULT_ZOOM,
        pitch: 0,  // Remove 3D
        bearing: 0,
        antialias: false,  // Better iOS performance
        failIfMajorPerformanceCaveat: false
    });
    
    map.addControl(new mapboxgl.NavigationControl(), 'bottom-left');
    
    map.on('load', () => {
        const layers = map.getStyle().layers;
        const labelLayerId = layers.find(
            (layer) => layer.type === 'symbol' && layer.layout['text-field']
        ).id;
        
        map.addLayer({
            'id': '3d-buildings',
            'source': 'composite',
            'source-layer': 'building',
            'filter': ['==', 'extrude', 'true'],
            'type': 'fill-extrusion',
            'minzoom': 15,
            'paint': {
                'fill-extrusion-color': '#FFE5EF',
                'fill-extrusion-height': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    15,
                    0,
                    15.05,
                    ['get', 'height']
                ],
                'fill-extrusion-base': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    15,
                    0,
                    15.05,
                    ['get', 'min_height']
                ],
                'fill-extrusion-opacity': 0.6
            }
        }, labelLayerId);
        
        displayPlaces();
        renderPlacesList();
    });
    map.resize();
}

// Extract coordinates from Google Maps link or geocode address
async function getCoordinates(input) {
    // Try simple pattern matching (no CORS proxy)
    const patterns = [
        /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/, // !3dlat!4dlng
        /3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,  // 3dlat!4dlng (without !)
        /@(-?\d+\.\d+),(-?\d+\.\d+),\d+z/, // @lat,lng,17z
        /@(-?\d+\.\d+),(-?\d+\.\d+)/,     // @lat,lng
    ];
    
    for (const pattern of patterns) {
        const match = input.match(pattern);
        if (match) {
            console.log('Matched pattern:', pattern.source, 'Result:', match[1], match[2]);
            return {
                lat: parseFloat(match[1]),
                lng: parseFloat(match[2])
            };
        }
    }
    
    // Try geocoding as fallback
    let searchTerm = input;
    const qMatch = input.match(/q=([^&]+)/);
    if (qMatch) {
        searchTerm = decodeURIComponent(qMatch[1].replace(/\+/g, ' '));
    }
    
    try {
        const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchTerm)}.json?access_token=${MAPBOX_TOKEN}&proximity=${NYC_CENTER[0]},${NYC_CENTER[1]}&limit=1`
        );
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
            const [lng, lat] = data.features[0].center;
            return { lat, lng };
        }
    } catch (error) {
        console.error('Geocoding error:', error);
    }
    
    return null;
}

// Create custom marker
function createMarker(place) {
    const el = document.createElement('div');
    el.className = 'custom-marker';
    if (place.type === 'birthday') {
        el.classList.add('birthday-message');
    }
    
    const icon = document.createElement('div');
    icon.className = 'marker-icon';
    icon.textContent = '';
    el.appendChild(icon);
    
    return el;
}

// Create popup content
function createPopupContent(place) {
    let html = `<div class="popup-title">${place.name}</div>`;
    
    if (place.message) {
        html += `<div class="popup-message">"${place.message}"</div>`;
    }
    
    if (place.from) {
        html += `<div class="popup-from">— ${place.from}</div>`;
    }
    
    // Add directions link with icon
    html += `<a href="${place.link}" target="_blank" style="display: inline-flex; align-items: center; gap: 6px; color: var(--primary); font-weight: 600; text-decoration: none; margin-top: 6px; font-size: 12px; background: var(--shadow); padding: 2px 10px; border-radius: 4px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 013.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
        </svg>
        Directions
    </a>`;
    
    return html;
}

// Close all popups
function closeAllPopups() {
    markers.forEach(m => {
        if (m.getPopup().isOpen()) {
            m.getPopup().remove();
        }
    });
}

// Display all places on map
function displayPlaces() {
    markers.forEach(marker => marker.remove());
    markers = [];
    
    places.forEach(place => {
        const el = createMarker(place);
        
        const popup = new mapboxgl.Popup({ offset: 25 })
            .setHTML(createPopupContent(place));
        
        const marker = new mapboxgl.Marker(el)
            .setLngLat([place.lng, place.lat])
            .setPopup(popup)
            .addTo(map);
        
        // Close all other popups when this one opens
        popup.on('open', () => {
            markers.forEach(m => {
                if (m !== marker && m.getPopup().isOpen()) {
                    m.getPopup().remove();
                }
            });
        });
        
        markers.push(marker);
    });
}

// Render places list
function renderPlacesList() {
    const listContainer = document.getElementById('placesList');
    // const countElement = document.getElementById('placesCount');
    
    listContainer.innerHTML = '';
    // countElement.textContent = `( ${places.length} )`;
    
    if (places.length === 0) {
        listContainer.innerHTML = '<div style="text-align: center; color: #999; padding: 40px 20px;">No places yet. Be the first to add one!</div>';
        return;
    }
    
    places.forEach(place => {
        const card = document.createElement('div');
        card.className = 'place-card';
        card.onclick = () => flyToPlace(place);
        
        let html = `<div class="place-name">${place.name}</div>`;
        
        if (place.message) {
            html += `<div class="place-message">"${place.message}"</div>`;
        }
        
        if (place.from) {
            html += `<div class="place-from">— ${place.from}</div>`;
        }
        
        card.innerHTML = html;
        listContainer.appendChild(card);
    });
}

// Fly to place on map
function flyToPlace(place) {
    // Close all popups first
    closeAllPopups();
    
    // Collapse drawer on mobile after selection
    const drawer = document.getElementById('placesDrawer');
    if (window.innerWidth <= 768) {
        drawer.classList.add('collapsed');
    }
    
    // Use padding to offset the center point
    map.flyTo({
        center: [place.lng, place.lat],
        zoom: 16,
        padding: { top: 200, bottom: 100, left: 50, right: 50 },
        duration: 2000,
        essential: true
    });
    
    // Open popup after animation completes
    setTimeout(() => {
        const marker = markers.find(m => 
            m.getLngLat().lng === place.lng && 
            m.getLngLat().lat === place.lat
        );
        
        if (marker) {
            marker.togglePopup();
        }
    }, 2100);
}

// Open directions
function openDirections(link) {
    window.open(link, '_blank');
}

// Geolocation functions - FIXED
function requestLocation() {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        return;
    }
    
    const locationBtn = document.getElementById('locationBtn');
    
    // Toggle location tracking
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
        locationBtn.classList.remove('active');
        if (userLocationMarker) {
            userLocationMarker.remove();
            userLocationMarker = null;
        }
        return;
    }
    
    locationBtn.classList.add('active');
    
    navigator.geolocation.getCurrentPosition(
        position => {
            updateUserLocation(position.coords, true); // Fly only on first click
            
            watchId = navigator.geolocation.watchPosition(
                pos => updateUserLocation(pos.coords, false), // Don't fly on updates
                error => console.error('Location watch error:', error),
                { enableHighAccuracy: true, maximumAge: 10000 }
            );
        },
        error => {
            console.error('Geolocation error:', error);
            alert('Could not get your location. Please check your permissions.');
            locationBtn.classList.remove('active');
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

function updateUserLocation(coords, shouldFly = false) {
    const { latitude, longitude } = coords;
    
    if (userLocationMarker) {
        userLocationMarker.setLngLat([longitude, latitude]);
    } else {
        const el = document.createElement('div');
        el.style.width = '20px';
        el.style.height = '20px';
        el.style.borderRadius = '50%';
        el.style.background = '#4A90E2';
        el.style.border = '4px solid white';
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        
        userLocationMarker = new mapboxgl.Marker(el)
            .setLngLat([longitude, latitude])
            .addTo(map);
    }
    
    // Only fly to location on first click
    if (shouldFly) {
        map.flyTo({
            center: [longitude, latitude],
            zoom: 15,
            duration: 2000
        });
    }
}

// Modal functions
function openModal() {
    document.getElementById('addModal').classList.add('active');
    document.getElementById('placeName').focus();
}

function closeModal() {
    document.getElementById('addModal').classList.remove('active');
    document.getElementById('addPlaceForm').reset();
}

// Show success message
function showSuccessMessage() {
    const message = document.createElement('div');
    message.style.cssText = `
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: #000000;
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        z-index: 1000;
        font-weight: 600;
        animation: slideDown 0.3s ease-out;
    `;
    message.textContent = '✓ Place submitted! Waiting for approval...';
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => message.remove(), 300);
    }, 3000);
}

// Form handling
async function handleAddPlace(e) {
    e.preventDefault();
    
    const name = document.getElementById('placeName').value;
    const message = document.getElementById('placeMessage').value;
    const from = document.getElementById('placeFrom').value;
    const link = document.getElementById('placeLink').value;
    
    const submitBtn = e.target.querySelector('.btn-primary');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;
    
    try {
        // Try to get coordinates, but allow submission without them
        let coords = await getCoordinates(link);
        
        // If coordinates fail, use NYC center as placeholder
        if (!coords) {
            console.log('Could not find coordinates, using placeholder');
            coords = { lat: NYC_CENTER[1], lng: NYC_CENTER[0] };
        }
        
        const newPlace = {
            name,
            type: message ? 'birthday' : 'visit',
            lat: coords.lat,
            lng: coords.lng,
            message,
            from,
            link
        };
        
        await savePlaceToSupabase(newPlace);
        
        closeModal();
        showSuccessMessage();
        
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        
    } catch (error) {
        console.error('Error adding place:', error);
        alert('Failed to submit place. Please try again.');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    loadPlaces();
    initMap();
    
    // Real-time updates
    supabase
        .channel('places-changes')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'places' },
            (payload) => {
                console.log('Place updated:', payload);
                loadPlaces();
            }
        )
        .subscribe();
    
    // Drawer toggle for mobile
    const drawerHandle = document.getElementById('drawerHandle');
    const drawer = document.getElementById('placesDrawer');
    
    if (drawerHandle) {
        drawerHandle.addEventListener('click', () => {
            drawer.classList.toggle('collapsed');
        });
    }
    
    // Event listeners
    const locationBtn = document.getElementById('locationBtn');
    const addBtn = document.getElementById('addBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const addPlaceForm = document.getElementById('addPlaceForm');
    const addModal = document.getElementById('addModal');
    
    if (locationBtn) locationBtn.addEventListener('click', requestLocation);
    if (addBtn) addBtn.addEventListener('click', openModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if (addPlaceForm) addPlaceForm.addEventListener('submit', handleAddPlace);
    
    // Close modal when clicking outside
    if (addModal) {
        addModal.addEventListener('click', (e) => {
            // Only close if clicking directly on the modal backdrop (not on children)
            if (e.target.classList.contains('modal')) {
                closeModal();
            }
        });
    }
});

window.openDirections = openDirections;
window.flyToPlace = flyToPlace;