from flask import Flask, render_template, request, jsonify
import requests
import os
from dotenv import load_dotenv
from math import radians, cos, sin, asin, sqrt

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Constants
OWM_API_KEY = os.getenv('OPENWEATHERMAP_API_KEY')
WEATHERAPI_KEY = os.getenv('WEATHERAPI_KEY', '5c3ee4f89e2b4b788b2190843261208')
BASE_URL = 'https://api.openweathermap.org/data/2.5'
def haversine(lat1, lon1, lat2, lon2):
    """Calculate the great circle distance in kilometers between two points on the earth."""
    lon1, lat1, lon2, lat2 = map(radians, [float(lon1), float(lat1), float(lon2), float(lat2)])
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a)) 
    r = 6371 # Radius of earth in kilometers
    return c * r

def calc_pm25_aqi(pm25):
    """Calculate the US EPA AQI for PM2.5 concentration."""
    if pm25 <= 12.0: return int(round((50 - 0) / (12.0 - 0.0) * (pm25 - 0.0) + 0))
    elif pm25 <= 35.4: return int(round((100 - 51) / (35.4 - 12.1) * (pm25 - 12.1) + 51))
    elif pm25 <= 55.4: return int(round((150 - 101) / (55.4 - 35.5) * (pm25 - 35.5) + 101))
    elif pm25 <= 150.4: return int(round((200 - 151) / (150.4 - 55.5) * (pm25 - 55.5) + 151))
    elif pm25 <= 250.4: return int(round((300 - 201) / (250.4 - 150.5) * (pm25 - 150.5) + 201))
    elif pm25 <= 350.4: return int(round((400 - 301) / (350.4 - 250.5) * (pm25 - 250.5) + 301))
    elif pm25 <= 500.4: return int(round((500 - 401) / (500.4 - 350.5) * (pm25 - 350.5) + 401))
    else: return 500

def build_params(city, lat, lon):
    params = {
        'appid': OWM_API_KEY,
        'units': 'metric'
    }
    if city:
        params['q'] = city
    elif lat and lon:
        params['lat'] = lat
        params['lon'] = lon
    return params

@app.route('/')
def index():
    """Render the main single-page application dashboard."""
    return render_template('index.html')

@app.route('/api/weather', methods=['GET'])
def get_weather():
    """Proxy route to fetch current weather data from OpenWeatherMap."""
    city = request.args.get('city')
    lat = request.args.get('lat')
    lon = request.args.get('lon')

    if not OWM_API_KEY:
        return jsonify({'error': 'API key not configured on server.'}), 500

    params = build_params(city, lat, lon)
    if 'q' not in params and 'lat' not in params:
        return jsonify({'error': 'Please provide city or coordinates.'}), 400

    try:
        response = requests.get(f'{BASE_URL}/weather', params=params)
        response.raise_for_status()
        return jsonify(response.json())
    except requests.exceptions.RequestException as e:
        status_code = response.status_code if response is not None else 500
        if status_code == 404:
             return jsonify({'error': 'City not found.'}), 404
        return jsonify({'error': 'Failed to fetch weather data.', 'details': str(e)}), status_code

@app.route('/api/forecast', methods=['GET'])
def get_forecast():
    """Proxy route to fetch 5-day / 3-hour forecast data from OpenWeatherMap."""
    city = request.args.get('city')
    lat = request.args.get('lat')
    lon = request.args.get('lon')

    if not OWM_API_KEY:
        return jsonify({'error': 'API key not configured on server.'}), 500

    params = build_params(city, lat, lon)
    if 'q' not in params and 'lat' not in params:
        return jsonify({'error': 'Please provide city or coordinates.'}), 400

    try:
        response = requests.get(f'{BASE_URL}/forecast', params=params)
        response.raise_for_status()
        return jsonify(response.json())
    except requests.exceptions.RequestException as e:
        status_code = response.status_code if response is not None else 500
        if status_code == 404:
             return jsonify({'error': 'City not found.'}), 404
        return jsonify({'error': 'Failed to fetch forecast data.', 'details': str(e)}), status_code

@app.route('/api/air-quality', methods=['GET'])
def get_air_quality():
    """Proxy route to fetch Air Quality data using WeatherAPI."""
    lat = request.args.get('lat')
    lon = request.args.get('lon')

    if not WEATHERAPI_KEY:
        return jsonify({'error': 'WeatherAPI key not configured on server.'}), 500
        
    if not lat or not lon:
        return jsonify({'error': 'Air quality API requires latitude and longitude.'}), 400
    
    try:
        # WeatherAPI requires a query, we'll use coordinates to be most precise
        query = f"{lat},{lon}"
        response = requests.get(f'http://api.weatherapi.com/v1/current.json', params={'key': WEATHERAPI_KEY, 'q': query, 'aqi': 'yes'})
        response.raise_for_status()
        weatherapi_data = response.json()
        
        # WeatherAPI provides PM2.5, PM10, etc. under current.air_quality
        aqi_data = weatherapi_data.get('current', {}).get('air_quality', {})
        pm25 = aqi_data.get('pm2_5', 0)
        pm10 = aqi_data.get('pm10', 0)
        o3 = aqi_data.get('o3', 0)
        
        # Calculate the US EPA AQI using PM2.5
        calculated_aqi = calc_pm25_aqi(pm25)
        
        # Return in the format expected by the frontend
        return jsonify({
            "status": "ok",
            "data": {
                "aqi": calculated_aqi,
                "iaqi": {
                    "pm25": {"v": round(pm25, 1)},
                    "pm10": {"v": round(pm10, 1)},
                    "o3": {"v": round(o3, 1)}
                }
            }
        })
    except requests.exceptions.RequestException as e:
        status_code = response.status_code if response is not None else 500
        return jsonify({'error': 'Failed to fetch air quality data.', 'details': str(e)}), status_code

