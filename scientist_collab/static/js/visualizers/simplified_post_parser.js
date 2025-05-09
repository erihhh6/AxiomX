/**
 * Simplified Scientific Post Parser
 * 
 * Fast and lightweight version that processes tags and uses 
 * fallback visualizations directly for maximum performance.
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('[DEBUG] Simplified post parser loaded');
    
    // Process all posts
    setTimeout(processPosts, 800);
    
    // Process content when dynamic content is loaded
    document.addEventListener('content-loaded', processPosts);
    
    // Removed Refresh Viz button as visualizers now work correctly without manual refresh
});

// Process all posts to find tags
function processPosts() {
    console.log('[DEBUG] Processing posts to find visualization tags...');
    
    const posts = document.querySelectorAll('.post-content, .topic-content');
    console.log(`[DEBUG] Found ${posts.length} post containers to process`);
    
    posts.forEach((post, index) => {
        // Check if the post has already been processed
        if (post.getAttribute('data-viz-processed') === 'true') {
            console.log(`Post ${index} already processed, skipping`);
            return;
        }
        
        console.log(`Processing post ${index}`);
        const content = post.innerHTML;
        
        // Find tags and replace them with containers for visualizations
        const processedContent = processContent(content);
        
        if (content !== processedContent) {
            console.log(`Post ${index} had visualizer tags, updating content`);
            post.innerHTML = processedContent;
            post.setAttribute('data-viz-processed', 'true');
            
            // Initialize created visualizers
            initializeVisualizers(post);
        } else {
            console.log(`Post ${index} had no visualizer tags`);
        }
    });
}

// Process content to find visualization tags
function processContent(content) {
    // Counter for unique IDs
    let counter = 1;
    let matchCount = 0;
    let processed = content;
    
    // Supported tags with their corresponding regex patterns
    const tagPatterns = [
        {
            type: 'wave',
            pattern: /\[wave(?:\s+([^[\]]+))?\](.*?)\[\/wave\]/gs
        },
        {
            type: 'dna',
            pattern: /\[dna(?:\s+sequence="([^"]*)")?(?:\s+markers="([^"]*)")?(?:\s+chainType="([^"]*)")?(?:\s+energyEfficiency="([^"]*)")?\](.*?)\[\/dna\]/gs
        },
        {
            type: 'datastructure',
            pattern: /\[datastructure(?:\s+type="([^"]*)")?(?:\s+data="([^"]*)")?\](.*?)\[\/datastructure\]/gs
        }
    ];
    
    // Type mapping to standardize visualizer types
    const typeMap = {
        'wave': 'energy-wave-simulator',
        'dna': 'molecular-energy-chain',
        'datastructure': 'energy-network'
    };
    
    // Process each tag type
    for (const { type, pattern } of tagPatterns) {
        let matches = [...processed.matchAll(pattern)];
        matchCount += matches.length;
        
        if (matches.length > 0) {
            console.log(`[DEBUG] Found ${matches.length} ${type} tags in content. Matches:`, matches);
        }
        
        processed = processed.replace(pattern, (match, ...args) => {
            const id = `viz-${type}-${counter++}`;
            const config = {};
            const visualizerType = typeMap[type] || type;
            
            console.log(`Found ${type} tag, creating visualizer with ID ${id}. Match: ${match}`);
            
            // Extract parameters based on tag type
            switch (type) {
                case 'wave':
                    const [params] = args;
                    if (params) {
                        try {
                            Object.assign(config, JSON.parse(params));
                            console.log(`Wave params:`, config);
                        } catch (e) {
                            console.error('Invalid parameters for wave:', e);
                        }
                    }
                    break;
                    
                case 'dna':
                    const [sequence, markers, chainType, energyEfficiency] = args;
                    if (sequence) {
                        config.sequence = sequence;
                        console.log(`Molecular chain length: ${sequence.length}`);
                    }
                    if (markers) {
                        try {
                            config.markers = JSON.parse(markers);
                            console.log(`Molecular markers:`, config.markers);
                        } catch (e) {
                            console.error('Invalid parameters for markers:', e);
                        }
                    }
                    if (chainType) {
                        config.chainType = chainType;
                        console.log(`Chain type: ${chainType}`);
                    }
                    if (energyEfficiency) {
                        config.energyEfficiency = parseFloat(energyEfficiency);
                        console.log(`Energy efficiency: ${energyEfficiency}`);
                    }
                    break;
                    
                case 'datastructure':
                    const [structureType, data] = args;
                    if (structureType) {
                        config.structureType = structureType;
                        console.log(`Energy network type: ${structureType}`);
                        
                        // Set mode to 3D for better visualization
                        config.mode = '3d';
                    }
                    if (data) {
                        try {
                            config.data = JSON.parse(data);
                            console.log(`Energy network data:`, config.data);
                        } catch (e) {
                            console.error('Invalid parameters for data:', e);
                        }
                    }
                    break;
            }
            
            // Create visualization container
            return `
                <div class="card my-3">
                    <div class="card-header">
                        <span>${getVisualizerTitle(type)}</span>
                        <span class="viz-status-indicator badge bg-secondary float-end">Loading...</span>
                    </div>
                    <div class="card-body">
                        <div id="${id}" class="visualizer-container" 
                             data-visualizer-type="${visualizerType}" 
                             data-visualizer-config='${JSON.stringify(config)}'>
                            <div class="text-center">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Loading...</span>
                                </div>
                                <p class="mt-2">Loading visualization...</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
    }
    
    console.log(`Found ${matchCount} total visualizer tags in content`);
    return processed;
}

// Check if scripts are already loaded or loading
function isScriptLoaded(src) {
    return document.querySelector(`script[src="${src}"]`) !== null;
}

function isScriptLoading(src) {
    const scripts = document.querySelectorAll('script');
    for (const script of scripts) {
        if (script && script.src && script.src.includes(src) && !script.hasAttribute('data-loaded')) {
            return true;
        }
    }
    return false;
}

// Function to load script and return a promise
function loadScript(src) {
    if (!src) {
        return Promise.reject(new Error('Invalid script source'));
    }
    
    return new Promise((resolve, reject) => {
        if (isScriptLoaded(src)) {
            return resolve();
        }
        
        if (isScriptLoading(src)) {
            // Wait for it to load
            const checkInterval = setInterval(() => {
                if (isScriptLoaded(src)) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
            return;
        }
        
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => {
            script.setAttribute('data-loaded', 'true');
            resolve();
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

function initializeVisualizers(container) {
    if (!container) {
        console.error('Container is null or undefined');
        return;
    }
    
    const visualizers = container.querySelectorAll('.visualizer-container');
    
    console.log(`Found ${visualizers.length} visualizers to initialize`);
    
    visualizers.forEach(viz => {
        if (!viz) return;
        
        const id = viz.id;
        const type = viz.getAttribute('data-visualizer-type');
        const configStr = viz.getAttribute('data-visualizer-config') || '{}';
        
        if (!id || !type) {
            console.error('Missing id or type for visualizer');
            return;
        }
        
        console.log(`Initializing visualizer: ${id} of type ${type}`);
        
        try {
            const config = JSON.parse(configStr);
            
            // Clean up container first
            viz.innerHTML = '';
            
            // Set a data attribute to prevent double initialization
            viz.setAttribute('data-processing', 'true');
            
            // Initialize based on type
            switch(type) {
                case 'wave-visualizer':
                case 'wave-simulator': // Pentru compatibilitate cu postări vechi
                case 'energy-wave-simulator': // Noul tip pentru Energy Wave Simulator
                    initializeWaveVisualizer(viz, id, config);
                    break;
                    
                case 'dna-visualizer':
                case 'molecular-energy-chain': // New type for Molecular Energy Chain Visualizer
                    initializeMolecularChainVisualizer(viz, id, config);
                    break;
                    
                case 'data-structure':
                case 'energy-network':
                    // Try to use the real data structure visualizer first
                    initializeDataStructureVisualizer(viz, id, config);
                    break;
                    
                default:
                    viz.innerHTML = `<div class="alert alert-warning">Unknown visualizer type: ${type}</div>`;
                    updateStatusIndicator(viz, 'Error', false);
            }
            
        } catch (error) {
            console.error(`Error initializing visualizer ${id}:`, error);
            if (viz) {
                viz.innerHTML = `<div class="alert alert-danger">Error initializing visualizer: ${error.message}</div>`;
                updateStatusIndicator(viz, 'Error', false);
            }
        }
    });
}

// Initialize wave visualizer with fallback implementation
function initializeWaveVisualizer(container, id, config) {
    console.log("Initializing Energy Wave Simulator");
    
    try {
        // Verificăm dacă există funcția globală noua de Energy Wave
        if (typeof initEnergyWaveSimulator === 'function') {
            // Folosim direct funcția Energy Wave Simulator
            initEnergyWaveSimulator(container, config);
            updateStatusIndicator(container, 'Energy Wave', true);
            return;
        }
        
        // Verificăm funcția legacy
        if (typeof initWave3DVisualizer === 'function') {
            // Folosim funcția legacy care acum mapează la Energy Wave
            initWave3DVisualizer(container, config);
            updateStatusIndicator(container, 'Legacy → Energy', true);
            return;
        }
        
        // Încărcăm scriptul Energy Wave și apoi inițializăm
        loadScript('/static/js/visualizers/waves/wave_3d.js')
            .then(() => {
                console.log('Energy Wave Simulator loaded via script');
                if (typeof initEnergyWaveSimulator === 'function') {
                    initEnergyWaveSimulator(container, config);
                    updateStatusIndicator(container, 'Energy Wave', true);
                } else if (typeof initWave3DVisualizer === 'function') {
                    initWave3DVisualizer(container, config);
                    updateStatusIndicator(container, 'Legacy → Energy', true);
                } else {
                    throw new Error('Energy Wave Simulator loaded but function not found');
                }
            })
            .catch(error => {
                console.error('Failed to load Energy Wave Simulator:', error);
                // Încercăm să folosim fallback-ul simplu
                loadScript('/static/js/visualizers/waves/fallback_wave.js')
                    .then(() => {
                        if (typeof createSimpleWaveVisualizer === 'function') {
                            console.log('Using fallback wave visualizer');
                            createSimpleWaveVisualizer(container, config);
                            updateStatusIndicator(container, 'Basic Energy', false);
                        } else {
                            throw new Error('Fallback visualizer loaded but function not found');
                        }
                    })
                    .catch(err => {
                        console.error('Failed to load any visualizer:', err);
                        createFallbackVisualizer(container, 'Failed to load Energy Wave Simulator');
                    });
            });
    } catch (error) {
        console.error('Error in Energy Wave Simulator initialization:', error);
        createFallbackVisualizer(container, error.message);
    }
}

// Create a simple fallback visualizer when everything else fails
function createFallbackVisualizer(container, errorMessage) {
    if (!container) return;
    
    // Simplu, dar garantat să funcționeze - o imagine SVG statică
    container.innerHTML = `
        <div style="padding:10px; background-color:#f8f9fa; border-radius:4px; text-align:center;">
            <div style="margin-bottom:10px; font-weight:bold;">Energy Wave Simulator (Fallback)</div>
            <div style="height:100px; overflow:hidden;">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 100" width="100%" height="100" preserveAspectRatio="none">
                    <path d="M0,50 Q250,0 500,50 T1000,50" stroke="#4285F4" stroke-width="3" fill="none" />
                    <text x="500" y="80" text-anchor="middle" font-size="12" fill="#666">Energy Wave</text>
                </svg>
            </div>
            <div style="font-size:12px; color:#666; margin-top:10px;">
                ${errorMessage || 'Vizualizator simplificat'}
            </div>
        </div>
    `;
    
    // Actualizăm statusul
    updateStatusIndicator(container, 'Fallback', false);
    
    // Actualizăm și indicatorul din card header
    const card = container.closest('.card');
    if (card) {
        const statusBadge = card.querySelector('.viz-status-indicator');
        if (statusBadge) {
            statusBadge.textContent = 'Fallback';
            statusBadge.className = 'viz-status-indicator badge bg-warning float-end';
        }
    }
}

// Initialize DNA visualizer with 3D if available
function initializeDNAVisualizer(container, id, config) {
    // Use existing DNA visualizer load process - already optimized in the current code
    try {
        if (typeof initDNAVisualizer === 'function') {
            initDNAVisualizer(id, config);
            updateStatusIndicator(container, '3D Ready', true);
        } else {
            loadScript('/static/js/visualizers/dna/dna_visualizer.js')
                .then(() => {
                    if (typeof initDNAVisualizer === 'function') {
                        initDNAVisualizer(id, config);
                        updateStatusIndicator(container, '3D Ready', true);
                    } else {
                        throw new Error('DNA visualizer loaded but initialization function not found');
                    }
                })
                .catch(error => {
                    console.error('Error loading DNA visualizer:', error);
                    FallbackVisualizer.create(container, 'dna', config);
                    updateStatusIndicator(container, 'Basic', true);
                });
        }
    } catch (error) {
        console.error('Error initializing DNA visualizer:', error);
        FallbackVisualizer.create(container, 'dna', config);
        updateStatusIndicator(container, 'Basic', true);
    }
}

// Initialize data structure visualizer
function initializeDataStructureVisualizer(container, id, config) {
    try {
        console.log(`Initializing energy network visualizer: ${id}`, config);
        
        // Check if container exists and is valid
        if (!container || !(container instanceof HTMLElement)) {
            console.error('Invalid container for energy network visualizer');
            return false;
        }
        
        // Store original content for fallback
        const originalContent = container.innerHTML;
        
        // Safely clear the container
        try {
            // Remove loading spinner from container
            container.innerHTML = '';
        } catch (e) {
            console.error('Error clearing container:', e);
        }
        
        // Ensure structureType is passed to the visualizer
        const options = { ...config };
        
        // Default to network if no type specified
        if (!options.structureType) {
            options.structureType = 'network';
        }
        
        console.log('Energy network configuration:', options);
        
        // Add progress status directly to container first
        try {
            const statusDiv = document.createElement('div');
            statusDiv.className = 'visualizer-status py-1 px-2 mb-2';
            statusDiv.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Initializing Energy Network Visualizer...';
            container.appendChild(statusDiv);
        } catch (e) {
            console.error('Error adding status message:', e);
        }
        
        // First check if Three.js is loaded - it should be from the template
        const isThreeJsLoaded = (typeof THREE !== 'undefined' && THREE.REVISION);
        if (!isThreeJsLoaded) {
            console.warn('Three.js not detected, attempting to load it first');
            // Try loading Three.js before initializing
            const threeScript = document.createElement('script');
            threeScript.src = 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.min.js';
            document.head.appendChild(threeScript);
            
            // Wait a moment to allow script to load
            setTimeout(() => {
                initializeEnergyNetwork();
            }, 500);
        } else {
            // Three.js is already loaded, proceed
            console.log('Three.js already loaded, version:', THREE.REVISION);
            initializeEnergyNetwork();
        }
        
        function initializeEnergyNetwork() {
            try {
                console.log('Using native energy network visualizer');
                // Try using the energy network visualizer
                if (typeof window.initEnergyNetworkVisualizer === 'function') {
                    const result = window.initEnergyNetworkVisualizer(container, options);
                    if (result) {
                        return true;
                    } else {
                        throw new Error('Initializer returned false');
                    }
                } else {
                    throw new Error('Energy network visualizer not available');
                }
            } catch (error) {
                console.warn('Failed to initialize energy network visualizer, falling back to simplified version', error);
                
                // Restore original content for clean slate
                try {
                    container.innerHTML = '';
                } catch (e) {
                    console.error('Error clearing container for fallback:', e);
                }
                
                // Try the fallback visualizer
                try {
                    // Fallback to the simplified visualizer
                    if (typeof FallbackVisualizer !== 'undefined' && typeof FallbackVisualizer.create === 'function') {
                        console.log('Using fallback visualizer for energy network');
                        FallbackVisualizer.create(container, 'data-structure', options);
                        return true;
                    } else {
                        throw new Error('Both main and fallback visualizers failed to initialize');
                    }
                } catch (fallbackError) {
                    console.error('Fallback also failed:', fallbackError);
                    
                    // Last resort - show a basic error message
                    try {
                        container.innerHTML = `
                            <div class="alert alert-danger">
                                <h5 class="alert-heading">Error initializing Energy Network Visualizer</h5>
                                <p>${error.message || 'Unknown error occurred'}</p>
                                <p>Fallback also failed: ${fallbackError.message}</p>
                            </div>
                        `;
                    } catch (e) {
                        console.error('Complete failure in visualization initialization:', e);
                    }
                    
                    return false;
                }
            }
        }
        
        return true;
    } catch (error) {
        console.error('Error initializing data structure visualizer:', error);
        
        // Show error in container
        try {
            container.innerHTML = `
                <div class="alert alert-danger">
                    <h5 class="alert-heading">Error initializing Energy Network Visualizer</h5>
                    <p>${error.message || 'Unknown error occurred'}</p>
                </div>
            `;
        } catch (e) {
            console.error('Could not display error message:', e);
        }
        
        return false;
    }
}

// Update status indicator
function updateStatusIndicator(container, statusText, success = true) {
    if (!container) return;
    
    // Look for existing status indicator
    let statusIndicator = container.querySelector('.visualizer-status');
    
    // Create if it doesn't exist
    if (!statusIndicator) {
        statusIndicator = document.createElement('div');
        statusIndicator.className = 'visualizer-status';
        statusIndicator.style.position = 'absolute';
        statusIndicator.style.bottom = '5px';
        statusIndicator.style.right = '5px';
        statusIndicator.style.padding = '2px 6px';
        statusIndicator.style.borderRadius = '3px';
        statusIndicator.style.fontSize = '10px';
        statusIndicator.style.fontWeight = 'bold';
        statusIndicator.style.zIndex = '10';
        
        try {
            container.appendChild(statusIndicator);
        } catch (e) {
            console.error('Error appending status indicator:', e);
            return;
        }
    }
    
    try {
        // Update style and text
        statusIndicator.style.backgroundColor = success ? 'rgba(40, 167, 69, 0.8)' : 'rgba(220, 53, 69, 0.8)';
        statusIndicator.style.color = 'white';
        statusIndicator.textContent = statusText;
    } catch (e) {
        console.error('Error updating status indicator:', e);
    }
}

// Get visualizer title
function getVisualizerTitle(type) {
    switch (type) {
        case 'wave':
            return 'Energy Wave Simulator';
        case 'dna':
            return 'Molecular Energy Chain Visualizer';
        case 'datastructure':
            return 'Energy Network Visualizer';
        default:
            return 'Interactive Visualizer';
    }
}

// Initialize a DNA/Molecular Chain visualizer
function initializeMolecularChainVisualizer(container, id, config) {
    updateStatusIndicator(container, 'Loading Molecular Chain Visualizer');
    
    try {
        // Check if specific molecular chain config is provided
        if (config.chainType) {
            // This is the new molecular chain visualizer
            if (typeof window.initMolecularEnergyChainVisualizer === 'function') {
                window.initMolecularEnergyChainVisualizer(id, config);
                updateStatusIndicator(container, 'Ready', true);
            } else {
                // Load the molecular chain visualizer script - use the existing file that we transformed
                loadScript('/static/js/visualizers/dna/dna_visualizer.js?v=' + Date.now(), () => {
                    if (typeof window.initMolecularEnergyChainVisualizer === 'function') {
                        window.initMolecularEnergyChainVisualizer(id, config);
                        updateStatusIndicator(container, 'Ready', true);
                    } else {
                        updateStatusIndicator(container, 'Error: Could not initialize Molecular Chain Visualizer', false);
                    }
                });
            }
        } else {
            // Try to use the Molecular Chain Visualizer for all scenarios
            if (typeof window.initMolecularEnergyChainVisualizer === 'function') {
                // Use the new visualizer if available
                window.initMolecularEnergyChainVisualizer(id, {
                    ...config,
                    // Add default chain type for DNA/RNA sequences
                    chainType: config.sequence && (config.sequence.includes('A') || config.sequence.includes('T') || 
                              config.sequence.includes('G') || config.sequence.includes('C')) ? 'biofuel' : 'hydrocarbon'
                });
                updateStatusIndicator(container, 'Ready', true);
            } else {
                // Load the visualizer script
                loadScript('/static/js/visualizers/dna/dna_visualizer.js?v=' + Date.now(), () => {
                    if (typeof window.initMolecularEnergyChainVisualizer === 'function') {
                        window.initMolecularEnergyChainVisualizer(id, {
                            ...config,
                            // Add default chain type for DNA/RNA sequences
                            chainType: config.sequence && (config.sequence.includes('A') || config.sequence.includes('T') || 
                                      config.sequence.includes('G') || config.sequence.includes('C')) ? 'biofuel' : 'hydrocarbon'
                        });
                        updateStatusIndicator(container, 'Ready', true);
                    } else {
                        updateStatusIndicator(container, 'Error: Could not initialize visualizer', false);
                    }
                });
            }
        }
    } catch (error) {
        console.error('Error initializing molecular chain visualizer:', error);
        updateStatusIndicator(container, 'Error', false);
    }
} 