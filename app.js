// NYC Birthday Adventure Map - With Supabase Backend
// Built with Mapbox GL JS, Geolocation API, and Supabase

// Configuration
const MAPBOX_TOKEN = 'pk.eyJ1IjoibXR0d2hsbHkiLCJhIjoiY2prZngzcGF1MGRhcTNwbzlhYTlza2NicyJ9.Cw82KbQTNdjYdobD3HTK-w';
const NYC_CENTER = [-73.9712, 40.7831];
const DEFAULT_ZOOM = 12;

// Supabase Configuration
const SUPABASE_URL = 'https://jffzitptaxgpejjakuhk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmZnppdHB0YXhncGVqamFrdWhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3Nzc0NzUsImV4cCI6MjA4MDM1MzQ3NX0.J6w3sHUVFdrlocoJyqcaBEe_69o6gezRbXrKgfL7NDc'; // Get from Supabase dashboard

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
        
        // Update UI if map is ready
        if (map && map.loaded()) {
            displayPlaces();
            renderPlacesList();
        }
    } catch (error) {
        console.error('Error loading places:', error);
        // Fall back to localStorage if Supabase fails
        loadPlacesFromLocalStorage();
    }
}

// Fallback: Load from localStorage
function loadPlacesFromLocalStorage() {
    const saved = localStorage.getItem('nycBirthdayPlaces');
    if (saved) {
        places = JSON.parse(saved);
        console.log('Loaded places from localStorage (fallback)');
    }
}

