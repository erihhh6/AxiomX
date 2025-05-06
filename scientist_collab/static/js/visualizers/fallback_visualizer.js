/**
 * Fallback Visualizer
 * 
 * This provides simple fallback visualizers when the main ones can't load due to
 * missing dependencies or errors.
 */

// Wave Fallback
function createFallbackWaveVisualizer(container, config = {}) {
    const canvas = document.createElement('canvas');
    canvas.width = container.clientWidth;
    canvas.height = 300;
    container.innerHTML = '';
    container.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    const centerY = canvas.height / 2;
    const amplitude = config.amplitude || 50;
    const frequency = config.frequency || 0.05;
    const speed = config.speed || 0.05;
    
    function animate() {
        const time = Date.now() * 0.001;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw axis
        ctx.beginPath();
        ctx.strokeStyle = '#ccc';
        ctx.moveTo(0, centerY);
        ctx.lineTo(canvas.width, centerY);
        ctx.stroke();
        
        // Draw simple sine wave
        ctx.beginPath();
        ctx.strokeStyle = '#1a75ff';
        ctx.lineWidth = 2;
        
        for (let x = 0; x < canvas.width; x++) {
            const y = centerY + Math.sin(x * frequency + time * speed) * amplitude;
            
            if (x === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.stroke();
        
        // Continue animation
        requestAnimationFrame(animate);
    }
    
    // Start animation
    animate();
    
    // Add message
    const message = document.createElement('div');
    message.style.marginTop = '10px';
    message.style.padding = '10px';
    message.style.backgroundColor = '#f8f9fa';
    message.style.borderRadius = '5px';
    message.style.fontSize = '14px';
    message.innerHTML = `
        <p><strong>Fallback Wave Visualizer</strong></p>
        <p class="text-muted">The full simulator could not be loaded. This is a simplified version.</p>
    `;
    container.appendChild(message);
}

// DNA Fallback
function createFallbackDNAVisualizer(container, config = {}) {
    const sequence = config.sequence || 'ATGCAGCTGATGCTAGCTA';
    
    // Create wrapper
    container.innerHTML = '';
    
    // Create sequence display with colored nucleotides
    const sequenceDisplay = document.createElement('div');
    sequenceDisplay.style.fontFamily = 'monospace';
    sequenceDisplay.style.fontSize = '18px';
    sequenceDisplay.style.padding = '20px';
    sequenceDisplay.style.backgroundColor = '#f8f9fa';
    sequenceDisplay.style.borderRadius = '5px';
    sequenceDisplay.style.textAlign = 'center';
    sequenceDisplay.style.letterSpacing = '2px';
    container.appendChild(sequenceDisplay);
    
    // Color nucleotides
    const colorMap = {
        'A': '#A0A0FF',
        'T': '#FFA0A0',
        'G': '#A0FFA0',
        'C': '#FFFFA0',
        'U': '#FFC0A0'
    };
    
    for (let i = 0; i < sequence.length; i++) {
        const nucleotide = sequence[i].toUpperCase();
        const span = document.createElement('span');
        span.textContent = nucleotide;
        span.style.backgroundColor = colorMap[nucleotide] || '#fff';
        span.style.padding = '2px';
        span.style.margin = '1px';
        span.style.borderRadius = '3px';
        
        // Add position tooltip
        span.title = `Position: ${i + 1}`;
        
        sequenceDisplay.appendChild(span);
        
        // Add space every 10 nucleotides
        if ((i + 1) % 10 === 0) {
            const spacer = document.createElement('span');
            spacer.innerHTML = ' ';
            sequenceDisplay.appendChild(spacer);
        }
        
        // Add line break every 50 nucleotides
        if ((i + 1) % 50 === 0) {
            sequenceDisplay.appendChild(document.createElement('br'));
        }
    }
    
    // Add sequence info
    const info = document.createElement('div');
    info.style.marginTop = '20px';
    info.style.textAlign = 'center';
    
    const nucleotideCounts = {};
    for (const nucleotide of sequence) {
        nucleotideCounts[nucleotide] = (nucleotideCounts[nucleotide] || 0) + 1;
    }
    
    info.innerHTML = `
        <p><strong>Sequence Info:</strong></p>
        <p>Length: ${sequence.length} bp</p>
        <p>GC Content: ${Math.round((nucleotideCounts['G'] || 0 + nucleotideCounts['C'] || 0) / sequence.length * 100)}%</p>
    `;
    container.appendChild(info);
    
    // Add message
    const message = document.createElement('div');
    message.style.marginTop = '10px';
    message.style.padding = '10px';
    message.style.backgroundColor = '#f8f9fa';
    message.style.borderRadius = '5px';
    message.style.fontSize = '14px';
    message.innerHTML = `
        <p><strong>Fallback DNA Visualizer</strong></p>
        <p class="text-muted">The full DNA/RNA viewer could not be loaded. This is a simplified view.</p>
    `;
    container.appendChild(message);
}

// Data Structure Fallback
function createFallbackDataStructureVisualizer(container, config = {}) {
    const type = config.structureType || 'tree';
    
    // Create wrapper
    container.innerHTML = '';
    
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = container.clientWidth;
    canvas.height = 300;
    container.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    
    // Draw simple visualization based on type
    switch (type.toLowerCase()) {
        case 'tree':
            drawSimpleTree(ctx, canvas.width / 2, 40, canvas.width * 0.8);
            break;
        case 'graph':
            drawSimpleGraph(ctx, canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) * 0.3);
            break;
        case 'linkedlist':
        case 'linked-list':
        case 'linked_list':
            drawSimpleLinkedList(ctx, 50, canvas.height / 2, canvas.width - 100);
            break;
        case 'array':
            drawSimpleArray(ctx, 50, canvas.height / 2, canvas.width - 100);
            break;
        default:
            // Default to tree
            drawSimpleTree(ctx, canvas.width / 2, 40, canvas.width * 0.8);
    }
    
    // Add message
    const message = document.createElement('div');
    message.style.marginTop = '10px';
    message.style.padding = '10px';
    message.style.backgroundColor = '#f8f9fa';
    message.style.borderRadius = '5px';
    message.style.fontSize = '14px';
    message.innerHTML = `
        <p><strong>Fallback Data Structure Visualizer</strong></p>
        <p class="text-muted">The full data structure visualizer could not be loaded. This is a simplified representation.</p>
    `;
    container.appendChild(message);
}

// Simple tree drawing
function drawSimpleTree(ctx, x, y, width) {
    const levels = 3;
    const nodeRadius = 20;
    const levelHeight = 60;
    
    // Draw root
    drawNode(ctx, x, y, 'A');
    
    // Level 2
    const x1 = x - width/4;
    const x2 = x + width/4;
    const y2 = y + levelHeight;
    
    drawNode(ctx, x1, y2, 'B');
    drawNode(ctx, x2, y2, 'C');
    
    drawEdge(ctx, x, y, x1, y2);
    drawEdge(ctx, x, y, x2, y2);
    
    // Level 3
    const x3 = x1 - width/8;
    const x4 = x1 + width/8;
    const x5 = x2 - width/8;
    const x6 = x2 + width/8;
    const y3 = y2 + levelHeight;
    
    drawNode(ctx, x3, y3, 'D');
    drawNode(ctx, x4, y3, 'E');
    drawNode(ctx, x5, y3, 'F');
    drawNode(ctx, x6, y3, 'G');
    
    drawEdge(ctx, x1, y2, x3, y3);
    drawEdge(ctx, x1, y2, x4, y3);
    drawEdge(ctx, x2, y2, x5, y3);
    drawEdge(ctx, x2, y2, x6, y3);
}

// Simple graph drawing
function drawSimpleGraph(ctx, centerX, centerY, radius) {
    const nodeCount = 6;
    const nodePositions = [];
    const nodeRadius = 20;
    
    // Calculate node positions in a circle
    for (let i = 0; i < nodeCount; i++) {
        const angle = (i / nodeCount) * Math.PI * 2;
        nodePositions.push({
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius,
            label: String.fromCharCode(65 + i) // A, B, C, ...
        });
    }
    
    // Draw edges (in this case, a simple cycle)
    for (let i = 0; i < nodeCount; i++) {
        const nextIdx = (i + 1) % nodeCount;
        drawEdge(ctx, nodePositions[i].x, nodePositions[i].y, 
                 nodePositions[nextIdx].x, nodePositions[nextIdx].y);
    }
    
    // Draw nodes on top of edges
    for (const node of nodePositions) {
        drawNode(ctx, node.x, node.y, node.label);
    }
}

// Simple linked list drawing
function drawSimpleLinkedList(ctx, x, y, width) {
    const nodeCount = 5;
    const nodeWidth = 60;
    const nodeHeight = 40;
    const spacing = (width - nodeCount * nodeWidth) / (nodeCount - 1);
    
    let currentX = x;
    
    for (let i = 0; i < nodeCount; i++) {
        // Draw node
        ctx.fillStyle = '#e9ecef';
        ctx.strokeStyle = '#6c757d';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(currentX, y - nodeHeight/2, nodeWidth, nodeHeight);
        ctx.fill();
        ctx.stroke();
        
        // Divide node into data and pointer sections
        const pointerX = currentX + nodeWidth * 0.7;
        ctx.beginPath();
        ctx.moveTo(pointerX, y - nodeHeight/2);
        ctx.lineTo(pointerX, y + nodeHeight/2);
        ctx.stroke();
        
        // Add text (value)
        ctx.fillStyle = '#212529';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String.fromCharCode(65 + i), currentX + nodeWidth * 0.35, y);
        
        // Draw pointer arrow (if not last node)
        if (i < nodeCount - 1) {
            const arrowX = currentX + nodeWidth;
            const arrowEndX = currentX + nodeWidth + spacing;
            
            // Draw arrow line
            ctx.beginPath();
            ctx.moveTo(arrowX, y);
            ctx.lineTo(arrowEndX, y);
            ctx.stroke();
            
            // Draw arrowhead
            ctx.beginPath();
            ctx.moveTo(arrowEndX, y);
            ctx.lineTo(arrowEndX - 10, y - 5);
            ctx.lineTo(arrowEndX - 10, y + 5);
            ctx.closePath();
            ctx.fill();
        } else {
            // NULL terminator for last node
            const nullX = currentX + nodeWidth + 10;
            ctx.font = 'bold 14px Arial';
            ctx.fillText('NULL', nullX + 25, y);
        }
        
        currentX += nodeWidth + spacing;
    }
}

