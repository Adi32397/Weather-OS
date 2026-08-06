// Dashboard State and Map logic

let map = null;
let currentMapLayer = null;

// Mock Favorite Cities & Recent Searches via LocalStorage
const STORAGE_KEYS = {
    FAV: 'weatheros_favourites',
    RECENT: 'weatheros_recent'
};

function initDashboard() {
    initMap();
    renderFavourites();
    renderRecentSearches();
    initRouter();
}

function initRouter() {
    const navItems = document.querySelectorAll('.sidebar .nav-item');
    const pages = document.querySelectorAll('.page-view');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // 1. Update Nav UI
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            // 2. Hide all pages
            pages.forEach(p => {
                p.classList.remove('active');
            });

            // 3. Show Target Page
            const targetId = item.getAttribute('data-target');
            const targetPage = document.getElementById(targetId);
            if(targetPage) {
                targetPage.classList.add('active');
                
                // 4. Trigger specific page logic
                if(targetId === 'page-map' && map) {
                    // Leaflet map needs to recalculate size when unhidden
                    setTimeout(() => {
                        map.invalidateSize();
                    }, 50);
                }
                
                // 5. Re-trigger animations for widgets in the new page
                if (window.animateDashboardReveal) {
                    window.animateDashboardReveal(targetPage);
                }
            }
        });
    });
}

let currentTileLayer = null;

window.setMapLayer = function(layerId) {
    if (!map) return;
    
    if (currentTileLayer) {
        map.removeLayer(currentTileLayer);
    }
    
    let url = '';
    let options = { maxZoom: 19 };
    
    if (layerId === 'satellite') {
        url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    } else if (layerId === 'standard') {
        url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    } else {
        // default dark
        url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
        options.subdomains = 'abcd';
    }
    
    currentTileLayer = L.tileLayer(url, options).addTo(map);
};

function initMap() {
    const mapContainer = document.getElementById('leaflet-map');
    if(!mapContainer) return;

    // Default to London, will update when weather fetches
    map = L.map('leaflet-map', {
        zoomControl: false,
        attributionControl: false
    }).setView([51.505, -0.09], 4);

    window.setMapLayer(window.mapLayer || 'dark');
    
    // Add custom zoom control to top right
    L.control.zoom({ position: 'topright' }).addTo(map);
}

function updateMapLocation(lat, lon) {
    if(map) {
        map.setView([lat, lon], 10);
        // Clear old markers
        map.eachLayer((layer) => {
            if (layer instanceof L.Marker) {
                map.removeLayer(layer);
            }
        });
        
        // Add Marker
        const customIcon = L.divIcon({
            className: 'custom-map-marker',
            html: '<i class="fa-solid fa-location-dot" style="color:var(--color-primary); font-size: 2rem; filter: drop-shadow(0 0 10px rgba(37,99,235,0.8));"></i>',
            iconSize: [30, 30],
            iconAnchor: [15, 30]
        });
        
        L.marker([lat, lon], {icon: customIcon}).addTo(map);
    }
}

// LocalStorage Helpers
function getStored(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
}
function setStored(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function addRecentSearch(city) {
    if (window.rememberHistory === false) return; // Respect privacy setting
    
    let recent = getStored(STORAGE_KEYS.RECENT);
    // Remove if exists to push to front
    recent = recent.filter(c => c.toLowerCase() !== city.toLowerCase());
    recent.unshift(city);
    if(recent.length > 5) recent.pop(); // Keep top 5
    setStored(STORAGE_KEYS.RECENT, recent);
    renderRecentSearches();
}

function renderRecentSearches() {
    const container = document.getElementById('recent-searches');
    const recent = getStored(STORAGE_KEYS.RECENT);
    
    if(recent.length === 0) {
        container.innerHTML = '<div style="padding: 1rem; color: var(--text-secondary); font-size: 0.9rem;">No recent searches</div>';
        return;
    }
    
    container.innerHTML = '';
    recent.forEach(city => {
        const div = document.createElement('div');
        div.className = 'recent-item';
        div.innerHTML = `<i class="fa-solid fa-clock-rotate-left"></i> <span>${city}</span>`;
        div.addEventListener('click', () => {
            document.getElementById('city-input').value = city;
            container.classList.add('hidden');
            if(window.fetchWeather) window.fetchWeather(city);
        });
        container.appendChild(div);
    });
}

function toggleFavourite(city) {
    if (window.rememberHistory === false) return; // Respect privacy setting
    
    let favs = getStored(STORAGE_KEYS.FAV);
    if(favs.includes(city)) {
        favs = favs.filter(c => c !== city);
    } else {
        favs.push(city);
    }
    setStored(STORAGE_KEYS.FAV, favs);
    renderFavourites();
}

function renderFavourites() {
    const list = document.getElementById('fav-list');
    const favs = getStored(STORAGE_KEYS.FAV);
    
    list.innerHTML = '';
    
    // Add default if empty just for UI showcase
    if(favs.length === 0) {
        favs.push('New York', 'Tokyo', 'London');
        setStored(STORAGE_KEYS.FAV, favs);
    }
    
    favs.forEach(city => {
        const li = document.createElement('li');
        li.className = 'fav-item';
        li.innerHTML = `<span>${city}</span> <i class="fa-solid fa-chevron-right"></i>`;
        li.addEventListener('click', () => {
            if(window.fetchWeather) window.fetchWeather(city);
        });
        list.appendChild(li);
    });
}

// Show/Hide recent searches dropdown
document.getElementById('city-input').addEventListener('focus', () => {
    document.getElementById('recent-searches').classList.remove('hidden');
});

document.addEventListener('click', (e) => {
    const searchContainer = document.querySelector('.search-container');
    if(searchContainer && !searchContainer.contains(e.target)) {
        const recentSearches = document.getElementById('recent-searches');
        if(recentSearches) recentSearches.classList.add('hidden');
    }
});

// Global Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl + K : Focus Search
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('city-input');
        if (searchInput) {
            searchInput.focus();
            // Show recent searches if available
            const recentSearches = document.getElementById('recent-searches');
            if (recentSearches) recentSearches.classList.remove('hidden');
        }
    }
    
    // Ctrl + S : Open Settings
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        const settingsTab = document.querySelector('.sidebar .nav-item[data-target="page-settings"]');
        if (settingsTab) {
            settingsTab.click();
        }
    }
});
