/**
 * Energy Wave Simulator
 * Simulates and visualizes energy waves in various systems
 * Including electromagnetic, thermal, pressure, and sound waves in energy systems
 */

// Main initialization function that can be called directly
window.initEnergyWaveSimulator = function(container, customConfig = {}) {
    console.log('[ENERGY-WAVE] Initializing Energy Wave Simulator');
    
    // Legacy support - map old function name to new one
    window.initWave3DVisualizer = window.initEnergyWaveSimulator;
    
    // If Three.js is not loaded, load it first
    if (typeof THREE === 'undefined') {
        console.log('[ENERGY-WAVE] Loading Three.js library...');
        loadThreeJs().then(() => {
            createEnergyWave(container, customConfig);
        }).catch(error => {
            console.error('[ENERGY-WAVE] Failed to load Three.js:', error);
            // Fall back to the 2D visualizer
            if (typeof window.createSimpleWaveVisualizer === 'function') {
                window.createSimpleWaveVisualizer(container, customConfig);
            }
        });
    } else {
        // Three.js already loaded, create the energy wave
        createEnergyWave(container, customConfig);
    }
};

// Load Three.js from CDN
function loadThreeJs() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.min.js';
        script.onload = () => {
            console.log('[ENERGY-WAVE] Three.js loaded successfully');
            resolve();
        };
        script.onerror = () => {
            console.error('[ENERGY-WAVE] Failed to load Three.js');
            reject(new Error('Failed to load Three.js'));
        };
        document.head.appendChild(script);
    });
}

// Create the energy wave visualization
function createEnergyWave(container, customConfig) {
    // Check if container exists
    if (!container) {
        console.error('[ENERGY-WAVE] Container is missing');
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
        console.error('[ENERGY-WAVE] Error parsing container config:', e);
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
        // Energy-specific parameters
        energyType: customConfig.energyType || containerConfig.energyType || 'electromagnetic',
        powerLevel: customConfig.powerLevel || containerConfig.powerLevel || 5.0, // in kW
        efficiency: customConfig.efficiency || containerConfig.efficiency || 0.85, // 85% efficiency
        // Style
        waves: customConfig.waves || containerConfig.waves || 2,
        interactive: customConfig.interactive !== undefined ? 
            customConfig.interactive : (containerConfig.interactive !== undefined ? 
                containerConfig.interactive : true)
    };
    
    console.log('[ENERGY-WAVE] Creating energy wave with config:', config);
    
    // Clear container and mark as initialized
    container.innerHTML = '';
    container.setAttribute('data-viz-initialized', 'true');
    
    // Style container
    styleContainer(container);
    
    // Add UI elements with energy-specific title
    addUIElements(container, 'Energy Wave Simulator');
    
    // Add energy type indicator
    addEnergyTypeIndicator(container, config.energyType);
    
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
    
    // Parse color to RGB based on energy type
    let waveColor = config.color;
    switch(config.energyType) {
        case 'electromagnetic':
            waveColor = '#4285F4'; // Blue for electromagnetic
            break;
        case 'thermal':
            waveColor = '#EA4335'; // Red for thermal
            break;
        case 'pressure':
            waveColor = '#34A853'; // Green for pressure
            break;
        case 'sound':
            waveColor = '#FBBC05'; // Yellow for sound
            break;
    }
    const colorObj = new THREE.Color(waveColor);
    
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
    
    // Add energy scale reference
    addEnergyScaleReference(container, scene, config);
    
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
        for (let meshIndex = 0; meshIndex < waveMeshes.length; meshIndex++) {
            const mesh = waveMeshes[meshIndex];
            const positions = mesh.geometry.attributes.position.array;
            const count = positions.length / 3;
            
            // Calculate energy loss based on efficiency
            const energyFactor = Math.pow(config.efficiency, meshIndex * 0.2 + 1);
            
            // Apply the new wave pattern to the vertices based on energy type
            for (let i = 0; i < count; i++) {
                const x = positions[i * 3];
                const z = positions[i * 3 + 2];
                let y = 0;
                
                const distance = Math.sqrt(x * x + z * z);
                
                // Different patterns based on energy type
                switch(config.energyType) {
                    case 'electromagnetic':
                        // Standard sine wave for electromagnetic
                        y = Math.sin(x * config.frequency + phase) * 
                            Math.cos(z * config.frequency + phase) * 
                            config.amplitude * energyFactor;
                        break;
                    case 'thermal':
                        // Radial waves for thermal
                        y = Math.sin(distance * config.frequency - phase) * 
                            config.amplitude * energyFactor;
                        break;
                    case 'pressure':
                        // Pulsating wave for pressure
                        y = Math.sin(distance * config.frequency - phase * 2) * 
                            Math.sin(phase * 3) * 
                            config.amplitude * energyFactor;
                        break;
                    case 'sound':
                        // Concentric waves for sound
                        y = Math.sin(distance * config.frequency - phase * 1.5) * 
                            config.amplitude * energyFactor * 
                            (1 / (1 + distance * 0.05)); // Decay with distance
                        break;
                    default:
                        // Default pattern
                        y = Math.sin(x * config.frequency + phase) * 
                            Math.cos(z * config.frequency + phase) * 
                            config.amplitude * energyFactor;
                }
                
                // Add variation if interacting
                if (isInteracting) {
                    const dx = x / 50 - mouseX;
                    const dz = z / 50 - mouseY;
                    const interactionDistance = Math.sqrt(dx * dx + dz * dz);
                    
                    // Add ripple from mouse position
                    if (interactionDistance < 1.5) {
                        y += Math.sin(interactionDistance * 6 - phase * 3) * 
                             config.amplitude * (1 - interactionDistance / 1.5) * 0.5;
                    }
                }
                
                positions[i * 3 + 1] = y;
            }
            
            mesh.geometry.attributes.position.needsUpdate = true;
        }
        
        // Slowly rotate camera if not interacting
        if (!isInteracting) {
            cameraAngle += 0.001;
            camera.position.x = Math.sin(cameraAngle) * 100;
            camera.position.z = Math.cos(cameraAngle) * 100;
            camera.lookAt(0, 0, 0);
        }
        
        // Update energy display
        updateEnergyDisplay(container, config);
        
        // Render the scene
        renderer.render(scene, camera);
        
        // Continue animation
        requestAnimationFrame(animate);
    }
    
    // Start animation
    animate();
    
    // Add interactive controls
    addInteractiveControls(container, config, waveMeshes);
    
    return true;
}

