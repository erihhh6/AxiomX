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
            pattern: /\[dna(?:\s+sequence="([^"]*)")?(?:\s+markers="([^"]*)")?\](.*?)\[\/dna\]/gs
        },
        {
            type: 'datastructure',
            pattern: /\[datastructure(?:\s+type="([^"]*)")?(?:\s+data="([^"]*)")?\](.*?)\[\/datastructure\]/gs
        }
    ];
    
    // Type mapping to standardize visualizer types
    const typeMap = {
        'wave': 'wave-visualizer',
        'dna': 'dna-visualizer',
        'datastructure': 'data-structure'
    };
    
    // Process each tag type
    for (const { type, pattern } of tagPatterns) {
        let matches = [...processed.matchAll(pattern)];
        matchCount += matches.length;
        
        if (type === 'wave' && matches.length > 0) {
            console.log(`[WAVE] Found ${matches.length} wave tags in content. Matches:`, matches);
        }
        
        processed = processed.replace(pattern, (match, ...args) => {
            const id = `viz-${type}-${counter++}`;
            const config = {};
            const visualizerType = typeMap[type] || type;
            
            console.log(`Found ${type} tag, creating visualizer with ID ${id}`);
            
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
                    const [sequence, markers] = args;
                    if (sequence) {
                        config.sequence = sequence;
                        console.log(`DNA sequence length: ${sequence.length}`);
                    }
                    if (markers) {
                        try {
                            config.markers = JSON.parse(markers);
                            console.log(`DNA markers:`, config.markers);
                        } catch (e) {
                            console.error('Invalid parameters for markers:', e);
                        }
                    }
                    break;
                    
                case 'datastructure':
                    const [structureType, data] = args;
                    if (structureType) {
                        config.structureType = structureType;
                        console.log(`Data structure type: ${structureType}`);
                        
                        // Set mode to 3D for better visualization
                        config.mode = '3d';
                    }
                    if (data) {
                        try {
                            config.data = JSON.parse(data);
                            console.log(`Data structure data:`, config.data);
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
                    initializeWaveVisualizer(viz, id, config);
                    break;
                    
                case 'dna-visualizer':
                    initializeDNAVisualizer(viz, id, config);
                    break;
                    
                case 'data-structure':
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
    console.log("Using direct fallback for wave visualizer");
    
    try {
        // Verificăm dacă există funcția globală
        if (typeof createSimpleWaveVisualizer === 'function') {
            // Folosim direct funcția globală
            createSimpleWaveVisualizer(container);
            return;
        }
        
        // Altfel încărcăm scriptul și apoi inițializăm
        loadScript('/static/js/visualizers/waves/fallback_wave.js')
            .then(() => {
                console.log('Fallback wave visualizer loaded via script');
                if (typeof createSimpleWaveVisualizer === 'function') {
                    createSimpleWaveVisualizer(container);
                } else {
                    throw new Error('Fallback wave visualizer loaded but function not found');
                }
            })
            .catch(error => {
                console.error('Failed to load wave visualizer:', error);
                createFallbackVisualizer(container, 'Failed to load wave visualizer');
            });
    } catch (error) {
        console.error('Error in wave visualizer initialization:', error);
        createFallbackVisualizer(container, error.message);
    }
}

// Create a simple fallback visualizer when everything else fails
function createFallbackVisualizer(container, errorMessage) {
    if (!container) return;
    
    // Simplu, dar garantat să funcționeze - o imagine SVG statică
    container.innerHTML = `
        <div style="padding:10px; background-color:#f8f9fa; border-radius:4px; text-align:center;">
            <div style="margin-bottom:10px; font-weight:bold;">Wave Visualizer (Fallback)</div>
            <div style="height:100px; overflow:hidden;">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 100" width="100%" height="100" preserveAspectRatio="none">
                    <path d="M0,50 Q250,0 500,50 T1000,50" stroke="#4285F4" stroke-width="3" fill="none" />
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
        console.log(`Initializing data structure visualizer: ${id}`, config);
        
        // Remove loading spinner from container
        container.innerHTML = '';
        
        // Ensure structureType is passed to the visualizer
        const options = { ...config };
        
        // Default to tree if no type specified
        if (!options.structureType) {
            options.structureType = 'tree';
        }
        
        console.log('Data structure configuration:', options);
        
        // Add progress status directly to container first
        const statusDiv = document.createElement('div');
        statusDiv.className = 'text-center mb-2';
        statusDiv.innerHTML = '<small class="text-muted">Initializing visualizer...</small>';
        container.appendChild(statusDiv);
        
        // Check if initDataStructureVisualizer function is available
        if (typeof initDataStructureVisualizer === 'function') {
            console.log('Using native data structure visualizer');
            // Pass the container directly
            initDataStructureVisualizer(container, options);
            
            // Remove temporary status message
            if (statusDiv && statusDiv.parentNode) {
                statusDiv.parentNode.removeChild(statusDiv);
            }
            
            updateStatusIndicator(container, 'Active', true);
            
            // Update card status badge
            const card = container.closest('.card');
            if (card) {
                const statusBadge = card.querySelector('.viz-status-indicator');
                if (statusBadge) {
                    statusBadge.textContent = 'Active';
                    statusBadge.className = 'viz-status-indicator badge bg-success float-end';
                }
            }
            
            return;
        }
        
        // Try to load the data structure visualizer script
        statusDiv.innerHTML = '<small class="text-muted">Loading data structure visualizer...</small>';
        
        // Try absolute path first, then relative path as fallback
        const scriptPath = '/static/js/visualizers/datastructures/data_structure_visualizer.js';
        const relativePath = '../datastructures/data_structure_visualizer.js';
        
        loadScript(scriptPath)
            .catch(error => {
                console.log(`Failed to load from ${scriptPath}, trying relative path ${relativePath}`);
                return loadScript(relativePath);
            })
            .then(() => {
                if (typeof initDataStructureVisualizer === 'function') {
                    console.log('Data structure visualizer loaded via script');
                    
                    // Remove temporary status
                    if (statusDiv && statusDiv.parentNode) {
                        statusDiv.parentNode.removeChild(statusDiv);
                    }
                    
                    // Check for global flag
                    if (window.DATA_STRUCTURE_VISUALIZER_LOADED) {
                        console.log("Confirmed data structure visualizer is loaded (global flag present)");
                    } else {
                        console.warn("Data structure visualizer function exists but global flag is missing");
                    }
                    
                    // Pass the container directly
                    initDataStructureVisualizer(container, options);
                    updateStatusIndicator(container, 'Active', true);
                    
                    // Update card status badge
                    const card = container.closest('.card');
                    if (card) {
                        const statusBadge = card.querySelector('.viz-status-indicator');
                        if (statusBadge) {
                            statusBadge.textContent = 'Active';
                            statusBadge.className = 'viz-status-indicator badge bg-success float-end';
                        }
                    }
                } else {
                    throw new Error('Data structure visualizer loaded but initialization function not found');
                }
            })
            .catch(error => {
                console.error('Failed to load data structure visualizer:', error);
                // Use fallback as last resort
                FallbackVisualizer.create(container, 'data-structure', options);
                updateStatusIndicator(container, 'Fallback', true);
                
                // Update card status badge
                const card = container.closest('.card');
                if (card) {
                    const statusBadge = card.querySelector('.viz-status-indicator');
                    if (statusBadge) {
                        statusBadge.textContent = 'Fallback';
                        statusBadge.className = 'viz-status-indicator badge bg-warning float-end';
                    }
                }
            });
    } catch (error) {
        console.error('Error initializing data structure visualizer:', error);
        FallbackVisualizer.create(container, 'data-structure', config);
        updateStatusIndicator(container, 'Fallback', true);
        
        // Update card status badge
        const card = container.closest('.card');
        if (card) {
            const statusBadge = card.querySelector('.viz-status-indicator');
            if (statusBadge) {
                statusBadge.textContent = 'Fallback';
                statusBadge.className = 'viz-status-indicator badge bg-warning float-end';
            }
        }
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
            return 'Wave Visualizer';
        case 'dna':
            return 'DNA/RNA Sequence Visualizer';
        case 'datastructure':
            return 'Data Structure Visualizer';
        default:
            return 'Interactive Visualizer';
    }
} 