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
            renderer.setClearColor(0x000022, 1); // Slightly blue background instead of pure black
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

            // LIGHTING
            const ambientLight = new THREE.AmbientLight(0x404040);
            scene.add(ambientLight);

            const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
            directionalLight.position.set(10, 10, 10);
            scene.add(directionalLight);

            const pointLight = new THREE.PointLight(0x00ffff, 1, 100);
            pointLight.position.set(0, 0, 0);
            scene.add(pointLight);

            // CAMERA POSITION
            camera.position.z = 20;
            timeMarker = logTime("Lighting setup", timeMarker);

            // PARTICLE SYSTEM - Sistem îmbunătățit de particule
            const particleCount = isMobile ? 1200 : 2000; // Increase particles since we removed other elements
            const particleSystem = createEnhancedParticleSystem(particleCount);
            scene.add(particleSystem.particles);
            timeMarker = logTime("Particle system created", timeMarker);

            // Create static starfield background
            function createStarfield() {
                const starCount = 800; // Increase star count for better background
                const starGeometry = new THREE.BufferGeometry();
                const starPositions = new Float32Array(starCount * 3);
                const starColors = new Float32Array(starCount * 3);
                const starSizes = new Float32Array(starCount);
                
                // Create stars at random positions far away from center
                for (let i = 0; i < starCount; i++) {
                    const i3 = i * 3;
                    // Place stars in a large sphere around the scene
                    const radius = 80 + Math.random() * 40;
                    const theta = Math.random() * Math.PI * 2;
                    const phi = Math.random() * Math.PI;
                    
                    // Convert spherical to cartesian coordinates
                    starPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
                    starPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
                    starPositions[i3 + 2] = radius * Math.cos(phi);
                    
                    // Random star colors - mostly white/blue with occasional yellow/red
                    const colorType = Math.random();
                    if (colorType > 0.8) { // Reddish/yellow stars
                        starColors[i3] = 0.9 + Math.random() * 0.1; // Red
                        starColors[i3 + 1] = 0.7 + Math.random() * 0.3; // Green
                        starColors[i3 + 2] = 0.5 + Math.random() * 0.2; // Blue
                    } else if (colorType > 0.6) { // Bluish stars
                        starColors[i3] = 0.5 + Math.random() * 0.2; // Red
                        starColors[i3 + 1] = 0.5 + Math.random() * 0.3; // Green
                        starColors[i3 + 2] = 0.8 + Math.random() * 0.2; // Blue
                    } else { // White/blue stars (most common)
                        starColors[i3] = 0.8 + Math.random() * 0.2; // Red
                        starColors[i3 + 1] = 0.8 + Math.random() * 0.2; // Green
                        starColors[i3 + 2] = 0.9 + Math.random() * 0.1; // Blue
                    }
                    
                    // Varied star sizes
                    starSizes[i] = 0.2 + Math.random() * 0.8;
                }
                
                starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
                starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
                
                const starMaterial = new THREE.PointsMaterial({
                    size: 0.5,
                    vertexColors: true,
                    transparent: true,
                    opacity: 0.8,
                    blending: THREE.AdditiveBlending
                });
                
                // Add texture to make stars look like actual stars
                const textureLoader = new THREE.TextureLoader();
                const starTexture = 'https://raw.githubusercontent.com/baronwatts/models/master/snowflake.png';
                textureLoader.load(starTexture, (texture) => {
                    starMaterial.map = texture;
                    starMaterial.needsUpdate = true;
                });
                
                const starPoints = new THREE.Points(starGeometry, starMaterial);
                return {
                    particles: starPoints,
                    positions: starPositions,
                    colors: starColors,
                    sizes: starSizes,
                    count: starCount
                };
            }
            
            // Add starfield to scene
            const starfield = createStarfield();
            scene.add(starfield.particles);
            timeMarker = logTime("Starfield created", timeMarker);

            // LOGO PARTICLES - keep the AxiomX logo
            const logoParticles = createLogoParticles();
            scene.add(logoParticles.particleSystem);
            timeMarker = logTime("Logo particles created", timeMarker);

            // ANIMATION PROGRESS
            let animationProgress = 0;
            let introStarted = false;
            let introCompleted = false;

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
                    
                    // Animate starfield with subtle twinkle effect
                    if (starfield && starfield.particles) {
                        const starPositions = starfield.particles.geometry.attributes.position.array;
                        const starColors = starfield.particles.geometry.attributes.color.array;
                        
                        // Make stars twinkle by slightly modifying their colors
                        for (let i = 0; i < starfield.count; i++) {
                            const i3 = i * 3;
                            // Subtle position movement for some stars (distant ones)
                            if (i % 5 === 0) {
                                starPositions[i3] += Math.sin(time * 0.0001 + i) * 0.01;
                                starPositions[i3 + 1] += Math.cos(time * 0.0001 + i) * 0.01;
                            }
                            
                            // Color/brightness twinkling
                            const twinkle = 0.1 * Math.sin(time * 0.001 + i * 10);
                            starColors[i3] = Math.max(0.5, Math.min(1.0, starColors[i3] + twinkle));
                            starColors[i3 + 1] = Math.max(0.5, Math.min(1.0, starColors[i3 + 1] + twinkle));
                            starColors[i3 + 2] = Math.max(0.5, Math.min(1.0, starColors[i3 + 2] + twinkle));
                        }
                        
                        starfield.particles.geometry.attributes.position.needsUpdate = true;
                        starfield.particles.geometry.attributes.color.needsUpdate = true;
                        starfield.particles.rotation.y += 0.0001;
                    }
                    
                    // Rotate particle system
                    if (particleSystem && particleSystem.particles) {
                        particleSystem.particles.rotation.y += 0.01;
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
                        
                        const positions = logoParticles.particleSystem.geometry.attributes.position.array;
                        const originalPositions = logoParticles.positions;
                        const targetPositions = logoParticles.targetPositions;
                        
                        for (let i = 0; i < positions.length; i += 3) {
                            if (animationProgress < 1) {
                                // Particles move from random positions to logo shape
                                positions[i] = originalPositions[i] + (targetPositions[i] - originalPositions[i]) * easeInOutCubic(animationProgress);
                                positions[i + 1] = originalPositions[i + 1] + (targetPositions[i + 1] - originalPositions[i + 1]) * easeInOutCubic(animationProgress);
                                positions[i + 2] = originalPositions[i + 2] + (targetPositions[i + 2] - originalPositions[i + 2]) * easeInOutCubic(animationProgress);
                            } else if (!introCompleted) {
                                // Small subtle movement once in position
                                const time = Date.now() * 0.001;
                                const idx = Math.floor(i / 3);
                                positions[i] = targetPositions[i] + Math.sin(time + idx * 0.1) * 0.03;
                                positions[i + 1] = targetPositions[i + 1] + Math.cos(time + idx * 0.1) * 0.03;
                                positions[i + 2] = targetPositions[i + 2] + Math.sin(time + idx * 0.05) * 0.03;
                            }
                        }
                        
                        logoParticles.particleSystem.geometry.attributes.position.needsUpdate = true;
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