/**
 * Logo Particles Module - Modulul pentru particulele ce formează logo-ul în animația 3D
 */

export function createLogoParticles() {
    // Verifică dacă THREE este disponibil
    if (typeof THREE === 'undefined') {
        console.error('THREE is not defined in logoParticles.js');
        // Create and return a dummy object if THREE is not available
        return {
            particleSystem: {position: {x: 0, y: 0, z: 0}},
            positions: new Float32Array(0),
            targetPositions: new Float32Array(0),
            count: 0
        };
    }
    
    // Define logo shape (AxiomX letters) - moving logo particles behind camera
    const zOffset = -2; // Move logo particles behind camera
    const yOffset = 3;  // Move logo up to avoid text overlap
    const scale = 0.8;  // Scale pentru litere mai mari

    // Funcție pentru a crea un cerc de puncte
    function createCirclePoints(centerX, centerY, radius, numPoints) {
        const points = [];
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            points.push([
                centerX + Math.cos(angle) * radius,
                centerY + Math.sin(angle) * radius,
                zOffset
            ]);
        }
        return points;
    }

    // Funcție pentru a crea o linie de puncte
    function createLine(x1, y1, x2, y2, numPoints) {
        const points = [];
        for (let i = 0; i < numPoints; i++) {
            const t = i / (numPoints - 1);
            points.push([
                x1 + (x2 - x1) * t,
                y1 + (y2 - y1) * t,
                zOffset
            ]);
        }
        return points;
    }

    // Definirea formei logo-ului AxiomX cu coordonate precise pentru lizibilitate
    let logoPoints = [];
    
    // Litera A
    logoPoints = logoPoints.concat(createLine(-5 * scale, -1 * scale, -4 * scale, 1 * scale, 15)); // Linie stângă
    logoPoints = logoPoints.concat(createLine(-4 * scale, 1 * scale, -3 * scale, -1 * scale, 15)); // Linie dreaptă
    logoPoints = logoPoints.concat(createLine(-4.5 * scale, 0, -3.5 * scale, 0, 8)); // Linie mijloc
    
    // Litera X
    logoPoints = logoPoints.concat(createLine(-2.5 * scale, 1 * scale, -1.5 * scale, -1 * scale, 15)); // Diagonală '\'
    logoPoints = logoPoints.concat(createLine(-2.5 * scale, -1 * scale, -1.5 * scale, 1 * scale, 15)); // Diagonală '/'
    
    // Litera I
    logoPoints = logoPoints.concat(createLine(-1 * scale, 1 * scale, -1 * scale, -1 * scale, 15)); // Linie verticală
    
    // Litera O
    const oCircle = createCirclePoints(0.5 * scale, 0, 0.9 * scale, 20);
    logoPoints = logoPoints.concat(oCircle);
    
    // Litera M
    logoPoints = logoPoints.concat(createLine(2 * scale, -1 * scale, 2 * scale, 1 * scale, 15)); // Linie stânga
    logoPoints = logoPoints.concat(createLine(2 * scale, 1 * scale, 3 * scale, 0, 10)); // Diagonal stânga
    logoPoints = logoPoints.concat(createLine(3 * scale, 0, 4 * scale, 1 * scale, 10)); // Diagonal dreapta
    logoPoints = logoPoints.concat(createLine(4 * scale, 1 * scale, 4 * scale, -1 * scale, 15)); // Linie dreapta
    
    // Litera X
    logoPoints = logoPoints.concat(createLine(5 * scale, 1 * scale, 6 * scale, -1 * scale, 15)); // Diagonală '\'
    logoPoints = logoPoints.concat(createLine(5 * scale, -1 * scale, 6 * scale, 1 * scale, 15)); // Diagonală '/'
    
    // Aplică offsetul Y și scalarea la toate punctele
    const finalLogoPoints = logoPoints.map(point => [
        point[0], 
        point[1] + yOffset, 
        point[2]
    ]);
    
    // Create more points by interpolation for smoother areas
    const additionalPoints = [];
    for (let i = 0; i < 100; i++) {
        const basePoint = finalLogoPoints[Math.floor(Math.random() * finalLogoPoints.length)];
        additionalPoints.push([
            basePoint[0] + (Math.random() - 0.5) * 0.1,
            basePoint[1] + (Math.random() - 0.5) * 0.1,
            basePoint[2] + (Math.random() - 0.5) * 0.1
        ]);
    }
    
    const allPoints = [...finalLogoPoints, ...additionalPoints];
    const particleCount = allPoints.length;
    
    const particles = new THREE.BufferGeometry();
    const originalPositions = new Float32Array(particleCount * 3);
    const targetPositions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    // Set initial random positions and colors
    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        // Random starting positions - spread out wider
        originalPositions[i3] = (Math.random() - 0.5) * 40; // Wider X spread
        originalPositions[i3 + 1] = (Math.random() - 0.5) * 40 + yOffset; // Wider Y spread with offset
        originalPositions[i3 + 2] = (Math.random() - 0.5) * 40 + zOffset; // Wider Z spread with offset
        
        // Target positions form the logo
        targetPositions[i3] = allPoints[i][0];
        targetPositions[i3 + 1] = allPoints[i][1];
        targetPositions[i3 + 2] = allPoints[i][2];
        
        // Gradient colors - de la albastru deschis la mov
        if (i < finalLogoPoints.length) {
            // Puncte principale - albastru mai strălucitor
            colors[i3] = 0.1 + Math.random() * 0.2; // R - puțin roșu
            colors[i3 + 1] = 0.5 + Math.random() * 0.4; // G - verde mediu
            colors[i3 + 2] = 0.9 + Math.random() * 0.1; // B - mult albastru
            sizes[i] = 0.12; // Particule principale mai mari
        } else {
            // Puncte de umplere - culori complementare
            colors[i3] = 0.4 + Math.random() * 0.2; // R - mai mult roșu
            colors[i3 + 1] = 0.6 + Math.random() * 0.2; // G - mai mult verde
            colors[i3 + 2] = 0.8 + Math.random() * 0.2; // B - albastru moderat
            sizes[i] = 0.08; // Particule secundare mai mici
        }
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(originalPositions.slice(), 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // Texture path for beautiful particles
    const particleTexture = 'https://raw.githubusercontent.com/baronwatts/models/master/snowflake.png';
    
    const particleMaterial = new THREE.PointsMaterial({
        size: 0.12, // Larger particles
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        sizeAttenuation: true // Particles change size with distance
    });
    
    // Adaugă textură pentru particule pentru un aspect mai plăcut
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(particleTexture, (texture) => {
        particleMaterial.map = texture;
        particleMaterial.needsUpdate = true;
    }, null, () => {
        // Fallback - creează textură simplă dacă imaginea nu se încarcă
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.3, 'rgba(210, 240, 255, 0.8)');
        gradient.addColorStop(0.7, 'rgba(120, 170, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(40, 100, 220, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);
        
        const particleTexture = new THREE.CanvasTexture(canvas);
        particleMaterial.map = particleTexture;
        particleMaterial.needsUpdate = true;
    });
    
    // Folosește un material care adaugă efect de strălucire
    particleMaterial.blending = THREE.AdditiveBlending;
    
    // Setează un atribut de dimensiune particule
    particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Create the particle system
    const particleSystem = new THREE.Points(particles, particleMaterial);
    
    // Position adjustment
    particleSystem.position.y = 0; // No additional Y positioning
    particleSystem.position.z = zOffset; // Add extra Z offset
    
    return {
        particleSystem: particleSystem,
        positions: originalPositions,
        targetPositions: targetPositions,
        count: particleCount
    };
} 