// Main Entry Point

document.addEventListener("DOMContentLoaded", () => {
    // 1. Initialize Animations (GSAP + Lenis Loader)
    if (typeof initAnimations === 'function') initAnimations();

    // 2. Initialize Dashboard State & Map
    if (typeof initDashboard === 'function') initDashboard();

    // 3. Initialize 3D Scene
    if (typeof initThreeScene === 'function') initThreeScene();

    // 4. Theme Toggle Setup
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            document.body.classList.toggle('theme-light');
            const icon = themeBtn.querySelector('i');
            if (document.body.classList.contains('theme-light')) {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            } else {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
        });
    }

    // 3.5 Ambient Sounds Toggle
    const soundAmbientToggle = document.getElementById('setting-sound-weather');
    if(soundAmbientToggle) {
        soundAmbientToggle.addEventListener('change', (e) => {
            window.weatherAmbienceEnabled = e.target.checked;
            if(window.updateWeatherAmbience) window.updateWeatherAmbience();
            if(e.target.checked) {
                showToast("Weather Ambience Enabled");
            } else {
                showToast("Weather Ambience Disabled");
            }
        });
    }

    // 5. Sound & Profile features
    initSoundSystem();
    initProfileModal();

    // 6. Default Fetch
    setTimeout(() => {
        if(typeof fetchWeather === 'function') {
            if(localStorage.getItem('autoGps') === 'true' && typeof fetchWeatherByCoords === 'function') {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
                        },
                        (error) => {
                            console.warn("Geolocation denied or failed. Falling back to default city.");
                            fetchWeather(localStorage.getItem('defaultCity') || 'London');
                        }
                    );
                } else {
                    fetchWeather(localStorage.getItem('defaultCity') || 'London');
                }
            } else {
                fetchWeather(localStorage.getItem('defaultCity') || 'London');
            }
        }
    }, 2500); // Wait for loader animation to finish
});

// Web Audio API for UI Click Sounds
window.soundEnabled = false;
let audioCtx = null;

function initSoundSystem() {
    const soundBtn = document.getElementById('sound-toggle');
    if(soundBtn) {
        soundBtn.addEventListener('click', () => {
            window.soundEnabled = !window.soundEnabled;
            const icon = soundBtn.querySelector('i');
            if (window.soundEnabled) {
                icon.classList.remove('fa-volume-xmark');
                icon.classList.add('fa-volume-high');
                if(!audioCtx) {
                    const AudioContext = window.AudioContext || window.webkitAudioContext;
                    audioCtx = new AudioContext();
                }
                
                // Apply Ambient Sounds
                const soundAmbientToggle = document.getElementById('setting-sound-weather');
                if (soundAmbientToggle && settings.soundAmbient !== undefined) {
                    soundAmbientToggle.checked = settings.soundAmbient;
                    window.weatherAmbienceEnabled = settings.soundAmbient;
                    if(window.updateWeatherAmbience) window.updateWeatherAmbience();
                }

                playClickSound(); // feedback
            } else {
                icon.classList.remove('fa-volume-high');
                icon.classList.add('fa-volume-xmark');
            }
        });
    }

    // Attach sound to all buttons
    document.addEventListener('click', (e) => {
        if(window.soundEnabled && e.target.closest('.icon-btn, .text-btn, .nav-item, .fav-item, .profile-avatar')) {
            playClickSound();
        }
    });
}

function playClickSound() {
    if(!window.soundEnabled || !audioCtx) return;
    if(audioCtx.state === 'suspended') audioCtx.resume();
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.05);
    
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.05);
}

window.playLoadingSound = function() {
    if(!window.soundEnabled || !audioCtx) return;
    if(audioCtx.state === 'suspended') audioCtx.resume().catch(()=>{});
    if(audioCtx.state === 'suspended') return;
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.4);
    
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.1);
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.4);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.4);
};

