// NYC Birthday Adventure Map
// Built with Mapbox GL JS and Geolocation API

// Configuration
const MAPBOX_TOKEN = 'pk.eyJ1IjoibXR0d2hsbHkiLCJhIjoiY2prZngzcGF1MGRhcTNwbzlhYTlza2NicyJ9.Cw82KbQTNdjYdobD3HTK-w';
const NYC_CENTER = [-73.9712, 40.7831]; // NYC coordinates
const DEFAULT_ZOOM = 12;

// State
let map;
let markers = [];
let userLocationMarker = null;
let watchId = null;

// Sample places data structure
let places = [
    {
        id: 1,
        name: 'The Metropolitan Museum of Art',
        type: 'visit',
        lat: 40.7794,
        lng: -73.9632,
        message: '',
        from: '',
        link: 'https://goo.gl/maps/xyz'
    },
    {
        id: 2,
        name: 'Central Park',
        type: 'visit',
        lat: 40.7829,
        lng: -73.9654,
        message: '',
        from: '',
        link: 'https://goo.gl/maps/abc'
    },
    {
        id: 3,
        name: 'Brooklyn Bridge',
        type: 'birthday',
        lat: 40.7061,
        lng: -73.9969,
        message: 'Happy 40th! May this year bring you as much joy as this beautiful bridge brings to NYC. Love you! 💕',
        from: 'Mom & Dad',
        link: 'https://goo.gl/maps/def'
    }
];

// Load places from localStorage
function loadPlaces() {
    const saved = localStorage.getItem('nycBirthdayPlaces');
    if (saved) {
        places = JSON.parse(saved);
    }
}

// Save places to localStorage
function savePlaces() {
    localStorage.setItem('nycBirthdayPlaces', JSON.stringify(places));
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
    
    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
    
    // Add 3D buildings for that WebGL wow factor
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
        
        // Load and display all places
        displayPlaces();
        renderPlacesList();
    });
}

// Extract coordinates from Google Maps link or geocode address
async function getCoordinates(input) {
    // Try to extract from Google Maps link
    const patterns = [
        /@(-?\d+\.\d+),(-?\d+\.\d+)/,  // @lat,lng
        /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/, // !3dlat!4dlng
        /q=(-?\d+\.\d+),(-?\d+\.\d+)/ // q=lat,lng
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
    
    // If not a link, try geocoding the address
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
    icon.textContent = place.type === 'birthday' ? '◯' : '◯';
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
        Get Directions
    </button>`;
    
    return html;
}

// Display all places on map
function displayPlaces() {
    // Clear existing markers
    markers.forEach(marker => marker.remove());
    markers = [];
    
    // Add markers for each place
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
        
        let html = `
            <div class="place-name">${place.name}</div>
        `;
        
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
    
    // Highlight the marker
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
            
            // Watch for position changes
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
    
    // Remove old marker
    if (userLocationMarker) {
        userLocationMarker.remove();
    }
    
    // Create user location marker
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
    
    // Fly to user location
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

// Form handling
async function handleAddPlace(e) {
    e.preventDefault();
    
    const name = document.getElementById('placeName').value;
    const type = document.getElementById('placeType').value;
    const message = document.getElementById('placeMessage').value;
    const from = document.getElementById('placeFrom').value;
    const link = document.getElementById('placeLink').value;
    
    // Get coordinates
    const coords = await getCoordinates(link);
    
    if (!coords) {
        alert('Could not find coordinates for this location. Please check the link or address.');
        return;
    }
    
    // Create new place
    const newPlace = {
        id: Date.now(),
        name,
        type,
        lat: coords.lat,
        lng: coords.lng,
        message,
        from,
        link
    };
    
    places.push(newPlace);
    savePlaces();
    displayPlaces();
    renderPlacesList();
    closeModal();
    
    // Fly to new place
    flyToPlace(newPlace);
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    loadPlaces();
    initMap();
    
    document.getElementById('locationBtn').addEventListener('click', requestLocation);
    document.getElementById('addBtn').addEventListener('click', openModal);
    document.getElementById('cancelBtn').addEventListener('click', closeModal);
    document.getElementById('addPlaceForm').addEventListener('submit', handleAddPlace);
    
    // Close modal on background click
    document.getElementById('addModal').addEventListener('click', (e) => {
        if (e.target.id === 'addModal') {
            closeModal();
        }
    });
    
    // Show/hide message fields based on type
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