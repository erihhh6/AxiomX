// Versiune legacy (non-module) a scriptului intro3d.js
// Acest script este folosit ca fallback pentru browsere care nu suportă module ES6

// Scientists Collaboration Platform 3D Intro Animation
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded in legacy mode, initializing 3D intro...");
    
    // DOM elements
    const landingContainer = document.getElementById('landing-container');
    const introCanvas = document.getElementById('intro-canvas');
    const skipButton = document.getElementById('intro-skip');
    const introText = document.getElementById('intro-text');
    const mainContent = document.getElementById('main-content');
    const loadingIndicator = document.getElementById('loading-indicator');
    
    // Make sure DOM elements exist before proceeding
    if (!landingContainer || !introCanvas || !skipButton || !introText || !mainContent) {
        console.error('Missing DOM elements for intro animation');
        return;
    }

    // Keep track of intro state
    let introSkipped = false;
    
    // Function to load scripts dynamically
    function loadScript(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
            document.head.appendChild(script);
        });
    }
    
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
                await loadScript('https://cdn.jsdelivr.net/npm/three@0.149.0/examples/js/loaders/FontLoader.js');
                console.log("FontLoader loaded");
                await loadScript('https://cdn.jsdelivr.net/npm/three@0.149.0/examples/js/geometries/TextGeometry.js');
                console.log("TextGeometry loaded");
                return true;
            } catch (error) {
                console.error("Failed to load Three.js libraries:", error);
                return false;
            }
        }
        console.log("Three.js already loaded");
        return true;
    }

    // Skip intro if already seen
    if (localStorage.getItem('hasSeenIntro') === 'true') {
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

    // Detect if browser is on mobile
    function isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    async function initThreeScene() {
        console.log("Setting up Three.js scene");
        try {
            // Hide loading indicator once we start rendering
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
            
            // Detectează dacă este dispozitiv mobil pentru optimizări
            const isMobile = isMobileDevice();
            
            // Use the full version of the intro3d script
            // This is a simplified fallback version that automatically skips
            // to the main content after a short delay
            console.log("Legacy mode: Using simplified 3D intro");
            
            // Simple loading animation until we show the main content
            // This is a minimal animation for browsers that don't support ES6 modules
            const ctx = introCanvas.getContext('2d');
            introCanvas.width = window.innerWidth;
            introCanvas.height = window.innerHeight;
            
            const centerX = introCanvas.width / 2;
            const centerY = introCanvas.height / 2;
            let angle = 0;
            
            function drawLoadingAnimation() {
                if (introSkipped) return;
                
                ctx.clearRect(0, 0, introCanvas.width, introCanvas.height);
                ctx.fillStyle = '#000022';
                ctx.fillRect(0, 0, introCanvas.width, introCanvas.height);
                
                // Draw orbit
                ctx.beginPath();
                ctx.strokeStyle = 'rgba(100, 149, 237, 0.3)';
                ctx.lineWidth = 2;
                ctx.arc(centerX, centerY, 50, 0, Math.PI * 2);
                ctx.stroke();
                
                // Draw particles
                for (let i = 0; i < 5; i++) {
                    const particleAngle = angle + (i * Math.PI * 2 / 5);
                    const x = centerX + Math.cos(particleAngle) * 50;
                    const y = centerY + Math.sin(particleAngle) * 50;
                    
                    ctx.beginPath();
                    ctx.fillStyle = 'rgba(100, 149, 237, 0.8)';
                    ctx.arc(x, y, 5, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                // Update angle
                angle += 0.05;
                
                // Draw text
                ctx.fillStyle = 'white';
                ctx.font = '20px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Scientists Collaboration Platform', centerX, centerY + 100);
                
                if (!introSkipped) {
                    requestAnimationFrame(drawLoadingAnimation);
                }
            }
            
            drawLoadingAnimation();
            
            // Show the main content after a delay
            setTimeout(() => {
                if (!introSkipped) {
                    console.log("Legacy mode: Showing main content");
                    skipIntro();
                }
            }, 3000);
            
        } catch (error) {
            console.error('Error in Three.js initialization:', error);
            skipIntro();
        }
    }

    // Fallback timeout - if animation doesn't complete in 5 seconds, show content anyway
    setTimeout(() => {
        if (!mainContent.classList.contains('content-visible')) {
            console.log('Legacy fallback timeout: showing main content');
            skipIntro();
        }
    }, 5000);
}); 