window.playSuccessSound = function() {
    if(!window.soundEnabled || !audioCtx) return;
    if(audioCtx.state === 'suspended') audioCtx.resume().catch(()=>{});
    if(audioCtx.state === 'suspended') return;
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    osc.frequency.setValueAtTime(600, audioCtx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
};

// Weather Ambience Synthesis
window.weatherAmbienceEnabled = false;
window.currentWeatherCondition = 'clear';
let ambienceSource = null;
let ambienceGain = null;

function createWhiteNoiseBuffer(audioCtx) {
    const bufferSize = audioCtx.sampleRate * 2; // 2 seconds
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    return buffer;
}

window.updateWeatherAmbience = function() {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();

    // Stop existing
    if (ambienceSource) {
        ambienceSource.stop();
        ambienceSource.disconnect();
        ambienceSource = null;
    }

    if (!window.weatherAmbienceEnabled) return;
    if (window.currentWeatherCondition === 'clear') return; // no sound

    ambienceSource = audioCtx.createBufferSource();
    ambienceSource.buffer = createWhiteNoiseBuffer(audioCtx);
    ambienceSource.loop = true;

    const filter = audioCtx.createBiquadFilter();
    ambienceGain = audioCtx.createGain();

    let targetGain = 0;

    if (window.currentWeatherCondition === 'rain' || window.currentWeatherCondition === 'storm') {
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        targetGain = 0.5;
    } else if (window.currentWeatherCondition === 'wind') {
        filter.type = 'lowpass';
        filter.frequency.value = 400;
        targetGain = 0.7;
    } else if (window.currentWeatherCondition === 'snow') {
        filter.type = 'lowpass';
        filter.frequency.value = 200;
        targetGain = 0.2;
    } else {
        // Clear or Clouds - very faint breeze so the user can hear it works
        filter.type = 'lowpass';
        filter.frequency.value = 300;
        targetGain = 0.1;
    }

    // Fade in
    ambienceGain.gain.setValueAtTime(0, audioCtx.currentTime);
    ambienceGain.gain.linearRampToValueAtTime(targetGain, audioCtx.currentTime + 2);

    ambienceSource.connect(filter);
    filter.connect(ambienceGain);
    ambienceGain.connect(audioCtx.destination);
    ambienceSource.start();
};

// Profile Modal Logic
function initProfileModal() {
    const profileBtn = document.querySelector('.profile-avatar');
    if(!profileBtn) return;

    // Create modal HTML
    const modal = document.createElement('div');
    modal.className = 'glass-modal-container hidden';
    modal.innerHTML = `
        <div class="glass-modal glass-panel" style="padding: 2rem; text-align: center; width: 90%; max-width: 400px; max-height: 85vh; overflow-y: auto; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 10000; display:flex; flex-direction:column; align-items:center;">
            <div style="width: 110px; height: 110px; flex-shrink: 0; border-radius: 50%; overflow: hidden; margin-bottom: 1.2rem; box-shadow: 0 8px 20px rgba(0,0,0,0.3); border: 3px solid rgba(255,255,255,0.2);">
                <img src="/static/image/profile.png" alt="Developer" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=250&q=80';">
            </div>
            <h2 style="font-family: var(--font-heading); font-size: 1.5rem; margin-bottom: 0.25rem;">Aditya Singh Saini</h2>
            <p style="color: var(--color-primary); font-weight: 500; font-size: 0.95rem; margin-bottom: 1rem;">Full Stack Engineer & UI/UX Designer</p>
            <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1.5rem; line-height: 1.5;">Passionate about building intuitive and visually stunning web applications. Expertise in blending modern aesthetics with robust architecture to craft seamless digital experiences.</p>
            <a href="https://www.linkedin.com/in/aditya-singh-saini-a3654731b" target="_blank" style="display: flex; justify-content: center; align-items: center; gap: 0.5rem; color: #fff; background-color: #0a66c2; padding: 0.6rem 1rem; border-radius: 8px; text-decoration: none; font-weight: 600; width: 100%; margin-bottom: 0.5rem; transition: background-color 0.2s;">
                <i class="fa-brands fa-linkedin" style="font-size: 1.2rem;"></i> Connect on LinkedIn
            </a>
            <button class="text-btn" id="close-modal-btn" style="width: 100%; padding: 0.75rem; background: rgba(255,255,255,0.1); border-radius: 8px;">Close</button>
        </div>
        <div class="modal-backdrop" style="position: fixed; top:0; left:0; width:100vw; height:100vh; background: rgba(0,0,0,0.6); z-index: 9999; backdrop-filter: blur(5px);"></div>
    `;
    
    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('#close-modal-btn');
    const backdrop = modal.querySelector('.modal-backdrop');

    const closeModal = () => {
        gsap.to(modal.querySelector('.glass-modal'), { y: 20, opacity: 0, duration: 0.3 });
        gsap.to(backdrop, { opacity: 0, duration: 0.3, onComplete: () => {
            modal.classList.add('hidden');
        }});
    };

    profileBtn.addEventListener('click', () => {
        modal.classList.remove('hidden');
        gsap.fromTo(modal.querySelector('.glass-modal'), { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'back.out(1.5)' });
        gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.3 });
    });

    closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);
}
