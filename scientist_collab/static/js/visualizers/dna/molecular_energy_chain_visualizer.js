// This is the Molecular Energy Chain Visualizer (renamed from DNA Visualizer)
// This component creates a visualizer for molecular chains in energy processes
// With advanced 3D visualization for energy researchers

class MolecularEnergyChainVisualizer {
    constructor(containerId, options = {}) {
        console.log("MolecularEnergyChainVisualizer 3D version initialized for", containerId);
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
            moleculeColors: {
                C: '#555555', // Carbon - gray
                H: '#FFFFFF', // Hydrogen - white
                O: '#FF0000', // Oxygen - red
                N: '#0000FF', // Nitrogen - blue
                P: '#FFA500', // Phosphorus - orange
                S: '#FFFF00', // Sulfur - yellow
                B: '#B3E0F2', // Boron - light blue
                F: '#90E050', // Fluorine - light green
                K: '#8F40D4'  // Potassium - purple
            },
            chainType: 'hydrocarbon', // hydrocarbon, biofuel, polymer
            energyEfficiency: 0.85, // 85% efficiency
            mode: '3d', // Force 3D mode by default
            showEnergyData: false,
            ...options
        };

        // Explicitly set to 3D mode to override any passed options
        this.options.mode = '3d';

        // Add a visual indicator that this is the 3D version
        const versionIndicator = document.createElement('div');
        versionIndicator.className = 'molecular-visualizer-version';
        versionIndicator.textContent = '3D Molecular Chain Visualizer v1.0';
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
        this.statusIndicator.className = 'molecular-visualizer-status';
        this.statusIndicator.style.fontSize = '12px';
        this.statusIndicator.style.color = '#666';
        this.statusIndicator.style.marginTop = '4px';
        this.statusIndicator.style.marginBottom = '4px';
        this.statusIndicator.style.textAlign = 'center';
        this.container.appendChild(this.statusIndicator);
        this.updateStatus('Initializing Molecular Energy Chain visualizer...');

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
            if (typeof EXAMPLE_SEQUENCES !== 'undefined' && EXAMPLE_SEQUENCES.hydrocarbon) {
                this.options.sequence = EXAMPLE_SEQUENCES.hydrocarbon;
            } else {
                // Create a default sequence for a simple hydrocarbon
                this.options.sequence = "CCCCCCCCCCHHHHHHHHHHHHHHHHHHHH";
            }
            this.updateStatus('Using example molecular chain (no sequence provided)');
        } else {
            this.updateStatus('Visualizing provided molecular chain');
        }

        // Clear container except status indicator
        const currentStatus = this.statusIndicator;
        this.container.innerHTML = '';
        this.container.appendChild(currentStatus);

        // Create visualizer based on mode
        this.createToolbar();
        
        // Create the main visualization container
        this.visualizerContainer = document.createElement('div');
        this.visualizerContainer.className = 'molecular-visualizer-container';
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
        
        this.updateStatus(`${this.getChainType()} molecular chain (${this.options.sequence.length} atoms)`);
    }

    getChainType() {
        const sequence = this.options.sequence;
        const chainType = this.options.chainType;
        
        // Determine chain type based on option or composition
        if (chainType) {
            return chainType.charAt(0).toUpperCase() + chainType.slice(1);
        } else if (sequence.includes('O') && sequence.includes('C') && sequence.includes('H')) {
            return 'Biofuel';
        } else if (sequence.includes('C') && sequence.includes('H')) {
            return 'Hydrocarbon';
        } else {
            return 'Polymer';
        }
    }

    renderError() {
        this.sequenceContainer.innerHTML = `
            <div class="alert alert-danger">
                <h5>Error Rendering Molecular Chain</h5>
                <p>Could not render the molecular chain. Check browser console for details.</p>
            </div>
        `;
    }

    createToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'molecular-visualizer-toolbar';
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

        // Toggle efficiency display
        const toggleEfficiencyBtn = document.createElement('button');
        toggleEfficiencyBtn.className = 'btn btn-sm btn-outline-success';
        toggleEfficiencyBtn.innerHTML = '<i class="fas fa-bolt"></i> Energy Data';
        toggleEfficiencyBtn.title = 'Toggle Energy Efficiency Data';
        toggleEfficiencyBtn.onclick = () => {
            this.toggleEnergyData();
        };
        toolbar.appendChild(toggleEfficiencyBtn);

        // Toggle numbers
        const toggleNumbersBtn = document.createElement('button');
        toggleNumbersBtn.className = 'btn btn-sm btn-outline-secondary';
        toggleNumbersBtn.innerHTML = '<i class="fas fa-list-ol"></i> Atom Numbers';
        toggleNumbersBtn.title = 'Toggle Atom Position Numbers';
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

        // Chain type indicator
        const chainTypeIndicator = document.createElement('span');
        chainTypeIndicator.className = 'badge bg-info ms-auto';
        chainTypeIndicator.style.marginLeft = 'auto';
        chainTypeIndicator.textContent = this.getChainType();
        toolbar.appendChild(chainTypeIndicator);
    }
    
    toggleEnergyData() {
        // Toggle energy data overlay
        this.options.showEnergyData = !this.options.showEnergyData;
        
        if (this.options.mode === 'text') {
            this.renderSequence();
        } else {
            this.updateEnergyEfficiencyDisplay();
        }
    }
    
    updateEnergyEfficiencyDisplay() {
        // Remove any existing energy efficiency display
        const existingDisplay = this.threeDContainer.querySelector('.energy-efficiency-display');
        if (existingDisplay) {
            existingDisplay.remove();
        }
        
        if (!this.options.showEnergyData) return;
        
        // Create energy efficiency display
        const energyDisplay = document.createElement('div');
        energyDisplay.className = 'energy-efficiency-display';
        energyDisplay.style.position = 'absolute';
        energyDisplay.style.bottom = '10px';
        energyDisplay.style.right = '10px';
        energyDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        energyDisplay.style.color = 'white';
        energyDisplay.style.padding = '5px 10px';
        energyDisplay.style.borderRadius = '4px';
        energyDisplay.style.fontSize = '12px';
        energyDisplay.style.fontFamily = 'monospace';
        
        // Calculate energy metrics based on chain type
        const chainType = this.getChainType().toLowerCase();
        let energyContent = 0;
        let efficiency = this.options.energyEfficiency;
        
        switch(chainType) {
            case 'hydrocarbon':
                // Approximation for hydrocarbon energy content (MJ/kg)
                energyContent = 45;
                break;
            case 'biofuel':
                // Approximation for biofuel energy content (MJ/kg)
                energyContent = 38;
                break;
            case 'polymer':
                // Approximation for polymer energy content (MJ/kg)
                energyContent = 25;
                break;
            default:
                energyContent = 30;
        }
        
        // Calculate usable energy based on efficiency
        const usableEnergy = energyContent * efficiency;
        
        // Display energy data
        energyDisplay.innerHTML = `
            <div><strong>Chain Type:</strong> ${this.getChainType()}</div>
            <div><strong>Energy Content:</strong> ${energyContent.toFixed(1)} MJ/kg</div>
            <div><strong>Efficiency:</strong> ${(efficiency * 100).toFixed(1)}%</div>
            <div><strong>Usable Energy:</strong> ${usableEnergy.toFixed(1)} MJ/kg</div>
        `;
        
        this.threeDContainer.appendChild(energyDisplay);
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
            this.updateEnergyEfficiencyDisplay();
            // Restart animation if it was paused
            if (this.animationPaused) {
                this.startAnimation();
            }
        }
    }
    
    createTextVisualizer() {
        // Create text visualization container
        this.textContainer = document.createElement('div');
        this.textContainer.className = 'molecular-text-container';
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
        this.sequenceContainer.className = 'molecular-sequence';
        this.sequenceContainer.style.position = 'relative';
        this.textContainer.appendChild(this.sequenceContainer);

        try {
            // Render the sequence
            this.renderSequence();
        } catch (error) {
            console.error("Error rendering molecular chain:", error);
            this.updateStatus('Error rendering molecular chain', true);
            this.renderError();
        }
    }
    
    createThreeDVisualizer() {
        // Create 3D visualization container
        this.threeDContainer = document.createElement('div');
        this.threeDContainer.className = 'molecular-3d-container';
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
        this.scene.background = new THREE.Color(0xf0f8ff);
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        this.camera.position.set(0, 5, 20);
        
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
        
        // Create molecular chain
        this.createMolecularChain();
        
        // Add energy efficiency display
        this.updateEnergyEfficiencyDisplay();
        
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
    
    createMolecularChain() {
        // Define molecular chain parameters
        const sequence = this.options.sequence.toUpperCase();
        const length = Math.min(sequence.length, 100); // Limit to 100 atoms for performance
        const atomRadius = 0.3;
        const bondLength = 0.8;
        const bondRadius = 0.1;
        
        // Create molecular group
        this.molecularGroup = new THREE.Group();
        
        // Get chain type for specific formatting
        const chainType = this.getChainType().toLowerCase();
        
        // Create materials for different atom types
        const atomMaterials = {};
        for (const [atom, color] of Object.entries(this.options.moleculeColors)) {
            atomMaterials[atom] = new THREE.MeshPhongMaterial({ 
                color: this.hexToRgbNumber(color), 
                shininess: 100 
            });
        }
        
        // Default material for unknown atoms
        const defaultMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xcccccc, 
            shininess: 80 
        });
        
        // Bond material
        const bondMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x444444, 
            shininess: 30 
        });
        
        // Create molecular structure based on chain type
        let atomPositions = [];
        
        if (chainType === 'hydrocarbon') {
            // Create a linear hydrocarbon chain with zigzag pattern
            for (let i = 0; i < length; i++) {
                const atom = sequence[i] || 'C';
                const x = (i * bondLength) - (length * bondLength / 2);
                const y = (i % 2 === 0) ? 0 : 0.3;
                const z = 0;
                
                atomPositions.push({
                    atom: atom,
                    position: new THREE.Vector3(x, y, z)
                });
            }
        } else if (chainType === 'biofuel') {
            // Create a biofuel molecule with oxygen groups
            for (let i = 0; i < length; i++) {
                const atom = sequence[i] || 'C';
                let x, y, z;
                
                if (atom === 'O') {
                    // Position oxygen atoms slightly above the chain
                    const baseIndex = Math.floor(i / 3);
                    x = (baseIndex * bondLength * 1.5) - (length * bondLength / 4);
                    y = 1.0;
                    z = (i % 2 === 0) ? 0.5 : -0.5;
                } else {
                    // Position carbon and hydrogen in the main chain
                    x = (Math.floor(i / 2) * bondLength) - (length * bondLength / 4);
                    y = (atom === 'C') ? 0 : (i % 2 === 0 ? -0.7 : 0.7);
                    z = (i % 3 === 0) ? 0.2 : (i % 3 === 1 ? -0.2 : 0);
                }
                
                atomPositions.push({
                    atom: atom,
                    position: new THREE.Vector3(x, y, z)
                });
            }
        } else {
            // Create a circular/ring structure for polymer
            const radius = length * 0.1;
            const twists = Math.ceil(length / 10);
            
            for (let i = 0; i < length; i++) {
                const atom = sequence[i] || 'C';
                const angle = (i / length) * Math.PI * 2 * twists;
                const elevation = (i / length) * 2 - 1;
                
                const x = radius * Math.cos(angle);
                const y = elevation * 3;
                const z = radius * Math.sin(angle);
                
                atomPositions.push({
                    atom: atom,
                    position: new THREE.Vector3(x, y, z)
                });
            }
        }
        
        // Create atoms and bonds
        for (let i = 0; i < atomPositions.length; i++) {
            const {atom, position} = atomPositions[i];
            
            // Create atom sphere
            const atomGeometry = new THREE.SphereGeometry(
                atom === 'H' ? atomRadius * 0.8 : atomRadius, 
                16, 16
            );
            const atomMesh = new THREE.Mesh(
                atomGeometry, 
                atomMaterials[atom] || defaultMaterial
            );
            atomMesh.position.copy(position);
            this.molecularGroup.add(atomMesh);
            
            // Add bond to next atom if not the last one
            if (i < atomPositions.length - 1) {
                const nextPos = atomPositions[i + 1].position;
                const bondLength = position.distanceTo(nextPos);
                
                // Create bond cylinder
                const bondGeometry = new THREE.CylinderGeometry(
                    bondRadius, bondRadius, bondLength, 8
                );
                const bond = new THREE.Mesh(bondGeometry, bondMaterial);
                
                // Position bond between atoms
                const midpoint = new THREE.Vector3().addVectors(position, nextPos).multiplyScalar(0.5);
                bond.position.copy(midpoint);
                
                // Rotate bond to point from this atom to next atom
                bond.lookAt(nextPos);
                bond.rotateX(Math.PI / 2);
                
                this.molecularGroup.add(bond);
            }
        }
        
        // Add a small indicator of energy based on the chain type
        this.addEnergyIndicator(chainType);
        
        // Add molecular group to scene
        this.scene.add(this.molecularGroup);
    }
    
    addEnergyIndicator(chainType) {
        // Create an energy field/glow around the molecule based on type
        let energyColor;
        let energyIntensity;
        
        switch(chainType) {
            case 'hydrocarbon':
                energyColor = 0xffcc00; // Yellow-orange for hydrocarbon
                energyIntensity = 0.4;
                break;
            case 'biofuel':
                energyColor = 0x00cc66; // Green for biofuel
                energyIntensity = 0.3;
                break;
            case 'polymer':
                energyColor = 0x3366ff; // Blue for polymer
                energyIntensity = 0.2;
                break;
            default:
                energyColor = 0xffcc00;
                energyIntensity = 0.3;
        }
        
        // Create a light to represent energy
        const energyLight = new THREE.PointLight(energyColor, energyIntensity, 20);
        energyLight.position.set(0, 0, 0);
        this.molecularGroup.add(energyLight);
        
        // Create a subtle glow effect with a sphere
        const glowGeometry = new THREE.SphereGeometry(5, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: energyColor,
            transparent: true,
            opacity: 0.1,
        });
        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        this.molecularGroup.add(glowMesh);
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
    
    getBondLength(atom1, atom2) {
        // Simple approximation of bond lengths between different atoms
        const bondLengths = {
            'CC': 1.0,
            'CH': 0.8,
            'CO': 0.9,
            'CN': 0.9,
            'HH': 0.6,
            'OH': 0.7
        };
        
        const bondKey = [atom1, atom2].sort().join('');
        return bondLengths[bondKey] || 0.8;
    }
    
    startAnimation() {
        this.animationPaused = false;
        this.animate();
    }
    
    animate() {
        if (this.animationPaused) return;
        
        if (this.options.mode === '3d' && this.molecularGroup) {
            // Gentle rotation of the molecular chain
            this.molecularGroup.rotation.y += 0.002;
            
            // Simulate energy by adding a subtle vibration for atoms
            const time = Date.now() * 0.001;
            const chainType = this.getChainType().toLowerCase();
            
            if (chainType === 'hydrocarbon' || chainType === 'biofuel') {
                // Add subtle movement for molecular vibration
                this.molecularGroup.children.forEach((child, index) => {
                    // Only apply to atoms (spheres), not bonds (cylinders)
                    if (child.geometry.type === 'SphereGeometry') {
                        child.position.y += Math.sin(time * 3 + index * 0.2) * 0.003;
                    }
                });
            }
            
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
            this.sequenceContainer.innerHTML = '<p class="text-muted">No molecular sequence provided</p>';
            return;
        }

        const sequence = this.options.sequence.toUpperCase();
        const atoms = sequence.split('');
        
        // Clear previous content
        this.sequenceContainer.innerHTML = '';

        // Container for position numbers
        let positionContainer = null;
        if (this.options.showNumbers) {
            positionContainer = document.createElement('div');
            positionContainer.className = 'molecular-position-numbers';
            positionContainer.style.fontFamily = 'monospace';
            positionContainer.style.fontSize = `${this.options.fontSize * 0.8}px`;
            positionContainer.style.color = '#6c757d';
            positionContainer.style.marginBottom = '5px';
            this.sequenceContainer.appendChild(positionContainer);
        }

        // Create the sequence line
        const sequenceLine = document.createElement('div');
        sequenceLine.className = 'molecular-sequence-line';
        sequenceLine.style.display = 'flex';  // Use flex to ensure proper spacing
        sequenceLine.style.flexWrap = 'wrap'; // Allow wrapping for long sequences
        sequenceLine.style.gap = '0px';      // No gap between atoms
        this.sequenceContainer.appendChild(sequenceLine);
        
        // Add energy data if enabled
        if (this.options.showEnergyData) {
            const energyInfoContainer = document.createElement('div');
            energyInfoContainer.className = 'energy-data-container';
            energyInfoContainer.style.marginBottom = '10px';
            energyInfoContainer.style.padding = '5px';
            energyInfoContainer.style.backgroundColor = 'rgba(0,0,0,0.05)';
            energyInfoContainer.style.borderRadius = '4px';
            energyInfoContainer.style.fontSize = '12px';
            
            // Calculate energy metrics based on chain type
            const chainType = this.getChainType().toLowerCase();
            let energyContent = 0;
            let efficiency = this.options.energyEfficiency;
            
            switch(chainType) {
                case 'hydrocarbon':
                    energyContent = 45; // MJ/kg
                    break;
                case 'biofuel':
                    energyContent = 38; // MJ/kg
                    break;
                case 'polymer':
                    energyContent = 25; // MJ/kg
                    break;
                default:
                    energyContent = 30;
            }
            
            // Calculate usable energy based on efficiency
            const usableEnergy = energyContent * efficiency;
            
            energyInfoContainer.innerHTML = `
                <div><strong>Chain Type:</strong> ${this.getChainType()}</div>
                <div><strong>Energy Content:</strong> ${energyContent.toFixed(1)} MJ/kg</div>
                <div><strong>Efficiency:</strong> ${(efficiency * 100).toFixed(1)}%</div>
                <div><strong>Usable Energy:</strong> ${usableEnergy.toFixed(1)} MJ/kg</div>
            `;
            
            this.sequenceContainer.insertBefore(energyInfoContainer, sequenceLine);
        }

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

        // Generate the atoms with colors
        atoms.forEach((atom, index) => {
            const atomSpan = document.createElement('span');
            atomSpan.textContent = atom;
            atomSpan.dataset.position = index + 1;
            atomSpan.style.display = 'inline-block';
            atomSpan.style.width = '1em';  // Fixed width for consistent spacing
            atomSpan.style.textAlign = 'center';
            
            // Set background color based on atom type
            const color = this.options.moleculeColors[atom] || '#ccc';
            atomSpan.style.backgroundColor = color;
            
            // Adjust text color for contrast
            const colorSum = this.hexToRgb(color);
            atomSpan.style.color = colorSum > 600 ? '#000' : '#fff';
            
            // Add hover effects for better UX
            atomSpan.style.cursor = 'pointer';
            atomSpan.title = `Position: ${index + 1}, Atom: ${atom}`;
            
            // Add to the sequence line
            sequenceLine.appendChild(atomSpan);
            
            // Add a space every 10 atoms for better readability
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
                    ctx.fillStyle = this.options.moleculeColors[nucleotide] || '#fff';
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
            link.download = `${this.getChainType()}_chain.png`;
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
    hydrocarbon: "CCCCCCCCCCHHHHHHHHHHHHHHHHHHHHH",
    biofuel: "CCCCCHHHHHHHHHOOOHHCCCCHHHHHH",
    polymer: "CCCCNNCCCNNCCCCNNCCOOHHNNCCCC",
    molecularMarkers: [
        {
            start: 1,
            end: 3,
            name: "Methyl Group",
            description: "Terminal methyl group",
            backgroundColor: "#ffdddd"
        },
        {
            start: 12,
            end: 18,
            name: "Functional Group",
            description: "Oxygen-containing functional group",
            backgroundColor: "#ddffdd",
            color: "#006600",
            bold: true
        }
    ]
};

// Helper function to initialize the molecular chain visualizer
function initMolecularEnergyChainVisualizer(containerId, options = {}) {
    console.log("Creating Molecular Energy Chain visualizer for", containerId);
    // Force reload of Three.js to ensure it's available
    if (!window.THREE) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.min.js?t=' + new Date().getTime();
        document.head.appendChild(script);
    }
    
    // Force 3D mode
    options.mode = '3d';
    
    return new MolecularEnergyChainVisualizer(containerId, options);
}

// Export the initializer globally
window.initMolecularEnergyChainVisualizer = initMolecularEnergyChainVisualizer; 