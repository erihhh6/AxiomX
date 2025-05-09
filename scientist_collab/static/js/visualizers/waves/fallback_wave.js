/**
 * Wave Visualizer System
 * Automatically detects and uses 3D mode when available, with 2D SVG fallback
 */

// When document is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('[WAVE] Wave Visualizer loaded - DOM ready event fired');
    
    // Update all wave containers immediately
    createAllWaveVisualizers();
    
    // Try again after a short time (for dynamically loaded content)
    setTimeout(function() {
        console.log('[WAVE] Delayed scan for wave containers');
        createAllWaveVisualizers();
    }, 1000);
});

// MutationObserver to detect changes in DOM
if (typeof MutationObserver !== 'undefined') {
    console.log('[WAVE] Setting up MutationObserver for dynamic content');
    const observer = new MutationObserver(function(mutations) {
        console.log('[WAVE] DOM changed, checking for new wave containers');
        createAllWaveVisualizers();
    });
    
    // Observe document for changes
    observer.observe(document.body, { 
        childList: true,
        subtree: true
    });
}

// Find all wave containers and initialize them
function createAllWaveVisualizers() {
    // Get all visualization containers - look for all possible type names
    const containers = document.querySelectorAll([
        '.visualizer-container[data-visualizer-type="wave-visualizer"]',
        '.visualizer-container[data-visualizer-type="wave-simulator"]', 
        '.visualizer-container[data-visualizer-type="energy-wave-simulator"]'
    ].join(', '));
    
    console.log('[WAVE] Found', containers.length, 'wave containers to initialize');
    
    // Initialize each container
    containers.forEach(function(container) {
        if (!container.hasAttribute('data-viz-initialized')) {
            initWaveVisualizer(container);
        }
    });
}

// Initialize visualizer with 3D or 2D fallback
function initWaveVisualizer(container) {
    // Check if the 3D Energy Wave Simulator is available
    if (typeof window.initEnergyWaveSimulator === 'function') {
        console.log('[WAVE] Using Energy Wave Simulator for container:', container.id);
        window.initEnergyWaveSimulator(container);
        return;
    }
    
    // Try legacy 3D visualizer as fallback
    if (typeof window.initWave3DVisualizer === 'function') {
        console.log('[WAVE] Using legacy 3D wave visualizer for container:', container.id);
        window.initWave3DVisualizer(container);
        return;
    }
    
    // Last resort - use 2D canvas fallback
    console.log('[WAVE] 3D visualizers not available, using 2D fallback for container:', container.id);
    createSimpleWaveVisualizer(container);
}

