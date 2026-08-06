// Dashboard API fetching and DOM updates

let isCelsius = true;
let currentWeatherData = null;
let currentForecastData = null;
let currentAqiData = null;
let currentInsightsData = null;
let liveClockInterval = null;

// Timezone Helper
function formatCityTime(unixTimestamp, timezoneOffsetSeconds, formatStr) {
    // Shift UTC time by the city's offset
    const ms = (unixTimestamp ? unixTimestamp * 1000 : Date.now()) + (timezoneOffsetSeconds * 1000);
    const d = new Date(ms);
    
    const h = d.getUTCHours();
    const m = d.getUTCMinutes();
    
    // Check global time format setting
    const is24 = window.timeFormat === '24';
    
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hr12 = h % 12 || 12;
    const hr24 = h.toString().padStart(2, '0');
    const min = m.toString().padStart(2, '0');
    
    if (formatStr === 'time') return is24 ? `${hr24}:${min}` : `${hr12}:${min} ${ampm}`;
    if (formatStr === 'hour') return is24 ? `${hr24}:00` : `${hr12} ${ampm}`;
    
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    if (formatStr === 'weekday') return days[d.getUTCDay()];
    if (formatStr === 'fullDate') return `${days[d.getUTCDay()]}, ${months[d.getUTCMonth()]} ${d.getUTCDate()}`;
    
    return d;
}

const iconMap = {
    '01d': 'fa-sun', '01n': 'fa-moon',
    '02d': 'fa-cloud-sun', '02n': 'fa-cloud-moon',
    '03d': 'fa-cloud', '03n': 'fa-cloud',
    '04d': 'fa-cloud', '04n': 'fa-cloud',
    '09d': 'fa-cloud-rain', '09n': 'fa-cloud-rain',
    '10d': 'fa-cloud-showers-water', '10n': 'fa-cloud-showers-water',
    '11d': 'fa-cloud-bolt', '11n': 'fa-cloud-bolt',
    '13d': 'fa-snowflake', '13n': 'fa-snowflake',
    '50d': 'fa-smog', '50n': 'fa-smog'
};

async function fetchWeather(city) {
    try {
        if (window.playLoadingSound) window.playLoadingSound();
        hideError();
        showLoader();
        
        // 1 & 2. Current Weather and Forecast in parallel
        const weatherPromise = fetch(`/api/weather?city=${encodeURIComponent(city)}`);
        const forecastPromise = fetch(`/api/forecast?city=${encodeURIComponent(city)}`);

        const [res, forecastRes] = await Promise.all([weatherPromise, forecastPromise]);

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || 'Failed to fetch weather');
        }
        currentWeatherData = await res.json();

        if (!forecastRes.ok) throw new Error('Failed to fetch forecast');
        currentForecastData = await forecastRes.json();
        
        // 3. Air Quality
        const lat = currentWeatherData.coord.lat;
        const lon = currentWeatherData.coord.lon;
        let aqiData = null;
        try {
            const aqiRes = await fetch(`/api/air-quality?lat=${lat}&lon=${lon}`);
            if(aqiRes.ok) aqiData = await aqiRes.json();
        } catch(e) { console.warn("AQI fetch failed", e); }
        
        // 4. AI Insights
        let insightsData = null;
        try {
            const insightRes = await fetch('/api/insights', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    temp: currentWeatherData.main.temp,
                    feels_like: currentWeatherData.main.feels_like,
                    humidity: currentWeatherData.main.humidity,
                    weather_main: currentWeatherData.weather[0].main,
                    weather_desc: currentWeatherData.weather[0].description,
                    wind_speed: currentWeatherData.wind.speed,
                    visibility: currentWeatherData.visibility,
                    aqi: aqiData && aqiData.status === 'ok' ? (aqiData.data.aqi === '-' ? null : parseInt(aqiData.data.aqi)) : null
                })
            });
            if(insightRes.ok) insightsData = await insightRes.json();
        } catch(e) { console.warn("Insights fetch failed", e); }

        // Update DOM
        currentAqiData = aqiData;
        currentInsightsData = insightsData;
        updateUI(aqiData, insightsData);
        
        // Update Map
        if(window.updateMapLocation) {
            window.updateMapLocation(lat, lon);
        }
        
        // Add to recent searches
        if(window.addRecentSearch) {
            if(window.addRecentSearch) window.addRecentSearch(currentWeatherData.name);
        }
        
        if (window.playSuccessSound) window.playSuccessSound();
        hideLoader();
    } catch (error) {
        hideLoader();
        showError(error.message);
    }
}

