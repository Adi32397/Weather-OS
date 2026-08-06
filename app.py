from flask import Flask, render_template, request, jsonify
import requests
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Constants
OWM_API_KEY = os.getenv('OPENWEATHERMAP_API_KEY')
WAQI_API_KEY = os.getenv('WAQI_API_KEY', '0490e373f4052b7145e4cbb3d082cd0797f37ccf')
BASE_URL = 'https://api.openweathermap.org/data/2.5'

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
    """Proxy route to fetch Air Quality data."""
    lat = request.args.get('lat')
    lon = request.args.get('lon')

    if not WAQI_API_KEY:
        return jsonify({'error': 'WAQI API key not configured on server.'}), 500
        
    if not lat or not lon:
        return jsonify({'error': 'Air quality API requires latitude and longitude.'}), 400
    
    try:
        # WAQI Air Quality API endpoint
        response = requests.get(f'https://api.waqi.info/feed/geo:{lat};{lon}/', params={'token': WAQI_API_KEY})
        response.raise_for_status()
        return jsonify(response.json())
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
