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
    // Get all visualization containers
    const containers = document.querySelectorAll('.visualizer-container[data-visualizer-type="wave-visualizer"]');
    console.log('[WAVE] Found', containers.length, 'wave containers to initialize');
    
    // Initialize each container
    containers.forEach(function(container) {
        if (!container.hasAttribute('data-viz-initialized')) {
            initWaveVisualizer(container);
        }
    });
    
    // Look for old containers (for compatibility)
    const oldContainers = document.querySelectorAll('.visualizer-container[data-visualizer-type="wave-simulator"]');
    console.log('[WAVE] Found', oldContainers.length, 'old wave containers to initialize');
    
    oldContainers.forEach(function(container) {
        if (!container.hasAttribute('data-viz-initialized')) {
            initWaveVisualizer(container);
        }
    });
}

// Initialize visualizer with 3D or 2D fallback
function initWaveVisualizer(container) {
    // Check if 3D is available
    if (typeof window.initWave3DVisualizer === 'function') {
        console.log('[WAVE] Using 3D wave visualizer for container:', container.id);
        window.initWave3DVisualizer(container);
    } else {
        console.log('[WAVE] 3D visualizer not available, using 2D fallback for container:', container.id);
        createSimpleWaveVisualizer(container);
    }
}

// Create simple 2D SVG wave visualizer (fallback)
window.createSimpleWaveVisualizer = function(container, config = {}) {
    // Check if container exists
    if (!container) {
        console.error('[WAVE] Wave container is missing');
        return;
    }
    
    console.log('[WAVE] Creating simple wave visualizer in container:', container.id);
    
    // Get configuration from container
    let containerConfig = {};
    try {
        const configStr = container.getAttribute('data-visualizer-config');
        if (configStr) {
            containerConfig = JSON.parse(configStr);
        }
    } catch (e) {
        console.error('[WAVE] Error parsing config:', e);
    }
    
    // Merge configs
    const waveConfig = {
        amplitude: config.amplitude || containerConfig.amplitude || 40,
        frequency: config.frequency || containerConfig.frequency || 0.02,
        speed: config.speed || containerConfig.speed || 0.05,
        color: config.color || containerConfig.color || '#4285F4',
        height: config.height || containerConfig.height || 180
    };
    
    // Mark container as initialized
    container.setAttribute('data-viz-initialized', 'true');
    
    // Clear container
    container.innerHTML = '';
    
    // Setup container styles
    container.style.backgroundColor = '#f0f8ff';
    container.style.overflow = 'hidden';
    container.style.position = 'relative';
    container.style.minHeight = '250px';
    container.style.borderRadius = '4px';
    container.style.border = '1px solid #4285F4';
    container.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)';
    
    // Add title
    const title = document.createElement('div');
    title.textContent = 'Wave Visualizer';
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
    
    // Add version badge
    const badge = document.createElement('div');
    badge.textContent = 'WAVE 2D v2.0';
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
    
    // Create SVG element for visualization
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', waveConfig.height);
    svg.setAttribute('viewBox', '0 0 1000 180');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.style.position = 'absolute';
    svg.style.bottom = '0';
    svg.style.left = '0';
    container.appendChild(svg);
    
    // Add center line
    const centerLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    centerLine.setAttribute('x1', '0');
    centerLine.setAttribute('y1', '90');
    centerLine.setAttribute('x2', '1000');
    centerLine.setAttribute('y2', '90');
    centerLine.setAttribute('stroke', '#ddd');
    centerLine.setAttribute('stroke-width', '1');
    svg.appendChild(centerLine);
    
    // Add wave path - initially straight
    const wavePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    wavePath.setAttribute('d', 'M0,90 L1000,90');
    wavePath.setAttribute('stroke', waveConfig.color);
    wavePath.setAttribute('stroke-width', '3');
    wavePath.setAttribute('fill', 'none');
    svg.appendChild(wavePath);
    
    // Add simple controls for parameters
    if (containerConfig.interactive !== false) {
        addSimpleControls(container, waveConfig);
    }
    
    // Function to update the wave
    function updateWave(timestamp) {
        if (!container.isConnected) {
            // Container no longer in DOM, stop animation
            return;
        }
        
        // Calculate wave points
        let path = 'M0,90 ';
        
        for (let x = 0; x <= 1000; x += 10) {
            const y = 90 + Math.sin(x * waveConfig.frequency + timestamp * waveConfig.speed) * waveConfig.amplitude;
            path += `L${x},${y} `;
        }
        
        // Update wave path
        wavePath.setAttribute('d', path);
        
        // Continue animation
        requestAnimationFrame(updateWave);
    }
    
    // Start animation
    requestAnimationFrame(updateWave);
    
    // Update status in card header if it exists
    const card = container.closest('.card');
    if (card) {
        const statusBadge = card.querySelector('.viz-status-indicator');
        if (statusBadge) {
            statusBadge.textContent = 'Active';
            statusBadge.className = 'viz-status-indicator badge bg-success float-end';
        }
    }
    
    console.log('[WAVE] Simple wave visualizer created successfully');
    return true;
}

// Add simple parameter controls to 2D visualizer
function addSimpleControls(container, config) {
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
    addSlider(controlPanel, 'Amplitude', config.amplitude, 5, 60, 1, (value) => {
        config.amplitude = Number(value);
    });
    
    // Frequency control
    addSlider(controlPanel, 'Frequency', config.frequency * 100, 1, 5, 0.1, (value) => {
        config.frequency = Number(value) / 100;
    });
    
    // Speed control
    addSlider(controlPanel, 'Speed', config.speed * 100, 1, 10, 0.1, (value) => {
        config.speed = Number(value) / 100;
    });
    
    container.appendChild(controlPanel);
}

// Helper to create sliders
function addSlider(parent, label, value, min, max, step, onChange) {
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
    parent.appendChild(container);
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