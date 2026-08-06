// Settings Module Logic

document.addEventListener('DOMContentLoaded', () => {
    initSavedSettings();
    initSettingsNav();
    initSettingsSearch();
    initSettingsInteractions();
    initSettingsGSAP();
});

function initSavedSettings() {
    const savedData = localStorage.getItem('weatherAppUiSettings');
    if (savedData) {
        try {
            const settings = JSON.parse(savedData);
            
            // Apply Theme
            const darkModeToggle = document.getElementById('setting-dark-mode');
            if (darkModeToggle && settings.themeDark !== undefined) {
                darkModeToggle.checked = settings.themeDark;
                if (settings.themeDark) {
                    document.body.classList.remove('theme-light');
                    document.body.classList.add('theme-dark');
                } else {
                    document.body.classList.remove('theme-dark');
                    document.body.classList.add('theme-light');
                }
                const topNavThemeBtn = document.getElementById('theme-toggle');
                if(topNavThemeBtn) {
                    const icon = topNavThemeBtn.querySelector('i');
                    if (settings.themeDark) {
                        icon.classList.remove('fa-sun');
                        icon.classList.add('fa-moon');
                    } else {
                        icon.classList.remove('fa-moon');
                        icon.classList.add('fa-sun');
                    }
                }
            }

            // Apply Sounds
            const soundUiToggle = document.getElementById('setting-sound-ui');
            if (soundUiToggle && settings.soundUi !== undefined) {
                soundUiToggle.checked = settings.soundUi;
                window.soundEnabled = settings.soundUi;
                const topNavSoundBtn = document.getElementById('sound-toggle');
                if(topNavSoundBtn) {
                    const icon = topNavSoundBtn.querySelector('i');
                    if (settings.soundUi) {
                        icon.classList.remove('fa-volume-xmark');
                        icon.classList.add('fa-volume-high');
                    } else {
                        icon.classList.remove('fa-volume-high');
                        icon.classList.add('fa-volume-xmark');
                    }
                }
            }

            // Apply Ambient Sounds
            const soundAmbientToggle = document.getElementById('setting-sound-weather');
            if (soundAmbientToggle && settings.soundAmbient !== undefined) {
                soundAmbientToggle.checked = settings.soundAmbient;
                window.weatherAmbienceEnabled = settings.soundAmbient;
                if(window.updateWeatherAmbience) window.updateWeatherAmbience();
            }

            // Apply Blur
            const blurSlider = document.getElementById('setting-blur-slider');
            if (blurSlider && settings.blur !== undefined) {
                blurSlider.value = settings.blur;
                document.documentElement.style.setProperty('--glass-blur', `blur(${settings.blur / 5}px)`);
            }

            // Apply Transparency
            const transSlider = document.getElementById('setting-transparency-slider');
            if (transSlider && settings.transparency !== undefined) {
                transSlider.value = settings.transparency;
                const opacity = (settings.transparency / 200).toFixed(2);
                document.documentElement.style.setProperty('--glass-opacity', opacity);
            }

            // Apply Glow
            const glowToggle = document.getElementById('setting-glow-effect');
            if (glowToggle && settings.glow !== undefined) {
                glowToggle.checked = settings.glow;
                if (settings.glow) {
                    document.body.classList.add('glow-enabled');
                } else {
                    document.body.classList.remove('glow-enabled');
                }
            }

            // Apply Radius
            const radiusSlider = document.getElementById('setting-radius-slider');
            if (radiusSlider && settings.radius !== undefined) {
                radiusSlider.value = settings.radius;
                document.documentElement.style.setProperty('--border-radius', `${settings.radius}px`);
            }

            // Apply Button Style
            const buttonStyle = document.getElementById('setting-button-style');
            if (buttonStyle && settings.buttonStyle !== undefined) {
                buttonStyle.value = settings.buttonStyle;
                if(settings.buttonStyle === 'rounded') {
                    document.documentElement.style.setProperty('--btn-radius', '8px');
                } else if(settings.buttonStyle === 'pill') {
                    document.documentElement.style.setProperty('--btn-radius', '50px');
                } else if(settings.buttonStyle === 'square') {
                    document.documentElement.style.setProperty('--btn-radius', '0px');
                }
            }

            // Apply Animations
            if (settings.animMaster !== undefined) {
                window.animMaster = settings.animMaster;
                const toggle = document.getElementById('setting-anim-master');
                if (toggle) toggle.checked = window.animMaster;
            } else {
                window.animMaster = true;
            }
            if (settings.animCards !== undefined) {
                window.animCards = settings.animCards;
                const toggle = document.getElementById('setting-anim-cards');
                if (toggle) toggle.checked = window.animCards;
            } else {
                window.animCards = true;
            }
            if (settings.animParticles !== undefined) {
                window.animParticles = settings.animParticles;
                const toggle = document.getElementById('setting-anim-particles');
                if (toggle) toggle.checked = window.animParticles;
            } else {
                window.animParticles = true;
            }
            if (settings.animSpeed !== undefined) {
                window.animSpeed = settings.animSpeed;
                const slider = document.getElementById('setting-anim-speed');
                if (slider) slider.value = window.animSpeed;
                if (window.gsap) gsap.globalTimeline.timeScale(window.animSpeed / 5);
            } else {
                window.animSpeed = 5;
            }

            // Apply Compact Mode
            const compactToggle = document.getElementById('setting-compact-mode');
            if (compactToggle && settings.compactMode !== undefined) {
                compactToggle.checked = settings.compactMode;
                if (settings.compactMode) {
                    document.body.classList.add('compact-mode');
                } else {
                    document.body.classList.remove('compact-mode');
                }
            }

            // Apply Map Layer
            if (settings.mapLayer !== undefined) {
                window.mapLayer = settings.mapLayer;
                const select = document.getElementById('setting-map-layer');
                if (select) select.value = window.mapLayer;
                // InitMap might not have run yet, so the dashboard.js handles initial setMapLayer
            } else {
                window.mapLayer = 'dark';
            }

            // Apply Privacy
            if (settings.rememberHistory !== undefined) {
                window.rememberHistory = settings.rememberHistory;
                const historyToggle = document.getElementById('setting-remember-history');
                if (historyToggle) historyToggle.checked = window.rememberHistory;
            } else {
                window.rememberHistory = true;
            }

            // Apply Language
            if (settings.appLanguage !== undefined) {
                window.appLanguage = settings.appLanguage;
                const langSelect = document.getElementById('setting-language');
                if (langSelect) langSelect.value = window.appLanguage;
                
                // Delay to allow google translate to load
                setTimeout(() => {
                    const googleSelect = document.querySelector('.goog-te-combo');
                    if(googleSelect && googleSelect.value !== window.appLanguage) {
                        googleSelect.value = window.appLanguage;
                        googleSelect.dispatchEvent(new Event('change'));
                    }
                }, 1000);
            } else {
                window.appLanguage = 'en';
            }

            // Apply Cloud Sync
            if (settings.cloudSync !== undefined) {
                window.cloudSync = settings.cloudSync;
                const cloudToggle = document.getElementById('setting-cloud-sync');
                if (cloudToggle) cloudToggle.checked = window.cloudSync;
            } else {
                window.cloudSync = false;
            }

            // Apply FPS Limit
            if (settings.fpsLimit !== undefined) {
                window.fpsLimit = settings.fpsLimit;
                const fpsSelect = document.getElementById('setting-fps-limit');
                if (fpsSelect) fpsSelect.value = window.fpsLimit;
            } else {
                window.fpsLimit = '60';
            }

            // Apply Icon Pack
            if (settings.iconPack !== undefined) {
                window.iconPack = settings.iconPack;
                const iconSelect = document.getElementById('setting-icon-pack');
                if (iconSelect) iconSelect.value = window.iconPack;
                document.body.classList.remove('icon-pack-glass', 'icon-pack-flat', 'icon-pack-outlined');
                document.body.classList.add(`icon-pack-${window.iconPack}`);
            } else {
                window.iconPack = 'glass';
                document.body.classList.add('icon-pack-glass');
            }
        } catch(e) {
            console.error('Error loading settings', e);
        }
    }
    
    // Inject Icon Packs CSS
    const style = document.createElement('style');
    style.innerHTML = `
        /* Minimal Glass (Default) */
        body.icon-pack-glass #current-icon i,
        body.icon-pack-glass #hourly-container i,
        body.icon-pack-glass #daily-container i {
            filter: drop-shadow(0 4px 10px rgba(255,255,255,0.3));
        }
        
        /* Flat Color */
        body.icon-pack-flat #current-icon i,
        body.icon-pack-flat #hourly-container i,
        body.icon-pack-flat #daily-container i {
            filter: none;
            text-shadow: none;
        }
        
        /* Outlined */
        body.icon-pack-outlined #current-icon i,
        body.icon-pack-outlined #hourly-container i,
        body.icon-pack-outlined #daily-container i {
            color: transparent !important;
            -webkit-text-stroke: 1.5px currentColor;
            filter: none;
            text-shadow: none;
        }
        body.icon-pack-outlined #current-icon i {
            -webkit-text-stroke: 3px currentColor;
        }
    `;
    document.head.appendChild(style);
}

