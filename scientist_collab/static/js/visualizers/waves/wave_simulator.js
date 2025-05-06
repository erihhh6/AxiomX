// Lightweight Wave Simulator
// This component creates a simple wave visualization with minimal resource usage

class WaveSimulator {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`Container with ID '${containerId}' not found.`);
            return;
        }

        // Parameters that can be adjusted
        this.params = {
            amplitude: 1.0,
            frequency: 1.0,
            speed: 0.5,
            waveType: 'sine' // sine, square, sawtooth
        };

        this.init();
    }

    init() {
        console.log("Initializing lightweight wave simulator");
        
        // Set up container dimensions
        this.width = this.container.clientWidth;
        this.height = 300;
        
        // Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.container.appendChild(this.canvas);
        
        this.ctx = this.canvas.getContext('2d');
        
        // Create controls
        this.createControls();
        
        // Start animation
        this.lastTime = performance.now();
        this.animate();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    createControls() {
        const controlsDiv = document.createElement('div');
        controlsDiv.style.marginBottom = '10px';
        controlsDiv.style.padding = '10px';
        controlsDiv.style.backgroundColor = '#f8f9fa';
        controlsDiv.style.borderRadius = '4px';
        
        // Amplitude control
        const ampDiv = document.createElement('div');
        ampDiv.innerHTML = `<label>Amplitude: </label>`;
        const ampSlider = document.createElement('input');
        ampSlider.type = 'range';
        ampSlider.min = '0.1';
        ampSlider.max = '3.0';
        ampSlider.step = '0.1';
        ampSlider.value = this.params.amplitude;
        ampSlider.addEventListener('input', (e) => {
            this.params.amplitude = parseFloat(e.target.value);
        });
        ampDiv.appendChild(ampSlider);
        
        // Frequency control
        const freqDiv = document.createElement('div');
        freqDiv.innerHTML = `<label>Frequency: </label>`;
        const freqSlider = document.createElement('input');
        freqSlider.type = 'range';
        freqSlider.min = '0.1';
        freqSlider.max = '5.0';
        freqSlider.step = '0.1';
        freqSlider.value = this.params.frequency;
        freqSlider.addEventListener('input', (e) => {
            this.params.frequency = parseFloat(e.target.value);
        });
        freqDiv.appendChild(freqSlider);
        
        // Speed control
        const speedDiv = document.createElement('div');
        speedDiv.innerHTML = `<label>Speed: </label>`;
        const speedSlider = document.createElement('input');
        speedSlider.type = 'range';
        speedSlider.min = '0.1';
        speedSlider.max = '2.0';
        speedSlider.step = '0.1';
        speedSlider.value = this.params.speed;
        speedSlider.addEventListener('input', (e) => {
            this.params.speed = parseFloat(e.target.value);
        });
        speedDiv.appendChild(speedSlider);
        
        // Wave type control
        const typeDiv = document.createElement('div');
        typeDiv.innerHTML = `<label>Wave type: </label>`;
        const typeSelect = document.createElement('select');
        ['sine', 'square', 'sawtooth'].forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.text = type.charAt(0).toUpperCase() + type.slice(1);
            typeSelect.appendChild(option);
        });
        typeSelect.value = this.params.waveType;
        typeSelect.addEventListener('change', (e) => {
            this.params.waveType = e.target.value;
        });
        typeDiv.appendChild(typeSelect);
        
        // Add all controls to the container
        controlsDiv.appendChild(ampDiv);
        controlsDiv.appendChild(freqDiv);
        controlsDiv.appendChild(speedDiv);
        controlsDiv.appendChild(typeDiv);
        
        this.container.prepend(controlsDiv);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
        this.lastTime = currentTime;
        
        this.draw(currentTime * 0.001); // Convert to seconds
    }
    
    draw(time) {
        const { ctx, width, height } = this;
        const centerY = height / 2;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw axes
        ctx.beginPath();
        ctx.strokeStyle = '#ccc';
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.stroke();
        
        // Draw wave
        ctx.beginPath();
        ctx.strokeStyle = '#1a75ff';
        ctx.lineWidth = 3;
        
        for (let x = 0; x < width; x++) {
            // Calculate wave value
            const normalizedX = (x / width) * 10 - 5; // Range from -5 to 5
            const phase = this.params.frequency * normalizedX - this.params.speed * time;
            
            let y;
            switch(this.params.waveType) {
                case 'sine':
                    y = this.params.amplitude * Math.sin(phase);
                    break;
                case 'square':
                    y = this.params.amplitude * Math.sign(Math.sin(phase));
                    break;
                case 'sawtooth':
                    y = this.params.amplitude * (2 * (phase / (2 * Math.PI) - Math.floor(phase / (2 * Math.PI) + 0.5)));
                    break;
                default:
                    y = this.params.amplitude * Math.sin(phase);
            }
            
            // Convert to canvas coordinates
            const canvasY = centerY - y * 50; // Scale for better visibility
            
            if (x === 0) {
                ctx.moveTo(x, canvasY);
            } else {
                ctx.lineTo(x, canvasY);
            }
        }
        
        ctx.stroke();
    }

    onWindowResize() {
        this.width = this.container.clientWidth;
        this.canvas.width = this.width;
    }
}

// Helper function to initialize the wave simulator
function initWaveSimulator(containerId) {
    console.log("Creating wave simulator for", containerId);
    return new WaveSimulator(containerId);
} 