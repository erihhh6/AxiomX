/**
 * Advanced Energy Network Visualizer
 * 
 * Supports both 2D (Canvas API) and 3D (Three.js) visualizations
 * for energy network modeling, distribution nodes, and energy flows
 * with modern, interactive features and smooth animations
 */

// Add global debugging flag for this module
window.ENERGY_NETWORK_VISUALIZER_LOADED = true;
console.log("========== Energy Network Visualizer Script Loaded ==========");

class EnergyNetworkVisualizer {
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

        console.log("EnergyNetworkVisualizer initialized with options:", options);

        // Process options
        // Map structureType to type if needed (for compatibility with tag attributes)
        if (options.structureType && !options.type) {
            options.type = options.structureType;
            console.log(`Mapped structureType '${options.structureType}' to type`);
        }

        // Default options with 3D support
        this.options = Object.assign({
            type: 'network',
            mode: '3d', // Default to 3D for better visualization
            data: null,
            theme: 'default',
            animation: true,
            interactive: true,
            // Energy-specific options
            efficiency: 0.85,
            costFactor: 1.0,
            emissions: 'low',
            capacity: 100
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
        this.statusIndicator.className = 'energy-network-visualizer-status';
        this.statusIndicator.style.fontSize = '12px';
        this.statusIndicator.style.color = '#666';
        this.statusIndicator.style.marginTop = '4px';
        this.statusIndicator.style.marginBottom = '4px';
        this.statusIndicator.style.textAlign = 'center';
        
        // Safely append the status indicator
        try {
            this.container.appendChild(this.statusIndicator);
            this.updateStatus('Initializing energy network visualizer...');
        } catch (e) {
            console.error("Error appending status indicator:", e);
        }

        // Create mode toggle switch (but don't append yet)
        let modeToggle = this.createModeToggle();
        try {
            this.container.appendChild(modeToggle);
        } catch (e) {
            console.error("Error appending mode toggle:", e);
        }

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
        icon.innerHTML = this.options.mode === '3d' ? '⚡' : '🔌';
        
        toggle.appendChild(icon);
        toggle.appendChild(text);
        toggleContainer.appendChild(toggle);
        
        // Add event listener to toggle between 2D and 3D
        toggle.addEventListener('click', () => {
            this.options.mode = this.options.mode === '3d' ? '2d' : '3d';
            text.textContent = this.options.mode === '3d' ? '3D' : '2D';
            icon.innerHTML = this.options.mode === '3d' ? '⚡' : '🔌';
            
            // Reinitialize visualizer with new mode
            if (this.options.mode === '3d') {
                this.init3D();
            } else {
                this.init2D();
            }
        });
        
        // Store reference to the toggle container
        this.modeToggle = toggleContainer;
        return toggleContainer;
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
            } else if (message === 'Initializing energy network visualizer...') {
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
            <h5>Energy Network Visualization Error</h5>
            <p>${error.message || 'Unknown error occurred while initializing the energy network visualizer'}</p>
            <p>Check browser console for more details.</p>
        `;
        
        // Update status indicators
        this.updateStatus('Error initializing energy network visualizer', true);
        
        return errorDiv;
    }
    
    createStructureControls() {
        try {
            // Create controls container
            const controlsDiv = document.createElement('div');
            controlsDiv.className = 'energy-network-controls';
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
            typeDiv.innerHTML = `<label style="margin-right: 5px;">Network type: </label>`;
            const typeSelect = document.createElement('select');
            typeSelect.className = 'form-select form-select-sm network-type-select';
            typeSelect.style.display = 'inline-block';
            typeSelect.style.width = 'auto';
            
            // Energy network types
            ['network', 'grid', 'smartGrid', 'distribution', 'renewable'].forEach(type => {
                const option = document.createElement('option');
                option.value = type;
                option.text = type === 'smartGrid' ? 'Smart Grid' : 
                            (type.charAt(0).toUpperCase() + type.slice(1));
                if (type === this.options.type) {
                    option.selected = true;
                }
                typeSelect.appendChild(option);
            });
            
            typeSelect.addEventListener('change', (e) => {
                this.options.type = e.target.value;
                this.updateStatus(`Switching to ${this.options.type} energy network...`);
                
                if (this.options.mode === '3d') {
                    this.create3DStructure();
                    this.updateStatus(`3D ${this.options.type} energy network active`);
                } else {
                    this.draw();
                    this.updateStatus(`${this.options.type} energy network active`);
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
                { value: 'green', text: 'Green Energy' },
                { value: 'thermal', text: 'Thermal' }
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
            
            // Energy efficiency slider
            const efficiencyDiv = document.createElement('div');
            efficiencyDiv.style.display = 'flex';
            efficiencyDiv.style.alignItems = 'center';
            efficiencyDiv.style.marginLeft = '10px';
            
            const efficiencyLabel = document.createElement('label');
            efficiencyLabel.textContent = 'Efficiency: ';
            efficiencyLabel.style.marginRight = '5px';
            efficiencyDiv.appendChild(efficiencyLabel);
            
            const efficiencyValue = document.createElement('span');
            efficiencyValue.textContent = `${Math.round(this.options.efficiency * 100)}%`;
            efficiencyValue.style.marginRight = '5px';
            efficiencyValue.style.minWidth = '40px';
            efficiencyValue.style.display = 'inline-block';
            efficiencyDiv.appendChild(efficiencyValue);
            
            const efficiencySlider = document.createElement('input');
            efficiencySlider.type = 'range';
            efficiencySlider.min = '0.1';
            efficiencySlider.max = '1';
            efficiencySlider.step = '0.05';
            efficiencySlider.value = this.options.efficiency;
            efficiencySlider.style.width = '100px';
            
            efficiencySlider.addEventListener('input', (e) => {
                this.options.efficiency = parseFloat(e.target.value);
                efficiencyValue.textContent = `${Math.round(this.options.efficiency * 100)}%`;
                
                // Update visualization with new efficiency
                if (this.options.mode === '3d') {
                    this.updateNetworkEfficiency();
                } else {
                    this.draw();
                }
            });
            
            efficiencyDiv.appendChild(efficiencySlider);
            controlsDiv.appendChild(efficiencyDiv);
            
            // Emissions type selector
            const emissionsDiv = document.createElement('div');
            emissionsDiv.style.display = 'flex';
            emissionsDiv.style.alignItems = 'center';
            emissionsDiv.style.marginLeft = '10px';
            
            const emissionsLabel = document.createElement('label');
            emissionsLabel.textContent = 'Emissions: ';
            emissionsLabel.style.marginRight = '5px';
            emissionsDiv.appendChild(emissionsLabel);
            
            const emissionsSelect = document.createElement('select');
            emissionsSelect.className = 'form-select form-select-sm';
            emissionsSelect.style.display = 'inline-block';
            emissionsSelect.style.width = 'auto';
            
            ['low', 'medium', 'high'].forEach(level => {
                const option = document.createElement('option');
                option.value = level;
                option.text = level.charAt(0).toUpperCase() + level.slice(1);
                if (level === this.options.emissions) {
                    option.selected = true;
                }
                emissionsSelect.appendChild(option);
            });
            
            emissionsSelect.addEventListener('change', (e) => {
                this.options.emissions = e.target.value;
                
                // Update visualization with new emissions setting
                if (this.options.mode === '3d') {
                    this.updateNetworkEmissions();
                } else {
                    this.draw();
                }
            });
            
            emissionsDiv.appendChild(emissionsSelect);
            controlsDiv.appendChild(emissionsDiv);
            
            // Store controlsDiv reference but return it without appending
            this.controlsDiv = controlsDiv;
            return controlsDiv;
        } catch (error) {
            console.error("Error creating structure controls:", error);
            
            // Return a minimal control panel in case of error
            const minimalControls = document.createElement('div');
            minimalControls.className = 'energy-network-controls';
            minimalControls.style.padding = '10px';
            minimalControls.style.backgroundColor = '#f8f9fa';
            minimalControls.style.borderRadius = '4px';
            minimalControls.style.marginBottom = '10px';
            
            const errorMessage = document.createElement('div');
            errorMessage.textContent = 'Control panel error. Basic visualization active.';
            errorMessage.style.color = '#dc3545';
            errorMessage.style.fontSize = '12px';
            
            minimalControls.appendChild(errorMessage);
            this.controlsDiv = minimalControls;
            return minimalControls;
        }
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
                try {
                    this.container.appendChild(currentStatus);
                } catch (e) {
                    console.error("Error re-appending status indicator:", e);
                    this.statusIndicator = document.createElement('div');
                    this.statusIndicator.className = 'energy-network-visualizer-status';
                    this.container.appendChild(this.statusIndicator);
                }
            }
            
            // Add mode toggle back or create new one
            let modeToggle;
            if (currentModeToggle) {
                modeToggle = currentModeToggle;
            } else {
                modeToggle = this.createModeToggle();
            }
            
            try {
                this.container.appendChild(modeToggle);
            } catch (e) {
                console.error("Error appending mode toggle:", e);
            }
            
            // Set up container dimensions
            this.width = this.container.clientWidth || 500; // Fallback width if clientWidth is 0
            this.height = 300;
            
            console.log(`Container dimensions: ${this.width}x${this.height}`);
            
            // Create structure controls
            try {
                const controls = this.createStructureControls();
                this.container.appendChild(controls);
            } catch (e) {
                console.error("Error creating or appending structure controls:", e);
            }
            
            // Create canvas
            try {
                this.canvas = document.createElement('canvas');
                if (!this.canvas) {
                    throw new Error("Failed to create canvas element");
                }
                
                this.canvas.width = this.width;
                this.canvas.height = this.height;
                this.canvas.style.display = 'block';
                this.canvas.style.margin = '0 auto';
                this.container.appendChild(this.canvas);
            } catch (e) {
                console.error("Error creating or appending canvas:", e);
                throw new Error("Canvas initialization failed: " + e.message);
            }
            
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
            
            // Add error message to container
            try {
                const errorDiv = this.showError(error);
                this.container.appendChild(errorDiv);
            } catch (e) {
                console.error("Error displaying error message:", e);
                // Last resort error
                this.container.innerHTML = `<div class="alert alert-danger">Error initializing visualizer: ${error.message}</div>`;
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
                try {
                    this.container.appendChild(currentStatus);
                } catch (e) {
                    console.error("Error re-appending status indicator:", e);
                    this.statusIndicator = document.createElement('div');
                    this.statusIndicator.className = 'energy-network-visualizer-status';
                    this.container.appendChild(this.statusIndicator);
                }
            }
            
            // Add the mode toggle back or create new one
            let modeToggle;
            if (currentModeToggle) {
                modeToggle = currentModeToggle;
            } else {
                modeToggle = this.createModeToggle();
            }
            
            try {
                this.container.appendChild(modeToggle);
            } catch (e) {
                console.error("Error appending mode toggle:", e);
            }
            
            // Create structure controls
            try {
                const controls = this.createStructureControls();
                this.container.appendChild(controls);
            } catch (e) {
                console.error("Error creating or appending structure controls:", e);
            }
            
            // Create a canvas as a placeholder while loading
            try {
                this.canvas = document.createElement('canvas');
                this.canvas.width = this.container.clientWidth || 500;
                this.canvas.height = 300;
                this.canvas.style.display = 'block';
                this.canvas.style.margin = '0 auto';
                this.container.appendChild(this.canvas);
            } catch (e) {
                console.error("Error creating or appending canvas:", e);
            }
            
            // Update status
            this.updateStatus('Loading 3D visualization...');
            
            // Load Three.js library
            this.load3DLibrary()
                .then(() => {
                    console.log("Three.js loaded successfully, creating 3D visualization");
                    this.create3DStructure();
                })
                .catch(error => {
                    console.error("Failed to load Three.js:", error);
                    this.updateStatus("Error loading 3D library, showing fallback", true);
                    
                    // Create a fallback visualization on the canvas
                    this.createFallback3DVisualization();
                });
        } catch (error) {
            console.error("Error in 3D initialization:", error);
            this.updateStatus("Error initializing 3D, showing fallback", true);
            
            // Create a fallback visualization
            try {
                this.createFallback3DVisualization();
            } catch (e) {
                console.error("Error creating fallback visualization:", e);
                // Last resort error
                try {
                    this.container.innerHTML = `<div class="alert alert-danger">Error initializing visualizer: ${error.message}</div>`;
                } catch (e2) {
                    console.error("Complete failure in visualization:", e2);
                }
            }
        }
    }
    
    // Create a fallback visualization when Three.js fails to load
    createFallback3DVisualization() {
        try {
            // Ensure we have a canvas
            if (!this.canvas) {
                this.canvas = document.createElement('canvas');
                this.canvas.width = this.container.clientWidth || 500;
                this.canvas.height = 300;
                this.canvas.style.display = 'block';
                this.canvas.style.margin = '0 auto';
                this.container.appendChild(this.canvas);
            }
            
            // Get 2D context and draw a fallback visualization
            const ctx = this.canvas.getContext('2d');
            if (!ctx) {
                throw new Error("Failed to get canvas context");
            }
            
            // Clear canvas
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Add background
            ctx.fillStyle = '#f0f5ff';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Draw network based on type
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;
            const radius = Math.min(this.canvas.width, this.canvas.height) * 0.4;
            
            // Draw different network types
            switch (this.options.type.toLowerCase()) {
                case 'grid':
                    this.drawFallbackPowerGrid(ctx, centerX, centerY, radius);
                    break;
                case 'smartgrid':
                    this.drawFallbackSmartGrid(ctx, centerX, centerY, radius);
                    break;
                case 'renewable':
                    this.drawFallbackRenewableNetwork(ctx, centerX, centerY, radius);
                    break;
                case 'distribution':
                    this.drawFallbackDistributionNetwork(ctx, centerX, centerY, radius);
                    break;
                default:
                    this.drawFallbackBasicNetwork(ctx, centerX, centerY, radius);
            }
            
            // Add a note about fallback mode
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Fallback Visualization (3D mode unavailable)', centerX, 30);
            
            // Add error message
            ctx.font = '12px Arial';
            ctx.fillText('Could not load 3D visualization library', centerX, 50);
            
        } catch (error) {
            console.error("Error creating fallback visualization:", error);
            this.updateStatus("Visualization error", true);
            
            // Show a text error message as last resort
            const errorMsg = document.createElement('div');
            errorMsg.className = 'alert alert-danger';
            errorMsg.innerHTML = '<strong>Error:</strong> Failed to create energy network visualization.';
            this.container.appendChild(errorMsg);
        }
    }
    
    // Basic network fallback drawing
    drawFallbackBasicNetwork(ctx, centerX, centerY, radius) {
        // Draw generator node
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.arc(centerX - radius/2, centerY - radius/2, radius/6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Generator', centerX - radius/2, centerY - radius/2 + radius/4 + 15);
        
        // Draw distribution node
        ctx.fillStyle = '#4285F4';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius/5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#333';
        ctx.fillText('Distributor', centerX, centerY + radius/4 + 15);
        
        // Draw consumer nodes
        ctx.fillStyle = '#34a853';
        ctx.beginPath();
        ctx.arc(centerX + radius/2, centerY - radius/3, radius/8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#333';
        ctx.fillText('Consumer 1', centerX + radius/2, centerY - radius/3 + radius/6 + 15);
        
        ctx.fillStyle = '#34a853';
        ctx.beginPath();
        ctx.arc(centerX + radius/3, centerY + radius/3, radius/8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#333';
        ctx.fillText('Consumer 2', centerX + radius/3, centerY + radius/3 + radius/6 + 15);
        
        // Draw connections
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        
        // Generator to distributor
        ctx.beginPath();
        ctx.moveTo(centerX - radius/2 + radius/6, centerY - radius/2);
        ctx.lineTo(centerX - radius/5, centerY);
        ctx.stroke();
        
        // Distributor to consumers
        ctx.beginPath();
        ctx.moveTo(centerX + radius/5, centerY);
        ctx.lineTo(centerX + radius/2 - radius/8, centerY - radius/3);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(centerX + radius/5, centerY);
        ctx.lineTo(centerX + radius/3 - radius/8, centerY + radius/3);
        ctx.stroke();
    }
    
    // Smart grid fallback
    drawFallbackSmartGrid(ctx, centerX, centerY, radius) {
        // Similar to drawFallbackBasicNetwork but with smart grid features
        // Draw renewable sources
        ctx.fillStyle = '#20c997';
        ctx.beginPath();
        ctx.arc(centerX - radius/2, centerY - radius/2, radius/7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Solar', centerX - radius/2, centerY - radius/2 + radius/5 + 15);
        
        ctx.fillStyle = '#20c997';
        ctx.beginPath();
        ctx.arc(centerX + radius/2, centerY - radius/2, radius/7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#333';
        ctx.fillText('Wind', centerX + radius/2, centerY - radius/2 + radius/5 + 15);
        
        // Draw storage
        ctx.fillStyle = '#ff922b';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius/6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#333';
        ctx.fillText('Storage', centerX, centerY + radius/4 + 15);
        
        // Draw smart consumers
        ctx.fillStyle = '#339af0';
        ctx.beginPath();
        ctx.arc(centerX - radius/3, centerY + radius/3, radius/8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#333';
        ctx.fillText('Smart Home', centerX - radius/3, centerY + radius/3 + radius/6 + 15);
        
        ctx.fillStyle = '#339af0';
        ctx.beginPath();
        ctx.arc(centerX + radius/3, centerY + radius/3, radius/8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#333';
        ctx.fillText('Smart Building', centerX + radius/3, centerY + radius/3 + radius/6 + 15);
        
        // Draw connections in a mesh network
        const nodes = [
            {x: centerX - radius/2, y: centerY - radius/2}, // Solar
            {x: centerX + radius/2, y: centerY - radius/2}, // Wind
            {x: centerX, y: centerY},                       // Storage
            {x: centerX - radius/3, y: centerY + radius/3}, // Smart Home
            {x: centerX + radius/3, y: centerY + radius/3}  // Smart Building
        ];
        
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                ctx.beginPath();
                ctx.moveTo(nodes[i].x, nodes[i].y);
                ctx.lineTo(nodes[j].x, nodes[j].y);
                ctx.stroke();
            }
        }
    }
    
    // Power grid fallback
    drawFallbackPowerGrid(ctx, centerX, centerY, radius) {
        // Draw power plant
        ctx.fillStyle = '#ff6b6b';
        ctx.beginPath();
        ctx.arc(centerX, centerY - radius/2, radius/5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Power Plant', centerX, centerY - radius/2 + radius/4 + 15);
        
        // Draw substations
        ctx.fillStyle = '#4dabf7';
        for (let i = 0; i < 4; i++) {
            const angle = i * Math.PI / 2;
            const x = centerX + Math.cos(angle) * radius/2;
            const y = centerY + Math.sin(angle) * radius/2;
            
            ctx.beginPath();
            ctx.arc(x, y, radius/8, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#333';
            ctx.fillText(`Substation ${i+1}`, x, y + radius/6 + 15);
            ctx.fillStyle = '#4dabf7';
        }
        
        // Draw connections
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        
        // Power plant to substations
        for (let i = 0; i < 4; i++) {
            const angle = i * Math.PI / 2;
            const x = centerX + Math.cos(angle) * radius/2;
            const y = centerY + Math.sin(angle) * radius/2;
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY - radius/2 + radius/5);
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    }
    
    // Distribution network fallback
    drawFallbackDistributionNetwork(ctx, centerX, centerY, radius) {
        // Similar to other network types but with hierarchical structure
        // Main power source
        ctx.fillStyle = '#e03131';
        ctx.beginPath();
        ctx.arc(centerX, centerY - radius/2, radius/5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Main Source', centerX, centerY - radius/2 + radius/4 + 15);
        
        // Primary distributors
        ctx.fillStyle = '#5c7cfa';
        const primaryDist = [];
        for (let i = 0; i < 3; i++) {
            const angle = (i - 1) * Math.PI / 4;
            const x = centerX + Math.cos(angle) * radius/2;
            const y = centerY + Math.sin(angle) * radius/3;
            
            primaryDist.push({x, y});
            
            ctx.beginPath();
            ctx.arc(x, y, radius/8, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#333';
            ctx.fillText(`Primary ${i+1}`, x, y + radius/6 + 15);
            ctx.fillStyle = '#5c7cfa';
        }
        
        // Connect main to primary
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        for (let i = 0; i < primaryDist.length; i++) {
            ctx.beginPath();
            ctx.moveTo(centerX, centerY - radius/2 + radius/5);
            ctx.lineTo(primaryDist[i].x, primaryDist[i].y);
            ctx.stroke();
        }
    }
    
    // Renewable energy network fallback
    drawFallbackRenewableNetwork(ctx, centerX, centerY, radius) {
        // Draw renewable sources
        // Solar
        ctx.fillStyle = '#fcc419';
        ctx.beginPath();
        ctx.arc(centerX - radius/2, centerY - radius/3, radius/7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Solar', centerX - radius/2, centerY - radius/3 + radius/5 + 15);
        
        // Wind
        ctx.fillStyle = '#a5d8ff';
        ctx.beginPath();
        ctx.arc(centerX, centerY - radius/2, radius/7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#333';
        ctx.fillText('Wind', centerX, centerY - radius/2 + radius/5 + 15);
        
        // Hydro
        ctx.fillStyle = '#15aabf';
        ctx.beginPath();
        ctx.arc(centerX + radius/2, centerY - radius/3, radius/7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#333';
        ctx.fillText('Hydro', centerX + radius/2, centerY - radius/3 + radius/5 + 15);
        
        // Storage
        ctx.fillStyle = '#ff922b';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius/6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#333';
        ctx.fillText('Storage', centerX, centerY + radius/4 + 15);
        
        // Consumers
        ctx.fillStyle = '#40c057';
        ctx.beginPath();
        ctx.arc(centerX - radius/3, centerY + radius/3, radius/8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#333';
        ctx.fillText('Green Home', centerX - radius/3, centerY + radius/3 + radius/6 + 15);
        
        ctx.fillStyle = '#40c057';
        ctx.beginPath();
        ctx.arc(centerX + radius/3, centerY + radius/3, radius/8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#333';
        ctx.fillText('Community', centerX + radius/3, centerY + radius/3 + radius/6 + 15);
        
        // Draw connections
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        
        // Connect renewables to storage
        ctx.beginPath();
        ctx.moveTo(centerX - radius/2, centerY - radius/3);
        ctx.lineTo(centerX, centerY);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - radius/2);
        ctx.lineTo(centerX, centerY);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(centerX + radius/2, centerY - radius/3);
        ctx.lineTo(centerX, centerY);
        ctx.stroke();
        
        // Connect storage to consumers
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX - radius/3, centerY + radius/3);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + radius/3, centerY + radius/3);
        ctx.stroke();
    }
    
    // Helper to load Three.js library
    load3DLibrary() {
        return new Promise((resolve, reject) => {
            // First check if Three.js is already available globally
            if (typeof THREE !== 'undefined' && THREE.REVISION) {
                console.log("Three.js already loaded, version:", THREE.REVISION);
                
                // Check if OrbitControls is also loaded
                if (typeof THREE.OrbitControls !== 'undefined') {
                    console.log("OrbitControls also already loaded");
                    resolve();
                    return;
                } else {
                    // Only load OrbitControls since Three.js is already available
                    console.log("Loading OrbitControls only...");
                    const orbitScript = document.createElement('script');
                    orbitScript.src = 'https://cdn.jsdelivr.net/npm/three@0.132.2/examples/js/controls/OrbitControls.js';
                    orbitScript.onload = () => {
                        console.log('OrbitControls loaded successfully');
                        resolve();
                    };
                    orbitScript.onerror = () => {
                        console.warn('Failed to load OrbitControls, continuing with basic Three.js');
                        // Still resolve as Three.js is available
                        resolve();
                    };
                    document.head.appendChild(orbitScript);
                    return;
                }
            }

            // If Three.js is not available, load both libraries
            console.log('Loading Three.js for 3D visualization...');
            
            // Use CDN as primary source since it's more reliable
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.min.js';
            
            // Add event handlers
            script.onload = () => {
                console.log('Three.js loaded successfully');
                
                // Load OrbitControls once Three.js is available
                const orbitScript = document.createElement('script');
                orbitScript.src = 'https://cdn.jsdelivr.net/npm/three@0.132.2/examples/js/controls/OrbitControls.js';
                
                orbitScript.onload = () => {
                    console.log('OrbitControls loaded successfully');
                    resolve();
                };
                
                orbitScript.onerror = () => {
                    console.warn('Failed to load OrbitControls, continuing with basic Three.js');
                    // Still resolve as Three.js is loaded
                    resolve();
                };
                
                document.head.appendChild(orbitScript);
            };
            
            script.onerror = (error) => {
                console.error('Failed to load Three.js:', error);
                
                // Try loading from a different CDN as fallback
                const fallbackScript = document.createElement('script');
                fallbackScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r132/three.min.js';
                
                fallbackScript.onload = () => {
                    console.log('Three.js loaded from fallback CDN');
                    
                    // Load OrbitControls
                    const orbitScript = document.createElement('script');
                    orbitScript.src = 'https://cdn.jsdelivr.net/npm/three@0.132.2/examples/js/controls/OrbitControls.js';
                    
                    orbitScript.onload = () => {
                        console.log('OrbitControls loaded successfully');
                        resolve();
                    };
                    
                    orbitScript.onerror = () => {
                        console.warn('Failed to load OrbitControls, continuing with basic Three.js');
                        resolve();
                    };
                    
                    document.head.appendChild(orbitScript);
                };
                
                fallbackScript.onerror = () => {
                    console.error('All attempts to load Three.js failed');
                    reject(new Error('Failed to load Three.js library after multiple attempts'));
                };
                
                document.head.appendChild(fallbackScript);
            };
            
            // Append script to head
            document.head.appendChild(script);
        });
    }

    // Create 3D visualization using Three.js
    create3DStructure() {
        try {
            // Clear existing structure
            if (this.scene) {
                try {
                    // Remove all objects except lights and camera
                    const objectsToRemove = [];
                    this.scene.traverse(object => {
                        if (object.type !== 'Scene' && 
                            object.type !== 'AmbientLight' && 
                            object.type !== 'DirectionalLight' &&
                            object.type !== 'HemisphereLight' &&
                            object !== this.camera) {
                            objectsToRemove.push(object);
                        }
                    });
                    
                    objectsToRemove.forEach(object => {
                        this.scene.remove(object);
                    });
                } catch (e) {
                    console.error("Error clearing scene:", e);
                }
            }
            
            // Check if THREE is available
            if (typeof THREE === 'undefined') {
                throw new Error("THREE.js library not loaded");
            }
            
            // Reset collections
            this.networkNodes = [];
            this.networkEdges = [];
            
            // If scene doesn't exist, create it
            if (!this.scene) {
                this.scene = new THREE.Scene();
                this.scene.background = new THREE.Color(0xf0f5ff);
                
                // Create camera if it doesn't exist
                if (!this.camera) {
                    const aspectRatio = this.canvas.width / this.canvas.height;
                    this.camera = new THREE.PerspectiveCamera(60, aspectRatio, 0.1, 1000);
                    this.camera.position.set(0, 15, 25);
                    this.camera.lookAt(0, 0, 0);
                }
                
                // Add lighting
                const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
                this.scene.add(ambientLight);
                
                const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
                directionalLight.position.set(10, 20, 15);
                this.scene.add(directionalLight);
                
                // Add renderer
                try {
                    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
                    this.renderer.setSize(this.canvas.width, this.canvas.height);
                    this.renderer.shadowMap.enabled = true;
                } catch (e) {
                    console.error("WebGL renderer creation failed:", e);
                    // Fallback to canvas renderer or handle error
                    throw new Error("Could not create WebGL renderer: " + e.message);
                }
                
                // Add orbit controls if available
                if (THREE.OrbitControls) {
                    try {
                        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
                        this.controls.enableDamping = true;
                        this.controls.dampingFactor = 0.25;
                        this.controls.enableZoom = true;
                        this.controls.maxDistance = 100;
                    } catch (e) {
                        console.error("Error creating OrbitControls:", e);
                    }
                }
                
                // Start animation loop
                this.animate = this.animate.bind(this);
                this.animate();
                
                // Handle window resizing
                window.addEventListener('resize', () => this.onWindowResize3D());
            }
            
            // Create based on network type
            try {
                switch (this.options.type) {
                    case 'network':
                        this.createEnergyNetwork();
                        break;
                    case 'grid':
                        this.createPowerGrid();
                        break;
                    case 'smartGrid':
                        this.createSmartGrid();
                        break;
                    case 'distribution':
                        this.createDistributionNetwork();
                        break;
                    case 'renewable':
                        this.createRenewableNetwork();
                        break;
                    default:
                        this.createEnergyNetwork();
                }
                
                // Update efficiency and emissions
                this.updateNetworkEfficiency();
                this.updateNetworkEmissions();
                
                // Update status
                this.updateStatus(`3D ${this.options.type} energy network active`);
            } catch (typeError) {
                console.error("Error creating network structure:", typeError);
                // Attempt to create a basic network as fallback
                try {
                    this.createEnergyNetwork();
                    this.updateStatus(`3D energy network active (fallback mode)`, false);
                } catch (fallbackError) {
                    console.error("Fallback network creation also failed:", fallbackError);
                    this.updateStatus(`Error creating 3D structure`, true);
                    throw new Error("Failed to create any 3D network structure");
                }
            }
        } catch (error) {
            console.error("Error in create3DStructure:", error);
            this.updateStatus("Error creating 3D visualization", true);
            
            // Create a fallback 2D visualization
            this.createFallback3DVisualization();
        }
    }
    
    // Animation loop for 3D rendering
    animate() {
        try {
            if (this.renderer && this.scene && this.camera) {
                requestAnimationFrame(this.animate);
                
                // Update controls if they exist
                if (this.controls && this.controls.update) {
                    this.controls.update();
                }
                
                // Render scene
                this.renderer.render(this.scene, this.camera);
                
                // Update any animations in the scene
                if (this.animatableObjects) {
                    this.animatableObjects.forEach(obj => {
                        if (obj.animate) obj.animate();
                    });
                }
            }
        } catch (e) {
            console.error("Error in animation loop:", e);
            // Don't call requestAnimationFrame again if there was an error
        }
    }
    
    // Create basic energy network
    createEnergyNetwork() {
        if (!this.scene) return;
        
        const colors = this.get3DThemeColors();
        
        // Create a standard energy network with generators, distributors and consumers
        const networkData = {
            nodes: [
                { id: 'gen1', type: 'generator', label: 'G1', x: -5, y: 0, z: -5, capacity: 100, efficiency: 0.85 },
                { id: 'gen2', type: 'generator', label: 'G2', x: 5, y: 0, z: -5, capacity: 80, efficiency: 0.9 },
                { id: 'dist1', type: 'distributor', label: 'D1', x: 0, y: 0, z: 0, capacity: 150 },
                { id: 'cons1', type: 'consumer', label: 'C1', x: -6, y: 0, z: 2, demand: 40 },
                { id: 'cons2', type: 'consumer', label: 'C2', x: -2, y: 0, z: 4, demand: 30 },
                { id: 'cons3', type: 'consumer', label: 'C3', x: 2, y: 0, z: 4, demand: 50 },
                { id: 'cons4', type: 'consumer', label: 'C4', x: 6, y: 0, z: 2, demand: 45 }
            ],
            edges: [
                { from: 'gen1', to: 'dist1', capacity: 0.8 },
                { from: 'gen2', to: 'dist1', capacity: 0.7 },
                { from: 'dist1', to: 'cons1', capacity: 0.5 },
                { from: 'dist1', to: 'cons2', capacity: 0.6 },
                { from: 'dist1', to: 'cons3', capacity: 0.5 },
                { from: 'dist1', to: 'cons4', capacity: 0.4 }
            ]
        };
        
        // Create nodes
        const nodes = {};
        
        networkData.nodes.forEach(nodeData => {
            let node;
            
            if (nodeData.type === 'generator') {
                node = this.createGeneratorNode(nodeData, colors);
            } else if (nodeData.type === 'distributor') {
                node = this.createDistributorNode(nodeData, colors);
            } else if (nodeData.type === 'consumer') {
                node = this.createConsumerNode(nodeData, colors);
            }
            
            if (node) {
                nodes[nodeData.id] = node;
                this.scene.add(node);
                this.networkNodes.push(node);
            }
        });
        
        // Create edges
        networkData.edges.forEach(edgeData => {
            if (nodes[edgeData.from] && nodes[edgeData.to]) {
                const edge = this.createEnergyFlow(
                    nodes[edgeData.from],
                    nodes[edgeData.to],
                    edgeData.capacity,
                    colors
                );
                
                if (edge) {
                    this.scene.add(edge);
                    this.networkEdges.push(edge);
                }
            }
        });
        
        // Add ground grid
        const gridSize = 20;
        const gridDivisions = 20;
        const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x555555, 0x333333);
        gridHelper.position.y = -1;
        this.scene.add(gridHelper);
        
        // Update camera position
        this.camera.position.set(0, 15, 20);
        this.camera.lookAt(0, 0, 0);
    }
    
    // Create generator node (power plant)
    createGeneratorNode(nodeData, colors) {
        const group = new THREE.Group();
        group.position.set(nodeData.x, nodeData.y, nodeData.z);
        
        // Efficiency determines color
        const efficiency = nodeData.efficiency || this.options.efficiency;
        const color = this.getNodeColorByEfficiency(efficiency, 'generator');
        
        // Base cylinder
        const baseGeometry = new THREE.CylinderGeometry(0.8, 1, 1.5, 16);
        const baseMaterial = new THREE.MeshPhongMaterial({ 
            color: color,
            shininess: 70
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = -0.25;
        group.add(base);
        
        // Chimney
        const chimneyGeometry = new THREE.CylinderGeometry(0.3, 0.4, 2, 16);
        const chimneyMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x666666,
            shininess: 50
        });
        const chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
        chimney.position.y = 1;
        chimney.position.x = 0.4;
        group.add(chimney);
        
        // Generator building
        const buildingGeometry = new THREE.BoxGeometry(1.5, 1, 1.5);
        const buildingMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x8888aa,
            shininess: 60
        });
        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
        building.position.y = 0.5;
        group.add(building);
        
        // Label
        const label = this.createTextSprite(nodeData.label || 'G', 0.8);
        label.position.set(0, 2, 0);
        group.add(label);
        
        // Add userData for interactions
        group.userData = {
            type: 'generator',
            id: nodeData.id,
            capacity: nodeData.capacity || 100,
            efficiency: efficiency,
            label: nodeData.label || 'G',
            baseEmissionFactor: (1 - efficiency) * 0.8 + 0.2
        };
        
        // Add glow/light effect for generator
        const light = new THREE.PointLight(0xffcc22, 0.5 + efficiency * 2, 5);
        light.position.set(0, 1, 0);
        group.add(light);
        group.userData.glow = light;
        
        // Add smoke effect for non-clean generators
        if (efficiency < 0.9) {
            const smokeGeometry = new THREE.SphereGeometry(0.2, 8, 8);
            const smokeMaterial = new THREE.MeshBasicMaterial({
                color: 0x999999,
                transparent: true,
                opacity: (1 - efficiency) * 0.5
            });
            const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
            smoke.position.set(0.4, 2.5, 0);
            group.add(smoke);
            group.userData.smokeEffect = smoke;
        }
        
        return group;
    }
    
    // Create distributor node (substation)
    createDistributorNode(nodeData, colors) {
        const group = new THREE.Group();
        group.position.set(nodeData.x, nodeData.y, nodeData.z);
        
        // Base platform
        const baseGeometry = new THREE.BoxGeometry(2, 0.3, 2);
        const baseMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x888888,
            shininess: 50
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = -0.5;
        group.add(base);
        
        // Transformer
        const transformerGeometry = new THREE.BoxGeometry(1, 1, 1);
        const transformerMaterial = new THREE.MeshPhongMaterial({ 
            color: this.getNodeColorByEfficiency(this.options.efficiency, 'distributor'),
            shininess: 70
        });
        const transformer = new THREE.Mesh(transformerGeometry, transformerMaterial);
        transformer.position.y = 0.2;
        group.add(transformer);
        
        // Transmission towers
        const createTower = (x, z) => {
            const towerGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.5, 8);
            const towerMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
            const tower = new THREE.Mesh(towerGeometry, towerMaterial);
            tower.position.set(x, 0.5, z);
            return tower;
        };
        
        const towers = [
            createTower(0.7, 0.7),
            createTower(-0.7, 0.7),
            createTower(0.7, -0.7),
            createTower(-0.7, -0.7)
        ];
        
        towers.forEach(tower => group.add(tower));
        
        // Label
        const label = this.createTextSprite(nodeData.label || 'D', 0.8);
        label.position.set(0, 1.5, 0);
        group.add(label);
        
        // Add userData for interactions
        group.userData = {
            type: 'distributor',
            id: nodeData.id,
            capacity: nodeData.capacity || 100,
            label: nodeData.label || 'D'
        };
        
        return group;
    }
    
    // Create consumer node (building)
    createConsumerNode(nodeData, colors) {
        const group = new THREE.Group();
        group.position.set(nodeData.x, nodeData.y, nodeData.z);
        
        // Building geometry
        const buildingHeight = 1 + (nodeData.demand / 50);
        const buildingGeometry = new THREE.BoxGeometry(1.2, buildingHeight, 1.2);
        const buildingMaterial = new THREE.MeshPhongMaterial({ 
            color: this.getNodeColorByEfficiency(this.options.efficiency, 'consumer'),
            shininess: 50
        });
        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
        building.position.y = buildingHeight/2 - 0.5;
        group.add(building);
        
        // Windows
        const addWindows = () => {
            const rows = Math.ceil(buildingHeight * 2);
            const windowGeometry = new THREE.PlaneGeometry(0.15, 0.15);
            const windowMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xffffcc,
                side: THREE.DoubleSide
            });
            
            // Add windows on each side of the building
            for (let side = 0; side < 4; side++) {
                for (let row = 0; row < rows; row++) {
                    for (let col = 0; col < 3; col++) {
                        const window = new THREE.Mesh(windowGeometry, windowMaterial);
                        
                        const angle = side * Math.PI/2;
                        const x = Math.sin(angle) * 0.61;
                        const z = Math.cos(angle) * 0.61;
                        
                        window.position.set(
                            x,
                            row * 0.3 - 0.4 + buildingHeight/2,
                            z
                        );
                        
                        window.rotation.set(0, angle, 0);
                        
                        // Offset the middle column
                        if (col === 1) {
                            window.position.x += Math.sin(angle + Math.PI/2) * 0.3;
                            window.position.z += Math.cos(angle + Math.PI/2) * 0.3;
                        } else if (col === 2) {
                            window.position.x += Math.sin(angle + Math.PI/2) * 0.6;
                            window.position.z += Math.cos(angle + Math.PI/2) * 0.6;
                        }
                        
                        group.add(window);
                    }
                }
            }
        };
        
        addWindows();
        
        // Label
        const label = this.createTextSprite(nodeData.label || 'C', 0.8);
        label.position.set(0, buildingHeight + 0.5, 0);
        group.add(label);
        
        // Add userData for interactions
        group.userData = {
            type: 'consumer',
            id: nodeData.id,
            demand: nodeData.demand || 50,
            label: nodeData.label || 'C'
        };
        
        return group;
    }
    
    // Create energy flow connection between nodes
    createEnergyFlow(fromNode, toNode, capacity, colors) {
        if (!fromNode || !toNode) return null;
        
        const fromPosition = new THREE.Vector3();
        fromNode.getWorldPosition(fromPosition);
        
        const toPosition = new THREE.Vector3();
        toNode.getWorldPosition(toPosition);
        
        // Create curve for the flow
        const points = [];
        const curveHeight = 1 + Math.random() * 0.5;
        
        points.push(fromPosition);
        
        // Middle control point
        const midPoint = new THREE.Vector3().addVectors(fromPosition, toPosition).multiplyScalar(0.5);
        midPoint.y += curveHeight;
        points.push(midPoint);
        
        points.push(toPosition);
        
        const curve = new THREE.CatmullRomCurve3(points);
        const geometry = new THREE.TubeGeometry(curve, 20, 0.1, 8, false);
        
        // Color based on efficiency and capacity
        const color = this.getEdgeColorByEfficiency(this.options.efficiency, capacity);
        
        const material = new THREE.MeshBasicMaterial({ 
            color: color,
            transparent: true,
            opacity: 0.3 + (capacity * 0.7)
        });
        
        const tube = new THREE.Mesh(geometry, material);
        
        // Add animated energy particles along the tube
        if (capacity > 0.2) {
            const particleCount = Math.floor(capacity * 10);
            const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: 0xffff00,
                transparent: true,
                opacity: 0.8
            });
            
            for (let i = 0; i < particleCount; i++) {
                const particle = new THREE.Mesh(particleGeometry, particleMaterial);
                const position = i / particleCount;
                
                const point = curve.getPoint(position);
                particle.position.copy(point);
                
                tube.add(particle);
                
                // Store animation data
                particle.userData = {
                    position,
                    speed: 0.005 + (Math.random() * 0.005),
                    curve
                };
                
                // Store particles for animation
                if (!this.energyParticles) this.energyParticles = [];
                this.energyParticles.push(particle);
            }
        }
        
        // Store userData for the tube
        tube.userData = {
            type: 'energyFlow',
            from: fromNode.userData.id,
            to: toNode.userData.id,
            capacity: capacity
        };
        
        return tube;
    }
    
    // Text sprite creation helper
    createTextSprite(text, size = 1) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 256;
        
        // Background
        context.fillStyle = 'rgba(0, 0, 0, 0.6)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Text
        context.font = '48px Arial';
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, canvas.width / 2, canvas.height / 2);
        
        // Create texture and sprite
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(size, size, 1);
        
        return sprite;
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

    // Update network efficiency in 3D mode
    updateNetworkEfficiency() {
        if (!this.scene || !this.networkNodes) return;
        
        // Update node colors based on efficiency
        this.networkNodes.forEach(node => {
            if (node.userData && node.userData.type) {
                const nodeType = node.userData.type;
                
                // Different node types have different efficiency representations
                if (nodeType === 'generator') {
                    // Higher efficiency = more vibrant color
                    const material = node.material || (node.children[0] && node.children[0].material);
                    if (material) {
                        const color = this.getNodeColorByEfficiency(this.options.efficiency, nodeType);
                        material.color.set(color);
                        
                        // Also adjust glow intensity
                        if (node.userData.glow) {
                            node.userData.glow.intensity = 0.5 + this.options.efficiency * 2;
                        }
                    }
                } else if (nodeType === 'distributor' || nodeType === 'consumer') {
                    // Update consumer/distributor node indicators
                    const material = node.material || (node.children[0] && node.children[0].material);
                    if (material) {
                        const color = this.getNodeColorByEfficiency(this.options.efficiency, nodeType);
                        material.color.set(color);
                    }
                }
            }
        });
        
        // Update edge colors based on efficiency
        if (this.networkEdges) {
            this.networkEdges.forEach(edge => {
                if (edge.material) {
                    // More efficient = more intense color
                    const opacity = 0.3 + (this.options.efficiency * 0.7);
                    edge.material.opacity = opacity;
                    
                    // Change color based on flow capacity and efficiency
                    const flowCapacity = edge.userData && edge.userData.capacity 
                        ? edge.userData.capacity 
                        : 1.0;
                    const color = this.getEdgeColorByEfficiency(this.options.efficiency, flowCapacity);
                    edge.material.color.set(color);
                }
            });
        }
        
        // Add efficiency indicators
        this.updateEfficiencyDisplay();
    }
    
    // Update network emissions in 3D mode
    updateNetworkEmissions() {
        if (!this.scene || !this.networkNodes) return;
        
        // Emission particles
        if (this.emissionParticles) {
            this.scene.remove(this.emissionParticles);
            this.emissionParticles = null;
        }
        
        // Only add particles for medium or high emissions
        if (this.options.emissions !== 'low') {
            // Create particle system for emissions
            const particleCount = this.options.emissions === 'high' ? 500 : 200;
            const particleGeometry = new THREE.BufferGeometry();
            const particlePositions = new Float32Array(particleCount * 3);
            
            // Create positions for emission particles near power generators
            let particleIndex = 0;
            this.networkNodes.forEach(node => {
                if (node.userData && node.userData.type === 'generator' && 
                    node.userData.emissionFactor > 0.2) {
                    
                    const nodePos = new THREE.Vector3();
                    node.getWorldPosition(nodePos);
                    
                    // Number of particles based on emission factor
                    const nodeParts = Math.floor(particleCount * node.userData.emissionFactor / this.networkNodes.length);
                    
                    for (let i = 0; i < nodeParts && particleIndex < particleCount; i++) {
                        particlePositions[particleIndex * 3] = nodePos.x + (Math.random() - 0.5) * 3;
                        particlePositions[particleIndex * 3 + 1] = nodePos.y + (Math.random() * 2);
                        particlePositions[particleIndex * 3 + 2] = nodePos.z + (Math.random() - 0.5) * 3;
                        particleIndex++;
                    }
                }
            });
            
            particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
            
            // Emission material
            const particleMaterial = new THREE.PointsMaterial({
                color: this.options.emissions === 'high' ? 0x666666 : 0x999999,
                size: this.options.emissions === 'high' ? 0.2 : 0.1,
                transparent: true,
                opacity: this.options.emissions === 'high' ? 0.8 : 0.4,
                depthWrite: false
            });
            
            this.emissionParticles = new THREE.Points(particleGeometry, particleMaterial);
            this.emissionParticles.userData = {
                type: 'emission',
                animationSpeed: this.options.emissions === 'high' ? 0.02 : 0.01
            };
            
            this.scene.add(this.emissionParticles);
        }
        
        // Update generator appearance based on emissions
        this.networkNodes.forEach(node => {
            if (node.userData && node.userData.type === 'generator') {
                // Set emission factor based on global setting
                if (this.options.emissions === 'high') {
                    node.userData.emissionFactor = node.userData.baseEmissionFactor || 0.8;
                } else if (this.options.emissions === 'medium') {
                    node.userData.emissionFactor = (node.userData.baseEmissionFactor || 0.8) * 0.6;
                } else {
                    node.userData.emissionFactor = (node.userData.baseEmissionFactor || 0.8) * 0.2;
                }
                
                // Update generator visual indicators
                if (node.userData.smokeEffect) {
                    const smokeOpacity = node.userData.emissionFactor * 0.8;
                    node.userData.smokeEffect.material.opacity = smokeOpacity;
                }
            }
        });
    }
    
    // Create efficiency display overlay
    updateEfficiencyDisplay() {
        // Remove existing display if any
        if (this.efficiencyDisplay) {
            this.container.removeChild(this.efficiencyDisplay);
        }
        
        // Create new display
        this.efficiencyDisplay = document.createElement('div');
        this.efficiencyDisplay.className = 'efficiency-display';
        this.efficiencyDisplay.style.position = 'absolute';
        this.efficiencyDisplay.style.bottom = '10px';
        this.efficiencyDisplay.style.right = '10px';
        this.efficiencyDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        this.efficiencyDisplay.style.color = 'white';
        this.efficiencyDisplay.style.padding = '8px 12px';
        this.efficiencyDisplay.style.borderRadius = '4px';
        this.efficiencyDisplay.style.fontSize = '12px';
        this.efficiencyDisplay.style.zIndex = '100';
        
        // Calculate network statistics
        const efficiency = this.options.efficiency;
        const networkLoss = 1 - efficiency;
        const co2Impact = this.getEmissionsFactor();
        
        // Set display content
        this.efficiencyDisplay.innerHTML = `
            <div><strong>Network Efficiency:</strong> ${Math.round(efficiency * 100)}%</div>
            <div><strong>Energy Loss:</strong> ${Math.round(networkLoss * 100)}%</div>
            <div><strong>CO<sub>2</sub> Impact:</strong> ${co2Impact}</div>
        `;
        
        this.container.appendChild(this.efficiencyDisplay);
    }
    
    // Get color for node based on efficiency
    getNodeColorByEfficiency(efficiency, nodeType) {
        if (nodeType === 'generator') {
            // Generators: Red (low efficiency) to Green (high efficiency)
            const r = Math.floor(255 * (1 - efficiency));
            const g = Math.floor(200 * efficiency);
            const b = 50;
            return `rgb(${r}, ${g}, ${b})`;
        } else if (nodeType === 'distributor') {
            // Distributors: Efficiency impacts brightness
            const baseValue = 100 + Math.floor(155 * efficiency);
            return `rgb(${baseValue}, ${baseValue}, ${baseValue})`;
        } else if (nodeType === 'consumer') {
            // Consumers: Blue with efficiency-based brightness
            const b = 100 + Math.floor(155 * efficiency);
            return `rgb(50, 100, ${b})`;
        }
        
        // Default
        return '#ffffff';
    }
    
    // Get color for energy flow edge based on efficiency
    getEdgeColorByEfficiency(efficiency, capacity) {
        // Blend between red (low efficiency) and blue (high efficiency)
        // with intensity based on capacity
        const intensityFactor = 0.5 + (capacity * 0.5);
        
        const r = Math.floor(200 * (1 - efficiency) * intensityFactor);
        const g = Math.floor(100 * intensityFactor);
        const b = Math.floor(200 * efficiency * intensityFactor);
        
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    // Get text description of emissions factor
    getEmissionsFactor() {
        switch (this.options.emissions) {
            case 'low':
                return 'Low';
            case 'medium':
                return 'Moderate';
            case 'high':
                return 'High';
            default:
                return 'Medium';
        }
    }

    // Create power grid visualization
    createPowerGrid() {
        if (!this.scene) return;
        
        const colors = this.get3DThemeColors();
        
        // Create a grid-based power distribution network
        const gridSize = 4;
        const nodeSpacing = 5;
        
        // Initialize nodes and edges
        const nodes = {};
        const nodeData = [];
        const edgeData = [];
        
        // Create power plant at the center
        nodeData.push({
            id: 'plant1',
            type: 'generator',
            label: 'P1',
            x: 0,
            y: 0,
            z: 0,
            capacity: 200,
            efficiency: this.options.efficiency
        });
        
        // Create substations in a grid pattern
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                // Skip the center where the power plant is
                if (i === Math.floor(gridSize/2) && j === Math.floor(gridSize/2)) continue;
                
                const x = (i - gridSize/2 + 0.5) * nodeSpacing;
                const z = (j - gridSize/2 + 0.5) * nodeSpacing;
                
                // Create substation node
                const substationId = `sub_${i}_${j}`;
                nodeData.push({
                    id: substationId,
                    type: 'distributor',
                    label: `S${i}${j}`,
                    x: x,
                    y: 0,
                    z: z,
                    capacity: 50 + Math.random() * 50
                });
                
                // Connect to power plant
                edgeData.push({
                    from: 'plant1',
                    to: substationId,
                    capacity: 0.6 + Math.random() * 0.3
                });
                
                // Create consumers around each substation
                const consumerCount = 1 + Math.floor(Math.random() * 3);
                const radius = 2;
                
                for (let k = 0; k < consumerCount; k++) {
                    const angle = (k / consumerCount) * Math.PI * 2;
                    const consumerId = `con_${i}_${j}_${k}`;
                    
                    // Position in a circle around the substation
                    const consumerX = x + Math.cos(angle) * radius;
                    const consumerZ = z + Math.sin(angle) * radius;
                    
                    nodeData.push({
                        id: consumerId,
                        type: 'consumer',
                        label: `C${i}${j}${k}`,
                        x: consumerX,
                        y: 0,
                        z: consumerZ,
                        demand: 20 + Math.random() * 30
                    });
                    
                    // Connect consumer to its substation
                    edgeData.push({
                        from: substationId,
                        to: consumerId,
                        capacity: 0.4 + Math.random() * 0.3
                    });
                }
            }
        }
        
        // Create nodes
        nodeData.forEach(data => {
            let node;
            
            if (data.type === 'generator') {
                node = this.createGeneratorNode(data, colors);
            } else if (data.type === 'distributor') {
                node = this.createDistributorNode(data, colors);
            } else if (data.type === 'consumer') {
                node = this.createConsumerNode(data, colors);
            }
            
            if (node) {
                nodes[data.id] = node;
                this.scene.add(node);
                this.networkNodes.push(node);
            }
        });
        
        // Create edges
        edgeData.forEach(data => {
            if (nodes[data.from] && nodes[data.to]) {
                const edge = this.createEnergyFlow(
                    nodes[data.from],
                    nodes[data.to],
                    data.capacity,
                    colors
                );
                
                if (edge) {
                    this.scene.add(edge);
                    this.networkEdges.push(edge);
                }
            }
        });
        
        // Add ground grid
        const groundSize = nodeSpacing * (gridSize + 1);
        const groundDivisions = gridSize * 2;
        const gridHelper = new THREE.GridHelper(groundSize, groundDivisions, 0x555555, 0x333333);
        gridHelper.position.y = -1;
        this.scene.add(gridHelper);
        
        // Update camera position
        this.camera.position.set(0, 25, 30);
        this.camera.lookAt(0, 0, 0);
    }

    // Create smart grid visualization
    createSmartGrid() {
        if (!this.scene) return;
        
        const colors = this.get3DThemeColors();
        
        // Create a smart grid with renewable sources and storage
        const nodeData = [];
        const edgeData = [];
        const nodes = {};
        
        // Main power plant
        nodeData.push({
            id: 'plant1',
            type: 'generator',
            label: 'P1',
            x: -8,
            y: 0,
            z: -8,
            capacity: 180,
            efficiency: this.options.efficiency * 0.9  // Slightly less efficient
        });
        
        // Renewable sources (solar and wind)
        nodeData.push({
            id: 'solar1',
            type: 'renewable',
            subtype: 'solar',
            label: 'S1',
            x: 8,
            y: 0,
            z: -8,
            capacity: 80,
            efficiency: 0.95
        });
        
        nodeData.push({
            id: 'wind1',
            type: 'renewable',
            subtype: 'wind',
            label: 'W1',
            x: 0,
            y: 0,
            z: -8,
            capacity: 60,
            efficiency: 0.9
        });
        
        // Battery storage
        nodeData.push({
            id: 'battery1',
            type: 'storage',
            label: 'B1',
            x: 4,
            y: 0,
            z: -4,
            capacity: 100,
            efficiency: 0.98
        });
        
        // Smart distribution substations
        for (let i = 0; i < 3; i++) {
            const x = -8 + i * 8;
            
            nodeData.push({
                id: `smart_sub${i}`,
                type: 'smartDistributor',
                label: `SD${i}`,
                x: x,
                y: 0,
                z: 0,
                capacity: 100
            });
        }
        
        // Consumer buildings
        for (let i = 0; i < 6; i++) {
            const x = -10 + i * 4;
            
            nodeData.push({
                id: `consumer${i}`,
                type: 'consumer',
                label: `C${i}`,
                x: x,
                y: 0,
                z: 6,
                demand: 20 + Math.random() * 40
            });
        }
        
        // Smart home with generation
        nodeData.push({
            id: 'smart_home',
            type: 'smartHome',
            label: 'SH',
            x: 8,
            y: 0,
            z: 3,
            demand: 30,
            generation: 20,
            efficiency: 0.9
        });
        
        // Create connections
        // Connect generators to substations
        edgeData.push({ from: 'plant1', to: 'smart_sub0', capacity: 0.8 });
        edgeData.push({ from: 'solar1', to: 'smart_sub2', capacity: 0.7 });
        edgeData.push({ from: 'wind1', to: 'smart_sub1', capacity: 0.6 });
        
        // Connect battery
        edgeData.push({ from: 'battery1', to: 'smart_sub1', capacity: 0.9 });
        edgeData.push({ from: 'solar1', to: 'battery1', capacity: 0.5 });
        
        // Interconnect substations (grid)
        edgeData.push({ from: 'smart_sub0', to: 'smart_sub1', capacity: 0.4 });
        edgeData.push({ from: 'smart_sub1', to: 'smart_sub2', capacity: 0.4 });
        
        // Connect consumers to nearest substation
        for (let i = 0; i < 6; i++) {
            const subIndex = Math.floor(i / 2);
            edgeData.push({
                from: `smart_sub${subIndex}`,
                to: `consumer${i}`,
                capacity: 0.4 + Math.random() * 0.3
            });
        }
        
        // Connect smart home
        edgeData.push({ from: 'smart_sub2', to: 'smart_home', capacity: 0.5 });
        edgeData.push({ from: 'smart_home', to: 'smart_sub2', capacity: 0.3 }); // Bidirectional flow
        
        // Create nodes
        nodeData.forEach(data => {
            let node;
            
            if (data.type === 'generator') {
                node = this.createGeneratorNode(data, colors);
            } else if (data.type === 'distributor' || data.type === 'smartDistributor') {
                node = this.createSmartDistributorNode(data, colors);
            } else if (data.type === 'consumer') {
                node = this.createConsumerNode(data, colors);
            } else if (data.type === 'renewable') {
                node = this.createRenewableNode(data, colors);
            } else if (data.type === 'storage') {
                node = this.createStorageNode(data, colors);
            } else if (data.type === 'smartHome') {
                node = this.createSmartHomeNode(data, colors);
            }
            
            if (node) {
                nodes[data.id] = node;
                this.scene.add(node);
                this.networkNodes.push(node);
            }
        });
        
        // Create edges with smart grid properties (bidirectional, smart monitoring)
        edgeData.forEach(data => {
            if (nodes[data.from] && nodes[data.to]) {
                const edge = this.createSmartEnergyFlow(
                    nodes[data.from],
                    nodes[data.to],
                    data.capacity,
                    colors
                );
                
                if (edge) {
                    this.scene.add(edge);
                    this.networkEdges.push(edge);
                }
            }
        });
        
        // Add ground
        const groundSize = 30;
        const groundDivisions = 30;
        const gridHelper = new THREE.GridHelper(groundSize, groundDivisions, 0x555555, 0x333333);
        gridHelper.position.y = -1;
        this.scene.add(gridHelper);
        
        // Update camera position
        this.camera.position.set(0, 20, 25);
        this.camera.lookAt(0, 0, 0);
    }
    
    // Create smart distributor node
    createSmartDistributorNode(nodeData, colors) {
        // Base node is similar to a distributor but with added "smart" features
        const node = this.createDistributorNode(nodeData, colors);
        
        if (node) {
            // Add smart monitoring features
            const monitorGeometry = new THREE.SphereGeometry(0.3, 16, 16);
            const monitorMaterial = new THREE.MeshPhongMaterial({
                color: 0x00ffff,
                shininess: 100,
                emissive: 0x003333
            });
            const monitor = new THREE.Mesh(monitorGeometry, monitorMaterial);
            monitor.position.set(0, 1.5, 0);
            node.add(monitor);
            
            // Create glowing effect
            const glowLight = new THREE.PointLight(0x00ffff, 0.5, 3);
            glowLight.position.set(0, 1.5, 0);
            node.add(glowLight);
            
            // Update userData
            node.userData.type = 'smartDistributor';
            node.userData.isSmart = true;
        }
        
        return node;
    }
    
    // Create renewable energy source node
    createRenewableNode(nodeData, colors) {
        const group = new THREE.Group();
        group.position.set(nodeData.x, nodeData.y, nodeData.z);
        
        const subtype = nodeData.subtype || 'solar';
        const efficiency = nodeData.efficiency || 0.95;
        
        if (subtype === 'solar') {
            // Create solar panel structure
            const baseGeometry = new THREE.BoxGeometry(3, 0.2, 3);
            const baseMaterial = new THREE.MeshPhongMaterial({
                color: 0x444444,
                shininess: 50
            });
            const base = new THREE.Mesh(baseGeometry, baseMaterial);
            base.position.y = -0.5;
            group.add(base);
            
            // Solar panels
            const panelGeometry = new THREE.BoxGeometry(2.8, 0.1, 2.8);
            const panelMaterial = new THREE.MeshPhongMaterial({
                color: 0x1a3c5a,
                shininess: 100,
                emissive: 0x0a1c2a
            });
            const panel = new THREE.Mesh(panelGeometry, panelMaterial);
            panel.position.y = -0.3;
            group.add(panel);
            
            // Add reflective surface
            const solarCellsGeometry = new THREE.PlaneGeometry(2.6, 2.6);
            const solarCellsMaterial = new THREE.MeshPhongMaterial({
                color: 0x2244aa,
                shininess: 200,
                emissive: 0x112244,
                specular: 0x6688cc
            });
            const solarCells = new THREE.Mesh(solarCellsGeometry, solarCellsMaterial);
            solarCells.rotation.x = -Math.PI / 2;
            solarCells.position.y = -0.25;
            group.add(solarCells);
            
        } else if (subtype === 'wind') {
            // Create wind turbine
            const poleGeometry = new THREE.CylinderGeometry(0.15, 0.2, 4, 8);
            const poleMaterial = new THREE.MeshPhongMaterial({
                color: 0xaaaaaa,
                shininess: 70
            });
            const pole = new THREE.Mesh(poleGeometry, poleMaterial);
            pole.position.y = 1;
            group.add(pole);
            
            // Turbine head
            const headGeometry = new THREE.BoxGeometry(1, 0.5, 0.5);
            const headMaterial = new THREE.MeshPhongMaterial({
                color: 0xeeeeee,
                shininess: 80
            });
            const head = new THREE.Mesh(headGeometry, headMaterial);
            head.position.y = 3.2;
            head.position.z = 0.1;
            group.add(head);
            
            // Turbine blades
            const bladeGroup = new THREE.Group();
            bladeGroup.position.y = 3.2;
            
            const createBlade = () => {
                const bladeGeometry = new THREE.BoxGeometry(0.1, 0.05, 1.5);
                const bladeMaterial = new THREE.MeshPhongMaterial({
                    color: 0xffffff,
                    shininess: 90
                });
                return new THREE.Mesh(bladeGeometry, bladeMaterial);
            };
            
            const blade1 = createBlade();
            blade1.position.z = 0.75;
            blade1.position.x = 0.5;
            
            const blade2 = createBlade();
            blade2.position.z = 0.75;
            blade2.position.x = -0.5;
            blade2.rotation.y = Math.PI / 2;
            
            const blade3 = createBlade();
            blade3.position.z = 0.75;
            blade3.rotation.y = -Math.PI / 4;
            blade3.position.x = 0.4;
            blade3.position.z = 0.4;
            
            bladeGroup.add(blade1);
            bladeGroup.add(blade2);
            bladeGroup.add(blade3);
            
            // Add animation data
            bladeGroup.userData = {
                rotationSpeed: 0.02,
                rotationAxis: 'z'
            };
            
            group.add(bladeGroup);
            group.userData.blades = bladeGroup;
        }
        
        // Label
        const label = this.createTextSprite(nodeData.label || (subtype === 'solar' ? 'S' : 'W'), 0.8);
        label.position.set(0, 2, 0);
        group.add(label);
        
        // Add userData for interactions
        group.userData = {
            type: 'renewable',
            subtype: subtype,
            id: nodeData.id,
            capacity: nodeData.capacity || 80,
            efficiency: efficiency,
            label: nodeData.label || (subtype === 'solar' ? 'S' : 'W'),
            baseEmissionFactor: 0.1  // Very low emissions for renewables
        };
        
        return group;
    }
    
    // Create energy storage node (battery)
    createStorageNode(nodeData, colors) {
        const group = new THREE.Group();
        group.position.set(nodeData.x, nodeData.y, nodeData.z);
        
        // Battery base
        const baseGeometry = new THREE.BoxGeometry(2, 0.5, 2);
        const baseMaterial = new THREE.MeshPhongMaterial({
            color: 0x444444,
            shininess: 60
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = -0.75;
        group.add(base);
        
        // Battery cells
        const batteryCellGeometry = new THREE.CylinderGeometry(0.4, 0.4, 1.5, 16);
        const batteryCellMaterial = new THREE.MeshPhongMaterial({
            color: 0x22aa22,
            shininess: 80
        });
        
        // Create multiple cells
        for (let i = 0; i < 4; i++) {
            const x = (i % 2 === 0) ? -0.5 : 0.5;
            const z = (i < 2) ? -0.5 : 0.5;
            
            const cell = new THREE.Mesh(batteryCellGeometry, batteryCellMaterial);
            cell.position.set(x, 0, z);
            group.add(cell);
        }
        
        // Battery status indicator
        const indicatorGeometry = new THREE.BoxGeometry(1.5, 0.2, 1.5);
        const indicatorMaterial = new THREE.MeshPhongMaterial({
            color: 0x22ff22,
            shininess: 100,
            emissive: 0x115511
        });
        const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
        indicator.position.y = 1;
        group.add(indicator);
        
        // Add glow effect
        const glow = new THREE.PointLight(0x33ff33, 1, 3);
        glow.position.y = 1;
        group.add(glow);
        
        // Label
        const label = this.createTextSprite(nodeData.label || 'B', 0.8);
        label.position.set(0, 2, 0);
        group.add(label);
        
        // Add userData for interactions
        group.userData = {
            type: 'storage',
            id: nodeData.id,
            capacity: nodeData.capacity || 100,
            efficiency: nodeData.efficiency || 0.95,
            label: nodeData.label || 'B',
            chargeLevel: 0.8,  // Initial charge level (80%)
            baseEmissionFactor: 0.05
        };
        
        return group;
    }
    
    // Create smart home with generation
    createSmartHomeNode(nodeData, colors) {
        const group = new THREE.Group();
        group.position.set(nodeData.x, nodeData.y, nodeData.z);
        
        // Base consumer building with solar panels
        const consumerNode = this.createConsumerNode(nodeData, colors);
        group.add(consumerNode);
        
        // Add small solar panel
        const panelGeometry = new THREE.BoxGeometry(1, 0.1, 1);
        const panelMaterial = new THREE.MeshPhongMaterial({
            color: 0x1a3c5a,
            shininess: 100
        });
        const panel = new THREE.Mesh(panelGeometry, panelMaterial);
        panel.position.y = 1.5;
        group.add(panel);
        
        // Add smart meter
        const meterGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.2);
        const meterMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ffff,
            emissive: 0x00aaaa,
            shininess: 120
        });
        const meter = new THREE.Mesh(meterGeometry, meterMaterial);
        meter.position.set(0.7, 0, 0.6);
        group.add(meter);
        
        // Smart home label
        const label = this.createTextSprite(nodeData.label || 'SH', 0.8);
        label.position.set(0, 2.5, 0);
        group.add(label);
        
        // Add userData for interactions
        group.userData = {
            type: 'smartHome',
            id: nodeData.id,
            demand: nodeData.demand || 30,
            generation: nodeData.generation || 20,
            efficiency: nodeData.efficiency || 0.9,
            label: nodeData.label || 'SH',
            isSmart: true
        };
        
        return group;
    }
    
    // Create smart energy flow with bidirectional capabilities
    createSmartEnergyFlow(fromNode, toNode, capacity, colors) {
        const flow = this.createEnergyFlow(fromNode, toNode, capacity, colors);
        
        if (flow) {
            // Add smart grid features
            flow.userData.isSmart = true;
            
            // Add data monitoring points
            const curve = flow.geometry.parameters.path;
            const points = curve.getPoints(4);
            
            // Add data point in the middle
            const midPoint = points[2];
            
            const monitorGeometry = new THREE.SphereGeometry(0.15, 8, 8);
            const monitorMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ffff,
                transparent: true,
                opacity: 0.8
            });
            const monitor = new THREE.Mesh(monitorGeometry, monitorMaterial);
            monitor.position.copy(midPoint);
            flow.add(monitor);
            
            // Add pulsing light effect
            const light = new THREE.PointLight(0x00ffff, 0.5, 1);
            light.position.copy(midPoint);
            flow.add(light);
            
            // Add animation data
            light.userData = {
                pulseSpeed: 0.05,
                minIntensity: 0.2,
                maxIntensity: 0.8
            };
            
            flow.userData.monitor = monitor;
            flow.userData.monitorLight = light;
        }
        
        return flow;
    }

    // Create distribution network visualization
    createDistributionNetwork() {
        if (!this.scene) return;
        
        const colors = this.get3DThemeColors();
        
        // Create a hierarchical distribution network
        const nodeData = [];
        const edgeData = [];
        const nodes = {};
        
        // Main power plant
        nodeData.push({
            id: 'mainPlant',
            type: 'generator',
            label: 'MP',
            x: 0,
            y: 0,
            z: -10,
            capacity: 250,
            efficiency: this.options.efficiency
        });
        
        // Main transformer stations
        const mainStationCount = 3;
        for (let i = 0; i < mainStationCount; i++) {
            const angle = (i / mainStationCount) * Math.PI - Math.PI/2;
            const x = Math.cos(angle) * 8;
            const z = Math.sin(angle) * 8;
            
            nodeData.push({
                id: `mainSub${i}`,
                type: 'distributor',
                label: `MS${i}`,
                x: x,
                y: 0,
                z: z,
                capacity: 120
            });
            
            // Connect to main plant
            edgeData.push({
                from: 'mainPlant',
                to: `mainSub${i}`,
                capacity: 0.9
            });
            
            // Secondary distribution nodes
            const secondaryCount = 2 + Math.floor(Math.random() * 2);
            const radius = 6;
            
            for (let j = 0; j < secondaryCount; j++) {
                const subAngle = angle + (j / secondaryCount - 0.5) * Math.PI/2;
                const subX = x + Math.cos(subAngle) * radius;
                const subZ = z + Math.sin(subAngle) * radius;
                
                nodeData.push({
                    id: `secondarySub${i}_${j}`,
                    type: 'distributor',
                    label: `S${i}${j}`,
                    x: subX,
                    y: 0,
                    z: subZ,
                    capacity: 60
                });
                
                // Connect to main substation
                edgeData.push({
                    from: `mainSub${i}`,
                    to: `secondarySub${i}_${j}`,
                    capacity: 0.7
                });
                
                // Create consumer clusters
                const consumerCount = 3 + Math.floor(Math.random() * 3);
                
                for (let k = 0; k < consumerCount; k++) {
                    const consumerAngle = subAngle + (k / consumerCount - 0.5) * Math.PI/3;
                    const distance = 3 + Math.random() * 2;
                    const consumerX = subX + Math.cos(consumerAngle) * distance;
                    const consumerZ = subZ + Math.sin(consumerAngle) * distance;
                    
                    nodeData.push({
                        id: `consumer${i}_${j}_${k}`,
                        type: 'consumer',
                        label: `C${i}${j}${k}`,
                        x: consumerX,
                        y: 0,
                        z: consumerZ,
                        demand: 20 + Math.random() * 30
                    });
                    
                    // Connect to secondary substation
                    edgeData.push({
                        from: `secondarySub${i}_${j}`,
                        to: `consumer${i}_${j}_${k}`,
                        capacity: 0.5
                    });
                }
            }
        }
        
        // Create nodes
        nodeData.forEach(data => {
            let node;
            
            if (data.type === 'generator') {
                node = this.createGeneratorNode(data, colors);
            } else if (data.type === 'distributor') {
                node = this.createDistributorNode(data, colors);
            } else if (data.type === 'consumer') {
                node = this.createConsumerNode(data, colors);
            }
            
            if (node) {
                nodes[data.id] = node;
                this.scene.add(node);
                this.networkNodes.push(node);
            }
        });
        
        // Create edges
        edgeData.forEach(data => {
            if (nodes[data.from] && nodes[data.to]) {
                const edge = this.createEnergyFlow(
                    nodes[data.from],
                    nodes[data.to],
                    data.capacity,
                    colors
                );
                
                if (edge) {
                    this.scene.add(edge);
                    this.networkEdges.push(edge);
                }
            }
        });
        
        // Add ground grid
        const gridSize = 35;
        const gridDivisions = 35;
        const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x555555, 0x333333);
        gridHelper.position.y = -1;
        this.scene.add(gridHelper);
        
        // Update camera position
        this.camera.position.set(0, 25, 25);
        this.camera.lookAt(0, 0, 0);
    }
    
    // Create renewable energy network
    createRenewableNetwork() {
        if (!this.scene) return;
        
        const colors = this.get3DThemeColors();
        
        // Create a network focused on renewable energy sources
        const nodeData = [];
        const edgeData = [];
        const nodes = {};
        
        // Small backup power plant
        nodeData.push({
            id: 'backupPlant',
            type: 'generator',
            label: 'BP',
            x: -12,
            y: 0,
            z: -7,
            capacity: 100,
            efficiency: this.options.efficiency * 0.8 // Less efficient
        });
        
        // Solar farm
        for (let i = 0; i < 6; i++) {
            const row = Math.floor(i / 3);
            const col = i % 3;
            
            nodeData.push({
                id: `solar${i}`,
                type: 'renewable',
                subtype: 'solar',
                label: `S${i}`,
                x: -5 + col * 4,
                y: 0,
                z: -10 + row * 4,
                capacity: 40 + Math.random() * 20,
                efficiency: 0.9 + Math.random() * 0.08
            });
        }
        
        // Wind farm
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const x = Math.cos(angle) * 10;
            const z = Math.sin(angle) * 10;
            
            nodeData.push({
                id: `wind${i}`,
                type: 'renewable',
                subtype: 'wind',
                label: `W${i}`,
                x: x + 8,
                y: 0,
                z: z - 8,
                capacity: 30 + Math.random() * 20,
                efficiency: 0.85 + Math.random() * 0.1
            });
        }
        
        // Main storage array
        nodeData.push({
            id: 'mainStorage',
            type: 'storage',
            label: 'MS',
            x: 5,
            y: 0,
            z: 0,
            capacity: 200,
            efficiency: 0.95
        });
        
        // Distribution nodes
        for (let i = 0; i < 3; i++) {
            nodeData.push({
                id: `distrib${i}`,
                type: 'smartDistributor',
                label: `D${i}`,
                x: -8 + i * 8,
                y: 0,
                z: 5,
                capacity: 80
            });
        }
        
        // Consumers
        for (let i = 0; i < 8; i++) {
            const x = -14 + i * 4;
            
            nodeData.push({
                id: `consumer${i}`,
                type: 'consumer',
                label: `C${i}`,
                x: x,
                y: 0,
                z: 12,
                demand: 20 + Math.random() * 30
            });
        }
        
        // Add smart homes with local generation
        for (let i = 0; i < 2; i++) {
            nodeData.push({
                id: `smartHome${i}`,
                type: 'smartHome',
                label: `SH${i}`,
                x: 5 + i * 6,
                y: 0,
                z: 7,
                demand: 25,
                generation: 15,
                efficiency: 0.92
            });
        }
        
        // Create connections
        // Connect renewable sources to storage and distribution
        for (let i = 0; i < 6; i++) {
            // Connect solar panels to main storage
            edgeData.push({
                from: `solar${i}`,
                to: 'mainStorage',
                capacity: 0.7 + Math.random() * 0.2
            });
        }
        
        for (let i = 0; i < 4; i++) {
            // Connect wind turbines to main storage
            edgeData.push({
                from: `wind${i}`,
                to: 'mainStorage',
                capacity: 0.6 + Math.random() * 0.3
            });
        }
        
        // Connect storage to distribution
        for (let i = 0; i < 3; i++) {
            edgeData.push({
                from: 'mainStorage',
                to: `distrib${i}`,
                capacity: 0.8
            });
        }
        
        // Connect backup plant to distribution
        edgeData.push({
            from: 'backupPlant',
            to: 'distrib0',
            capacity: 0.7
        });
        
        // Connect distribution to consumers
        for (let i = 0; i < 8; i++) {
            const distribIndex = Math.min(2, Math.floor(i / 3));
            edgeData.push({
                from: `distrib${distribIndex}`,
                to: `consumer${i}`,
                capacity: 0.6
            });
        }
        
        // Connect smart homes
        for (let i = 0; i < 2; i++) {
            // Connect to get power when needed
            edgeData.push({
                from: 'distrib2',
                to: `smartHome${i}`,
                capacity: 0.5
            });
            
            // Connect to give power back to grid
            edgeData.push({
                from: `smartHome${i}`,
                to: 'distrib2',
                capacity: 0.3
            });
        }
        
        // Create nodes
        nodeData.forEach(data => {
            let node;
            
            if (data.type === 'generator') {
                node = this.createGeneratorNode(data, colors);
            } else if (data.type === 'distributor') {
                node = this.createDistributorNode(data, colors);
            } else if (data.type === 'smartDistributor') {
                node = this.createSmartDistributorNode(data, colors);
            } else if (data.type === 'consumer') {
                node = this.createConsumerNode(data, colors);
            } else if (data.type === 'renewable') {
                node = this.createRenewableNode(data, colors);
            } else if (data.type === 'storage') {
                node = this.createStorageNode(data, colors);
            } else if (data.type === 'smartHome') {
                node = this.createSmartHomeNode(data, colors);
            }
            
            if (node) {
                nodes[data.id] = node;
                this.scene.add(node);
                this.networkNodes.push(node);
            }
        });
        
        // Create edges
        edgeData.forEach(data => {
            if (nodes[data.from] && nodes[data.to]) {
                // Use smart flows for all connections in the renewable network
                const edge = this.createSmartEnergyFlow(
                    nodes[data.from],
                    nodes[data.to],
                    data.capacity,
                    colors
                );
                
                if (edge) {
                    this.scene.add(edge);
                    this.networkEdges.push(edge);
                }
            }
        });
        
        // Add terrain base (green for renewable emphasis)
        const groundGeometry = new THREE.PlaneGeometry(50, 50, 20, 20);
        const groundMaterial = new THREE.MeshLambertMaterial({
            color: 0x337733,
            side: THREE.DoubleSide
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -1;
        this.scene.add(ground);
        
        // Update camera position
        this.camera.position.set(0, 30, 30);
        this.camera.lookAt(0, 0, 0);
    }
}

// Helper function to initialize the Energy Network Visualizer
function initEnergyNetworkVisualizer(container, options = {}) {
    console.log("Initializing Energy Network Visualizer for", container);
    
    try {
        // Handle both string ID or DOM element
        if (typeof container === 'string' || container instanceof HTMLElement) {
            return new EnergyNetworkVisualizer(container, options);
        } else {
            console.error("Container must be a string ID or a DOM element");
            return null;
        }
    } catch (error) {
        console.error("Failed to initialize energy network visualizer:", error);
        
        // Create error message
        const containerElement = typeof container === 'string' ? 
            document.getElementById(container) : container;
            
        if (containerElement) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'alert alert-danger mt-3';
            errorDiv.innerHTML = `
                <h5>Energy Network Visualization Error</h5>
                <p>${error.message || 'Failed to initialize energy network visualizer'}</p>
                <p>Check browser console for more details.</p>
            `;
            containerElement.appendChild(errorDiv);
        }
        
        return null;
    }
}

// For backwards compatibility
function initDataStructureVisualizer(container, options = {}) {
    console.warn("initDataStructureVisualizer is deprecated. Use initEnergyNetworkVisualizer instead.");
    return initEnergyNetworkVisualizer(container, options);
}

// Auto-initialize all energy network visualizers when the document loads
document.addEventListener('DOMContentLoaded', function() {
    console.log("Auto-initializing Energy Network Visualizers");
    
    // Find all containers with the visualizer class/attribute
    const containers = document.querySelectorAll('.energy-network-visualizer, [data-visualizer-type="energy-network"]');
    
    containers.forEach(container => {
        // Skip if already initialized
        if (container.hasAttribute('data-viz-initialized')) return;
        
        // Get configuration from data attribute
        let options = {};
        const configAttr = container.getAttribute('data-visualizer-config');
        
        if (configAttr) {
            try {
                options = JSON.parse(configAttr);
            } catch (e) {
                console.error("Invalid configuration JSON:", e);
            }
        }
        
        // Initialize visualizer
        initEnergyNetworkVisualizer(container, options);
        
        // Mark as initialized
        container.setAttribute('data-viz-initialized', 'true');
    });
    
    // For backwards compatibility
    const oldContainers = document.querySelectorAll('.data-structure-visualizer, [data-visualizer-type="data-structure"], [data-visualizer-type="datastructure"]');
    
    oldContainers.forEach(container => {
        // Skip if already initialized
        if (container.hasAttribute('data-viz-initialized')) return;
        
        // Get configuration from data attribute
        let options = {};
        const configAttr = container.getAttribute('data-visualizer-config');
        
        if (configAttr) {
            try {
                options = JSON.parse(configAttr);
            } catch (e) {
                console.error("Invalid configuration JSON:", e);
            }
        }
        
        // Initialize visualizer
        initEnergyNetworkVisualizer(container, options);
        
        // Mark as initialized
        container.setAttribute('data-viz-initialized', 'true');
    });
});

// Expose the initializer function globally
window.initEnergyNetworkVisualizer = initEnergyNetworkVisualizer;

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