/**
 * Advanced Data Structure Visualizer
 * 
 * Supports both 2D (Canvas API) and 3D (Three.js) visualizations
 * with modern, interactive features and smooth animations
 */

// Add global debugging flag for this module
window.DATA_STRUCTURE_VISUALIZER_LOADED = true;
console.log("========== Data Structure Visualizer Script Loaded ==========");

class DataStructureVisualizer {
    constructor(container, options = {}) {
        // Accept either a string ID or a DOM element
        if (typeof container === 'string') {
            this.container = document.getElementById(container);
            if (!this.container) {
                console.error(`Container with ID '${container}' not found.`);
                return;
            }
        } else if (container instanceof HTMLElement) {
            this.container = container;
        } else {
            console.error('Container must be a string ID or a DOM element');
            return;
        }

        console.log("DataStructureVisualizer initialized with options:", options);

        // Process options
        // Map structureType to type if needed (for compatibility with tag attributes)
        if (options.structureType && !options.type) {
            options.type = options.structureType;
            console.log(`Mapped structureType '${options.structureType}' to type`);
        }

        // Default options with 3D support
        this.options = Object.assign({
            type: 'tree',
            mode: '3d', // Default to 3D for better visualization
            data: null,
            theme: 'default',
            animation: true,
            interactive: true
        }, options);

        console.log("Final options:", this.options);

        // Store the original container content to restore if needed
        this.originalContent = this.container.innerHTML;
        
        // Find and store the status indicator from parent card if it exists
        const parentCard = this.container.closest('.card');
        if (parentCard) {
            this.cardStatusIndicator = parentCard.querySelector('.viz-status-indicator');
            if (this.cardStatusIndicator) {
                console.log("Found card status indicator:", this.cardStatusIndicator);
            }
        }

        // Add status indicator
        this.statusIndicator = document.createElement('div');
        this.statusIndicator.className = 'data-structure-visualizer-status';
        this.statusIndicator.style.fontSize = '12px';
        this.statusIndicator.style.color = '#666';
        this.statusIndicator.style.marginTop = '4px';
        this.statusIndicator.style.marginBottom = '4px';
        this.statusIndicator.style.textAlign = 'center';
        this.container.appendChild(this.statusIndicator);
        this.updateStatus('Initializing data structure visualizer...');

        // Create mode toggle switch
        this.createModeToggle();

        // Initialize based on mode
        if (this.options.mode === '3d') {
            console.log("Initializing in 3D mode");
            this.init3D();
        } else {
            console.log("Initializing in 2D mode");
            this.init2D();
        }
    }

    // Create a toggle switch for 2D/3D mode
    createModeToggle() {
        const toggleContainer = document.createElement('div');
        toggleContainer.className = 'mode-toggle-container';
        toggleContainer.style.position = 'absolute';
        toggleContainer.style.top = '5px';
        toggleContainer.style.right = '5px';
        toggleContainer.style.zIndex = '10';
        
        const toggle = document.createElement('div');
        toggle.className = 'mode-toggle';
        toggle.style.display = 'flex';
        toggle.style.alignItems = 'center';
        toggle.style.gap = '5px';
        toggle.style.fontSize = '12px';
        toggle.style.userSelect = 'none';
        toggle.style.cursor = 'pointer';
        toggle.style.backgroundColor = 'rgba(0,0,0,0.05)';
        toggle.style.padding = '3px 8px';
        toggle.style.borderRadius = '12px';
        
        const text = document.createElement('span');
        text.textContent = this.options.mode === '3d' ? '3D' : '2D';
        
        const icon = document.createElement('span');
        icon.innerHTML = this.options.mode === '3d' ? '🌐' : '📊';
        
        toggle.appendChild(icon);
        toggle.appendChild(text);
        toggleContainer.appendChild(toggle);
        
        // Add event listener to toggle between 2D and 3D
        toggle.addEventListener('click', () => {
            this.options.mode = this.options.mode === '3d' ? '2d' : '3d';
            text.textContent = this.options.mode === '3d' ? '3D' : '2D';
            icon.innerHTML = this.options.mode === '3d' ? '🌐' : '📊';
            
            // Reinitialize visualizer with new mode
            if (this.options.mode === '3d') {
                this.init3D();
            } else {
                this.init2D();
            }
        });
        
        this.container.appendChild(toggleContainer);
        this.modeToggle = toggleContainer;
    }

    updateStatus(message, isError = false) {
        if (this.statusIndicator) {
            this.statusIndicator.textContent = message;
            this.statusIndicator.style.color = isError ? '#dc3545' : '#666';
        }
        
        // Also update the card status indicator if it exists
        if (this.cardStatusIndicator) {
            if (isError) {
                this.cardStatusIndicator.textContent = 'Error';
                this.cardStatusIndicator.className = 'viz-status-indicator badge bg-danger float-end';
            } else if (message === 'Initializing data structure visualizer...') {
                this.cardStatusIndicator.textContent = 'Loading...';
                this.cardStatusIndicator.className = 'viz-status-indicator badge bg-secondary float-end';
            } else {
                this.cardStatusIndicator.textContent = 'Active';
                this.cardStatusIndicator.className = 'viz-status-indicator badge bg-success float-end';
            }
        }
    }