function initSettingsNav() {
    const navItems = document.querySelectorAll('.settings-nav-item');
    const sections = document.querySelectorAll('.settings-section');
    
    // Hide all sections initially except the first one (or active one)
    sections.forEach(sec => sec.style.display = 'none');
    if(sections.length > 0) sections[0].style.display = 'block';

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const sectionId = item.getAttribute('data-section');
            const targetSection = document.getElementById(`section-${sectionId}`);
            
            if (targetSection) {
                // Update active nav
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
                
                // Hide all sections
                sections.forEach(sec => sec.style.display = 'none');
                
                // Show target section
                targetSection.style.display = 'block';
                
                // Animate in the cards of the new section
                const cards = targetSection.querySelectorAll('.settings-card');
                if(cards.length > 0) {
                    gsap.fromTo(cards, 
                        { y: 20, opacity: 0 }, 
                        { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: "power2.out", overwrite: "auto" }
                    );
                }
            }
        });
    });
}

function initSettingsSearch() {
    const searchInput = document.getElementById('settings-search-input');
    const sections = document.querySelectorAll('.settings-section');

    if(!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();

        sections.forEach(section => {
            const rows = section.querySelectorAll('.settings-row');
            let sectionHasMatch = false;

            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                if (text.includes(query)) {
                    row.style.display = 'flex';
                    sectionHasMatch = true;
                } else {
                    row.style.display = 'none';
                }
            });

            // Hide the entire section if no rows match
            if (query) {
                section.style.display = sectionHasMatch ? 'block' : 'none';
            }
        });

        if (!query) {
            // Revert to tab logic if search is empty
            const activeNav = document.querySelector('.settings-nav-item.active');
            if (activeNav) {
                // Simulate click to reset visibility
                activeNav.click();
            }
        }
    });
}

