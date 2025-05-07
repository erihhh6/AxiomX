/**
 * 3D Wave Visualizer
 * Using Three.js for beautiful interactive waves
 */

// Main initialization function that can be called directly
window.initWave3DVisualizer = function(container, customConfig = {}) {
    console.log('[WAVE-3D] Initializing 3D wave visualizer');
    
    // If Three.js is not loaded, load it first
    if (typeof THREE === 'undefined') {
        console.log('[WAVE-3D] Loading Three.js library...');
        loadThreeJs().then(() => {
            createWave3D(container, customConfig);
        }).catch(error => {
            console.error('[WAVE-3D] Failed to load Three.js:', error);
            // Fall back to the 2D visualizer
            if (typeof window.createSimpleWaveVisualizer === 'function') {
                window.createSimpleWaveVisualizer(container, customConfig);
            }
        });
    } else {
        // Three.js already loaded, create the 3D wave
        createWave3D(container, customConfig);
    }
};

// Load Three.js from CDN
function loadThreeJs() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.min.js';
        script.onload = () => {
            console.log('[WAVE-3D] Three.js loaded successfully');
            resolve();
        };
        script.onerror = () => {
            console.error('[WAVE-3D] Failed to load Three.js');
            reject(new Error('Failed to load Three.js'));
        };
        document.head.appendChild(script);
    });
}