// Main initialization function that can be called directly
window.createSimpleWaveVisualizer = function(container, customConfig = {}) {
    console.log('Creating Energy Wave Simulator (Fallback Version)');
    
    // Default configuration
    const defaultConfig = {
        width: container.clientWidth,
        height: 200,
        waveCount: 3,
        amplitude: 40,
        frequency: 0.02,
        phase: 0,
        speed: 0.05,
        color: '#4285F4',
        energyType: 'electromagnetic', // electromagnetic, thermal, pressure, sound
        powerLevel: 5.0, // kW
        efficiency: 0.85
    };
    
    // Get config from container if available
    let containerConfig = {};
    try {
        const configAttr = container.getAttribute('data-visualizer-config');
        if (configAttr) {
            containerConfig = JSON.parse(configAttr);
        }
    } catch (e) {
        console.error('Error parsing container config:', e);
    }
    
    // Merge configurations
    const config = {...defaultConfig, ...containerConfig, ...customConfig};
    
    // Set color based on energy type
    switch (config.energyType) {
        case 'electromagnetic':
            config.color = '#4285F4'; // Blue for electromagnetic
            break;
        case 'thermal':
            config.color = '#EA4335'; // Red for thermal
            break;
        case 'pressure':
            config.color = '#34A853'; // Green for pressure
            break;
        case 'sound':
            config.color = '#FBBC05'; // Yellow for sound
            break;
    }
    
    // Create canvas element
    const canvas = document.createElement('canvas');
    canvas.width = config.width;
    canvas.height = config.height;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = `${config.height}px`;
    
    // Clear container
    container.innerHTML = '';
    container.appendChild(canvas);
    
    // Add title bar
    const titleBar = document.createElement('div');
    titleBar.textContent = 'Energy Wave Simulator';
    titleBar.style.position = 'absolute';
    titleBar.style.top = '0';
    titleBar.style.left = '0';
    titleBar.style.right = '0';
    titleBar.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    titleBar.style.color = 'white';
    titleBar.style.padding = '5px 10px';
    titleBar.style.fontSize = '14px';
    titleBar.style.fontWeight = 'bold';
    titleBar.style.zIndex = '5';
    container.appendChild(titleBar);
    
    // Add energy type indicator
    const energyTypeIndicator = document.createElement('div');
    
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
        default:
            bgColor = 'rgba(66, 133, 244, 0.8)';
            label = 'Electromagnetic';
    }
    
    energyTypeIndicator.textContent = label + ' Wave';
    energyTypeIndicator.style.position = 'absolute';
    energyTypeIndicator.style.top = '10px';
    energyTypeIndicator.style.right = '10px';
    energyTypeIndicator.style.padding = '3px 8px';
    energyTypeIndicator.style.backgroundColor = bgColor;
    energyTypeIndicator.style.color = 'white';
    energyTypeIndicator.style.fontSize = '12px';
    energyTypeIndicator.style.fontWeight = 'bold';
    energyTypeIndicator.style.borderRadius = '4px';
    energyTypeIndicator.style.zIndex = '6';
    container.appendChild(energyTypeIndicator);
    
    // Add energy info display
    const energyInfoDisplay = document.createElement('div');
    energyInfoDisplay.style.position = 'absolute';
    energyInfoDisplay.style.left = '10px';
    energyInfoDisplay.style.bottom = '10px';
    energyInfoDisplay.style.padding = '5px';
    energyInfoDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    energyInfoDisplay.style.color = 'white';
    energyInfoDisplay.style.fontSize = '11px';
    energyInfoDisplay.style.fontFamily = 'monospace';
    energyInfoDisplay.style.borderRadius = '4px';
    energyInfoDisplay.style.zIndex = '6';
    container.appendChild(energyInfoDisplay);
    
    // Add power scale
    const powerScaleContainer = document.createElement('div');
    powerScaleContainer.style.position = 'absolute';
    powerScaleContainer.style.left = '10px';
    powerScaleContainer.style.right = '10px';
    powerScaleContainer.style.bottom = '40px';
    powerScaleContainer.style.height = '20px';
    powerScaleContainer.style.zIndex = '5';
    
    const powerScale = document.createElement('div');
    powerScale.style.position = 'relative';
    powerScale.style.height = '4px';
    powerScale.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
    powerScale.style.marginBottom = '16px';
    powerScaleContainer.appendChild(powerScale);
    
    // Add scale units
    const units = ['0', 'kW', 'MW', 'GW'];
    for (let i = 0; i < units.length; i++) {
        const unit = document.createElement('div');
        unit.textContent = units[i];
        unit.style.position = 'absolute';
        unit.style.left = `${i * 33.3}%`;
        unit.style.top = '6px';
        unit.style.color = 'white';
        unit.style.fontSize = '10px';
        unit.style.fontWeight = 'bold';
        unit.style.textShadow = '1px 1px 1px rgba(0, 0, 0, 0.7)';
        powerScale.appendChild(unit);
    }
    
    // Add power indicator
    const powerIndicator = document.createElement('div');
    powerIndicator.style.position = 'absolute';
    powerIndicator.style.width = '2px';
    powerIndicator.style.height = '10px';
    powerIndicator.style.backgroundColor = '#ff0000';
    powerIndicator.style.top = '-3px';
    powerIndicator.style.marginLeft = '-1px';
    
    // Calculate position based on power level
    let indicatorPosition;
    if (config.powerLevel < 10) {
        indicatorPosition = (config.powerLevel / 10) * 33.3;
    } else if (config.powerLevel < 1000) {
        indicatorPosition = 33.3 + ((Math.log10(config.powerLevel) - 1) / 2) * 33.3;
    } else {
        indicatorPosition = 66.6 + (Math.log10(config.powerLevel / 1000) / 2) * 33.3;
    }
    
    powerIndicator.style.left = `${indicatorPosition}%`;
    powerScale.appendChild(powerIndicator);
    
    container.appendChild(powerScaleContainer);
    
    // Get drawing context
    const ctx = canvas.getContext('2d');
    
    // Animation values
    let phase = 0;
    let animationId = null;
    
    // Start animation
    function animate() {
        if (!container.isConnected) {
            // Container no longer in DOM, stop animation
            cancelAnimationFrame(animationId);
            return;
        }
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw background
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Update phase
        phase += config.speed;
        if (phase > Math.PI * 2) {
            phase -= Math.PI * 2;
        }
        
        // Draw multiple waves
        for (let w = 0; w < config.waveCount; w++) {
            // Calculate energy efficiency loss for each wave
            const energyFactor = Math.pow(config.efficiency, w * 0.3 + 1);
            
            // Adjust opacity for each wave
            const opacity = Math.max(0.1, 1 - (w * 0.2));
            
            // Draw the wave
            ctx.beginPath();
            
            // Set line style based on wave index
            ctx.strokeStyle = config.color;
            ctx.globalAlpha = opacity;
            ctx.lineWidth = 2;
            
            // Draw wave path differently based on energy type
            for (let x = 0; x <= canvas.width; x += 5) {
                const xNormalized = x / canvas.width * 10; // Normalize to 0-10 range
                
                let y = 0;
                const centerY = canvas.height / 2;
                
                switch(config.energyType) {
                    case 'electromagnetic':
                        // Sine wave for electromagnetic
                        y = centerY + Math.sin(xNormalized * config.frequency + phase + (w * 0.5)) * 
                            (config.amplitude * energyFactor);
                        break;
                    case 'thermal':
                        // Irregular wave for thermal
                        y = centerY + 
                            Math.sin(xNormalized * config.frequency + phase) * (config.amplitude * 0.7 * energyFactor) +
                            Math.sin(xNormalized * config.frequency * 2 + phase * 1.5) * (config.amplitude * 0.3 * energyFactor);
                        break;
                    case 'pressure':
                        // Pulse-like wave for pressure
                        y = centerY + 
                            Math.sin(xNormalized * config.frequency + phase) * 
                            Math.cos(phase * 2) * 
                            (config.amplitude * energyFactor);
                        break;
                    case 'sound':
                        // Normalized decay wave for sound
                        const distance = Math.abs(xNormalized - 5); // Distance from center
                        y = centerY + 
                            Math.sin(xNormalized * config.frequency + phase) * 
                            (config.amplitude * energyFactor) * 
                            (1 / (1 + distance * 0.2)); // Decay with distance
                        break;
                    default:
                        y = centerY + Math.sin(xNormalized * config.frequency + phase) * 
                            (config.amplitude * energyFactor);
                }
                
                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            
            ctx.stroke();
        }
        
        // Reset opacity
        ctx.globalAlpha = 1;
        
        // Update energy info display
        updateEnergyInfo(energyInfoDisplay, config);
        
        // Continue animation
        animationId = requestAnimationFrame(animate);
    }
    
    // Start animation
    animate();
    
    // Add controls
    addControls(container, config, canvas);
    
    // Mark as initialized
    container.setAttribute('data-viz-initialized', 'true');
    
    return {
        stop: function() {
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        }
    };
};