// Simple array drawing
function drawSimpleArray(ctx, x, y, width) {
    const cellCount = 8;
    const cellWidth = width / cellCount;
    const cellHeight = 50;
    
    // Draw cells
    for (let i = 0; i < cellCount; i++) {
        const cellX = x + i * cellWidth;
        
        // Fill with alternating colors
        ctx.fillStyle = i % 2 === 0 ? '#e9ecef' : '#f8f9fa';
        ctx.fillRect(cellX, y - cellHeight/2, cellWidth, cellHeight);
        
        // Draw border
        ctx.strokeStyle = '#6c757d';
        ctx.lineWidth = 1;
        ctx.strokeRect(cellX, y - cellHeight/2, cellWidth, cellHeight);
        
        // Draw content
        ctx.fillStyle = '#212529';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String.fromCharCode(65 + i), cellX + cellWidth/2, y);
        
        // Draw index
        ctx.font = '12px Arial';
        ctx.fillText(i.toString(), cellX + cellWidth/2, y - cellHeight/2 - 10);
    }
}

// Helper for drawing nodes
function drawNode(ctx, x, y, label) {
    const radius = 20;
    
    // Draw circle
    ctx.fillStyle = '#e9ecef';
    ctx.strokeStyle = '#6c757d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Draw text
    ctx.fillStyle = '#212529';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y);
}