    showError(error) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger mt-3';
        errorDiv.innerHTML = `
            <h5>Visualization Error</h5>
            <p>${error.message || 'Unknown error occurred while initializing the visualizer'}</p>
            <p>Check browser console for more details.</p>
        `;
        this.container.appendChild(errorDiv);
        
        // Update status indicators
        this.updateStatus('Error initializing visualizer', true);
    }
    
    createStructureControls() {
        // Create controls container
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'structure-controls';
        controlsDiv.style.marginBottom = '10px';
        controlsDiv.style.padding = '10px';
        controlsDiv.style.backgroundColor = '#f8f9fa';
        controlsDiv.style.borderRadius = '4px';
        controlsDiv.style.display = 'flex';
        controlsDiv.style.flexWrap = 'wrap';
        controlsDiv.style.gap = '10px';
        controlsDiv.style.alignItems = 'center';
        controlsDiv.style.zIndex = '5';
        
        // Type selection control
        const typeDiv = document.createElement('div');
        typeDiv.style.display = 'flex';
        typeDiv.style.alignItems = 'center';
        typeDiv.innerHTML = `<label style="margin-right: 5px;">Structure type: </label>`;
        const typeSelect = document.createElement('select');
        typeSelect.className = 'form-select form-select-sm structure-type-select';
        typeSelect.style.display = 'inline-block';
        typeSelect.style.width = 'auto';
        
        ['tree', 'graph', 'linkedList', 'array'].forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.text = type.charAt(0).toUpperCase() + type.slice(1);
            if (type === this.options.type) {
                option.selected = true;
            }
            typeSelect.appendChild(option);
        });
        
        typeSelect.addEventListener('change', (e) => {
            this.options.type = e.target.value;
            this.updateStatus(`Switching to ${this.options.type} visualization...`);
            
            if (this.options.mode === '3d') {
                this.create3DStructure();
                this.updateStatus(`3D ${this.options.type} visualization active`);
            } else {
                this.draw();
                this.updateStatus(`${this.options.type} visualization active`);
            }
        });
        
        typeDiv.appendChild(typeSelect);
        controlsDiv.appendChild(typeDiv);
        
        // Color theme selector
        const themeDiv = document.createElement('div');
        themeDiv.style.display = 'flex';
        themeDiv.style.alignItems = 'center';
        themeDiv.innerHTML = `<label style="margin-right: 5px;">Color theme: </label>`;
        const themeSelect = document.createElement('select');
        themeSelect.className = 'form-select form-select-sm color-theme-select';
        themeSelect.style.display = 'inline-block';
        themeSelect.style.width = 'auto';
        
        const themes = [
            { value: 'default', text: 'Default' },
            { value: 'dark', text: 'Dark' },
            { value: 'pastel', text: 'Pastel' }
        ];
        
        themes.forEach(theme => {
            const option = document.createElement('option');
            option.value = theme.value;
            option.text = theme.text;
            if (theme.value === (this.colorTheme || 'default')) {
                option.selected = true;
            }
            themeSelect.appendChild(option);
        });
        
        themeSelect.addEventListener('change', (e) => {
            this.colorTheme = e.target.value;
            if (this.options.mode === '3d') {
                this.create3DStructure();
            } else {
                this.draw();
            }
        });
        
        themeDiv.appendChild(themeSelect);
        controlsDiv.appendChild(themeDiv);
        
        // Store the controls div for later use
        this.structureControls = controlsDiv;
        
        return controlsDiv;
    }
    
    saveAsPNG() {
        const dataURL = this.canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataURL;
        a.download = `${this.options.type}_visualization.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
    
    draw() {
        const { ctx, width, height } = this;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Set colors based on theme
        this.setColorTheme();
        
        // Draw based on structure type
        switch (this.options.type) {
            case 'tree':
                this.drawTree();
                break;
            case 'graph':
                this.drawGraph();
                break;
            case 'linkedList':
                this.drawLinkedList();
                break;
            case 'array':
                this.drawArray();
                break;
            default:
                console.log(`Unknown type '${this.options.type}', defaulting to tree`);
                this.drawTree();
        }
    }
    
    setColorTheme() {
        // Define color themes
        const themes = {
            default: {
                background: '#ffffff',
                node: '#1a75ff',
                nodeText: '#ffffff',
                edge: '#333333',
                arrayCell: '#f8f9fa',
                arrayText: '#333333'
            },
            dark: {
                background: '#343a40',
                node: '#61dafb',
                nodeText: '#ffffff',
                edge: '#6c757d',
                arrayCell: '#495057',
                arrayText: '#f8f9fa'
            },
            pastel: {
                background: '#f8f9fa',
                node: '#7eb0d5',
                nodeText: '#333333',
                edge: '#8fd9a8',
                arrayCell: '#d0e1e2',
                arrayText: '#333333'
            }
        };
        
        // Set the active theme
        this.colors = themes[this.colorTheme || 'default'];
        
        // Fill background
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
    
    drawTree() {
        console.log("Drawing tree visualization");
        const { ctx, width, height } = this;
        const nodeRadius = 20;
        const levelHeight = 70;
        const centerX = width / 2;
        
        // Use custom data if provided or default example
        let treeData = null;
        
        // Check if data is provided in the options
        if (this.options.data) {
            console.log("Using provided tree data:", this.options.data);
            treeData = this.options.data;
        } else {
            // Use example data from the bottom of the file
            console.log("Using default tree example data");
            treeData = EXAMPLE_DATA.tree;
        }
        
        // Draw root
        this.drawNode(centerX, 50, '10');
        
        // Draw level 1
        this.drawNode(centerX - width/4, 50 + levelHeight, '5');
        this.drawNode(centerX + width/4, 50 + levelHeight, '15');
        
        // Connect root to children
        this.drawEdge(centerX, 50 + nodeRadius, centerX - width/4, 50 + levelHeight - nodeRadius);
        this.drawEdge(centerX, 50 + nodeRadius, centerX + width/4, 50 + levelHeight - nodeRadius);
        
        // Draw level 2
        this.drawNode(centerX - width/4 - width/8, 50 + 2 * levelHeight, '3');
        this.drawNode(centerX - width/4 + width/8, 50 + 2 * levelHeight, '7');
        this.drawNode(centerX + width/4 - width/8, 50 + 2 * levelHeight, '12');
        this.drawNode(centerX + width/4 + width/8, 50 + 2 * levelHeight, '20');
        
        // Connect level 1 to level 2
        this.drawEdge(centerX - width/4, 50 + levelHeight + nodeRadius, centerX - width/4 - width/8, 50 + 2 * levelHeight - nodeRadius);
        this.drawEdge(centerX - width/4, 50 + levelHeight + nodeRadius, centerX - width/4 + width/8, 50 + 2 * levelHeight - nodeRadius);
        this.drawEdge(centerX + width/4, 50 + levelHeight + nodeRadius, centerX + width/4 - width/8, 50 + 2 * levelHeight - nodeRadius);
        this.drawEdge(centerX + width/4, 50 + levelHeight + nodeRadius, centerX + width/4 + width/8, 50 + 2 * levelHeight - nodeRadius);
    }
    
    drawGraph() {
        const { ctx, width, height } = this;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = 100;
        
        const nodes = [
            { x: centerX, y: centerY - radius },
            { x: centerX + radius * Math.cos(Math.PI * 0.8), y: centerY - radius * Math.sin(Math.PI * 0.8) },
            { x: centerX + radius * Math.cos(Math.PI * 0.4), y: centerY - radius * Math.sin(Math.PI * 0.4) },
            { x: centerX + radius * Math.cos(Math.PI * 0.2), y: centerY - radius * Math.sin(Math.PI * 0.2) },
            { x: centerX + radius * Math.cos(-Math.PI * 0.2), y: centerY - radius * Math.sin(-Math.PI * 0.2) },
            { x: centerX + radius * Math.cos(-Math.PI * 0.6), y: centerY - radius * Math.sin(-Math.PI * 0.6) }
        ];
        
        // Draw edges
        this.drawEdge(nodes[0].x, nodes[0].y, nodes[1].x, nodes[1].y);
        this.drawEdge(nodes[0].x, nodes[0].y, nodes[2].x, nodes[2].y);
        this.drawEdge(nodes[1].x, nodes[1].y, nodes[2].x, nodes[2].y);
        this.drawEdge(nodes[2].x, nodes[2].y, nodes[3].x, nodes[3].y);
        this.drawEdge(nodes[3].x, nodes[3].y, nodes[4].x, nodes[4].y);
        this.drawEdge(nodes[2].x, nodes[2].y, nodes[5].x, nodes[5].y);
        this.drawEdge(nodes[4].x, nodes[4].y, nodes[5].x, nodes[5].y);
        
        // Draw nodes
        nodes.forEach((node, i) => {
            this.drawNode(node.x, node.y, String.fromCharCode(65 + i)); // 'A', 'B', 'C', etc.
        });
    }
    
    drawLinkedList() {
        const { ctx, width, height } = this;
        const nodeWidth = 60;
        const nodeHeight = 40;
        const nodeGap = 20;
        const totalNodeWidth = nodeWidth + nodeGap;
        const startX = 50;
        const centerY = height / 2;
        
        for (let i = 0; i < 6; i++) {
            const nodeX = startX + i * totalNodeWidth;
            
            // Draw node
            ctx.beginPath();
            ctx.rect(nodeX, centerY - nodeHeight/2, nodeWidth, nodeHeight);
            ctx.fillStyle = this.colors.node;
            ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,0.2)';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw value
            ctx.font = 'bold 18px Arial';
            ctx.fillStyle = this.colors.nodeText;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(i + 1, nodeX + nodeWidth/2, centerY);
            
            // Draw arrow
            if (i < 5) {
                const arrowStartX = nodeX + nodeWidth;
                const arrowEndX = nodeX + totalNodeWidth;
                
                ctx.beginPath();
                ctx.moveTo(arrowStartX, centerY);
                ctx.lineTo(arrowEndX, centerY);
                ctx.strokeStyle = this.colors.edge;
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // Arrow head
                ctx.beginPath();
                ctx.moveTo(arrowEndX, centerY);
                ctx.lineTo(arrowEndX - 10, centerY - 5);
                ctx.lineTo(arrowEndX - 10, centerY + 5);
                ctx.closePath();
                ctx.fillStyle = this.colors.edge;
                ctx.fill();
            }
        }
    }
    
    drawArray() {
        const { ctx, width, height } = this;
        const cellWidth = 60;
        const cellHeight = 40;
        const startX = 50;
        const centerY = height / 2;
        
        for (let i = 0; i < 7; i++) {
            const cellX = startX + i * cellWidth;
            
            // Draw cell
            ctx.beginPath();
            ctx.rect(cellX, centerY - cellHeight/2, cellWidth, cellHeight);
            ctx.fillStyle = this.colors.arrayCell;
            ctx.fill();
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw value
            ctx.font = 'bold 18px Arial';
            ctx.fillStyle = this.colors.arrayText;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(Math.floor(Math.random() * 100), cellX + cellWidth/2, centerY);
            
            // Draw index below
            ctx.font = '14px Arial';
            ctx.fillStyle = '#666';
            ctx.fillText(`[${i}]`, cellX + cellWidth/2, centerY + cellHeight/2 + 20);
        }
    }
    
    drawNode(x, y, label) {
        const { ctx } = this;
        const radius = 20;
        
        // Draw circle
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = this.colors.node;
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw label
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = this.colors.nodeText;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x, y);
    }
    
    drawEdge(x1, y1, x2, y2) {
        const { ctx } = this;
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = this.colors.edge;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    onWindowResize() {
        const newWidth = this.container.clientWidth;
        if (newWidth !== this.width) {
            this.width = newWidth;
            this.canvas.width = newWidth;
            this.draw();
        }
    }

    // Renames the original init to init2D
    init2D() {
        console.log("Initializing 2D data structure visualizer");
        
        try {
            // Clear container except status indicator
            const currentStatus = this.statusIndicator;
            const currentModeToggle = this.modeToggle;
            this.container.innerHTML = '';
            
            // Add status indicator back
            if (currentStatus) {
                this.container.appendChild(currentStatus);
            }
            
            // Add mode toggle back
            if (currentModeToggle) {
                this.container.appendChild(currentModeToggle);
            } else {
                this.createModeToggle();
            }
            
            // Set up container dimensions
            this.width = this.container.clientWidth || 500; // Fallback width if clientWidth is 0
            this.height = 300;
            
            console.log(`Container dimensions: ${this.width}x${this.height}`);
            
            // Create structure controls
            const controls = this.createStructureControls();
            this.container.appendChild(controls);
            
            // Create canvas
            this.canvas = document.createElement('canvas');
            if (!this.canvas) {
                throw new Error("Failed to create canvas element");
            }
            
            this.canvas.width = this.width;
            this.canvas.height = this.height;
            this.canvas.style.display = 'block';
            this.canvas.style.margin = '0 auto';
            this.container.appendChild(this.canvas);
            
            // Get drawing context
            this.ctx = this.canvas.getContext('2d');
            if (!this.ctx) {
                throw new Error("Failed to get 2D context from canvas");
            }
            
            // Set default color theme
            this.colorTheme = this.options.theme || 'default';
            
            // Draw the structure
            this.draw();
            
            // Update status to show visualization is active
            this.updateStatus(`${this.options.type} visualization active`);
            
            // Handle window resize
            window.addEventListener('resize', () => this.onWindowResize());
            
            console.log("2D visualization successfully initialized");
            return true;
        } catch (error) {
            console.error("Error initializing data structure visualizer:", error);
            this.updateStatus('Error initializing visualizer', true);
            this.showError(error);
            
            // Restore original content in case of error
            if (this.originalContent) {
                this.container.innerHTML = this.originalContent;
            }
            return false;
        }
    }
    
    // Initialize 3D visualization
    init3D() {
        console.log("Initializing 3D data structure visualizer");
        
        try {
            // Clear container except status indicator
            const currentStatus = this.statusIndicator;
            const currentModeToggle = this.modeToggle;
            this.container.innerHTML = '';
            
            // Add status indicator back
            if (currentStatus) {
                this.container.appendChild(currentStatus);
            }
            
            // Add the mode toggle back
            if (currentModeToggle) {
                this.container.appendChild(currentModeToggle);
            } else {
                this.createModeToggle();
            }
            
            // Create structure controls
            const controls = this.createStructureControls();
            this.container.appendChild(controls);
            
            // Update status
            this.updateStatus('Loading 3D visualization...');
            
            // Load Three.js library
            this.load3DLibrary()
                .then(() => {
                    console.log("Three.js loaded successfully, creating 3D visualization");
                    this.create3DVisualization();
                })
                .catch(error => {
                    console.error("Failed to load Three.js:", error);
                    this.updateStatus("Falling back to 2D visualization", true);
                    // Fall back to 2D
                    this.options.mode = '2d';
                    this.init2D();
                });
        } catch (error) {
            console.error("Error in 3D initialization:", error);
            this.updateStatus("Error initializing 3D, falling back to 2D", true);
            // Fall back to 2D on error
            this.options.mode = '2d';
            this.init2D();
        }
    }
    
    // Helper to load Three.js library
    load3DLibrary() {
        return new Promise((resolve, reject) => {
            if (typeof THREE !== 'undefined') {
                console.log("Three.js already loaded");
                resolve();
                return;
            }

            console.log('Loading Three.js for 3D visualization...');
            // First try to add the script
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.min.js';
            script.onload = () => {
                console.log('Three.js loaded successfully');
                // Add OrbitControls for better interaction
                const orbitScript = document.createElement('script');
                orbitScript.src = 'https://cdn.jsdelivr.net/npm/three@0.132.2/examples/js/controls/OrbitControls.js';
                orbitScript.onload = () => {
                    console.log('OrbitControls loaded successfully');
                    resolve();
                };
                orbitScript.onerror = () => {
                    console.warn('Failed to load OrbitControls, continuing with basic Three.js');
                    resolve(); // Still resolve since Three.js is loaded
                };
                document.head.appendChild(orbitScript);
            };
            script.onerror = (e) => {
                console.error('Failed to load Three.js:', e);
                reject(new Error('Failed to load Three.js'));
            };
            document.head.appendChild(script);
        });
    }

    // Create 3D visualization using Three.js
    create3DVisualization() {
        // Clear container except status indicator, mode toggle and structure controls
        const currentStatus = this.statusIndicator;
        const modeToggle = this.modeToggle;
        const structureControls = this.structureControls;
        
        // Keep only these elements
        const elementsToKeep = [currentStatus, modeToggle, structureControls].filter(Boolean);
        const tempContainer = document.createElement('div');
        elementsToKeep.forEach(el => {
            if (el && el.parentNode === this.container) {
                tempContainer.appendChild(el);
            }
        });
        
        // Clear container and add back the elements
        this.container.innerHTML = '';
        while (tempContainer.firstChild) {
            this.container.appendChild(tempContainer.firstChild);
        }
        
        // Set up container dimensions
        this.width = this.container.clientWidth || 500; // Fallback width
        this.height = 350; // Taller for 3D
        
        console.log(`Container dimensions for 3D: ${this.width}x${this.height}`);
        
        try {
            // Create scene
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0xf8f9fa);
            
            // Create camera
            this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 0.1, 1000);
            this.camera.position.set(0, 120, 200);
            this.camera.lookAt(0, 0, 0);
            
            // Create renderer
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            this.renderer.setSize(this.width, this.height);
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.container.appendChild(this.renderer.domElement);
            
            // Add lighting
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            this.scene.add(ambientLight);
            
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(50, 100, 50);
            this.scene.add(directionalLight);
            
            // Add OrbitControls if available
            if (typeof THREE.OrbitControls !== 'undefined') {
                this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
                this.controls.enableDamping = true;
                this.controls.dampingFactor = 0.25;
                this.controls.screenSpacePanning = false;
                this.controls.maxPolarAngle = Math.PI / 2;
            }
            
            // Create structure based on type
            this.create3DStructure();
            
            // Start animation loop
            this.startAnimation();
            
            // Add a status indicator to show which visualization is active
            const statusDiv = document.createElement('div');
            statusDiv.style.position = 'absolute';
            statusDiv.style.top = '45px';
            statusDiv.style.right = '5px';
            statusDiv.style.padding = '3px 8px';
            statusDiv.style.backgroundColor = 'rgba(0,0,0,0.05)';
            statusDiv.style.borderRadius = '4px';
            statusDiv.style.fontSize = '12px';
            statusDiv.style.color = '#333';
            statusDiv.style.zIndex = '10';
            statusDiv.textContent = `3D ${this.options.type} visualization active`;
            this.container.appendChild(statusDiv);
            
            // Update status to show visualization is active
            this.updateStatus(`3D ${this.options.type} visualization active`);
            
            // Handle window resize
            window.addEventListener('resize', () => this.onWindowResize3D());
            
            console.log("3D visualization successfully initialized");
            return true;
        } catch (error) {
            console.error("Error initializing 3D visualization:", error);
            this.updateStatus('Error initializing 3D visualizer, falling back to 2D', true);
            // Fall back to 2D
            this.options.mode = '2d';
            this.init2D();
            return false;
        }
    }

    // Animation loop for 3D visualization
    startAnimation() {
        if (!this.renderer || !this.scene || !this.camera) {
            console.error("Cannot start animation: renderer, scene or camera missing");
            return;
        }
        
        const animate = () => {
            if (!this.container.isConnected) {
                // Container removed from DOM, stop animation
                console.log("Container removed from DOM, stopping animation");
                return;
            }
            
            // Request next frame
            requestAnimationFrame(animate);
            
            // Update controls if available
            if (this.controls) {
                this.controls.update();
            }
            
            // Render scene
            this.renderer.render(this.scene, this.camera);
        };
        
        // Start animation loop
        animate();
    }

    // Create 3D structure based on selected type
    create3DStructure() {
        if (!this.scene) {
            console.error("Cannot create 3D structure: scene is not initialized");
            return;
        }
        
        // Create a new group for the structure
        this.structureGroup = new THREE.Group();
        this.scene.add(this.structureGroup);
        
        // Choose the appropriate structure type
        switch (this.options.type) {
            case 'tree':
                this.create3DTree();
                break;
            case 'graph':
                this.create3DGraph();
                break;
            case 'linkedList':
                this.create3DLinkedList();
                break;
            case 'array':
                this.create3DArray();
                break;
            default:
                console.log(`Unknown type '${this.options.type}', defaulting to tree`);
                this.create3DTree();
        }
    }

    // Creates a 3D tree visualization
    create3DTree() {
        console.log("Creating 3D tree visualization");
        // Get theme colors
        const colors = this.get3DThemeColors();
        const nodeRadius = 15;
        
        // Create node spheres
        const sphereGeometry = new THREE.SphereGeometry(nodeRadius, 32, 32);
        const nodeMaterial = new THREE.MeshPhongMaterial({
            color: colors.node,
            shininess: 50
        });
        
        // Helper to create a text sprite
        const createTextSprite = (text) => {
            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.font = 'Bold 32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, 32, 32);
            
            const texture = new THREE.CanvasTexture(canvas);
            const material = new THREE.SpriteMaterial({ map: texture });
            const sprite = new THREE.Sprite(material);
            sprite.scale.set(30, 30, 1);
            return sprite;
        };
        
        // Helper to create node
        const createNode = (x, y, z, value) => {
            const sphere = new THREE.Mesh(sphereGeometry, nodeMaterial);
            sphere.position.set(x, y, z);
            this.structureGroup.add(sphere);
            
            const label = createTextSprite(value);
            label.position.set(x, y, z);
            this.structureGroup.add(label);
            
            return sphere;
        };
        
        // Helper to create edge
        const createEdge = (startNode, endNode) => {
            const start = startNode.position;
            const end = endNode.position;
            
            const direction = new THREE.Vector3().subVectors(end, start);
            const length = direction.length();
            
            const edgeGeometry = new THREE.CylinderGeometry(2, 2, length, 8);
            const edgeMaterial = new THREE.MeshBasicMaterial({ color: colors.edge });
            const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
            
            // Position at midpoint
            edge.position.copy(start);
            edge.position.lerp(end, 0.5);
            
            // Orient cylinder along direction
            const axis = new THREE.Vector3(0, 1, 0);
            edge.quaternion.setFromUnitVectors(axis, direction.clone().normalize());
            edge.rotateX(Math.PI / 2);
            
            this.structureGroup.add(edge);
        };
        
        // Create tree nodes
        const root = createNode(0, 100, 0, '10');
        
        // Level 1 nodes
        const node1 = createNode(-60, 50, 0, '5');
        const node2 = createNode(60, 50, 0, '15');
        
        // Level 2 nodes
        const node3 = createNode(-90, 0, 0, '3');
        const node4 = createNode(-30, 0, 0, '7');
        const node5 = createNode(30, 0, 0, '12');
        const node6 = createNode(90, 0, 0, '20');
        
        // Connect nodes
        createEdge(root, node1);
        createEdge(root, node2);
        createEdge(node1, node3);
        createEdge(node1, node4);
        createEdge(node2, node5);
        createEdge(node2, node6);
        
        // Center the structure in the scene
        this.structureGroup.position.set(0, 0, 0);
    }

    // Creates a 3D linked list visualization
    create3DLinkedList() {
        console.log("Creating 3D linked list visualization");
        const colors = this.get3DThemeColors();
        
        // Node dimensions
        const nodeWidth = 30;
        const nodeHeight = 20;
        const nodeDepth = 10;
        const spacing = 50;
        
        // Set up materials
        const nodeMaterial = new THREE.MeshPhongMaterial({
            color: colors.node,
            shininess: 60
        });
        
        const arrowMaterial = new THREE.MeshBasicMaterial({
            color: colors.edge
        });
        
        // Helper to create a text sprite
        const createTextSprite = (text) => {
            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.font = 'Bold 32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, 32, 32);
            
            const texture = new THREE.CanvasTexture(canvas);
            const material = new THREE.SpriteMaterial({ map: texture });
            const sprite = new THREE.Sprite(material);
            sprite.scale.set(25, 25, 1);
            return sprite;
        };
        
        // Create nodes
        const nodes = [];
        const startX = -150;
        
        for (let i = 0; i < 6; i++) {
            const x = startX + i * spacing;
            
            // Create node box
            const nodeGeometry = new THREE.BoxGeometry(nodeWidth, nodeHeight, nodeDepth);
            const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
            node.position.set(x, 0, 0);
            this.structureGroup.add(node);
            nodes.push(node);
            
            // Add label
            const label = createTextSprite(String(i + 1));
            label.position.set(x, 0, nodeDepth/2 + 5);
            this.structureGroup.add(label);
            
            // Create arrow to next node (except for last node)
            if (i < 5) {
                // Arrow body
                const arrowLen = spacing - nodeWidth - 10;
                const arrowGeometry = new THREE.CylinderGeometry(2, 2, arrowLen, 8);
                const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
                arrow.position.set(x + nodeWidth/2 + arrowLen/2, 0, 0);
                arrow.rotation.z = Math.PI / 2;
                this.structureGroup.add(arrow);
                
                // Arrow head
                const headGeometry = new THREE.ConeGeometry(5, 10, 8);
                const arrowHead = new THREE.Mesh(headGeometry, arrowMaterial);
                arrowHead.position.set(x + nodeWidth/2 + arrowLen - 2, 0, 0);
                arrowHead.rotation.z = -Math.PI / 2;
                this.structureGroup.add(arrowHead);
            }
        }
    }

    // Creates a 3D graph visualization
    create3DGraph() {
        console.log("Creating 3D graph visualization");
        const colors = this.get3DThemeColors();
        const nodeRadius = 15;
        
        // Create materials
        const nodeMaterial = new THREE.MeshPhongMaterial({
            color: colors.node,
            shininess: 50
        });
        
        const edgeMaterial = new THREE.MeshBasicMaterial({
            color: colors.edge
        });
        
        // Helper to create text sprite
        const createTextSprite = (text) => {
            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.font = 'Bold 32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, 32, 32);
            
            const texture = new THREE.CanvasTexture(canvas);
            const material = new THREE.SpriteMaterial({ map: texture });
            const sprite = new THREE.Sprite(material);
            sprite.scale.set(25, 25, 1);
            return sprite;
        };
        
        // Create node
        const createNode = (x, y, z, label) => {
            const geometry = new THREE.SphereGeometry(nodeRadius, 32, 32);
            const sphere = new THREE.Mesh(geometry, nodeMaterial);
            sphere.position.set(x, y, z);
            this.structureGroup.add(sphere);
            
            const sprite = createTextSprite(label);
            sprite.position.set(x, y, z);
            this.structureGroup.add(sprite);
            
            return sphere;
        };
        
        // Create edge between nodes
        const createEdge = (start, end) => {
            const startPosition = start.position;
            const endPosition = end.position;
            
            // Direction vector
            const direction = new THREE.Vector3().subVectors(endPosition, startPosition);
            const length = direction.length() - nodeRadius * 2;
            
            // Create cylinder for edge
            const edgeGeometry = new THREE.CylinderGeometry(2, 2, length, 8);
            const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
            
            // Position edge - use midpoint
            const midpoint = new THREE.Vector3().addVectors(startPosition, endPosition).multiplyScalar(0.5);
            edge.position.copy(midpoint);
            
            // Orient along direction
            const dirNorm = direction.clone().normalize();
            const quaternion = new THREE.Quaternion().setFromUnitVectors(
                new THREE.Vector3(0, 1, 0), dirNorm
            );
            edge.setRotationFromQuaternion(quaternion);
            
            this.structureGroup.add(edge);
        };
        
        // Create nodes in a more interesting pattern
        const nodes = [];
        const radius = 80;
        
        // Create nodes in a circular pattern plus one in center
        // Center node
        const centerNode = createNode(0, 0, 0, 'A');
        nodes.push(centerNode);
        
        // Create nodes in a circle
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const y = (i % 2 === 0) ? 20 : -20; // Alternate height
            
            const node = createNode(x, y, z, String.fromCharCode(66 + i)); // 'B', 'C', etc.
            nodes.push(node);
        }
        
        // Create edges to form a connected graph
        // Connect center to all others
        for (let i = 1; i < nodes.length; i++) {
            createEdge(nodes[0], nodes[i]);
        }
        
        // Connect nodes in a ring
        for (let i = 1; i < nodes.length; i++) {
            createEdge(nodes[i], nodes[i === nodes.length - 1 ? 1 : i + 1]);
        }
    }
    
    // Creates a 3D array visualization
    create3DArray() {
        console.log("Creating 3D array visualization");
        const colors = this.get3DThemeColors();
        
        // Array dimensions
        const cellWidth = 40;
        const cellHeight = 30;
        const cellDepth = 20;
        const spacing = 5;
        const totalWidth = cellWidth + spacing;
        
        // Cell materials
        const cellMaterial = new THREE.MeshPhongMaterial({
            color: colors.node,
            shininess: 30,
            transparent: true,
            opacity: 0.9
        });
        
        // Helper to create text sprite
        const createTextSprite = (text) => {
            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.font = 'Bold 32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, 32, 32);
            
            const texture = new THREE.CanvasTexture(canvas);
            const material = new THREE.SpriteMaterial({ map: texture });
            const sprite = new THREE.Sprite(material);
            sprite.scale.set(25, 25, 1);
            return sprite;
        };
        
        // Create array cells
        const cellGeometry = new THREE.BoxGeometry(cellWidth, cellHeight, cellDepth);
        const arraySize = 7;
        const startX = -(arraySize * totalWidth) / 2 + totalWidth/2;
        
        for (let i = 0; i < arraySize; i++) {
            // Create cell cube
            const cell = new THREE.Mesh(cellGeometry, cellMaterial);
            const x = startX + i * totalWidth;
            cell.position.set(x, 0, 0);
            this.structureGroup.add(cell);
            
            // Add value text
            const value = Math.floor(Math.random() * 100);
            const valueSprite = createTextSprite(String(value));
            valueSprite.position.set(x, 0, cellDepth/2 + 2);
            this.structureGroup.add(valueSprite);
            
            // Add index below
            const indexSprite = createTextSprite(`[${i}]`);
            indexSprite.position.set(x, -cellHeight/2 - 15, 0);
            indexSprite.scale.set(20, 20, 1);
            this.structureGroup.add(indexSprite);
        }
    }

    // Get theme colors for 3D visualization
    get3DThemeColors() {
        // Define available themes
        const themes = {
            default: {
                node: 0x4285F4,   // Google blue
                edge: 0x666666,    // Dark gray
                text: 0xFFFFFF,    // White
                background: 0xF8F9FA // Light gray
            },
            dark: {
                node: 0x61DAFB,    // React blue
                edge: 0xAAAAAA,    // Light gray
                text: 0xFFFFFF,    // White
                background: 0x282C34 // Dark gray
            },
            pastel: {
                node: 0x7EB0D5,    // Light blue
                edge: 0x8FD9A8,    // Light green
                text: 0x333333,    // Dark text
                background: 0xF8F9FA // Light gray
            }
        };
        
        // Return colors for current theme or default if not found
        return themes[this.options.theme] || themes.default;
    }
    
    // Handle window resize for 3D
    onWindowResize3D() {
        if (!this.renderer || !this.camera) return;
        
        this.width = this.container.clientWidth || 500;
        
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(this.width, this.height);
    }

    createControls() {
        // For backwards compatibility, just delegate to the new method
        const controls = this.createStructureControls();
        this.container.appendChild(controls);
        return controls;
    }
}

// Helper function to initialize the data structure visualizer
function initDataStructureVisualizer(container, options = {}) {
    console.log("Creating data structure visualizer for", container, "with options:", options);
    try {
        // Extract structureType from config if present and map to internal type
        if (options.structureType && !options.type) {
            options.type = options.structureType;
        }
        
        return new DataStructureVisualizer(container, options);
    } catch (error) {
        console.error("Failed to initialize data structure visualizer:", error);
        // Try to update status if possible
        if (container) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'alert alert-danger';
            errorDiv.textContent = `Visualization error: ${error.message}`;
            
            // Clear and append error
            container.innerHTML = '';
            container.appendChild(errorDiv);
            
            // Update card status if exists
            const parentCard = container.closest('.card');
            if (parentCard) {
                const statusBadge = parentCard.querySelector('.viz-status-indicator');
                if (statusBadge) {
                    statusBadge.textContent = 'Error';
                    statusBadge.className = 'viz-status-indicator badge bg-danger float-end';
                }
            }
        }
        return null;
    }
}

// Example data
const EXAMPLE_DATA = {
    tree: {
        root: {
            value: 10,
            left: {
                value: 5,
                left: { value: 3 },
                right: { value: 7 }
            },
            right: {
                value: 15,
                left: { value: 12 },
                right: { value: 20 }
            }
        }
    }
};

// Example usage:
// const visualizer = initDataStructureVisualizer('container', {
//     type: 'tree',
//     data: customTreeData
// }); 