// Save place to Supabase (pending approval)
async function savePlaceToSupabase(place) {
    try {
        // Remove the id field as it's auto-generated
        const { id, ...placeData } = place;
        
        const { data, error } = await supabase
            .from('places')
            .insert([{
                ...placeData,
                approved: false // Pending approval
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

// Initialize map
function initMap() {
    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v12',
        center: NYC_CENTER,
        zoom: DEFAULT_ZOOM,
        pitch: 45,
        bearing: 0,
        antialias: true
    });
    
    map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
    
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
}

// Extract coordinates from Google Maps link or geocode address
async function getCoordinates(input) {
    const patterns = [
        /@(-?\d+\.\d+),(-?\d+\.\d+)/,
        /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
        /q=(-?\d+\.\d+),(-?\d+\.\d+)/
    ];
    
    for (const pattern of patterns) {
        const match = input.match(pattern);
        if (match) {
            return {
                lat: parseFloat(match[1]),
                lng: parseFloat(match[2])
            };
        }
    }
    
    try {
        const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(input)}.json?access_token=${MAPBOX_TOKEN}&proximity=${NYC_CENTER[0]},${NYC_CENTER[1]}&limit=1`
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
    icon.textContent = place.type === 'birthday' ? '🎂' : '📍';
    el.appendChild(icon);
    
    return el;
}

// Create popup content
function createPopupContent(place) {
    let html = `<div class="popup-title">${place.name}</div>`;
    
    if (place.message) {
        html += `<div class="popup-message">${place.message}</div>`;
    }
    
    if (place.from) {
        html += `<div class="popup-from">- ${place.from}</div>`;
    }
    
    html += `<button class="directions-btn" onclick="openDirections('${place.link}')">
        Get Directions 🗺️
    </button>`;
    
    return html;
}

// Display all places on map
function displayPlaces() {
    markers.forEach(marker => marker.remove());
    markers = [];
    
    places.forEach(place => {
        const el = createMarker(place);
        
        const marker = new mapboxgl.Marker(el)
            .setLngLat([place.lng, place.lat])
            .setPopup(
                new mapboxgl.Popup({ offset: 25 })
                    .setHTML(createPopupContent(place))
            )
            .addTo(map);
        
        markers.push(marker);
    });
}

// Render places list
function renderPlacesList() {
    const listContainer = document.getElementById('placesList');
    listContainer.innerHTML = '';
    
    places.forEach(place => {
        const card = document.createElement('div');
        card.className = 'place-card';
        card.onclick = () => flyToPlace(place);
        
        let html = `<div class="place-name">${place.name}</div>`;
        
        if (place.message) {
            html += `<div class="place-message">"${place.message}"</div>`;
        }
        
        if (place.from) {
            html += `<div class="place-from">From ${place.from}</div>`;
        }
        
        html += `<button class="directions-btn" onclick="openDirections('${place.link}'); event.stopPropagation();">Get Directions</button>`;
        
        card.innerHTML = html;
        listContainer.appendChild(card);
    });
}

// Fly to place on map
function flyToPlace(place) {
    map.flyTo({
        center: [place.lng, place.lat],
        zoom: 16,
        duration: 2000,
        essential: true
    });
    
    const marker = markers.find(m => 
        m.getLngLat().lng === place.lng && 
        m.getLngLat().lat === place.lat
    );
    
    if (marker) {
        marker.togglePopup();
    }
}

// Open directions
function openDirections(link) {
    window.open(link, '_blank');
}

// Geolocation functions
function requestLocation() {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        return;
    }
    
    const locationBtn = document.getElementById('locationBtn');
    locationBtn.classList.add('active');
    
    navigator.geolocation.getCurrentPosition(
        position => {
            updateUserLocation(position.coords);
            
            if (watchId === null) {
                watchId = navigator.geolocation.watchPosition(
                    pos => updateUserLocation(pos.coords),
                    error => console.error('Location watch error:', error),
                    { enableHighAccuracy: true, maximumAge: 10000 }
                );
            }
        },
        error => {
            console.error('Geolocation error:', error);
            alert('Could not get your location. Please check your permissions.');
            locationBtn.classList.remove('active');
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

function updateUserLocation(coords) {
    const { latitude, longitude } = coords;
    
    if (userLocationMarker) {
        userLocationMarker.remove();
    }
    
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
    
    map.flyTo({
        center: [longitude, latitude],
        zoom: 15,
        duration: 2000
    });
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
        background: #10B981;
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
    const type = document.getElementById('placeType').value;
    const message = document.getElementById('placeMessage').value;
    const from = document.getElementById('placeFrom').value;
    const link = document.getElementById('placeLink').value;
    
    // Show loading state
    const submitBtn = e.target.querySelector('.btn-primary');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;
    
    try {
        // Get coordinates
        const coords = await getCoordinates(link);
        
        if (!coords) {
            alert('Could not find coordinates for this location. Please check the link or address.');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            return;
        }
        
        // Create new place
        const newPlace = {
            name,
            type,
            lat: coords.lat,
            lng: coords.lng,
            message,
            from,
            link
        };
        
        // Save to Supabase
        await savePlaceToSupabase(newPlace);
        
        closeModal();
        showSuccessMessage();
        
        // Reset form
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
    // Load places from Supabase
    loadPlaces();
    
    // Initialize map
    initMap();
    
    // Set up real-time updates (optional)
    supabase
        .channel('places-changes')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'places' },
            (payload) => {
                console.log('Place updated:', payload);
                loadPlaces(); // Reload when changes occur
            }
        )
        .subscribe();
    
    document.getElementById('locationBtn').addEventListener('click', requestLocation);
    document.getElementById('addBtn').addEventListener('click', openModal);
    document.getElementById('cancelBtn').addEventListener('click', closeModal);
    document.getElementById('addPlaceForm').addEventListener('submit', handleAddPlace);
    
    document.getElementById('addModal').addEventListener('click', (e) => {
        if (e.target.id === 'addModal') {
            closeModal();
        }
    });
    
    document.getElementById('placeType').addEventListener('change', (e) => {
        const messageGroup = document.getElementById('messageGroup');
        const fromGroup = document.getElementById('fromGroup');
        const isBirthday = e.target.value === 'birthday';
        
        messageGroup.style.display = isBirthday ? 'block' : 'none';
        fromGroup.style.display = isBirthday ? 'block' : 'none';
    });
});

// Make functions globally available
window.openDirections = openDirections;
window.flyToPlace = flyToPlace;