function initSettingsInteractions() {
    // Show a premium toast notification
    const showToast = (message, isError = false) => {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = 'glass-panel';
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.right = '20px';
        toast.style.padding = '1rem 1.5rem';
        toast.style.borderRadius = '12px';
        toast.style.zIndex = '99999';
        toast.style.display = 'flex';
        toast.style.alignItems = 'center';
        toast.style.gap = '1rem';
        toast.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
        toast.style.border = `1px solid ${isError ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`;
        
        const icon = document.createElement('i');
        icon.className = isError ? 'fa-solid fa-circle-exclamation text-danger' : 'fa-solid fa-circle-check';
        icon.style.color = isError ? '#ef4444' : '#10b981';
        icon.style.fontSize = '1.25rem';
        
        const text = document.createElement('span');
        text.textContent = message;
        text.style.fontWeight = '500';
        
        toast.appendChild(icon);
        toast.appendChild(text);
        document.body.appendChild(toast);
        
        // Animate in
        gsap.fromTo(toast, {y: 50, opacity: 0}, {y: 0, opacity: 1, duration: 0.4, ease: 'back.out(1.5)'});
        
        // Animate out and remove
        setTimeout(() => {
            gsap.to(toast, {y: 20, opacity: 0, duration: 0.3, onComplete: () => toast.remove()});
        }, 3000);
    };

    // 1. Dark Mode Toggle (Actual Wiring)
    const darkModeToggle = document.getElementById('setting-dark-mode');
    if(darkModeToggle) {
        darkModeToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                document.body.classList.remove('theme-light');
                document.body.classList.add('theme-dark');
                showToast("Dark Mode Enabled");
            } else {
                document.body.classList.remove('theme-dark');
                document.body.classList.add('theme-light');
                showToast("Light Mode Enabled");
            }
            
            // Sync with top nav theme button
            const topNavBtn = document.getElementById('theme-toggle');
            if(topNavBtn) {
                const icon = topNavBtn.querySelector('i');
                if (e.target.checked) {
                    icon.classList.remove('fa-sun');
                    icon.classList.add('fa-moon');
                } else {
                    icon.classList.remove('fa-moon');
                    icon.classList.add('fa-sun');
                }
            }
        });
    }

    // 2. Unit Toggles (Actual Wiring)
    const tempSelect = document.getElementById('setting-unit-temp');
    if(tempSelect) {
        tempSelect.addEventListener('change', (e) => {
            // isCelsius is a global in weather.js. For a real app we'd use a setter.
            // Just simulate a click on the top-nav unit toggle to trigger the same logic.
            const topNavBtn = document.getElementById('unit-toggle');
            if(topNavBtn) {
                topNavBtn.click();
                showToast(`Temperature units set to ${e.target.options[e.target.selectedIndex].text}`);
            }
        });
    }

    // 3. UI Sounds Toggle (Actual Wiring)
    const soundUiToggle = document.getElementById('setting-sound-ui');
    if(soundUiToggle) {
        soundUiToggle.addEventListener('change', (e) => {
            window.soundEnabled = e.target.checked;
            
            // Sync with top nav button
            const topNavBtn = document.getElementById('sound-toggle');
            if(topNavBtn) {
                const icon = topNavBtn.querySelector('i');
                if (e.target.checked) {
                    icon.classList.remove('fa-volume-xmark');
                    icon.classList.add('fa-volume-high');
                } else {
                    icon.classList.remove('fa-volume-high');
                    icon.classList.add('fa-volume-xmark');
                }
            }
            
            if(e.target.checked) {
                if(window.playClickSound) window.playClickSound(); // Demo the sound
                showToast("UI Sounds Enabled");
            } else {
                showToast("UI Sounds Disabled");
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

    // 4. Glassmorphism & UI Customization Features 
    const blurSlider = document.getElementById('setting-blur-slider');
    if(blurSlider) {
        blurSlider.addEventListener('input', (e) => {
            document.documentElement.style.setProperty('--glass-blur', `blur(${e.target.value / 5}px)`);
        });
        blurSlider.addEventListener('change', () => showToast("Blur Intensity Updated"));
    }
    
    const transparencySlider = document.getElementById('setting-transparency-slider');
    if(transparencySlider) {
        transparencySlider.addEventListener('input', (e) => {
            // Map 0-100 to 0-0.5 for realistic glass opacity
            const opacity = (e.target.value / 200).toFixed(2);
            document.documentElement.style.setProperty('--glass-opacity', opacity);
        });
        transparencySlider.addEventListener('change', () => showToast("Card Transparency Updated"));
    }
    
    const glowToggle = document.getElementById('setting-glow-effect');
    if(glowToggle) {
        glowToggle.addEventListener('change', (e) => {
            if(e.target.checked) {
                document.body.classList.add('glow-enabled');
                showToast("Neon Glow Enabled");
            } else {
                document.body.classList.remove('glow-enabled');
                showToast("Neon Glow Disabled");
            }
        });
        // Initial setup
        if(glowToggle.checked) document.body.classList.add('glow-enabled');
    }

    const radiusSlider = document.getElementById('setting-radius-slider');
    if(radiusSlider) {
        radiusSlider.addEventListener('input', (e) => {
            document.documentElement.style.setProperty('--border-radius', `${e.target.value}px`);
        });
        radiusSlider.addEventListener('change', () => showToast("Border Radius Updated"));
    }
    
    const buttonStyle = document.getElementById('setting-button-style');
    if(buttonStyle) {
        buttonStyle.addEventListener('change', (e) => {
            if(e.target.value === 'rounded') {
                document.documentElement.style.setProperty('--btn-radius', '8px');
            } else if(e.target.value === 'pill') {
                document.documentElement.style.setProperty('--btn-radius', '50px');
            } else if(e.target.value === 'square') {
                document.documentElement.style.setProperty('--btn-radius', '0px');
            }
            showToast(`Button Style set to ${e.target.options[e.target.selectedIndex].text}`);
        });
    }

    // 4.5 Animations Settings
    const animMasterToggle = document.getElementById('setting-anim-master');
    if(animMasterToggle) {
        animMasterToggle.addEventListener('change', (e) => {
            window.animMaster = e.target.checked;
            showToast(e.target.checked ? "Animations Enabled" : "Animations Disabled");
        });
    }
    const animCardsToggle = document.getElementById('setting-anim-cards');
    if(animCardsToggle) {
        animCardsToggle.addEventListener('change', (e) => {
            window.animCards = e.target.checked;
        });
    }
    const animParticlesToggle = document.getElementById('setting-anim-particles');
    if(animParticlesToggle) {
        animParticlesToggle.addEventListener('change', (e) => {
            window.animParticles = e.target.checked;
        });
    }
    const animSpeedSlider = document.getElementById('setting-anim-speed');
    if(animSpeedSlider) {
        animSpeedSlider.addEventListener('input', (e) => {
            window.animSpeed = e.target.value;
            if (window.gsap) gsap.globalTimeline.timeScale(window.animSpeed / 5);
        });
    }

    // 4.6 Map Settings
    const mapLayerSelect = document.getElementById('setting-map-layer');
    if (mapLayerSelect) {
        mapLayerSelect.addEventListener('change', (e) => {
            window.mapLayer = e.target.value;
            if (window.setMapLayer) window.setMapLayer(window.mapLayer);
            showToast(`Map layer set to ${e.target.options[e.target.selectedIndex].text}`);
        });
    }

    // 4.7 Compact Mode
    const compactToggle = document.getElementById('setting-compact-mode');
    if (compactToggle) {
        compactToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                document.body.classList.add('compact-mode');
                showToast("Compact Mode Enabled");
            } else {
                document.body.classList.remove('compact-mode');
                showToast("Compact Mode Disabled");
            }
        });
    }

    // 5. Units & Location 
    const windSelect = document.getElementById('setting-unit-wind');
    if(windSelect) {
        windSelect.value = localStorage.getItem('windUnit') || 'ms';
        window.windUnit = windSelect.value;
        windSelect.addEventListener('change', (e) => {
            window.windUnit = e.target.value;
            localStorage.setItem('windUnit', window.windUnit);
            if(window.currentWeatherData && window.updateUI) window.updateUI();
            showToast(`Wind speed unit set to ${e.target.options[e.target.selectedIndex].text}`);
        });
    }
    
    const timeSelect = document.getElementById('setting-unit-time');
    if(timeSelect) {
        timeSelect.value = localStorage.getItem('timeFormat') || '12';
        window.timeFormat = timeSelect.value;
        timeSelect.addEventListener('change', (e) => {
            window.timeFormat = e.target.value;
            localStorage.setItem('timeFormat', window.timeFormat);
            if(window.currentWeatherData && window.updateUI) window.updateUI();
            showToast(`Time format set to ${e.target.options[e.target.selectedIndex].text}`);
        });
    }

    const autoGpsToggle = document.getElementById('setting-gps-auto');
    if(autoGpsToggle) {
        autoGpsToggle.checked = localStorage.getItem('autoGps') === 'true';
        autoGpsToggle.addEventListener('change', (e) => {
            localStorage.setItem('autoGps', e.target.checked);
            if(e.target.checked && window.fetchWeatherByCoords) {
                window.fetchWeatherByCoords();
                showToast("Fetching Location...");
            } else {
                showToast(e.target.checked ? "Auto GPS Enabled" : "Auto GPS Disabled");
            }
        });
    }

    const defaultCityInput = document.getElementById('setting-default-city');
    if (defaultCityInput) {
        defaultCityInput.value = localStorage.getItem('defaultCity') || 'London';
        defaultCityInput.addEventListener('change', (e) => {
            const city = e.target.value.trim();
            if (city) {
                localStorage.setItem('defaultCity', city);
                showToast(`Default city set to ${city}`);
            }
        });
    }

    // 4.8 Privacy Settings
    const historyToggle = document.getElementById('setting-remember-history');
    if (historyToggle) {
        historyToggle.addEventListener('change', (e) => {
            window.rememberHistory = e.target.checked;
            showToast(e.target.checked ? "Search History Enabled" : "Search History Disabled");
        });
    }

    // 4.9 Language Settings
    const languageSelect = document.getElementById('setting-language');
    if (languageSelect) {
        languageSelect.addEventListener('change', (e) => {
            window.appLanguage = e.target.value;
            const googleSelect = document.querySelector('.goog-te-combo');
            if(googleSelect) {
                googleSelect.value = window.appLanguage;
                googleSelect.dispatchEvent(new Event('change'));
            }
            showToast(`Language changed`);
        });
    }

    // 4.10 Cloud Sync
    const cloudSyncToggle = document.getElementById('setting-cloud-sync');
    if (cloudSyncToggle) {
        cloudSyncToggle.addEventListener('change', (e) => {
            window.cloudSync = e.target.checked;
            if (e.target.checked) {
                showToast("Syncing to WeatherOS Cloud...");
                setTimeout(() => {
                    showToast("Cloud Sync Active");
                }, 1500);
            } else {
                showToast("Cloud Sync Disabled");
            }
        });
    }

    // 4.11 FPS Limit
    const fpsSelect = document.getElementById('setting-fps-limit');
    if (fpsSelect) {
        fpsSelect.addEventListener('change', (e) => {
            window.fpsLimit = e.target.value;
            showToast(`FPS Limit set to ${e.target.options[e.target.selectedIndex].text}`);
        });
    }

    // 4.12 Icon Packs
    const iconPackSelect = document.getElementById('setting-icon-pack');
    if (iconPackSelect) {
        iconPackSelect.addEventListener('change', (e) => {
            window.iconPack = e.target.value;
            document.body.classList.remove('icon-pack-glass', 'icon-pack-flat', 'icon-pack-outlined');
            document.body.classList.add(`icon-pack-${window.iconPack}`);
            showToast(`Icon Pack set to ${e.target.options[e.target.selectedIndex].text}`);
        });
    }

    const clearCacheBtn = document.getElementById('btn-clear-cache');
    if(clearCacheBtn) {
        clearCacheBtn.addEventListener('click', () => {
            const origText = clearCacheBtn.textContent;
            clearCacheBtn.textContent = "Clearing...";
            
            // Actually clear the cache (recent searches and favourites)
            localStorage.removeItem('weatheros_recent');
            localStorage.removeItem('weatheros_favourites');
            
            if (window.renderRecentSearches) window.renderRecentSearches();
            if (window.renderFavourites) window.renderFavourites();

            setTimeout(() => {
                clearCacheBtn.textContent = origText;
                showToast("Local Cache Cleared Successfully");
            }, 800);
        });
    }

    const factoryResetBtn = document.getElementById('btn-factory-reset');
    if(factoryResetBtn) {
        factoryResetBtn.addEventListener('click', () => {
            if(confirm("Are you sure you want to reset all preferences? This cannot be undone.")) {
                showToast("Factory Reset Initiated...", true);
                localStorage.clear();
                setTimeout(() => window.location.reload(), 1500);
            }
        });
    }

    const saveBtn = document.getElementById('btn-save-settings');
    if(saveBtn) {
        saveBtn.addEventListener('click', () => {
            const origHTML = saveBtn.innerHTML;
            saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
            
            // Save all settings to localStorage
            const settings = {
                themeDark: document.getElementById('setting-dark-mode')?.checked,
                soundUi: document.getElementById('setting-sound-ui')?.checked,
                soundAmbient: document.getElementById('setting-sound-weather')?.checked,
                blur: document.getElementById('setting-blur-slider')?.value,
                transparency: document.getElementById('setting-transparency-slider')?.value,
                glow: document.getElementById('setting-glow-effect')?.checked,
                radius: document.getElementById('setting-radius-slider')?.value,
                buttonStyle: document.getElementById('setting-button-style')?.value,
                animMaster: document.getElementById('setting-anim-master')?.checked,
                animCards: document.getElementById('setting-anim-cards')?.checked,
                animParticles: document.getElementById('setting-anim-particles')?.checked,
                animSpeed: document.getElementById('setting-anim-speed')?.value,
                mapLayer: document.getElementById('setting-map-layer')?.value,
                compactMode: document.getElementById('setting-compact-mode')?.checked,
                rememberHistory: document.getElementById('setting-remember-history')?.checked,
                appLanguage: document.getElementById('setting-language')?.value,
                cloudSync: document.getElementById('setting-cloud-sync')?.checked,
                fpsLimit: document.getElementById('setting-fps-limit')?.value,
                iconPack: document.getElementById('setting-icon-pack')?.value
            };
            localStorage.setItem('weatherAppUiSettings', JSON.stringify(settings));

            setTimeout(() => {
                saveBtn.innerHTML = '<i class="fa-solid fa-check"></i> Saved!';
                saveBtn.style.background = '#10b981';
                showToast("All Settings Saved Successfully");
                
                setTimeout(() => {
                    saveBtn.innerHTML = origHTML;
                    saveBtn.style.background = 'var(--color-primary)';
                }, 2000);
            }, 800);
        });
    }

    // Attach click sound to all settings inputs
    const interactiveElements = document.querySelectorAll('.settings-card input, .settings-card select, .settings-btn');
    interactiveElements.forEach(el => {
        el.addEventListener('change', () => {
            if(window.playClickSound) window.playClickSound();
        });
    });

    // 6. Help & Support Documentation Modal
    const docsBtn = document.getElementById('btn-view-docs');
    if (docsBtn) {
        docsBtn.addEventListener('click', () => {
            if(window.playClickSound) window.playClickSound();
            
            const modal = document.createElement('div');
            modal.className = 'glass-modal-container hidden';
            modal.innerHTML = `
                <div class="glass-modal glass-panel" style="padding: 1.5rem 2rem; width: 92%; max-width: 550px; max-height: 80vh; overflow-y: auto; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 10000; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.6);">
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 1rem; margin-bottom: 1.5rem;">
                        <h2 style="font-family: var(--font-heading); margin: 0; font-size: 1.4rem;"><i class="fa-solid fa-book text-primary" style="margin-right: 8px;"></i> User Guide</h2>
                        <button id="close-docs-x" style="background: none; border: none; color: var(--text-secondary); font-size: 1.2rem; cursor: pointer; padding: 0.5rem;"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    
                    <div style="margin-bottom: 1.5rem;">
                        <h3 style="color: var(--color-primary); font-size: 1.1rem; margin-bottom: 0.5rem;"><i class="fa-solid fa-rocket" style="margin-right: 6px;"></i> Getting Started</h3>
                        <p style="color: #fff; line-height: 1.6; font-size: 0.95rem; margin: 0; opacity: 0.9;">
                            WeatherOS provides real-time weather tracking with an immersive 3D globe. 
                            Search for any city using the top search bar, or enable the <strong>Auto-GPS</strong> setting to track your location.
                        </p>
                    </div>

                    <div style="margin-bottom: 1.5rem;">
                        <h3 style="color: var(--color-primary); font-size: 1.1rem; margin-bottom: 0.75rem;"><i class="fa-regular fa-keyboard" style="margin-right: 6px;"></i> Keyboard Shortcuts</h3>
                        <div style="display: grid; grid-template-columns: auto 1fr; gap: 0.5rem 1rem; align-items: center; color: #fff; font-size: 0.95rem; opacity: 0.9;">
                            <kbd style="background: rgba(255,255,255,0.15); padding: 0.3rem 0.6rem; border-radius: 6px; font-family: monospace; font-size: 0.85rem; text-align: center;">Ctrl + K</kbd> 
                            <span>Focus search bar</span>
                            <kbd style="background: rgba(255,255,255,0.15); padding: 0.3rem 0.6rem; border-radius: 6px; font-family: monospace; font-size: 0.85rem; text-align: center;">Ctrl + S</kbd> 
                            <span>Open Settings panel</span>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 1.5rem;">
                        <h3 style="color: var(--color-primary); font-size: 1.1rem; margin-bottom: 0.5rem;"><i class="fa-solid fa-wrench" style="margin-right: 6px;"></i> Troubleshooting</h3>
                        <p style="color: #fff; line-height: 1.6; font-size: 0.95rem; margin: 0; opacity: 0.9;">
                            If weather data fails to load, verify your internet connection. If the issue persists, go to Settings &gt; Privacy & Security and click <strong>Clear Local Cache</strong>.
                        </p>
                    </div>

                    <button class="text-btn primary-btn" id="close-docs-btn" style="width: 100%; padding: 0.8rem; background: var(--color-primary); border-radius: 8px; margin-top: 0.5rem; color: #fff; font-weight: 600; font-size: 1rem; border: none; cursor: pointer;">Got It</button>
                </div>
                <div class="modal-backdrop" style="position: fixed; top:0; left:0; width:100vw; height:100vh; background: rgba(0,0,0,0.6); z-index: 9999; backdrop-filter: blur(8px);"></div>
            `;
            
            document.body.appendChild(modal);

            const closeBtn = modal.querySelector('#close-docs-btn');
            const closeX = modal.querySelector('#close-docs-x');
            const backdrop = modal.querySelector('.modal-backdrop');

            const closeModal = () => {
                gsap.to(modal.querySelector('.glass-modal'), { y: 20, opacity: 0, duration: 0.3 });
                gsap.to(backdrop, { opacity: 0, duration: 0.3, onComplete: () => {
                    modal.remove();
                }});
            };

            modal.classList.remove('hidden');
            gsap.fromTo(modal.querySelector('.glass-modal'), { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'back.out(1.5)' });
            gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.3 });

            closeBtn.addEventListener('click', closeModal);
            closeX.addEventListener('click', closeModal);
            backdrop.addEventListener('click', closeModal);
        });
    }
}

function initSettingsGSAP() {
    // When the settings page opens, stagger animate the cards of the CURRENTLY visible section
    const originalReveal = window.animateDashboardReveal;
    window.animateDashboardReveal = function(container = document) {
        if(container.id === 'page-settings') {
            const activeNav = document.querySelector('.settings-nav-item.active');
            if(activeNav) {
                const sectionId = activeNav.getAttribute('data-section');
                const targetSection = document.getElementById(`section-${sectionId}`);
                if(targetSection) {
                    const cards = targetSection.querySelectorAll('.settings-card');
                    if(cards.length > 0) {
                        gsap.fromTo(cards, 
                            { y: 30, opacity: 0 }, 
                            { y: 0, opacity: 1, duration: 0.5, stagger: 0.05, ease: "back.out(1.2)", overwrite: "auto" }
                        );
                    }
                }
            }
        } else {
            // Call the original for other pages
            if(originalReveal) originalReveal(container);
        }
    };
}