// Add energy type indicator
function addEnergyTypeIndicator(container, energyType) {
    const energyTypeDiv = document.createElement('div');
    energyTypeDiv.className = 'energy-type-indicator';
    energyTypeDiv.style.position = 'absolute';
    energyTypeDiv.style.top = '10px';
    energyTypeDiv.style.left = '10px';
    energyTypeDiv.style.padding = '3px 8px';
    energyTypeDiv.style.borderRadius = '4px';
    energyTypeDiv.style.fontSize = '12px';
    energyTypeDiv.style.fontWeight = 'bold';
    energyTypeDiv.style.color = 'white';
    energyTypeDiv.style.zIndex = '100';
    
    let bgColor, label;
    switch(energyType) {
        case 'electromagnetic':
            bgColor = 'rgba(66, 133, 244, 0.8)';
            label = 'Electromagnetic';
            break;
        case 'thermal':
            bgColor = 'rgba(234, 67, 53, 0.8)';
            label = 'Thermal';
            break;
        case 'pressure':
            bgColor = 'rgba(52, 168, 83, 0.8)';
            label = 'Pressure';
            break;
        case 'sound':
            bgColor = 'rgba(251, 188, 5, 0.8)';
            label = 'Sound';
            break;
        default:
            bgColor = 'rgba(66, 133, 244, 0.8)';
            label = 'Electromagnetic';
    }
    
    energyTypeDiv.style.backgroundColor = bgColor;
    energyTypeDiv.textContent = label + ' Wave';
    
    container.appendChild(energyTypeDiv);
    
    // Add energy data display
    const energyDataDiv = document.createElement('div');
    energyDataDiv.className = 'energy-data-display';
    energyDataDiv.style.position = 'absolute';
    energyDataDiv.style.top = '40px';
    energyDataDiv.style.left = '10px';
    energyDataDiv.style.padding = '5px';
    energyDataDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    energyDataDiv.style.color = 'white';
    energyDataDiv.style.borderRadius = '4px';
    energyDataDiv.style.fontSize = '11px';
    energyDataDiv.style.fontFamily = 'monospace';
    energyDataDiv.style.zIndex = '100';
    
    container.appendChild(energyDataDiv);
}

