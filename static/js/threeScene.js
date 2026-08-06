// Three.js Scene Setup for Photorealistic Earth
let scene, camera, renderer, earth, glowSprite, controls;

function initThreeScene() {
    const container = document.getElementById('hero-canvas-container');
    if(!container) return;
    
    // 1. Scene setup
    scene = new THREE.Scene();
    
    // 2. Camera setup
    const rect = container.getBoundingClientRect();
    camera = new THREE.PerspectiveCamera(45, rect.width / rect.height, 0.1, 1000);
    camera.position.z = 18; // Pulled back slightly for glow

    // 3. Renderer setup
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(rect.width, rect.height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 2);
    pointLight.position.set(20, 10, 20);
    scene.add(pointLight);

    // 5. Earth Model (Photorealistic Night Texture)
    // Geometry can be higher res now since wireframe is off and it's a single texture
    const earthGeometry = new THREE.SphereGeometry(6, 64, 64);
    
    // Load high-res earth night texture
    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load('https://unpkg.com/three-globe/example/img/earth-night.jpg');
    
    const earthMaterial = new THREE.MeshPhongMaterial({
        map: earthTexture,
        emissive: 0x111111,
        emissiveIntensity: 0.2,
        shininess: 10
    });
    
    earth = new THREE.Mesh(earthGeometry, earthMaterial);
    
    // Tilt the earth slightly
    earth.rotation.z = 23.5 * Math.PI / 180;
    scene.add(earth);

    // 6. Atmospheric Glow (Sprite behind Earth)
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(256, 256, 100, 256, 256, 256);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(100, 150, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(50, 100, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 512, 512);
    
    const glowTexture = new THREE.CanvasTexture(canvas);
    const glowMaterial = new THREE.SpriteMaterial({ 
        map: glowTexture, 
        color: 0x4488ff, 
        transparent: true, 
        blending: THREE.AdditiveBlending,
        opacity: 0.8
    });
    
    glowSprite = new THREE.Sprite(glowMaterial);
    glowSprite.scale.set(19, 19, 1); // Larger than earth
    scene.add(glowSprite);

    // 7. Handle Resize
    window.addEventListener('resize', () => {
        const r = container.getBoundingClientRect();
        camera.aspect = r.width / r.height;
        camera.updateProjectionMatrix();
        renderer.setSize(r.width, r.height);
    }, false);

    // 8. Mouse drag interaction
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    container.addEventListener('mousedown', () => isDragging = true);
    document.addEventListener('mouseup', () => isDragging = false);
    container.addEventListener('mousemove', (e) => {
        if(isDragging && earth) {
            const deltaMove = {
                x: e.offsetX - previousMousePosition.x,
                y: e.offsetY - previousMousePosition.y
            };
            // Rotate on Y and X axis based on drag
            earth.rotation.y += deltaMove.x * 0.005;
            earth.rotation.x += deltaMove.y * 0.005;
        }
        previousMousePosition = { x: e.offsetX, y: e.offsetY };
    });
    
    container.addEventListener('mouseenter', (e) => {
        previousMousePosition = { x: e.offsetX, y: e.offsetY };
    });

    animateThree();
}

let lastFrameTime = performance.now();

function animateThree() {
    requestAnimationFrame(animateThree);
    
    const now = performance.now();
    const elapsed = now - lastFrameTime;
    
    let fpsInterval = 0;
    if (window.fpsLimit === '60') fpsInterval = 1000 / 60;
    else if (window.fpsLimit === '30') fpsInterval = 1000 / 30;
    
    if (fpsInterval > 0) {
        if (elapsed > fpsInterval) {
            lastFrameTime = now - (elapsed % fpsInterval);
            if(earth) {
                earth.rotation.y += 0.001;
            }
            renderer.render(scene, camera);
        }
    } else {
        // Unlimited
        if(earth) {
            earth.rotation.y += 0.001;
        }
        renderer.render(scene, camera);
    }
}

// Function to dynamically update scene glow based on weather
window.updateThreeSceneWeather = function(weatherMain) {
    if(!glowSprite) return;
    
    // Change atmospheric glow color based on weather, leaving earth texture intact
    switch(weatherMain.toLowerCase()) {
        case 'clear':
            glowSprite.material.color.setHex(0xf59e0b); // Golden
            break;
        case 'clouds':
            glowSprite.material.color.setHex(0x94a3b8); // Slate Gray
            break;
        case 'rain':
        case 'drizzle':
            glowSprite.material.color.setHex(0x3b82f6); // Blue
            break;
        case 'thunderstorm':
            glowSprite.material.color.setHex(0x7c3aed); // Purple
            break;
        case 'snow':
            glowSprite.material.color.setHex(0x7dd3fc); // Light Ice Blue
            break;
        default:
            glowSprite.material.color.setHex(0x4488ff);
    }
}
