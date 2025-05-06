/**
 * Simplified Scientific Post Parser
 * 
 * Fast and lightweight version that processes tags and uses 
 * fallback visualizations directly for maximum performance.
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Simplified post parser loaded');
    
    // Process all posts
    setTimeout(processPosts, 800);
    
    // Process content when dynamic content is loaded
    document.addEventListener('content-loaded', processPosts);
    
    // Removed Refresh Viz button as visualizers now work correctly without manual refresh
});

// Process all posts to find tags
function processPosts() {
    console.log('Processing posts to find visualization tags...');
    
    const posts = document.querySelectorAll('.post-content, .topic-content');
    console.log(`Found ${posts.length} post containers to process`);
    
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

// Process content to replace tags
function processContent(content) {
    // Supported tags with their corresponding regex patterns
    const patterns = {
        wave: /\[wave(?:\s+params="([^"]*)")?\](.*?)\[\/wave\]/gs,
        dna: /\[dna(?:\s+sequence="([^"]*)")?(?:\s+markers="([^"]*)")?\](.*?)\[\/dna\]/gs,
        datastructure: /\[datastructure(?:\s+type="([^"]*)")?(?:\s+data="([^"]*)")?\](.*?)\[\/datastructure\]/gs
    };
    
    // Map tag types to visualizer types
    const typeMap = {
        'wave': 'wave-simulator',
        'dna': 'dna-visualizer',
        'datastructure': 'data-structure'
    };
    
    let processed = content;
    let counter = 0;
    let matchCount = 0;
    
    // Process each tag type
    for (const [type, pattern] of Object.entries(patterns)) {
        let matches = [...processed.matchAll(pattern)];
        matchCount += matches.length;
        
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

// Initialize all visualizations in a container
function initializeVisualizers(container) {
    const visualizers = container.querySelectorAll('.visualizer-container');
    console.log(`Found ${visualizers.length} visualizers to initialize in container`);
    
    // Check if resources are already loaded globally or need to be loaded
    let resourcesLoaded = {
        'wave-simulator': typeof initWaveSimulator === 'function',
        'dna-visualizer': typeof initDNAVisualizer === 'function',
        'data-structure': typeof initDataStructureVisualizer === 'function',
        'fallback': typeof FallbackVisualizer !== 'undefined'
    };
    
    console.log('Resource status:', Object.entries(resourcesLoaded)
        .map(([type, loaded]) => `${type}: ${loaded ? 'Loaded' : 'Not loaded'}`)
        .join(', '));
    
    // Load required scripts if not already loaded
    function loadRequiredResources(type) {
        return new Promise((resolve, reject) => {
            // If already loaded, resolve immediately
            if (resourcesLoaded[type]) {
                console.log(`Resources for ${type} already loaded`);
                resolve();
                return;
            }
            
            console.log(`Loading resources for: ${type}`);
            
            // Map of resources to load for each visualizer type
            const resourcePaths = {
                'wave-simulator': [
                    '/static/js/visualizers/waves/wave_simulator.js'
                ],
                'dna-visualizer': [
                    '/static/js/visualizers/dna/dna_visualizer.js'
                ],
                'data-structure': [
                    '/static/js/visualizers/datastructures/data_structure_visualizer.js'
                ],
                'fallback': [
                    '/static/js/visualizers/fallback_visualizer.js'
                ]
            };
            
            const scriptsToLoad = resourcePaths[type] || [];
            
            if (scriptsToLoad.length === 0) {
                reject(new Error(`No resources defined for ${type}`));
                return;
            }
            
            let loadedCount = 0;
            
            scriptsToLoad.forEach(path => {
                loadScript(path, () => {
                    loadedCount++;
                    console.log(`Loaded script ${loadedCount}/${scriptsToLoad.length} for ${type}: ${path}`);
                    if (loadedCount === scriptsToLoad.length) {
                        resourcesLoaded[type] = true;
                        resolve();
                    }
                }, (error) => {
                    console.error(`Failed to load ${path}:`, error);
                    reject(new Error(`Failed to load ${path}`));
                });
            });
        });
    }
    
    // Update status indicator in card header
    function updateStatusIndicator(viz, status, success = true) {
        const card = viz.closest('.card');
        if (card) {
            const indicator = card.querySelector('.viz-status-indicator');
            if (indicator) {
                indicator.textContent = status;
                indicator.className = `viz-status-indicator badge float-end ${success ? 'bg-success' : 'bg-danger'}`;
            }
        }
    }
    
    // Initialize each visualizer
    visualizers.forEach(viz => {
        const id = viz.id;
        const type = viz.getAttribute('data-visualizer-type');
        const configStr = viz.getAttribute('data-visualizer-config') || '{}';
        
        console.log(`Initializing visualizer: ${id} of type ${type}`);
        
        try {
            const config = JSON.parse(configStr);
            
            // Function to initialize the main visualizer
            const initMainVisualizer = () => {
                try {
                    switch (type) {
                        case 'wave-simulator':
                            initWaveSimulator(id);
                            updateStatusIndicator(viz, 'Main Visualizer');
                            break;
                        case 'dna-visualizer':
                            initDNAVisualizer(id, config);
                            updateStatusIndicator(viz, 'Main Visualizer');
                            break;
                        case 'data-structure':
                            initDataStructureVisualizer(id, config);
                            updateStatusIndicator(viz, 'Main Visualizer');
                            break;
                        default:
                            throw new Error(`Unknown visualizer type: ${type}`);
                    }
                } catch (error) {
                    console.error(`Error initializing main visualizer for ${type}:`, error);
                    initFallbackVisualizer(viz, type, config);
                }
            };
            
            // Function to initialize fallback visualizer
            const initFallbackVisualizer = (viz, type, config) => {
                loadRequiredResources('fallback')
                    .then(() => {
                        if (typeof FallbackVisualizer !== 'undefined') {
                            FallbackVisualizer.create(viz, type, config);
                            updateStatusIndicator(viz, 'Fallback Visualizer', false);
                        } else {
                            throw new Error('Fallback visualizer not available');
                        }
                    })
                    .catch(error => {
                        console.error('Error loading fallback visualizer:', error);
                        viz.innerHTML = `<div class="alert alert-danger">
                            <p>Error initializing visualization: ${error.message}</p>
                        </div>`;
                        updateStatusIndicator(viz, 'Error', false);
                    });
            };
            
            // First try to load and use the main visualizer
            loadRequiredResources(type)
                .then(() => {
                    initMainVisualizer();
                })
                .catch(error => {
                    console.error(`Error loading ${type} resources:`, error);
                    initFallbackVisualizer(viz, type, config);
                });
            
        } catch (error) {
            console.error(`Error initializing ${type}:`, error);
            viz.innerHTML = `<div class="alert alert-danger">
                <p>Error initializing visualization: ${error.message}</p>
            </div>`;
            updateStatusIndicator(viz, 'Error', false);
        }
    });
}

// Load a script dynamically
function loadScript(src, onSuccess, onError) {
    // Check if script is already loaded
    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript) {
        // Script already exists, consider it loaded
        console.log(`Script already in DOM: ${src}`);
        if (onSuccess) onSuccess();
        return;
    }
    
    console.log(`Loading script: ${src}`);
    const script = document.createElement('script');
    script.src = src;
    
    script.onload = () => {
        console.log(`Script loaded successfully: ${src}`);
        if (onSuccess) onSuccess();
    };
    
    script.onerror = (e) => {
        console.error(`Error loading script ${src}:`, e);
        if (onError) onError(e);
    };
    
    document.head.appendChild(script);
}

// Get visualizer title
function getVisualizerTitle(type) {
    switch (type) {
        case 'wave':
            return 'Wave Simulator';
        case 'dna':
            return 'DNA/RNA Sequence Visualizer';
        case 'datastructure':
            return 'Data Structure Visualizer';
        default:
            return 'Interactive Visualizer';
    }
} 