// Add energy scale reference to the scene
function addEnergyScaleReference(container, scene, config) {
    // Create a power scale
    const scaleWidth = 80;
    const scaleHeight = 5;
    const scaleGeometry = new THREE.BoxGeometry(scaleWidth, scaleHeight, 1);
    const scaleMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffff,
        transparent: true,
        opacity: 0.7
    });
    
    const scale = new THREE.Mesh(scaleGeometry, scaleMaterial);
    scale.position.set(0, -5, -45);
    scene.add(scale);
    
    // Add unit labels
    const labels = ['0', 'kW', 'MW', 'GW'];
    const labelPositions = [-scaleWidth/2, -scaleWidth/6, scaleWidth/6, scaleWidth/2];
    
    const loader = new THREE.TextureLoader();
    
    for (let i = 0; i < labels.length; i++) {
        // Create canvas for text
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(labels[i], 32, 16);
        
        // Create texture and sprite
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        sprite.position.set(labelPositions[i], -10, -45);
        sprite.scale.set(10, 5, 1);
        scene.add(sprite);
    }
    
    // Add current power level indicator
    const indicatorGeometry = new THREE.BoxGeometry(2, 10, 1);
    const indicatorMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
    
    // Position based on power level
    const powerFactor = getScaledPowerFactor(config.powerLevel);
    const indicatorPosition = -scaleWidth/2 + powerFactor * scaleWidth;
    indicator.position.set(indicatorPosition, -5, -44);
    scene.add(indicator);
    
    // Store for updates
    scene.userData.powerIndicator = indicator;
    scene.userData.scaleWidth = scaleWidth;
}

// Update the energy display with current values
function updateEnergyDisplay(container, config) {
    const energyDataDiv = container.querySelector('.energy-data-display');
    if (!energyDataDiv) return;
    
    // Calculate instantaneous power with some variation
    const basePower = config.powerLevel; // kW
    const variation = Math.sin(Date.now() / 1000) * basePower * 0.1; // 10% variation
    const instantPower = basePower + variation;
    
    // Scale to appropriate unit
    let displayPower, unit;
    if (instantPower < 1000) {
        displayPower = instantPower.toFixed(2);
        unit = 'kW';
    } else if (instantPower < 1000000) {
        displayPower = (instantPower / 1000).toFixed(2);
        unit = 'MW';
    } else {
        displayPower = (instantPower / 1000000).toFixed(2);
        unit = 'GW';
    }
    
    // Calculate efficiency loss
    const outputPower = instantPower * config.efficiency;
    const outputDisplay = (outputPower / (instantPower < 1000 ? 1 : instantPower < 1000000 ? 1000 : 1000000)).toFixed(2);
    
    // Update display
    energyDataDiv.innerHTML = `
        <div>Power: ${displayPower} ${unit}</div>
        <div>Frequency: ${(config.frequency * 500).toFixed(1)} Hz</div>
        <div>Efficiency: ${(config.efficiency * 100).toFixed(1)}%</div>
        <div>Output: ${outputDisplay} ${unit}</div>
    `;
    
    // Update indicator position if scene has been setup
    const scene = document.querySelector('Three.Scene');
    if (scene && scene.userData && scene.userData.powerIndicator) {
        const indicator = scene.userData.powerIndicator;
        const scaleWidth = scene.userData.scaleWidth;
        
        // Position based on power level
        const powerFactor = getScaledPowerFactor(instantPower);
        const indicatorPosition = -scaleWidth/2 + powerFactor * scaleWidth;
        indicator.position.x = indicatorPosition;
    }
}

// Get a scaled factor (0-1) for positioning based on power
function getScaledPowerFactor(power) {
    // Logarithmic scale: 0-10kW → 0-0.33, 10kW-1MW → 0.33-0.67, 1MW-100MW → 0.67-1.0
    if (power < 10) {
        return (power / 10) * 0.33;
    } else if (power < 1000) {
        return 0.33 + ((Math.log10(power) - 1) / 2) * 0.33;
    } else {
        return 0.67 + (Math.log10(power / 1000) / 2) * 0.33;
    }
}