async function fetchWeatherByCoords(lat, lon) {
    try {
        if (window.playLoadingSound) window.playLoadingSound();
        hideError();
        showLoader();
        
        // 1, 2 & 3. Weather, Forecast, and Air Quality in parallel
        const weatherPromise = fetch(`/api/weather?lat=${lat}&lon=${lon}`);
        const forecastPromise = fetch(`/api/forecast?lat=${lat}&lon=${lon}`);
        const aqiPromise = fetch(`/api/air-quality?lat=${lat}&lon=${lon}`);

        const [res, forecastRes, aqiRes] = await Promise.all([weatherPromise, forecastPromise, aqiPromise]);

        if (!res.ok) throw new Error('Failed to fetch weather');
        currentWeatherData = await res.json();

        // Fetch exact location name using Nominatim API
        try {
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`);
            if (geoRes.ok) {
                const geoData = await geoRes.json();
                if (geoData && geoData.address) {
                    const exactName = geoData.address.village || geoData.address.suburb || geoData.address.neighbourhood || geoData.address.town || geoData.address.city || currentWeatherData.name;
                    currentWeatherData.name = exactName;
                }
            }
        } catch (e) {
            console.warn("Exact location fetch failed", e);
        }

        if (!forecastRes.ok) throw new Error('Failed to fetch forecast');
        currentForecastData = await forecastRes.json();
        
        let aqiData = null;
        try {
            if(aqiRes.ok) aqiData = await aqiRes.json();
        } catch(e) {}
        
        // 4. AI Insights
        let insightsData = null;
        try {
            const insightRes = await fetch('/api/insights', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    temp: currentWeatherData.main.temp,
                    feels_like: currentWeatherData.main.feels_like,
                    humidity: currentWeatherData.main.humidity,
                    weather_main: currentWeatherData.weather[0].main,
                    weather_desc: currentWeatherData.weather[0].description,
                    wind_speed: currentWeatherData.wind.speed,
                    visibility: currentWeatherData.visibility,
                    aqi: aqiData && aqiData.status === 'ok' ? (aqiData.data.aqi === '-' ? null : parseInt(aqiData.data.aqi)) : null
                })
            });
            if(insightRes.ok) insightsData = await insightRes.json();
        } catch(e) {}

        currentAqiData = aqiData;
        currentInsightsData = insightsData;
        updateUI(aqiData, insightsData);
        
        if(window.updateMapLocation) window.updateMapLocation(lat, lon);
        if(window.addRecentSearch) window.addRecentSearch(currentWeatherData.name);
        
        if (window.playSuccessSound) window.playSuccessSound();
        hideLoader();
    } catch (error) {
        hideLoader();
        showError(error.message);
    }
}

function updateUI(aqiData, insightsData) {
    if (!currentWeatherData || !currentForecastData) return;

    // --- Hero Widget ---
    const { name, sys, dt, main, weather, wind, visibility, clouds, timezone } = currentWeatherData;
    
    document.getElementById('city-name').textContent = name;
    document.getElementById('country-name').textContent = sys.country;
    
    // Live Clock setup
    document.getElementById('date-time').textContent = formatCityTime(null, timezone, 'fullDate');
    if (liveClockInterval) clearInterval(liveClockInterval);
    liveClockInterval = setInterval(() => {
        document.getElementById('current-time').textContent = formatCityTime(null, timezone, 'time');
    }, 1000);
    document.getElementById('current-time').textContent = formatCityTime(null, timezone, 'time'); // Initial render

    document.getElementById('current-temp').textContent = `${formatTemp(main.temp)}°`;
    document.getElementById('current-desc').textContent = weather[0].description;
    
    const iconCode = weather[0].icon;
    const faIcon = iconMap[iconCode] || 'fa-cloud';
    document.getElementById('current-icon').innerHTML = `<i class="fa-solid ${faIcon}"></i>`;

    // --- Details Grid ---
    document.getElementById('humidity').textContent = `${main.humidity}%`;
    
    let windStr = '';
    const ws = wind.speed; // This is always m/s from OWM metrics (or metric request)
    if (window.windUnit === 'kmh') {
        windStr = `${(ws * 3.6).toFixed(1)} km/h`;
    } else if (window.windUnit === 'mph') {
        windStr = `${(ws * 2.237).toFixed(1)} mph`;
    } else if (window.windUnit === 'knots') {
        windStr = `${(ws * 1.944).toFixed(1)} knots`;
    } else {
        windStr = `${ws.toFixed(1)} m/s`;
    }
    document.getElementById('wind-speed').textContent = windStr;
    document.getElementById('feels-like').textContent = `${formatTemp(main.feels_like)}°`;
    document.getElementById('visibility').textContent = `${(visibility / 1000).toFixed(1)} km`;
    document.getElementById('pressure').textContent = `${main.pressure} hPa`;
    document.getElementById('clouds').textContent = `${clouds.all}%`;

    // --- AQI Widget ---
    if(aqiData && aqiData.status === 'ok' && aqiData.data.aqi !== '-') {
        const data = aqiData.data;
        const aqi = parseInt(data.aqi);
        const iaqi = data.iaqi || {};
        
        document.getElementById('aqi-score').textContent = aqi;
        document.getElementById('pm25').textContent = iaqi.pm25 ? iaqi.pm25.v : '--';
        document.getElementById('pm10').textContent = iaqi.pm10 ? iaqi.pm10.v : '--';
        document.getElementById('o3').textContent = iaqi.o3 ? iaqi.o3.v : '--';
        
        let status = 'Good', color = '#10b981'; // 🟢 Green
        if(aqi >= 51 && aqi <= 100) { status = 'Moderate'; color = '#facc15'; } // 🟡 Yellow
        if(aqi >= 101 && aqi <= 150) { status = 'Unhealthy for Sensitive Groups'; color = '#fb923c'; } // 🟠 Orange
        if(aqi >= 151 && aqi <= 200) { status = 'Unhealthy'; color = '#ef4444'; } // 🔴 Red
        if(aqi >= 201 && aqi <= 300) { status = 'Very Unhealthy'; color = '#a855f7'; } // 🟣 Purple
        if(aqi >= 301) { status = 'Hazardous'; color = '#000000'; } // ⚫ Black
        
        const aqiStatusEl = document.getElementById('aqi-status');
        aqiStatusEl.textContent = status;
        aqiStatusEl.style.color = color;
        document.getElementById('aqi-score').style.color = color;
    }

    // --- AI Insights Widget ---
    const insightsContainer = document.getElementById('insights-container');
    insightsContainer.innerHTML = '';
    if (insightsData && insightsData.insights) {
        insightsData.insights.forEach(insight => {
            const div = document.createElement('div');
            div.className = 'insight-item';
            div.innerHTML = `
                <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.5rem; font-weight:600; color:var(--color-secondary);">
                    <i class="fa-solid ${insight.icon || 'fa-lightbulb'}"></i> <span>${insight.type || 'Insight'}</span>
                </div>
                <div style="line-height:1.5; font-size: 0.95rem;">${insight.message}</div>
            `;
            insightsContainer.appendChild(div);
        });
    } else {
        insightsContainer.innerHTML = '<div class="insight-item">Enjoy the day!</div>';
    }
    
    // --- Sunrise / Sunset ---
    document.getElementById('sunrise-time').textContent = formatCityTime(sys.sunrise, timezone, 'time');
    document.getElementById('sunset-time').textContent = formatCityTime(sys.sunset, timezone, 'time');

    // --- 24-Hour Forecast (Hourly) ---
    const hourlyContainer = document.getElementById('hourly-container');
    hourlyContainer.innerHTML = '';
    currentForecastData.list.slice(0, 8).forEach(item => {
        const timeStr = formatCityTime(item.dt, timezone, 'hour');
        const icon = iconMap[item.weather[0].icon] || 'fa-cloud';
        const html = `
            <div style="display:flex; flex-direction:column; align-items:center; gap:0.5rem; min-width: 80px; padding: 1rem; background: rgba(0,0,0,0.2); border-radius: 12px;">
                <span style="color:var(--text-secondary); font-size: 0.9rem;">${timeStr}</span>
                <i class="fa-solid ${icon}" style="font-size: 1.5rem; color:var(--color-secondary);"></i>
                <span style="font-weight:600; font-size:1.1rem;">${formatTemp(item.main.temp)}°</span>
            </div>
        `;
        hourlyContainer.insertAdjacentHTML('beforeend', html);
    });

    // --- 5-Day Forecast ---
    const dailyContainer = document.getElementById('daily-container');
    dailyContainer.innerHTML = '';
    const dailyData = {};
    currentForecastData.list.forEach(item => {
        const dayName = formatCityTime(item.dt, timezone, 'weekday');
        if (!dailyData[dayName]) {
            dailyData[dayName] = { min: item.main.temp_min, max: item.main.temp_max, icon: item.weather[0].icon, desc: item.weather[0].main };
        } else {
            dailyData[dayName].min = Math.min(dailyData[dayName].min, item.main.temp_min);
            dailyData[dayName].max = Math.max(dailyData[dayName].max, item.main.temp_max);
        }
    });

    Object.keys(dailyData).slice(0, 5).forEach(day => {
        const data = dailyData[day];
        const icon = iconMap[data.icon] || 'fa-cloud';
        const html = `
            <div class="daily-item">
                <span style="flex:1; font-weight:500;">${day}</span>
                <div style="flex:1; display:flex; align-items:center; gap: 0.5rem; color:var(--color-secondary);">
                    <i class="fa-solid ${icon}"></i> <span>${data.desc}</span>
                </div>
                <div style="flex:1; text-align:right;">
                    <span style="font-weight:600;">${formatTemp(data.max)}°</span>
                    <span style="color:var(--text-secondary); margin-left:0.5rem;">${formatTemp(data.min)}°</span>
                </div>
            </div>
        `;
        dailyContainer.insertAdjacentHTML('beforeend', html);
    });

    // --- Charts ---
    if(window.renderTempChart) {
        window.renderTempChart(currentForecastData, isCelsius);
    }

    // --- Dynamic Theme & 3D ---
    updateThemeBasedOnWeather(weather[0].main);

    // Trigger GSAP animations for new elements
    if (window.animateDashboardReveal) {
        window.animateDashboardReveal();
    }
}

function updateThemeBasedOnWeather(weatherMain) {
    let gradient = 'var(--weather-cloudy)';
    switch(weatherMain.toLowerCase()) {
        case 'clear': gradient = 'var(--weather-sunny)'; break;
        case 'clouds': gradient = 'var(--weather-cloudy)'; break;
        case 'rain': 
        case 'drizzle': gradient = 'var(--weather-rain)'; break;
        case 'thunderstorm': gradient = 'var(--weather-storm)'; break;
        case 'snow': gradient = 'var(--weather-snow)'; break;
    }

    // Update global background
    document.getElementById('dynamic-bg').style.background = gradient;
    
    // Update Theme UI Accents
    document.documentElement.style.setProperty('--color-secondary', getComputedStyle(document.documentElement).getPropertyValue(gradient.replace('var(', '').replace(')', '')));

    // Update 3D scene
    if (window.updateThreeSceneWeather) {
        window.updateThreeSceneWeather(weatherMain);
    }
    
    // Ambient Sound Logic
    const mainCondition = weatherMain.toLowerCase();
    if (mainCondition.includes('rain') || mainCondition.includes('drizzle') || mainCondition.includes('thunderstorm')) {
        window.currentWeatherCondition = 'rain';
    } else if (mainCondition.includes('snow')) {
        window.currentWeatherCondition = 'snow';
    } else if (mainCondition.includes('mist') || mainCondition.includes('fog')) {
        window.currentWeatherCondition = 'wind';
    } else {
        window.currentWeatherCondition = 'clear';
    }
    if (window.updateWeatherAmbience) {
        window.updateWeatherAmbience();
    }
    
    // Trigger ambient CSS animations
    createWeatherEffects(weatherMain);
}

function createWeatherEffects(weatherMain) {
    const container = document.getElementById('weather-effects-container');
    if (!container) return;
    container.innerHTML = ''; // Clear existing
    
    if (window.animMaster === false || window.animParticles === false) {
        return;
    }
    
    const condition = weatherMain.toLowerCase();
    
    if (condition === 'clear') {
        const ray = document.createElement('div');
        ray.className = 'sun-ray';
        container.appendChild(ray);
    } 
    else if (condition === 'clouds') {
        // Spawn 4 floating clouds
        for (let i = 0; i < 4; i++) {
            const cloud = document.createElement('div');
            cloud.className = 'cloud-particle';
            cloud.style.width = `${Math.random() * 200 + 100}px`;
            cloud.style.height = `${Math.random() * 100 + 50}px`;
            cloud.style.top = `${Math.random() * 50}vh`;
            cloud.style.animationDuration = `${Math.random() * 40 + 20}s`;
            cloud.style.animationDelay = `-${Math.random() * 20}s`; // start midway
            container.appendChild(cloud);
        }
    }
    else if (condition === 'rain' || condition === 'drizzle') {
        // 50 raindrops max to save performance
        for (let i = 0; i < 50; i++) {
            const drop = document.createElement('div');
            drop.className = 'rain-particle';
            drop.style.left = `${Math.random() * 100}vw`;
            drop.style.animationDuration = `${Math.random() * 0.5 + 0.5}s`;
            drop.style.animationDelay = `${Math.random() * 2}s`;
            container.appendChild(drop);
        }
    }
    else if (condition === 'snow') {
        // 30 snowflakes
        for (let i = 0; i < 30; i++) {
            const flake = document.createElement('div');
            flake.className = 'snow-particle';
            flake.style.left = `${Math.random() * 100}vw`;
            flake.style.animationDuration = `${Math.random() * 3 + 3}s`;
            flake.style.animationDelay = `${Math.random() * 3}s`;
            // Vary size slightly
            const size = Math.random() * 5 + 3;
            flake.style.width = `${size}px`;
            flake.style.height = `${size}px`;
            container.appendChild(flake);
        }
    }
    else if (condition === 'thunderstorm') {
        // Rain
        for (let i = 0; i < 60; i++) {
            const drop = document.createElement('div');
            drop.className = 'rain-particle';
            drop.style.left = `${Math.random() * 100}vw`;
            drop.style.animationDuration = `${Math.random() * 0.5 + 0.3}s`; // faster
            drop.style.animationDelay = `${Math.random() * 2}s`;
            container.appendChild(drop);
        }
        // Lightning flash
        const flash = document.createElement('div');
        flash.className = 'lightning-flash';
        container.appendChild(flash);
    }
}

function formatTemp(tempC) {
    if (isCelsius) return Math.round(tempC);
    return Math.round((tempC * 9/5) + 32);
}

function toggleUnit() {
    isCelsius = !isCelsius;
    const btn = document.getElementById('unit-toggle');
    btn.textContent = isCelsius ? '°C' : '°F';
    if(currentWeatherData) {
        updateUI(currentAqiData, currentInsightsData); 
    }
}

function showError(msg) {
    document.getElementById('error-text').textContent = msg;
    document.getElementById('error-msg').classList.remove('hidden');
}

function hideError() {
    document.getElementById('error-msg').classList.add('hidden');
}

function showLoader() {
    const loader = document.getElementById('loader');
    if(loader) {
        loader.style.visibility = 'visible';
        loader.style.opacity = '1';
    }
}

function hideLoader() {
    const loader = document.getElementById('loader');
    if(loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.style.visibility = 'hidden', 1000);
    }
}

// Event Listeners
document.getElementById('city-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = e.target.value.trim();
        if(city) {
            e.target.blur(); // dismiss keyboard
            document.getElementById('recent-searches').classList.add('hidden');
            fetchWeather(city);
        }
    }
});

document.getElementById('unit-toggle').addEventListener('click', toggleUnit);

const locBtn = document.getElementById('location-btn');
if(locBtn) {
    locBtn.addEventListener('click', () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
                },
                (error) => {
                    showError("Location access denied or unavailable.");
                }
            );
        } else {
            showError("Geolocation is not supported by this browser.");
        }
    });
}
