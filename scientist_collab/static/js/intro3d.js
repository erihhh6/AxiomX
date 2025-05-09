// Scientists Collaboration Platform 3D Intro Animation
// Fișier principal pentru animația 3D - importă și folosește modulele

// Importă modulele necesare - reducere la strictul necesar
import { createEnhancedParticleSystem } from './intro3d/particles.js';
import { createLogoParticles } from './intro3d/logoParticles.js';
import { easeInOutCubic, loadScript, isMobileDevice, adjustRenderQuality } from './intro3d/utils.js';

// Helper function to validate object for animation
function isValidForAnimation(obj) {
    return obj && 
           obj.mesh && 
           obj.mesh.position &&
           obj.mesh.rotation;
}

// Function to log timing for performance analysis
function logTime(label, startTime) {
    const now = performance.now();
    const elapsed = (now - startTime).toFixed(1);
    console.log(`${label}: ${elapsed}ms`);
    return now;
}

document.addEventListener('DOMContentLoaded', () => {
    const perfStart = performance.now();
    console.log("DOM loaded, initializing 3D intro...");
    
    // For debugging - reset animation state on refresh if needed
    if (window.location.search.includes('reset=1')) {
        localStorage.removeItem('hasSeenIntro');
        console.log('Animation state reset due to URL parameter');
    }
    
    // DOM elements
    const landingContainer = document.getElementById('landing-container');
    const introCanvas = document.getElementById('intro-canvas');
    const skipButton = document.getElementById('intro-skip');
    const introText = document.getElementById('intro-text');
    const mainContent = document.getElementById('main-content');
    const loadingIndicator = document.getElementById('loading-indicator');
    
    // Debug DOM elements
    console.log("DOM elements:", {
        landingContainer: !!landingContainer,
        introCanvas: !!introCanvas,
        skipButton: !!skipButton,
        introText: !!introText,
        mainContent: !!mainContent,
        loadingIndicator: !!loadingIndicator
    });

    // Make sure DOM elements exist before proceeding
    if (!landingContainer || !introCanvas || !skipButton || !introText || !mainContent) {
        console.error('Missing DOM elements for intro animation');
        return;
    }

    // Keep track of intro state
    let introSkipped = false;
    
    // Check if Three.js is loaded
    async function ensureThreeJsLoaded() {
        if (typeof THREE === 'undefined') {
            console.log("Three.js not loaded yet, loading manually...");
            try {
                // Load Three.js libraries in sequence
                await loadScript('https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js');
                console.log("Three.js core loaded");
                await loadScript('https://cdn.jsdelivr.net/npm/three@0.149.0/examples/js/controls/OrbitControls.js');
                console.log("OrbitControls loaded");
                return true;
            } catch (error) {
                console.error("Failed to load Three.js libraries:", error);
                return false;
            }
        }
        console.log("Three.js already loaded");
        return true;
    }

    // Check if the intro has been seen before
    const hasSeenIntro = localStorage.getItem('hasSeenIntro') === 'true';
    
    // Skip intro if already seen (dar nu dacă avem parametrul reset=1)
    if (hasSeenIntro && !window.location.search.includes('reset=1')) {
        console.log("User has seen intro, skipping");
        skipIntro();
    } else {
        // Initialize Three.js scene
        initIntro();
    }

    // Skip button event listener
    skipButton.addEventListener('click', () => {
        console.log("Skip button clicked");
        localStorage.setItem('hasSeenIntro', 'true');
        skipIntro();
    });

    // Skip intro function
    function skipIntro() {
        if (introSkipped) return;
        
        introSkipped = true;
        console.log("Skipping intro");
        
        // Make sure the main content is visible regardless of the animation
        landingContainer.classList.add('hidden');
        mainContent.classList.add('content-visible');
        // Force visibility if CSS transition doesn't work
        mainContent.style.opacity = '1';
        landingContainer.style.opacity = '0';
        landingContainer.style.pointerEvents = 'none';
    }

    async function initIntro() {
        console.log("Initializing intro");
        
        // Show loading indicator
        if (loadingIndicator) {
            loadingIndicator.style.display = 'block';
        }
        
        // Make sure Three.js is loaded before proceeding
        const threeJsLoaded = await ensureThreeJsLoaded();
        
        if (!threeJsLoaded) {
            console.error("Failed to load Three.js, skipping intro");
            skipIntro();
            return;
        }
        
        // After confirming Three.js is loaded, initialize the scene
        try {
            // Initialize Three.js scene
            await initThreeScene();
        } catch (error) {
            console.error('Error initializing Three.js scene:', error);
            skipIntro(); // Fallback to skip intro if there's an error
        }
    }

    async function initThreeScene() {
        let timeMarker = performance.now();
        console.log("Setting up Three.js scene");
        try {
            // Hide loading indicator once we start rendering
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
            
            // Detectează dacă este dispozitiv mobil pentru optimizări
            const isMobile = isMobileDevice();
            
            // SCENE SETUP
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            const renderer = new THREE.WebGLRenderer({
                canvas: introCanvas,
                antialias: !isMobile, // disable antialiasing on mobile for better performance
                alpha: true
            });

            renderer.setSize(window.innerWidth, window.innerHeight);
            const qualityFactor = adjustRenderQuality(renderer, isMobile);
            renderer.setClearColor(0x151530, 1); // Dark stormy blue background
            timeMarker = logTime("Scene setup", timeMarker);

            // CONTROLS
            let controls;
            if (typeof THREE.OrbitControls !== 'undefined') {
                controls = new THREE.OrbitControls(camera, renderer.domElement);
                controls.enableDamping = true;
                controls.dampingFactor = 0.05;
                controls.enableZoom = false;
                controls.autoRotate = true;
                controls.autoRotateSpeed = 0.5;
            } else {
                console.warn('OrbitControls not available, using static camera');
            }

            // LIGHTING - Dynamic lightning effects
            const ambientLight = new THREE.AmbientLight(0x404060); // Darker blue ambient
            scene.add(ambientLight);

            const directionalLight = new THREE.DirectionalLight(0x8090ff, 0.8); // Blueish light
            directionalLight.position.set(10, 10, 10);
            scene.add(directionalLight);

            // Lightning flash light
            const flashLight = new THREE.PointLight(0xaaccff, 0, 100); // Initially off (intensity 0)
            flashLight.position.set(0, 15, -10);
            scene.add(flashLight);

            // CAMERA POSITION
            camera.position.z = 20;
            timeMarker = logTime("Lighting setup", timeMarker);

            // PARTICLE SYSTEM - Lightning storm particles
            const particleCount = isMobile ? 1200 : 2000;
            const particleSystem = createEnhancedParticleSystem(particleCount);
            scene.add(particleSystem.particles);
            timeMarker = logTime("Particle system created", timeMarker);

            // Create storm cloud background instead of starfield
            function createStormClouds() {
                const cloudCount = 600;
                const cloudGeometry = new THREE.BufferGeometry();
                const cloudPositions = new Float32Array(cloudCount * 3);
                const cloudColors = new Float32Array(cloudCount * 3);
                const cloudSizes = new Float32Array(cloudCount);
                
                // Create clouds distributed in a dome above and around
                for (let i = 0; i < cloudCount; i++) {
                    const i3 = i * 3;
                    
                    // Place clouds in a dome formation
                    const theta = Math.random() * Math.PI * 2; // Around circle
                    const phi = Math.random() * Math.PI * 0.6; // Partial dome (0 to 108 degrees)
                    const radius = 30 + Math.random() * 20; // Far away for background
                    
                    // Convert spherical to cartesian coordinates
                    cloudPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
                    cloudPositions[i3 + 1] = Math.abs(radius * Math.cos(phi)) - 5; // Mostly above
                    cloudPositions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta) - 20; // Push back
                    
                    // Dark stormy cloud colors
                    const shade = 0.2 + Math.random() * 0.3; // Darker shades
                    
                    // Different cloud types
                    if (Math.random() > 0.7) {
                        // Darker storm clouds
                        cloudColors[i3] = shade * 0.7; // Less red
                        cloudColors[i3 + 1] = shade * 0.8; // Less green
                        cloudColors[i3 + 2] = shade * 0.9; // More blue
                    } else {
                        // Lightning-illuminated clouds
                        cloudColors[i3] = shade * 0.8;
                        cloudColors[i3 + 1] = shade * 0.9;
                        cloudColors[i3 + 2] = shade;
                    }
                    
                    // Varied cloud particle sizes
                    cloudSizes[i] = 0.3 + Math.random() * 0.7;
                }
                
                cloudGeometry.setAttribute('position', new THREE.BufferAttribute(cloudPositions, 3));
                cloudGeometry.setAttribute('color', new THREE.BufferAttribute(cloudColors, 3));
                cloudGeometry.setAttribute('size', new THREE.BufferAttribute(cloudSizes, 1));
                
                const cloudMaterial = new THREE.PointsMaterial({
                    size: 2.0,
                    vertexColors: true,
                    transparent: true,
                    opacity: 0.7,
                    blending: THREE.AdditiveBlending
                });
                
                // Use a cloud-like texture
                const textureLoader = new THREE.TextureLoader();
                textureLoader.load('https://raw.githubusercontent.com/baronwatts/models/master/snowflake.png', (texture) => {
                    cloudMaterial.map = texture;
                    cloudMaterial.needsUpdate = true;
                }, null, () => {
                    // Fallback if texture loading fails
                    const canvas = document.createElement('canvas');
                    canvas.width = 128;
                    canvas.height = 128;
                    const ctx = canvas.getContext('2d');
                    
                    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
                    gradient.addColorStop(0, 'rgba(220, 220, 255, 0.8)');
                    gradient.addColorStop(0.3, 'rgba(180, 180, 220, 0.4)');
                    gradient.addColorStop(1, 'rgba(100, 100, 150, 0)');
                    
                    ctx.fillStyle = gradient;
                    ctx.fillRect(0, 0, 128, 128);
                    
                    const cloudTexture = new THREE.CanvasTexture(canvas);
                    cloudMaterial.map = cloudTexture;
                    cloudMaterial.needsUpdate = true;
                });
                
                const stormClouds = new THREE.Points(cloudGeometry, cloudMaterial);
                
                return {
                    clouds: stormClouds,
                    positions: cloudPositions,
                    colors: cloudColors,
                    count: cloudCount,
                    update: function(time, flashIntensity) {
                        // Subtle cloud movement
                        for (let i = 0; i < cloudCount; i++) {
                            const i3 = i * 3;
                            
                            // Wind movement - subtle drift
                            cloudPositions[i3] += Math.sin(time * 0.05 + i * 0.1) * 0.01;
                            cloudPositions[i3 + 1] += Math.cos(time * 0.05 + i * 0.05) * 0.005;
                            
                            // Brighten clouds during lightning flashes
                            if (flashIntensity > 0) {
                                cloudColors[i3] = Math.min(0.7, 0.2 + flashIntensity * 0.7);
                                cloudColors[i3 + 1] = Math.min(0.8, 0.3 + flashIntensity * 0.7);
                                cloudColors[i3 + 2] = Math.min(1.0, 0.4 + flashIntensity * 0.7);
                            } else {
                                // Return to normal cloud color gradually
                                const shade = 0.2 + Math.random() * 0.1;
                                cloudColors[i3] = lerp(cloudColors[i3], shade * 0.8, 0.01);
                                cloudColors[i3 + 1] = lerp(cloudColors[i3 + 1], shade * 0.9, 0.01);
                                cloudColors[i3 + 2] = lerp(cloudColors[i3 + 2], shade, 0.01);
                            }
                        }
                        
                        stormClouds.geometry.attributes.position.needsUpdate = true;
                        stormClouds.geometry.attributes.color.needsUpdate = true;
                    }
                };
            }
            
            // Helper function for linear interpolation
            function lerp(a, b, t) {
                return a + (b - a) * t;
            }
            
            // Create and add storm clouds
            const stormClouds = createStormClouds();
            scene.add(stormClouds.clouds);
            timeMarker = logTime("Storm clouds created", timeMarker);

            // LOGO PARTICLES - keep the ElectraX logo
            const logoParticles = createLogoParticles();
            scene.add(logoParticles.particleSystem);
            timeMarker = logTime("Logo particles created", timeMarker);

            // ANIMATION PROGRESS
            let animationProgress = 0;
            let introStarted = false;
            let introCompleted = false;
            
            // Lightning flash effect variables
            let flashIntensity = 0;
            let flashDecay = 0.05;
            let timeToNextFlash = 2 + Math.random() * 3;
            let lastFlashTime = 0;

            // Show intro text immediately for better UX
            introText.style.opacity = 1;

            // RESIZE HANDLER
            window.addEventListener('resize', () => {
                const width = window.innerWidth;
                const height = window.innerHeight;
                
                camera.aspect = width / height;
                camera.updateProjectionMatrix();
                
                renderer.setSize(width, height);
            });

            console.log("Starting animation loop");
            
            // Request animation frame with timestamp
            let lastTime = 0;
            let frameCount = 0;
            let animationStartTime = performance.now();
            let debugModeActive = window.location.search.includes('debug=1');
            
            // ANIMATION LOOP
            function animate(time) {
                if (introSkipped) {
                    console.log("Animation stopped because intro was skipped");
                    return;
                }
                
                if (document.hidden) {
                    // Don't animate when the page is not visible
                    requestAnimationFrame(animate);
                    return;
                }
                
                try {
                    // Request next frame at the beginning to ensure smooth framerate
                    requestAnimationFrame(animate);
                    
                    // Calculează delta pentru animație consistentă
                    const deltaTime = Math.min((time - lastTime) / 1000, 0.1); // în secunde, max 0.1s to prevent huge jumps
                    lastTime = time;
                    
                    // Debug every 50 frames
                    frameCount++;
                    if (frameCount % 50 === 0) {
                        const runTime = (performance.now() - animationStartTime) / 1000;
                        console.log(`Animation frame ${frameCount}, running for ${runTime.toFixed(1)}s, FPS: ${(frameCount/runTime).toFixed(1)}`);
                    }

                    // Update orbit controls
                    if (controls) {
                        controls.update();
                    }
                    
                    // Lightning flash effect
                    lastFlashTime += deltaTime;
                    flashIntensity = Math.max(0, flashIntensity - flashDecay);
                    
                    // Create a new lightning flash
                    if (lastFlashTime > timeToNextFlash) {
                        flashIntensity = 0.7 + Math.random() * 0.3; // Stronger flash
                        flashLight.intensity = flashIntensity * 3; // Brighter flash
                        
                        // Yellow-white light for flashes
                        flashLight.color.set(Math.random() < 0.7 ? 0xffffaa : 0xffff00);
                        
                        flashLight.position.set(
                            (Math.random() - 0.5) * 40,
                            10 + Math.random() * 10,
                            -10 + Math.random() * 10
                        );
                        
                        lastFlashTime = 0;
                        timeToNextFlash = 1.5 + Math.random() * 3.5; // 1.5-5 seconds between flashes
                        flashDecay = 0.03 + Math.random() * 0.04; // Random decay rate
                    }
                    
                    // Update flash light intensity
                    flashLight.intensity = flashIntensity * 3;
                    
                    // Update storm clouds
                    if (stormClouds && stormClouds.update) {
                        stormClouds.update(time * 0.001, flashIntensity);
                    }
                    
                    // Animate logo particles
                    if (logoParticles && logoParticles.positions) {
                        animationProgress += 0.005;
                        
                        if (animationProgress > 1 && !introStarted) {
                            introStarted = true;
                            console.log("Animation phase 1 complete, showing content in 5s");
                            setTimeout(() => {
                                introCompleted = true;
                                // Show main content after animation completes
                                mainContent.classList.add('content-visible');
                                console.log("Animation complete, content visible");
                                
                                // Hide intro after delay
                                setTimeout(() => {
                                    if (!introSkipped) {
                                        landingContainer.classList.add('hidden');
                                        localStorage.setItem('hasSeenIntro', 'true');
                                        console.log("Intro hidden, marked as seen");
                                    }
                                }, 1000);
                            }, 5000);
                        }
                        
                        // Update dynamic lightning lines (new!)
                        if (logoParticles.updateLightning) {
                            logoParticles.updateLightning(time * 0.001);
                        }
                        
                        const positions = logoParticles.particleSystem.children[0].geometry.attributes.position.array;
                        const originalPositions = logoParticles.positions;
                        const targetPositions = logoParticles.targetPositions;
                        
                        for (let i = 0; i < positions.length; i += 3) {
                            if (animationProgress < 1) {
                                // Particles move from random positions to logo shape
                                positions[i] = originalPositions[i] + (targetPositions[i] - originalPositions[i]) * easeInOutCubic(animationProgress);
                                positions[i + 1] = originalPositions[i + 1] + (targetPositions[i + 1] - originalPositions[i + 1]) * easeInOutCubic(animationProgress);
                                positions[i + 2] = originalPositions[i + 2] + (targetPositions[i + 2] - originalPositions[i + 2]) * easeInOutCubic(animationProgress);
                            } else if (!introCompleted) {
                                // Small subtle movement once in position, enhanced during lightning flashes
                                const time = Date.now() * 0.001;
                                const idx = Math.floor(i / 3);
                                const flashEffect = flashIntensity * 0.1; // Increased effect
                                
                                // More energetic movement during flashes
                                positions[i] = targetPositions[i] + Math.sin(time + idx * 0.1) * (0.05 + flashEffect);
                                positions[i + 1] = targetPositions[i + 1] + Math.cos(time + idx * 0.1) * (0.05 + flashEffect);
                                positions[i + 2] = targetPositions[i + 2] + Math.sin(time + idx * 0.05) * (0.05 + flashEffect);
                            }
                        }
                        
                        logoParticles.particleSystem.children[0].geometry.attributes.position.needsUpdate = true;
                    }

                    // Update particle system animation
                    if (particleSystem && particleSystem.animate) {
                        particleSystem.animate(time * 0.001);
                    }

                    // Render the main scene
                    renderer.render(scene, camera);
                    
                } catch (error) {
                    console.error('Error in animation loop:', error);
                    skipIntro(); // Skip intro if there's an error in the animation
                    return;
                }
            }

            // Start animation loop
            animate(0);
            logTime("Total initialization time", perfStart);

        } catch (error) {
            console.error('Error in Three.js initialization:', error);
            skipIntro();
        }
    }

    // Fallback timeout - if animation doesn't complete in 15 seconds, show content anyway
    setTimeout(() => {
        if (!mainContent.classList.contains('content-visible')) {
            console.log('Fallback timeout: showing main content');
            skipIntro();
        }
    }, 15000);
}); 