// Interactive controls for energy wave parameters
function addInteractiveControls(container, config, waveMeshes) {
    // Create controls panel
    const controlsPanel = document.createElement('div');
    controlsPanel.className = 'energy-wave-controls';
    controlsPanel.style.position = 'absolute';
    controlsPanel.style.bottom = '10px';
    controlsPanel.style.right = '10px';
    controlsPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    controlsPanel.style.padding = '8px';
    controlsPanel.style.borderRadius = '5px';
    controlsPanel.style.color = 'white';
    controlsPanel.style.fontSize = '12px';
    controlsPanel.style.zIndex = '100';
    
    // Add energy type selector
    const energyTypeSelector = document.createElement('select');
    energyTypeSelector.style.width = '100%';
    energyTypeSelector.style.marginBottom = '5px';
    energyTypeSelector.style.backgroundColor = '#444';
    energyTypeSelector.style.color = 'white';
    energyTypeSelector.style.border = '1px solid #666';
    energyTypeSelector.style.borderRadius = '3px';
    energyTypeSelector.style.padding = '3px';
    
    const energyTypes = [
        { value: 'electromagnetic', label: 'Electromagnetic Wave' },
        { value: 'thermal', label: 'Thermal Wave' },
        { value: 'pressure', label: 'Pressure Wave' },
        { value: 'sound', label: 'Sound Wave' }
    ];
    
    energyTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type.value;
        option.textContent = type.label;
        if (type.value === config.energyType) {
            option.selected = true;
        }
        energyTypeSelector.appendChild(option);
    });
    
    energyTypeSelector.addEventListener('change', (e) => {
        config.energyType = e.target.value;
        
        // Update energy type indicator
        const indicator = container.querySelector('.energy-type-indicator');
        if (indicator) {
            let bgColor, label;
            switch(config.energyType) {
                case 'electromagnetic':
                    bgColor = 'rgba(66, 133, 244, 0.8)';
                    label = 'Electromagnetic';
                    break;
                case 'thermal':
                    bgColor = 'rgba(234, 67, 53, 0.8)';
                    label = 'Thermal';
                    break;
                case 'pressure':
                    bgColor = 'rgba(52, 168, 83, 0.8)';
                    label = 'Pressure';
                    break;
                case 'sound':
                    bgColor = 'rgba(251, 188, 5, 0.8)';
                    label = 'Sound';
                    break;
            }
            
            indicator.style.backgroundColor = bgColor;
            indicator.textContent = label + ' Wave';
            
            // Update wave color
            let waveColor;
            switch(config.energyType) {
                case 'electromagnetic': waveColor = '#4285F4'; break;
                case 'thermal': waveColor = '#EA4335'; break;
                case 'pressure': waveColor = '#34A853'; break;
                case 'sound': waveColor = '#FBBC05'; break;
            }
            
            // Update all wave materials
            waveMeshes.forEach(mesh => {
                mesh.material.color.set(waveColor);
            });
        }
    });
    
    const energyTypeLabel = document.createElement('div');
    energyTypeLabel.textContent = 'Energy Type:';
    energyTypeLabel.style.marginBottom = '3px';
    
    controlsPanel.appendChild(energyTypeLabel);
    controlsPanel.appendChild(energyTypeSelector);
    
    // Add power level slider
    const powerLabel = document.createElement('div');
    powerLabel.textContent = 'Power Level (kW):';
    powerLabel.style.marginTop = '8px';
    powerLabel.style.marginBottom = '3px';
    
    const powerSlider = createSlider('power', config.powerLevel, 0.1, 1000, 0.1, (value) => {
        config.powerLevel = parseFloat(value);
    });
    
    controlsPanel.appendChild(powerLabel);
    controlsPanel.appendChild(powerSlider);
    
    // Add frequency slider
    const frequencyLabel = document.createElement('div');
    frequencyLabel.textContent = 'Frequency:';
    frequencyLabel.style.marginTop = '8px';
    frequencyLabel.style.marginBottom = '3px';
    
    const frequencySlider = createSlider('frequency', config.frequency * 100, 0.1, 10, 0.1, (value) => {
        config.frequency = parseFloat(value) / 100;
    });
    
    controlsPanel.appendChild(frequencyLabel);
    controlsPanel.appendChild(frequencySlider);
    
    // Add efficiency slider
    const efficiencyLabel = document.createElement('div');
    efficiencyLabel.textContent = 'Efficiency (%):';
    efficiencyLabel.style.marginTop = '8px';
    efficiencyLabel.style.marginBottom = '3px';
    
    const efficiencySlider = createSlider('efficiency', config.efficiency * 100, 10, 100, 1, (value) => {
        config.efficiency = parseFloat(value) / 100;
    });
    
    controlsPanel.appendChild(efficiencyLabel);
    controlsPanel.appendChild(efficiencySlider);
    
    // Add to container
    container.appendChild(controlsPanel);
}