@app.route('/api/reverse-geocode', methods=['GET'])
def reverse_geocode():
    """Proxy route for Nominatim reverse geocoding to avoid CORS and browser blocks."""
    lat = request.args.get('lat')
    lon = request.args.get('lon')
    if not lat or not lon:
        return jsonify({'error': 'Missing lat or lon.'}), 400
    
    headers = {
        'User-Agent': 'WeatherApp-Proxy/1.0 (contact@weatherapp.com)'
    }
    try:
        response = requests.get(f'https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat={lat}&lon={lon}', headers=headers)
        response.raise_for_status()
        return jsonify(response.json())
    except requests.exceptions.RequestException as e:
        status_code = response.status_code if response is not None else 500
        return jsonify({'error': 'Failed to fetch location data.', 'details': str(e)}), status_code

@app.route('/api/insights', methods=['POST'])
def generate_insights():
    """Generate programmatic AI-like insights based on weather data."""
    data = request.json
    if not data:
        return jsonify({'error': 'No data provided'}), 400
        
    temp = data.get('temp', 20)
    feels_like = data.get('feels_like', temp)
    humidity = data.get('humidity', 50)
    weather_main = data.get('weather_main', 'Clear').lower()
    wind_speed = data.get('wind_speed', 0)
    visibility = data.get('visibility', 10000)
    aqi = data.get('aqi')
    
    insights = []
    
    # 1. Thermal Comfort & Health
    if temp >= 30 and humidity >= 70:
        msg = f"High heat ({temp}°C) combined with {humidity}% humidity creates an oppressive Heat Index. Hydration is strictly recommended; limit strenuous outdoor activities."
        insights.append({"type": "Health & Comfort", "icon": "fa-heart-pulse", "message": msg})
    elif temp < 5 and wind_speed > 5:
        msg = f"Wind chill effect is active. While it is {temp}°C, the {wind_speed}m/s winds make it feel closer to {feels_like}°C. Insulated layers are required."
        insights.append({"type": "Health & Comfort", "icon": "fa-temperature-arrow-down", "message": msg})
    elif humidity < 30:
        insights.append({"type": "Skin & Hydration", "icon": "fa-droplet-slash", "message": "Unusually dry air detected. You may experience dry skin or throat irritation. Consider using a humidifier indoors."})
    else:
        if 15 <= temp <= 25:
            insights.append({"type": "Thermal Comfort", "icon": "fa-temperature-half", "message": "Optimal thermal comfort. The temperature-humidity index is perfectly balanced for human comfort."})
    
    # 2. Air Quality Impact
    if aqi is not None:
        if aqi <= 50:
            insights.append({"type": "Atmospheric Health", "icon": "fa-wind", "message": "Air quality is Good. Excellent conditions for opening windows and refreshing indoor air."})
        elif aqi <= 100:
            insights.append({"type": "Atmospheric Health", "icon": "fa-wind", "message": "Air quality is Moderate. Generally acceptable for most individuals."})
        elif aqi <= 150:
            insights.append({"type": "Atmospheric Health", "icon": "fa-smog", "message": "Air quality is Unhealthy for Sensitive Groups. Sensitive individuals might experience minor respiratory symptoms."})
        elif aqi <= 200:
            insights.append({"type": "Atmospheric Health", "icon": "fa-mask-ventilator", "message": "Air quality is Unhealthy. Keep windows closed and avoid heavy exertion outdoors."})
        elif aqi <= 300:
            insights.append({"type": "Atmospheric Health", "icon": "fa-biohazard", "message": "Air quality is Very Unhealthy. Serious health risks. Everyone should avoid outdoor activities."})
        else:
            insights.append({"type": "Atmospheric Health", "icon": "fa-skull-crossbones", "message": "Air quality is Hazardous. Health warning of emergency conditions."})
    
    # 3. Commute & Visibility
    if visibility < 2000 or weather_main in ['fog', 'mist']:
        insights.append({"type": "Commute Safety", "icon": "fa-car-burst", "message": f"Severe visibility reduction down to {visibility/1000}km. Use low-beam headlights and maintain safe following distances."})
    elif weather_main in ['rain', 'thunderstorm', 'drizzle', 'snow']:
        insights.append({"type": "Commute Safety", "icon": "fa-road-spikes", "message": "Precipitation will affect road friction. Expect increased braking distances and potential traffic delays."})
    
    # 4. Lifestyle & Activity
    if weather_main == 'clear' and wind_speed < 8:
        insights.append({"type": "Activity Recommendation", "icon": "fa-person-running", "message": "Peak conditions for outdoor recreation or photography. Clean sightlines and stable atmosphere."})
    elif wind_speed > 10:
        insights.append({"type": "Structural Alert", "icon": "fa-house-chimney-crack", "message": f"Strong sustained winds at {wind_speed}m/s. Secure loose outdoor objects and be cautious of falling debris."})

    # Fallback if no specific insights hit
    if len(insights) == 0:
        insights.append({"type": "General Overview", "icon": "fa-chart-pie", "message": "Weather conditions are relatively stable with no extreme metrics detected."})

    return jsonify({"insights": insights})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