// Helper for drawing edges
function drawEdge(ctx, x1, y1, x2, y2) {
    const nodeRadius = 20;
    
    // Calculate direction vector
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    
    // Normalize and scale by node radius
    const normalizedX = dx / len;
    const normalizedY = dy / len;
    
    // Adjust start and end points to be on the circumference of the nodes
    const startX = x1 + normalizedX * nodeRadius;
    const startY = y1 + normalizedY * nodeRadius;
    const endX = x2 - normalizedX * nodeRadius;
    const endY = y2 - normalizedY * nodeRadius;
    
    // Draw the line
    ctx.strokeStyle = '#6c757d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    // Draw arrowhead
    const arrowSize = 10;
    const angle = Math.atan2(dy, dx);
    
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
        endX - arrowSize * Math.cos(angle - Math.PI/6),
        endY - arrowSize * Math.sin(angle - Math.PI/6)
    );
    ctx.lineTo(
        endX - arrowSize * Math.cos(angle + Math.PI/6),
        endY - arrowSize * Math.sin(angle + Math.PI/6)
    );
    ctx.closePath();
    ctx.fillStyle = '#6c757d';
    ctx.fill();
}

// Fallback visualizer factory
const FallbackVisualizer = {
    create: function(container, type, config = {}) {
        console.log(`Creating fallback ${type} visualizer`);
        
        // Normalize the type
        const normalizedType = this.normalizeType(type);
        
        // Create the appropriate visualizer based on normalized type
        switch (normalizedType) {
            case 'wave-simulator':
                createFallbackWaveVisualizer(container, config);
                break;
            case 'dna-visualizer':
                createFallbackDNAVisualizer(container, config);
                break;
            case 'data-structure':
                createFallbackDataStructureVisualizer(container, config);
                break;
            default:
                container.innerHTML = `<div class="alert alert-warning">
                    Visualizer type "${type}" is not supported.
                </div>`;
        }
    },
    
    // Helper function to normalize different type names
    normalizeType: function(type) {
        // Type mapping for various formats
        const typeMap = {
            'wave': 'wave-simulator',
            'wave-simulator': 'wave-simulator',
            'waves': 'wave-simulator',
            
            'dna': 'dna-visualizer',
            'dna-visualizer': 'dna-visualizer',
            'rna': 'dna-visualizer',
            
            'datastructure': 'data-structure',
            'data-structure': 'data-structure',
            'data_structure': 'data-structure'
        };
        
        // If type is found in map, return the normalized version, otherwise return original
        return typeMap[type.toLowerCase()] || type;
    }
}; 