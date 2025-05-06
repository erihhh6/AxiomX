/**
 * Simple Data Structure Visualizer
 * 
 * This is a lightweight replacement for the original data structure visualizer.
 * It uses canvas API instead of Three.js for better compatibility and performance.
 */

class DataStructureVisualizer {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`Container with ID '${containerId}' not found.`);
            return;
        }

        // Default options
        this.options = Object.assign({
            type: 'tree',
            data: null
        }, options);

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

        this.init();
    }

    updateStatus(message, isError = false) {
        if (this.statusIndicator) {
            this.statusIndicator.textContent = message;
            this.statusIndicator.style.color = isError ? '#dc3545' : '#666';
        }
    }

    init() {
        console.log("Initializing data structure visualizer");
        
        // Clear container except status indicator
        const currentStatus = this.statusIndicator;
        this.container.innerHTML = '';
        this.container.appendChild(currentStatus);
        
        // Set up container dimensions
        this.width = this.container.clientWidth;
        this.height = 300;
        
        // Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.container.appendChild(this.canvas);
        
        // Get drawing context
        this.ctx = this.canvas.getContext('2d');
        
        try {
            // Create controls
            this.createControls();
            
            // Draw the structure
            this.draw();
            
            this.updateStatus(`${this.options.type} visualization active`);
            
            // Handle window resize
            window.addEventListener('resize', () => this.onWindowResize());
        } catch (error) {
            console.error("Error initializing data structure visualizer:", error);
            this.updateStatus('Error initializing visualizer', true);
            this.showError(error);
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
    }
    
    createControls() {
        const controlsDiv = document.createElement('div');
        controlsDiv.style.marginBottom = '10px';
        controlsDiv.style.padding = '10px';
        controlsDiv.style.backgroundColor = '#f8f9fa';
        controlsDiv.style.borderRadius = '4px';
        controlsDiv.style.display = 'flex';
        controlsDiv.style.flexWrap = 'wrap';
        controlsDiv.style.gap = '10px';
        controlsDiv.style.alignItems = 'center';
        
        // Type selection control
        const typeDiv = document.createElement('div');
        typeDiv.innerHTML = `<label>Structure type: </label> `;
        const typeSelect = document.createElement('select');
        typeSelect.className = 'form-select form-select-sm';
        typeSelect.style.display = 'inline-block';
        typeSelect.style.width = 'auto';
        typeSelect.style.marginLeft = '5px';
        
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
            this.draw();
            this.updateStatus(`${this.options.type} visualization active`);
        });
        
        typeDiv.appendChild(typeSelect);
        controlsDiv.appendChild(typeDiv);
        
        // Color theme selector
        const themeDiv = document.createElement('div');
        themeDiv.innerHTML = `<label>Color theme: </label> `;
        const themeSelect = document.createElement('select');
        themeSelect.className = 'form-select form-select-sm';
        themeSelect.style.display = 'inline-block';
        themeSelect.style.width = 'auto';
        themeSelect.style.marginLeft = '5px';
        
        const themes = [
            { value: 'default', text: 'Default' },
            { value: 'dark', text: 'Dark' },
            { value: 'pastel', text: 'Pastel' }
        ];
        
        themes.forEach(theme => {
            const option = document.createElement('option');
            option.value = theme.value;
            option.text = theme.text;
            themeSelect.appendChild(option);
        });
        
        themeSelect.addEventListener('change', (e) => {
            this.colorTheme = e.target.value;
            this.draw();
        });
        
        themeDiv.appendChild(themeSelect);
        controlsDiv.appendChild(themeDiv);
        
        // Save as Image button
        const saveButton = document.createElement('button');
        saveButton.className = 'btn btn-sm btn-outline-primary';
        saveButton.innerHTML = '<i class="fas fa-download"></i> Save as PNG';
        saveButton.onclick = () => this.saveAsPNG();
        controlsDiv.appendChild(saveButton);
        
        // Add controls to container
        this.container.prepend(controlsDiv);
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
        const { ctx, width, height } = this;
        const nodeRadius = 20;
        const levelHeight = 70;
        const centerX = width / 2;
        
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

// Helper function to initialize the data structure visualizer
function initDataStructureVisualizer(containerId, options = {}) {
    console.log("Creating data structure visualizer for", containerId);
    return new DataStructureVisualizer(containerId, options);
}

// Example usage:
// const visualizer = initDataStructureVisualizer('container', {
//     type: 'tree',
//     data: customTreeData
// }); 