// Create interactive slider control
function createSlider(id, value, min, max, step, onChange) {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.width = '100%';
    container.style.gap = '5px';
    
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.id = id + '-slider';
    slider.min = min;
    slider.max = max;
    slider.step = step;
    slider.value = value;
    slider.style.flex = '1';
    
    const valueDisplay = document.createElement('span');
    valueDisplay.textContent = value;
    valueDisplay.style.minWidth = '35px';
    valueDisplay.style.textAlign = 'right';
    
    slider.addEventListener('input', () => {
        const newValue = slider.value;
        valueDisplay.textContent = newValue;
        if (onChange) onChange(newValue);
    });
    
    container.appendChild(slider);
    container.appendChild(valueDisplay);
    
    return container;
}

function styleContainer(container) {
    container.style.position = 'relative';
    container.style.overflow = 'hidden';
    container.style.width = '100%';
    container.style.backgroundColor = '#f8f9fa';
    container.style.borderRadius = '4px';
}

function addUIElements(container, titleText) {
    // Add title bar
    const titleBar = document.createElement('div');
    titleBar.className = 'energy-wave-title';
    titleBar.style.position = 'absolute';
    titleBar.style.top = '0';
    titleBar.style.left = '0';
    titleBar.style.right = '0';
    titleBar.style.padding = '5px 10px';
    titleBar.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    titleBar.style.color = 'white';
    titleBar.style.fontSize = '14px';
    titleBar.style.fontWeight = 'bold';
    titleBar.style.zIndex = '50';
    titleBar.textContent = titleText;
    
    container.appendChild(titleBar);
    
    // Add version badge
    addVersionBadge(container, '2.0');
}

function addVersionBadge(container, version) {
    const badge = document.createElement('div');
    badge.className = 'energy-wave-version';
    badge.style.position = 'absolute';
    badge.style.bottom = '5px';
    badge.style.left = '5px';
    badge.style.padding = '2px 5px';
    badge.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    badge.style.color = 'white';
    badge.style.fontSize = '10px';
    badge.style.borderRadius = '3px';
    badge.style.zIndex = '50';
    badge.textContent = `v${version}`;
    
    container.appendChild(badge);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('[WAVE-3D] DOM ready, looking for containers to initialize');
    
    // Find all wave containers and initialize them
    const containers = document.querySelectorAll([
        '.visualizer-container[data-visualizer-type="wave-visualizer"]', 
        '.visualizer-container[data-visualizer-type="wave-simulator"]',
        '.visualizer-container[data-visualizer-type="energy-wave-simulator"]'
    ].join(', '));
    
    containers.forEach(container => {
        if (!container.hasAttribute('data-viz-initialized')) {
            window.initEnergyWaveSimulator(container);
        }
    });
});

// Export global functions
window.initAllWave3DVisualizers = function() {
    console.log('[WAVE-3D] Initializing all wave visualizers');
    const containers = document.querySelectorAll([
        '.visualizer-container[data-visualizer-type="wave-visualizer"]', 
        '.visualizer-container[data-visualizer-type="wave-simulator"]',
        '.visualizer-container[data-visualizer-type="energy-wave-simulator"]'
    ].join(', '));
    
    containers.forEach(container => {
        window.initEnergyWaveSimulator(container);
    });
} 