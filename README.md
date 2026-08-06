# Weather3D

A premium, 3D interactive weather forecast web application built with Flask, Three.js, GSAP, and the OpenWeatherMap API.

## Features

- **3D Interactive Background**: A Three.js powered procedural Earth and particle system.
- **Glassmorphism UI**: Modern frosted glass design with dynamic color themes based on weather conditions.
- **Smooth Animations**: GSAP and Lenis smooth scrolling for a premium feel.
- **Real-Time Data**: Fetches current weather, hourly forecast, and 5-day forecast via OpenWeatherMap.
- **Responsive**: Fully responsive design adapting to mobile, tablet, and desktop views.
- **Weather Effects**: Dynamic particle overlays for rain/snow based on live weather data.

## Prerequisites

- Python 3.8+
- An API Key from [OpenWeatherMap](https://home.openweathermap.org/users/sign_up)

## Setup Instructions

1. **Clone or Navigate to the project directory:**
   ```bash
   cd Weather-App
   ```

2. **Create a virtual environment (optional but recommended):**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```

3. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Variables Setup:**
   Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and replace `your_api_key_here` with your actual OpenWeatherMap API Key.

5. **Run the Application:**
   ```bash
   python app.py
   ```

6. **View the Website:**
   Open your browser and navigate to `p.

## Tech Stack

- **Backend**: Python, Flask, Requests
- **Frontend**: HTML5, Vanilla JavaScript, CSS3
- **Libraries**: 
  - [Three.js](https://threejs.org/) (3D Graphics)
  - [GSAP](https://greensock.com/gsap/) (Animations)
  - [Lenis](https://lenis.studiofreight.com/) (Smooth Scrolling)
  - [FontAwesome](https://fontawesome.com/) (Icons)

## License
MIT License
