// DNA/RNA Visualizer Component
// This component creates a visualizer for DNA and RNA sequences with marker support
// With added 3D visualization - Updated version

class DNAVisualizer {
    constructor(containerId, options = {}) {
        console.log("DNAVisualizer 3D version initialized for", containerId);
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`Container with ID '${containerId}' not found.`);
            return;
        }

        // Default options
        this.options = {
            sequence: '',
            markers: [],
            showNumbers: true,
            showControls: true,
            width: this.container.clientWidth,
            height: 300,
            fontSize: 14,
            nucleotideColors: {
                A: '#A0A0FF', // Adenine - blue
                T: '#FFA0A0', // Thymine - red
                G: '#A0FFA0', // Guanine - green
                C: '#FFFFA0', // Cytosine - yellow
                U: '#FFC0A0'  // Uracil - orange (for RNA)
            },
            mode: '3d', // Force 3D mode by default
            ...options
        };

        // Explicitly set to 3D mode to override any passed options
        this.options.mode = '3d';

        // Add a visual indicator that this is the 3D version
        const versionIndicator = document.createElement('div');
        versionIndicator.className = 'dna-visualizer-version';
        versionIndicator.textContent = '3D DNA Visualizer v2.0';
        versionIndicator.style.position = 'absolute';
        versionIndicator.style.top = '5px';
        versionIndicator.style.right = '10px';
        versionIndicator.style.fontSize = '10px';
        versionIndicator.style.color = '#fff';
        versionIndicator.style.backgroundColor = 'rgba(0,0,0,0.5)';
        versionIndicator.style.padding = '2px 5px';
        versionIndicator.style.borderRadius = '3px';
        versionIndicator.style.zIndex = '100';
        this.container.appendChild(versionIndicator);

        // Add status indicator
        this.statusIndicator = document.createElement('div');
        this.statusIndicator.className = 'dna-visualizer-status';
        this.statusIndicator.style.fontSize = '12px';
        this.statusIndicator.style.color = '#666';
        this.statusIndicator.style.marginTop = '4px';
        this.statusIndicator.style.marginBottom = '4px';
        this.statusIndicator.style.textAlign = 'center';
        this.container.appendChild(this.statusIndicator);
        this.updateStatus('Initializing DNA/RNA 3D visualizer...');

        this.init();
    }

    updateStatus(message, isError = false) {
        if (this.statusIndicator) {
            this.statusIndicator.textContent = message;
            this.statusIndicator.style.color = isError ? '#dc3545' : '#666';
        }
    }

    init() {
        // Check if sequence was provided
        if (!this.options.sequence) {
            if (typeof EXAMPLE_SEQUENCES !== 'undefined' && EXAMPLE_SEQUENCES.dna) {
                this.options.sequence = EXAMPLE_SEQUENCES.dna;
            } else {
                // Create a default sequence
                this.options.sequence = "ATGCATGCATGCATGCATGCATGCATGCATGCATGCATGC";
            }
            this.updateStatus('Using example DNA/RNA sequence (no sequence provided)');
        } else {
            this.updateStatus('Visualizing provided DNA/RNA sequence');
        }

        // Clear container except status indicator
        const currentStatus = this.statusIndicator;
        this.container.innerHTML = '';
        this.container.appendChild(currentStatus);

        // Create visualizer based on mode
        this.createToolbar();
        
        // Create the main visualization container
        this.visualizerContainer = document.createElement('div');
        this.visualizerContainer.className = 'dna-visualizer-container';
        this.visualizerContainer.style.width = '100%';
        this.visualizerContainer.style.height = `${this.options.height}px`;
        this.visualizerContainer.style.position = 'relative';
        this.visualizerContainer.style.border = '1px solid #dee2e6';
        this.visualizerContainer.style.borderRadius = '4px';
        this.visualizerContainer.style.overflow = 'hidden';
        this.container.appendChild(this.visualizerContainer);
        
        // Create both containers but only show the active one
        this.createTextVisualizer();
        this.createThreeDVisualizer();
        
        // Show the appropriate view
        this.switchView(this.options.mode);
        
        this.updateStatus(`${this.getSequenceType()} sequence (${this.options.sequence.length} bases)`);
    }

    getSequenceType() {
        return this.options.sequence.includes('U') ? 'RNA' : 'DNA';
    }

    renderError() {
        this.sequenceContainer.innerHTML = `
            <div class="alert alert-danger">
                <h5>Error Rendering Sequence</h5>
                <p>Could not render the DNA/RNA sequence. Check browser console for details.</p>
            </div>
        `;
    }

    createToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'dna-visualizer-toolbar';
        toolbar.style.marginBottom = '10px';
        toolbar.style.display = 'flex';
        toolbar.style.gap = '10px';
        toolbar.style.alignItems = 'center';
        toolbar.style.flexWrap = 'wrap';
        this.container.appendChild(toolbar);

        // Zoom controls
        const zoomInBtn = document.createElement('button');
        zoomInBtn.className = 'btn btn-sm btn-outline-secondary';
        zoomInBtn.innerHTML = '<i class="fas fa-search-plus"></i> Zoom In';
        zoomInBtn.title = 'Zoom In';
        zoomInBtn.onclick = () => this.zoom(1.2);
        toolbar.appendChild(zoomInBtn);

        const zoomOutBtn = document.createElement('button');
        zoomOutBtn.className = 'btn btn-sm btn-outline-secondary';
        zoomOutBtn.innerHTML = '<i class="fas fa-search-minus"></i> Zoom Out';
        zoomOutBtn.title = 'Zoom Out';
        zoomOutBtn.onclick = () => this.zoom(0.8);
        toolbar.appendChild(zoomOutBtn);

        // Toggle view mode (3D/Text)
        const toggleViewBtn = document.createElement('button');
        toggleViewBtn.className = 'btn btn-sm btn-outline-primary';
        toggleViewBtn.innerHTML = '<i class="fas fa-cube"></i> Switch View';
        toggleViewBtn.title = 'Switch between 3D and Text view';
        toggleViewBtn.onclick = () => {
            this.options.mode = this.options.mode === '3d' ? 'text' : '3d';
            this.switchView(this.options.mode);
        };
        toolbar.appendChild(toggleViewBtn);

        // Toggle numbers
        const toggleNumbersBtn = document.createElement('button');
        toggleNumbersBtn.className = 'btn btn-sm btn-outline-secondary';
        toggleNumbersBtn.innerHTML = '<i class="fas fa-list-ol"></i> Position Numbers';
        toggleNumbersBtn.title = 'Toggle Position Numbers';
        toggleNumbersBtn.onclick = () => {
            this.options.showNumbers = !this.options.showNumbers;
            this.renderSequence();
        };
        toolbar.appendChild(toggleNumbersBtn);

        // Download as image
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'btn btn-sm btn-outline-primary';
        downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download PNG';
        downloadBtn.title = 'Download as PNG';
        downloadBtn.onclick = () => this.downloadAsPNG();
        toolbar.appendChild(downloadBtn);

        // Sequence type indicator (DNA/RNA)
        const sequenceType = document.createElement('span');
        sequenceType.className = 'badge bg-info ms-auto';
        sequenceType.style.marginLeft = 'auto';
        sequenceType.textContent = this.getSequenceType();
        toolbar.appendChild(sequenceType);
    }
    
    switchView(mode) {
        // Hide both containers first
        if (this.textContainer) {
            this.textContainer.style.display = 'none';
        }
        if (this.threeDContainer) {
            this.threeDContainer.style.display = 'none';
        }
        
        // Show the selected container
        if (mode === 'text' && this.textContainer) {
            this.textContainer.style.display = 'block';
        } else if (mode === '3d' && this.threeDContainer) {
            this.threeDContainer.style.display = 'block';
            // Restart animation if it was paused
            if (this.animationPaused) {
                this.startAnimation();
            }
        }
    }
    
    createTextVisualizer() {
        // Create text visualization container
        this.textContainer = document.createElement('div');
        this.textContainer.className = 'dna-text-container';
        this.textContainer.style.width = '100%';
        this.textContainer.style.height = '100%';
        this.textContainer.style.overflowX = 'auto';
        this.textContainer.style.overflowY = 'hidden';
        this.textContainer.style.position = 'relative';
        this.textContainer.style.fontFamily = 'monospace';
        this.textContainer.style.fontSize = `${this.options.fontSize}px`;
        this.textContainer.style.lineHeight = `${this.options.fontSize * 1.5}px`;
        this.textContainer.style.whiteSpace = 'nowrap';
        this.textContainer.style.backgroundColor = '#f8f9fa';
        this.textContainer.style.padding = '10px';
        this.visualizerContainer.appendChild(this.textContainer);

        // Add the sequence visualization
        this.sequenceContainer = document.createElement('div');
        this.sequenceContainer.className = 'dna-sequence';
        this.sequenceContainer.style.position = 'relative';
        this.textContainer.appendChild(this.sequenceContainer);

        try {
            // Render the sequence
            this.renderSequence();
        } catch (error) {
            console.error("Error rendering DNA sequence:", error);
            this.updateStatus('Error rendering sequence', true);
            this.renderError();
        }
    }
    
    createThreeDVisualizer() {
        // Create 3D visualization container
        this.threeDContainer = document.createElement('div');
        this.threeDContainer.className = 'dna-3d-container';
        this.threeDContainer.style.width = '100%';
        this.threeDContainer.style.height = '100%';
        this.threeDContainer.style.position = 'relative';
        this.visualizerContainer.appendChild(this.threeDContainer);
        
        // Load Three.js dynamically if not already available
        this.loadThreeJS()
            .then(() => {
                this.setup3DVisualization();
            })
            .catch(error => {
                console.error("Error loading Three.js:", error);
                this.updateStatus('Could not load 3D visualization library', true);
                const errorMsg = document.createElement('div');
                errorMsg.className = 'alert alert-warning';
                errorMsg.innerHTML = `
                    <h5>3D Visualization Unavailable</h5>
                    <p>Could not load Three.js library. Switching to text view.</p>
                `;
                this.threeDContainer.appendChild(errorMsg);
                // Fall back to text mode
                this.options.mode = 'text';
                this.switchView('text');
            });
    }
    
    loadThreeJS() {
        return new Promise((resolve, reject) => {
            // Check if Three.js is already loaded
            if (window.THREE) {
                resolve();
                return;
            }
            
            // Load Three.js from CDN
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.min.js';
            script.onload = () => {
                // Load OrbitControls after Three.js is loaded
                const controlsScript = document.createElement('script');
                controlsScript.src = 'https://cdn.jsdelivr.net/npm/three@0.132.2/examples/js/controls/OrbitControls.js';
                controlsScript.onload = resolve;
                controlsScript.onerror = reject;
                document.head.appendChild(controlsScript);
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    setup3DVisualization() {
        // Get container dimensions
        const width = this.threeDContainer.clientWidth;
        const height = this.threeDContainer.clientHeight;
        
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf8f9fa);
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        this.camera.position.set(0, 0, 20);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.threeDContainer.appendChild(this.renderer.domElement);
        
        // Create orbit controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        // Add directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);
        
        // Create DNA helix
        this.createDNAHelix();
        
        // Handle window resize
        window.addEventListener('resize', () => {
            if (this.options.mode === '3d') {
                const width = this.threeDContainer.clientWidth;
                const height = this.threeDContainer.clientHeight;
                this.camera.aspect = width / height;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(width, height);
            }
        });
        
        // Start animation
        this.startAnimation();
    }
    
    createDNAHelix() {
        // Define DNA parameters
        const sequence = this.options.sequence.toUpperCase();
        const length = Math.min(sequence.length, 100); // Limit to 100 base pairs for performance
        const radius = 2;
        const helixHeight = length * 0.3;
        const helixRadius = 1.2;
        const nucleotideRadius = 0.2;
        const twists = length / 10;
        
        // Create helix group
        this.dnaGroup = new THREE.Group();
        
        // Create the two strands
        const strandMaterial1 = new THREE.MeshPhongMaterial({ color: 0x4285F4, shininess: 80 });
        const strandMaterial2 = new THREE.MeshPhongMaterial({ color: 0xDB4437, shininess: 80 });
        
        // Create the nucleotide materials based on nucleotide colors
        const nucleotideMaterials = {
            A: new THREE.MeshPhongMaterial({ 
                color: this.hexToRgbNumber(this.options.nucleotideColors.A), 
                shininess: 100 
            }),
            T: new THREE.MeshPhongMaterial({ 
                color: this.hexToRgbNumber(this.options.nucleotideColors.T), 
                shininess: 100 
            }),
            G: new THREE.MeshPhongMaterial({ 
                color: this.hexToRgbNumber(this.options.nucleotideColors.G), 
                shininess: 100 
            }),
            C: new THREE.MeshPhongMaterial({ 
                color: this.hexToRgbNumber(this.options.nucleotideColors.C), 
                shininess: 100 
            }),
            U: new THREE.MeshPhongMaterial({ 
                color: this.hexToRgbNumber(this.options.nucleotideColors.U), 
                shininess: 100 
            })
        };
        
        // Create tube geometries for the backbone
        const strandPoints1 = [];
        const strandPoints2 = [];
        
        for (let i = 0; i <= length; i++) {
            const t = i / length;
            const angle = t * Math.PI * 2 * twists;
            
            // First strand
            const x1 = helixRadius * Math.cos(angle);
            const y1 = helixRadius * Math.sin(angle);
            const z1 = helixHeight * t - helixHeight / 2;
            strandPoints1.push(new THREE.Vector3(x1, y1, z1));
            
            // Second strand (180 degrees opposite)
            const x2 = helixRadius * Math.cos(angle + Math.PI);
            const y2 = helixRadius * Math.sin(angle + Math.PI);
            const z2 = helixHeight * t - helixHeight / 2;
            strandPoints2.push(new THREE.Vector3(x2, y2, z2));
            
            // Add nucleotides at each position (except last point which is just for the strand)
            if (i < length) {
                // Get the nucleotide
                const nucleotide = sequence[i] || 'A';
                const pairNucleotide = this.getComplementary(nucleotide);
                
                // Create nucleotide sphere for first strand
                const nucleotideSphere1 = new THREE.Mesh(
                    new THREE.SphereGeometry(nucleotideRadius, 16, 16),
                    nucleotideMaterials[nucleotide] || nucleotideMaterials.A
                );
                nucleotideSphere1.position.set(x1, y1, z1);
                
                // Create nucleotide sphere for second strand
                const nucleotideSphere2 = new THREE.Mesh(
                    new THREE.SphereGeometry(nucleotideRadius, 16, 16),
                    nucleotideMaterials[pairNucleotide] || nucleotideMaterials.T
                );
                nucleotideSphere2.position.set(x2, y2, z2);
                
                // Create the connection between base pairs
                const connectionGeometry = new THREE.CylinderGeometry(0.05, 0.05, 
                    Math.sqrt(Math.pow(x2-x1, 2) + Math.pow(y2-y1, 2) + Math.pow(z2-z1, 2)));
                const connectionMaterial = new THREE.MeshPhongMaterial({ color: 0xcccccc });
                const connection = new THREE.Mesh(connectionGeometry, connectionMaterial);
                
                // Position and rotate the connection cylinder
                connection.position.set((x1+x2)/2, (y1+y2)/2, (z1+z2)/2);
                connection.lookAt(new THREE.Vector3(x2, y2, z2));
                connection.rotateX(Math.PI/2);
                
                // Add to DNA group
                this.dnaGroup.add(nucleotideSphere1);
                this.dnaGroup.add(nucleotideSphere2);
                this.dnaGroup.add(connection);
            }
        }
        
        // Create curves from points
        const curve1 = new THREE.CatmullRomCurve3(strandPoints1);
        const curve2 = new THREE.CatmullRomCurve3(strandPoints2);
        
        // Create tube geometries from curves
        const tubeGeometry1 = new THREE.TubeGeometry(curve1, length * 2, 0.1, 8, false);
        const tubeGeometry2 = new THREE.TubeGeometry(curve2, length * 2, 0.1, 8, false);
        
        // Create meshes from geometries
        const strand1 = new THREE.Mesh(tubeGeometry1, strandMaterial1);
        const strand2 = new THREE.Mesh(tubeGeometry2, strandMaterial2);
        
        // Add strands to DNA group
        this.dnaGroup.add(strand1);
        this.dnaGroup.add(strand2);
        
        // Add DNA group to scene
        this.scene.add(this.dnaGroup);
    }
    
    hexToRgbNumber(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (result) {
            const r = parseInt(result[1], 16);
            const g = parseInt(result[2], 16);
            const b = parseInt(result[3], 16);
            // Convert RGB to single number (format that Three.js uses for colors)
            return (r << 16) | (g << 8) | b;
        }
        return 0xffffff; // Default to white
    }
    
    getComplementary(nucleotide) {
        const complementMap = {
            'A': 'T',
            'T': 'A',
            'G': 'C',
            'C': 'G',
            'U': 'A'
        };
        return complementMap[nucleotide] || 'A';
    }
    
    startAnimation() {
        this.animationPaused = false;
        this.animate();
    }
    
    animate() {
        if (this.animationPaused) return;
        
        if (this.options.mode === '3d' && this.dnaGroup) {
            // Rotate the DNA helix slowly
            this.dnaGroup.rotation.y += 0.005;
            
            // Update controls
            if (this.controls) {
                this.controls.update();
            }
            
            // Render the scene
            this.renderer.render(this.scene, this.camera);
        }
        
        // Continue animation
        requestAnimationFrame(() => this.animate());
    }

    renderSequence() {
        if (!this.sequenceContainer) return;
        
        if (!this.options.sequence) {
            this.sequenceContainer.innerHTML = '<p class="text-muted">No sequence provided</p>';
            return;
        }

        const sequence = this.options.sequence.toUpperCase();
        const nucleotides = sequence.split('');
        
        // Clear previous content
        this.sequenceContainer.innerHTML = '';

        // Container for position numbers
        let positionContainer = null;
        if (this.options.showNumbers) {
            positionContainer = document.createElement('div');
            positionContainer.className = 'dna-position-numbers';
            positionContainer.style.fontFamily = 'monospace';
            positionContainer.style.fontSize = `${this.options.fontSize * 0.8}px`;
            positionContainer.style.color = '#6c757d';
            positionContainer.style.marginBottom = '5px';
            this.sequenceContainer.appendChild(positionContainer);
        }

        // Create the sequence line
        const sequenceLine = document.createElement('div');
        sequenceLine.className = 'dna-sequence-line';
        sequenceLine.style.display = 'flex';  // Use flex to ensure proper spacing
        sequenceLine.style.flexWrap = 'wrap'; // Allow wrapping for long sequences
        sequenceLine.style.gap = '0px';      // No gap between nucleotides
        this.sequenceContainer.appendChild(sequenceLine);

        // Generate position numbers if enabled
        if (this.options.showNumbers) {
            let positions = '';
            for (let i = 0; i < sequence.length; i += 10) {
                const pos = i + 1;
                const posStr = pos.toString();
                
                // Pad spaces for alignment
                const padding = ' '.repeat(9 - posStr.length);
                
                positions += posStr + padding + ' ';
            }
            positionContainer.textContent = positions;
        }

        // Generate the nucleotides with colors
        nucleotides.forEach((nucleotide, index) => {
            const nucleotideSpan = document.createElement('span');
            nucleotideSpan.textContent = nucleotide;
            nucleotideSpan.dataset.position = index + 1;
            nucleotideSpan.style.display = 'inline-block';
            nucleotideSpan.style.width = '1em';  // Fixed width for consistent spacing
            nucleotideSpan.style.textAlign = 'center';
            
            // Set background color based on nucleotide type
            const color = this.options.nucleotideColors[nucleotide] || '#fff';
            nucleotideSpan.style.backgroundColor = color;
            
            // Adjust text color for contrast
            const colorSum = this.hexToRgb(color);
            nucleotideSpan.style.color = colorSum > 600 ? '#000' : '#fff';
            
            // Add hover effects for better UX
            nucleotideSpan.style.cursor = 'pointer';
            nucleotideSpan.title = `Position: ${index + 1}, Base: ${nucleotide}`;
            
            // Add to the sequence line
            sequenceLine.appendChild(nucleotideSpan);
            
            // Add a space every 10 nucleotides for better readability
            if ((index + 1) % 10 === 0 && index < sequence.length - 1) {
                const spacer = document.createElement('span');
                spacer.innerHTML = ' ';
                spacer.style.width = '0.5em';
                sequenceLine.appendChild(spacer);
            }
        });
    }
    
    hexToRgb(hex) {
        // Remove the # if present
        hex = hex.replace('#', '');
        
        // Convert to RGB
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        
        // Return sum for contrast calculation
        return r + g + b;
    }

    zoom(factor) {
        if (this.options.mode === 'text') {
            // Update font size for text view
            this.options.fontSize = Math.max(8, Math.min(32, this.options.fontSize * factor));
            this.renderSequence();
        } else if (this.options.mode === '3d' && this.camera) {
            // Update camera for 3D view
            this.camera.position.z = Math.max(5, Math.min(50, this.camera.position.z / factor));
        }
    }

    downloadAsPNG() {
        let canvas;
        
        if (this.options.mode === '3d' && this.renderer) {
            // Get canvas from WebGL renderer
            canvas = this.renderer.domElement;
        } else {
            // Create temporary canvas for text view
            canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const container = this.textContainer;
            
            // Set canvas size
            canvas.width = container.scrollWidth;
            canvas.height = container.scrollHeight;
            
            // Fill background
            ctx.fillStyle = '#f8f9fa';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Use html2canvas if available, otherwise show error
            if (typeof html2canvas !== 'undefined') {
                html2canvas(container).then(canvas => {
                    this.savePNG(canvas);
                });
                return;
            } else {
                // Simplified fallback (just text)
                ctx.font = `${this.options.fontSize}px monospace`;
                ctx.fillStyle = '#000';
                
                const sequence = this.options.sequence.toUpperCase();
                const nucleotides = sequence.split('');
                
                let x = 10;
                let y = 50;
                
                nucleotides.forEach((nucleotide, index) => {
                    // Set fill color based on nucleotide
                    ctx.fillStyle = this.options.nucleotideColors[nucleotide] || '#fff';
                    ctx.fillRect(x, y - this.options.fontSize, this.options.fontSize, this.options.fontSize);
                    
                    // Draw nucleotide text
                    ctx.fillStyle = '#000';
                    ctx.fillText(nucleotide, x, y);
                    
                    // Move to next position
                    x += this.options.fontSize;
                    
                    // Start new line every 50 nucleotides
                    if ((index + 1) % 50 === 0) {
                        x = 10;
                        y += this.options.fontSize * 1.5;
                    }
                });
            }
        }
        
        this.savePNG(canvas);
    }
    
    savePNG(canvas) {
        try {
            // Convert canvas to data URL
            const dataURL = canvas.toDataURL('image/png');
            
            // Create download link
            const link = document.createElement('a');
            link.download = `${this.getSequenceType()}_sequence.png`;
            link.href = dataURL;
            link.click();
        } catch (error) {
            console.error('Error creating PNG:', error);
            this.updateStatus('Error creating PNG', true);
        }
    }

    updateSequence(sequence, markers = []) {
        this.options.sequence = sequence;
        this.options.markers = markers;
        this.init();
    }

    addMarker(marker) {
        this.options.markers.push(marker);
        this.renderSequence();
    }

    clearMarkers() {
        this.options.markers = [];
        this.renderSequence();
    }
}

// Example sequences for testing
const EXAMPLE_SEQUENCES = {
    dna: "ATGCATGCATGCATGCATGCATGCATGCATGCATGCATGC",
    rna: "AUGCAUGCAUGCAUGCAUGCAUGCAUGCAUGCAUGCAUGC",
    dnaMarkers: [
        {
            start: 1,
            end: 3,
            name: "Start Codon",
            description: "Translation start site",
            backgroundColor: "#ffdddd"
        },
        {
            start: 12,
            end: 18,
            name: "Enzyme Site",
            description: "Restriction enzyme recognition site",
            backgroundColor: "#ddffdd",
            color: "#006600",
            bold: true
        }
    ]
};

// Helper function to initialize the DNA visualizer
function initDNAVisualizer(containerId, options = {}) {
    console.log("Creating DNA 3D visualizer for", containerId);
    // Force reload of Three.js to ensure it's available
    if (!window.THREE) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.min.js?t=' + new Date().getTime();
        document.head.appendChild(script);
    }
    
    // Force 3D mode
    options.mode = '3d';
    
    return new DNAVisualizer(containerId, options);
}

// Export the initializer globally
window.initDNAVisualizer = initDNAVisualizer; 