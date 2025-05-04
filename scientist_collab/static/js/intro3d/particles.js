/**
 * Particles Module - Modulul pentru particulele din animația 3D
 */

export function createEnhancedParticleSystem(particleCount) {
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const speeds = new Float32Array(particleCount);
    
    // Distribuție mai interesantă a particulelor în spațiu
    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        // Distribuție în formă de sferă sau toroid
        const useToroid = Math.random() > 0.7;
        
        if (useToroid) {
            // Particule în formă de toroid (inel)
            const mainRadius = 8 + Math.random() * 5;
            const tubeRadius = 1 + Math.random() * 2;
            const angle = Math.random() * Math.PI * 2;
            const tubeAngle = Math.random() * Math.PI * 2;
            
            positions[i3] = (mainRadius + tubeRadius * Math.cos(tubeAngle)) * Math.cos(angle);
            positions[i3 + 1] = tubeRadius * Math.sin(tubeAngle);
            positions[i3 + 2] = (mainRadius + tubeRadius * Math.cos(tubeAngle)) * Math.sin(angle);
        } else {
            // Particule în formă de sferă
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
            const radius = 4 + Math.random() * 12;
            
            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);
        }
        
        // Culori cu mai multă variație pentru un efect cosmic/științific
        const particleType = Math.random();
        
        // Particule galbene/orange - reprezentând stele sau ecuații
        if (particleType < 0.2) {
            colors[i3] = 0.9 + Math.random() * 0.1; // R
            colors[i3 + 1] = 0.6 + Math.random() * 0.3; // G
            colors[i3 + 2] = 0.2 + Math.random() * 0.2; // B
            sizes[i] = 0.05 + Math.random() * 0.1;
        } 
        // Particule albastre - reprezentând date științifice
        else if (particleType < 0.6) {
            colors[i3] = 0.1 + Math.random() * 0.2; // R
            colors[i3 + 1] = 0.4 + Math.random() * 0.4; // G
            colors[i3 + 2] = 0.7 + Math.random() * 0.3; // B
            sizes[i] = 0.05 + Math.random() * 0.07;
        }
        // Particule verzi - reprezentând descoperiri
        else if (particleType < 0.8) {
            colors[i3] = 0.1 + Math.random() * 0.2; // R
            colors[i3 + 1] = 0.6 + Math.random() * 0.4; // G
            colors[i3 + 2] = 0.3 + Math.random() * 0.2; // B
            sizes[i] = 0.03 + Math.random() * 0.06;
        }
        // Particule violet - reprezentând colaborarea
        else {
            colors[i3] = 0.5 + Math.random() * 0.3; // R
            colors[i3 + 1] = 0.1 + Math.random() * 0.2; // G
            colors[i3 + 2] = 0.8 + Math.random() * 0.2; // B
            sizes[i] = 0.04 + Math.random() * 0.08;
        }
        
        // Viteza de animație diferită pentru fiecare particulă
        speeds[i] = 0.2 + Math.random() * 0.8;
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Material îmbunătățit pentru particule
    const particleMaterial = new THREE.PointsMaterial({
        size: 0.1,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });
    
    // Încarcă textură pentru particule mai realiste
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('https://raw.githubusercontent.com/baronwatts/models/master/snowflake.png', (texture) => {
        particleMaterial.map = texture;
        particleMaterial.needsUpdate = true;
    }, null, () => {
        // Alternativă în caz de eroare - creează o textură de particulă simplă
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        // Gradient radial pentru particulă
        const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.5, 'rgba(200, 200, 255, 0.5)');
        gradient.addColorStop(1, 'rgba(100, 100, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);
        
        const particleTexture = new THREE.CanvasTexture(canvas);
        particleMaterial.map = particleTexture;
        particleMaterial.needsUpdate = true;
    });
    
    const particlePoints = new THREE.Points(particles, particleMaterial);
    
    // Returnează atât sistemul de particule cât și datele pentru animație
    return {
        particles: particlePoints,
        positions: positions,
        speeds: speeds,
        originalPositions: positions.slice(),
        animate: function(time) {
            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                
                // Pulsație bazată pe sin pentru mișcare organică
                const pulseRate = time * speeds[i] * 0.3;
                const pulseFactor = Math.sin(pulseRate) * 0.1;
                
                // Distanța de la centru pentru efect de respirație
                const dx = positions[i3];
                const dy = positions[i3 + 1];
                const dz = positions[i3 + 2];
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                
                // Factor de normalizare
                const norm = (1 + pulseFactor) / dist;
                
                // Actualizare poziții
                positions[i3] = dx * norm;
                positions[i3 + 1] = dy * norm;
                positions[i3 + 2] = dz * norm;
            }
            
            // Actualizează atributul de poziție
            particlePoints.geometry.attributes.position.needsUpdate = true;
        }
    };
} 