// Create the 3D wave visualization
function createWave3D(container, customConfig) {
    // Check if container exists
    if (!container) {
        console.error('[WAVE-3D] Container is missing');
        return false;
    }
    
    // Get config from container
    let containerConfig = {};
    try {
        const configStr = container.getAttribute('data-visualizer-config');
        if (configStr) {
            containerConfig = JSON.parse(configStr);
        }
    } catch (e) {
        console.error('[WAVE-3D] Error parsing container config:', e);
    }
    
    // Merge configs with defaults
    const config = {
        // Visual
        amplitude: customConfig.amplitude || containerConfig.amplitude || 15,
        frequency: customConfig.frequency || containerConfig.frequency || 0.02,
        resolution: customConfig.resolution || containerConfig.resolution || 50,
        color: customConfig.color || containerConfig.color || '#4285F4',
        height: customConfig.height || containerConfig.height || 250,
        // Physics
        speed: customConfig.speed || containerConfig.speed || 0.05,
        damping: customConfig.damping || containerConfig.damping || 0.98,
        // Style
        waves: customConfig.waves || containerConfig.waves || 2,
        interactive: customConfig.interactive !== undefined ? 
            customConfig.interactive : (containerConfig.interactive !== undefined ? 
                containerConfig.interactive : true)
    };
    
    console.log('[WAVE-3D] Creating wave with config:', config);
    
    // Clear container and mark as initialized
    container.innerHTML = '';
    container.setAttribute('data-viz-initialized', 'true');
    
    // Style container
    styleContainer(container);
    
    // Add UI elements
    addUIElements(container, '3D Wave Visualizer');
    
    // Setup Three.js scene
    const width = container.clientWidth;
    const height = config.height;
    
    // Create scene
    const scene = new THREE.Scene();
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 40, 100);
    camera.lookAt(0, 0, 0);
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0xf0f8ff, 1);
    container.appendChild(renderer.domElement);
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (!container.isConnected) return;
        
        const newWidth = container.clientWidth;
        renderer.setSize(newWidth, height);
        camera.aspect = newWidth / height;
        camera.updateProjectionMatrix();
    });
    
    // Parse color to RGB
    const colorObj = new THREE.Color(config.color);
    
    // Create wave meshes
    const waveMeshes = [];
    const waveCount = Math.min(Math.max(1, config.waves), 5); // Limit to 5 waves max
    
    for (let w = 0; w < waveCount; w++) {
        // Create wave geometry with higher resolution
        const waveGeometry = new THREE.PlaneGeometry(100, 100, config.resolution, config.resolution);
        
        // Create material with customizable color
        const waveMaterial = new THREE.MeshPhongMaterial({
            color: colorObj,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.85 - (w * 0.15), // Decreasing opacity for each wave
            wireframe: w > 0, // First wave is solid, others are wireframe
            shininess: 50
        });
        
        // Create mesh
        const waveMesh = new THREE.Mesh(waveGeometry, waveMaterial);
        waveMesh.rotation.x = -Math.PI / 2;
        waveMesh.position.y = -10 - (w * 8); // Stack waves below each other
        scene.add(waveMesh);
        waveMeshes.push(waveMesh);
    }
    
    // Add grid for reference
    const gridHelper = new THREE.GridHelper(100, 20, 0xaaaaaa, 0xdddddd);
    gridHelper.position.y = -10;
    scene.add(gridHelper);
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    // Add mouse interactivity
    let mouseX = 0, mouseY = 0;
    let isInteracting = false;
    
    if (config.interactive) {
        container.addEventListener('mousemove', (event) => {
            if (!container.isConnected) return;
            
            const rect = container.getBoundingClientRect();
            mouseX = ((event.clientX - rect.left) / width) * 2 - 1;
            mouseY = -((event.clientY - rect.top) / height) * 2 + 1;
            isInteracting = true;
            
            // Reset interaction after a delay
            clearTimeout(container.interactionTimer);
            container.interactionTimer = setTimeout(() => {
                isInteracting = false;
            }, 2000);
        });
    }
    
    // Animation parameters
    let phase = 0;
    let cameraAngle = 0;
    
    // Animation function
    function animate() {
        if (!container.isConnected) {
            // Container no longer in DOM, stop animation
            return;
        }
        
        // Update phase
        phase += config.speed;
        
        // Update wave vertices
        waveMeshes.forEach((waveMesh, waveIndex) => {
            const vertices = waveMesh.geometry.attributes.position;
            const waveOffset = waveIndex * 0.7; // Offset for each wave
            
            for (let i = 0; i < vertices.count; i++) {
                const x = vertices.getX(i);
                const z = vertices.getZ(i);
                
                // Calculate wave height using multiple sine waves for complexity
                let height = Math.sin(x * config.frequency + phase + waveOffset) * 
                             Math.cos(z * config.frequency * 0.8 + phase) * 
                             config.amplitude;
                             
                // Add second wave pattern
                height += Math.sin(x * config.frequency * 0.5 + phase * 1.1) * 
                          Math.cos(z * config.frequency * 1.2 + phase * 0.8) * 
                          (config.amplitude * 0.3);
                
                // If mouse interaction is active, add ripple effect
                if (isInteracting && waveIndex === 0) {
                    const dx = x - mouseX * 50;
                    const dz = z - mouseY * 50;
                    const dist = Math.sqrt(dx * dx + dz * dz);
                    const ripple = Math.sin(dist * 0.5 - phase * 2) * (20 / (dist + 5));
                    height += ripple;
                }
                
                // Update Y position
                vertices.setY(i, height);
            }
            
            vertices.needsUpdate = true;
            waveMesh.geometry.computeVertexNormals();
        });
        
        // Camera movement - gentle orbit unless interacting
        if (!isInteracting) {
            cameraAngle += 0.002;
            camera.position.x = Math.sin(cameraAngle) * 120;
            camera.position.z = Math.cos(cameraAngle) * 120;
        } else {
            // Follow mouse position with camera slightly
            camera.position.x += (mouseX * 20 - camera.position.x) * 0.05;
            camera.position.z += (-mouseY * 20 - camera.position.z) * 0.05;
        }
        
        camera.lookAt(0, 0, 0);
        
        // Render scene
        renderer.render(scene, camera);
        
        // Continue animation
        requestAnimationFrame(animate);
    }
    
    // Start animation
    animate();
    
    // Add controls if interactive
    if (config.interactive) {
        addInteractiveControls(container, config, waveMeshes);
    }
    
    // Add version badge
    addVersionBadge(container, '3D');
    
    console.log('[WAVE-3D] 3D wave visualizer created successfully');
    return true;
}