// Function to update energy info
function updateEnergyInfo(display, config) {
    if (!display) return;
    
    // Calculate instantaneous power with variation
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
    
    // Calculate output power with efficiency loss
    const outputPower = instantPower * config.efficiency;
    const outputDisplay = (outputPower / (instantPower < 1000 ? 1 : instantPower < 1000000 ? 1000 : 1000000)).toFixed(2);
    
    // Update display
    display.innerHTML = `
        <div>Power: ${displayPower} ${unit}</div>
        <div>Frequency: ${(config.frequency * 500).toFixed(1)} Hz</div>
        <div>Efficiency: ${(config.efficiency * 100).toFixed(1)}%</div>
        <div>Output: ${outputDisplay} ${unit}</div>
    `;
}

// Function to add controls
function addControls(container, config, canvas) {
    // Create controls container
    const controls = document.createElement('div');
    controls.style.position = 'absolute';
    controls.style.right = '10px';
    controls.style.bottom = '10px';
    controls.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    controls.style.padding = '8px';
    controls.style.borderRadius = '5px';
    controls.style.zIndex = '5';
    
    // Energy type select
    const energyTypeSelect = document.createElement('select');
    energyTypeSelect.style.display = 'block';
    energyTypeSelect.style.marginBottom = '5px';
    energyTypeSelect.style.width = '100%';
    energyTypeSelect.style.backgroundColor = '#444';
    energyTypeSelect.style.color = 'white';
    energyTypeSelect.style.border = '1px solid #666';
    energyTypeSelect.style.padding = '2px';
    
    const energyTypes = [
        { value: 'electromagnetic', label: 'Electromagnetic' },
        { value: 'thermal', label: 'Thermal' },
        { value: 'pressure', label: 'Pressure' },
        { value: 'sound', label: 'Sound' }
    ];
    
    energyTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type.value;
        option.textContent = type.label;
        if (type.value === config.energyType) {
            option.selected = true;
        }
        energyTypeSelect.appendChild(option);
    });
    
    energyTypeSelect.addEventListener('change', function() {
        config.energyType = this.value;
        
        // Update energy type indicator
        const indicator = container.querySelector('div[style*="position: absolute"][style*="top: 10px"][style*="right: 10px"]');
        if (indicator) {
            let bgColor, label;
            switch(config.energyType) {
                case 'electromagnetic':
                    bgColor = 'rgba(66, 133, 244, 0.8)';
                    label = 'Electromagnetic';
                    config.color = '#4285F4';
                    break;
                case 'thermal':
                    bgColor = 'rgba(234, 67, 53, 0.8)';
                    label = 'Thermal';
                    config.color = '#EA4335';
                    break;
                case 'pressure':
                    bgColor = 'rgba(52, 168, 83, 0.8)';
                    label = 'Pressure';
                    config.color = '#34A853';
                    break;
                case 'sound':
                    bgColor = 'rgba(251, 188, 5, 0.8)';
                    label = 'Sound';
                    config.color = '#FBBC05';
                    break;
            }
            
            indicator.style.backgroundColor = bgColor;
            indicator.textContent = label + ' Wave';
        }
    });
    
    const energyTypeLabel = document.createElement('div');
    energyTypeLabel.textContent = 'Energy Type:';
    energyTypeLabel.style.color = 'white';
    energyTypeLabel.style.fontSize = '11px';
    energyTypeLabel.style.marginBottom = '2px';
    
    controls.appendChild(energyTypeLabel);
    controls.appendChild(energyTypeSelect);
    
    // Add slider for power
    const powerLabel = document.createElement('div');
    powerLabel.textContent = 'Power (kW):';
    powerLabel.style.color = 'white';
    powerLabel.style.fontSize = '11px';
    powerLabel.style.marginTop = '5px';
    powerLabel.style.marginBottom = '2px';
    
    const powerSlider = document.createElement('input');
    powerSlider.type = 'range';
    powerSlider.min = '0.1';
    powerSlider.max = '1000';
    powerSlider.step = '0.1';
    powerSlider.value = config.powerLevel;
    powerSlider.style.width = '100%';
    powerSlider.style.marginBottom = '5px';
    
    powerSlider.addEventListener('input', function() {
        config.powerLevel = parseFloat(this.value);
        
        // Update power indicator position
        const indicator = container.querySelector('div[style*="position: absolute"][style*="width: 2px"][style*="height: 10px"]');
        if (indicator) {
            let position;
            if (config.powerLevel < 10) {
                position = (config.powerLevel / 10) * 33.3;
            } else if (config.powerLevel < 1000) {
                position = 33.3 + ((Math.log10(config.powerLevel) - 1) / 2) * 33.3;
            } else {
                position = 66.6 + (Math.log10(config.powerLevel / 1000) / 2) * 33.3;
            }
            indicator.style.left = `${position}%`;
        }
    });
    
    controls.appendChild(powerLabel);
    controls.appendChild(powerSlider);
    
    // Add slider for efficiency
    const efficiencyLabel = document.createElement('div');
    efficiencyLabel.textContent = 'Efficiency (%):';
    efficiencyLabel.style.color = 'white';
    efficiencyLabel.style.fontSize = '11px';
    efficiencyLabel.style.marginTop = '5px';
    efficiencyLabel.style.marginBottom = '2px';
    
    const efficiencySlider = document.createElement('input');
    efficiencySlider.type = 'range';
    efficiencySlider.min = '10';
    efficiencySlider.max = '100';
    efficiencySlider.step = '1';
    efficiencySlider.value = config.efficiency * 100;
    efficiencySlider.style.width = '100%';
    
    efficiencySlider.addEventListener('input', function() {
        config.efficiency = parseFloat(this.value) / 100;
    });
    
    controls.appendChild(efficiencyLabel);
    controls.appendChild(efficiencySlider);
    
    container.appendChild(controls);
}

// Global function to update all wave containers
window.initAllWaveVisualizers = function() {
    console.log('[WAVE] Global initialization of all wave visualizers triggered');
    createAllWaveVisualizers();
}

// Direct call after page load
window.addEventListener('load', function() {
    console.log('[WAVE] Window fully loaded, forcing wave visualizer initialization');
    setTimeout(function() {
        createAllWaveVisualizers();
    }, 500);
});