// Add simple parameter controls
function addInteractiveControls(container, config, waveMeshes) {
    const controlPanel = document.createElement('div');
    controlPanel.className = 'wave-controls';
    controlPanel.style.position = 'absolute';
    controlPanel.style.bottom = '10px';
    controlPanel.style.right = '10px';
    controlPanel.style.backgroundColor = 'rgba(255,255,255,0.7)';
    controlPanel.style.padding = '5px';
    controlPanel.style.borderRadius = '4px';
    controlPanel.style.fontSize = '10px';
    controlPanel.style.zIndex = '3';
    
    // Amplitude control
    const amplitudeControl = createSlider('Amplitude', config.amplitude, 5, 30, 1, (value) => {
        config.amplitude = Number(value);
    });
    controlPanel.appendChild(amplitudeControl);
    
    // Frequency control
    const frequencyControl = createSlider('Frequency', config.frequency * 100, 1, 5, 0.1, (value) => {
        config.frequency = Number(value) / 100;
    });
    controlPanel.appendChild(frequencyControl);
    
    // Speed control
    const speedControl = createSlider('Speed', config.speed * 100, 1, 10, 0.1, (value) => {
        config.speed = Number(value) / 100;
    });
    controlPanel.appendChild(speedControl);
    
    container.appendChild(controlPanel);
}

// Create a slider control
function createSlider(label, value, min, max, step, onChange) {
    const container = document.createElement('div');
    container.style.marginBottom = '5px';
    
    const labelElem = document.createElement('label');
    labelElem.textContent = label;
    labelElem.style.display = 'block';
    labelElem.style.marginBottom = '2px';
    
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = min;
    slider.max = max;
    slider.step = step;
    slider.value = value;
    slider.style.width = '100%';
    slider.style.display = 'block';
    
    slider.addEventListener('input', () => {
        onChange(slider.value);
    });
    
    container.appendChild(labelElem);
    container.appendChild(slider);
    
    return container;
}

// Helper function to style the container
function styleContainer(container) {
    container.style.backgroundColor = '#f0f8ff';
    container.style.overflow = 'hidden';
    container.style.position = 'relative';
    container.style.minHeight = '250px';
    container.style.borderRadius = '4px';
    container.style.border = '1px solid #4285F4';
    container.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)';
}

// Helper function to add UI elements
function addUIElements(container, titleText) {
    // Add title
    const title = document.createElement('div');
    title.textContent = titleText;
    title.style.position = 'absolute';
    title.style.top = '10px';
    title.style.left = '15px'; 
    title.style.fontSize = '14px';
    title.style.fontWeight = 'bold';
    title.style.color = '#333';
    title.style.zIndex = '2';
    container.appendChild(title);
    
    // Add status indicator
    const status = document.createElement('div');
    status.textContent = 'Active';
    status.style.position = 'absolute';
    status.style.top = '10px';
    status.style.right = '15px';
    status.style.padding = '2px 8px';
    status.style.fontSize = '12px';
    status.style.backgroundColor = 'rgba(40, 167, 69, 0.7)';
    status.style.color = 'white';
    status.style.borderRadius = '3px';
    status.style.zIndex = '2';
    container.appendChild(status);
    
    // Update status in card header if it exists
    const card = container.closest('.card');
    if (card) {
        const statusBadge = card.querySelector('.viz-status-indicator');
        if (statusBadge) {
            statusBadge.textContent = 'Active';
            statusBadge.className = 'viz-status-indicator badge bg-success float-end';
        }
    }
}

// Add version badge to container
function addVersionBadge(container, version) {
    const badge = document.createElement('div');
    badge.textContent = `WAVE ${version} v3.0`;
    badge.style.position = 'absolute';
    badge.style.top = '40px';
    badge.style.right = '15px';
    badge.style.padding = '2px 6px';
    badge.style.fontSize = '10px';
    badge.style.backgroundColor = 'rgba(0,0,0,0.1)';
    badge.style.color = '#666';
    badge.style.borderRadius = '3px';
    badge.style.zIndex = '2';
    container.appendChild(badge);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('[WAVE-3D] DOM ready, looking for containers to initialize');
    
    // Find all wave containers and initialize them
    const containers = document.querySelectorAll('.visualizer-container[data-visualizer-type="wave-visualizer"]');
    containers.forEach(container => {
        if (!container.hasAttribute('data-viz-initialized')) {
            window.initWave3DVisualizer(container);
        }
    });
});

// Export global functions
window.initAllWave3DVisualizers = function() {
    console.log('[WAVE-3D] Initializing all wave visualizers');
    const containers = document.querySelectorAll('.visualizer-container[data-visualizer-type="wave-visualizer"]');
    containers.forEach(container => {
        window.initWave3DVisualizer(container);
    });
} 