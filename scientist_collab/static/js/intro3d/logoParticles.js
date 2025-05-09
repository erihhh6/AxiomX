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
    
    // Define logo shape (ElectraX letters) - moving logo particles behind camera
    const zOffset = -2; // Move logo particles behind camera
    const yOffset = 3;  // Move logo up to avoid text overlap
    const scale = 0.8 * 1.5;  // Scale pentru litere mai mari - mărit cu 1.5 față de original

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
    
    // Funcție pentru a crea lightning bolt (fulger)
    function createLightningLine(x1, y1, x2, y2, numPoints, jaggedness = 0.2) {
        const points = [];
        const mainDir = { x: x2 - x1, y: y2 - y1 };
        const length = Math.sqrt(mainDir.x * mainDir.x + mainDir.y * mainDir.y);
        
        // Dublăm numărul de puncte pentru o densitate mai mare
        numPoints = numPoints * 1.5;
        
        for (let i = 0; i < numPoints; i++) {
            const t = i / (numPoints - 1);
            
            // More jagged in the middle, smoother at endpoints
            const jagFactor = jaggedness * Math.sin(t * Math.PI);
            
            // Calculate jag perpendicular to main direction
            const perpX = -mainDir.y / length;
            const perpY = mainDir.x / length;
            
            // Add randomness perpendicular to the line
            const randOffset = (Math.random() - 0.5) * length * jagFactor;
            
            points.push([
                x1 + mainDir.x * t + perpX * randOffset,
                y1 + mainDir.y * t + perpY * randOffset,
                zOffset
            ]);
        }
        return points;
    }

    // Definirea formei logo-ului ElectraX cu coordonate precise pentru lizibilitate și spații corecte
    let logoPoints = [];
    
    // Litera E - densitate mărită pentru toate literele
    logoPoints = logoPoints.concat(createLightningLine(-6 * scale, -1 * scale, -6 * scale, 1 * scale, 25)); // Linie verticală
    logoPoints = logoPoints.concat(createLightningLine(-6 * scale, 1 * scale, -5 * scale, 1 * scale, 15)); // Linie sus
    logoPoints = logoPoints.concat(createLightningLine(-6 * scale, 0, -5.2 * scale, 0, 15)); // Linie mijloc
    logoPoints = logoPoints.concat(createLightningLine(-6 * scale, -1 * scale, -5 * scale, -1 * scale, 15)); // Linie jos
    
    // Litera L
    logoPoints = logoPoints.concat(createLightningLine(-4.5 * scale, 1 * scale, -4.5 * scale, -1 * scale, 25)); // Linie verticală
    logoPoints = logoPoints.concat(createLightningLine(-4.5 * scale, -1 * scale, -3.5 * scale, -1 * scale, 15)); // Linie orizontală
    
    // Litera E
    logoPoints = logoPoints.concat(createLightningLine(-3 * scale, -1 * scale, -3 * scale, 1 * scale, 25)); // Linie verticală
    logoPoints = logoPoints.concat(createLightningLine(-3 * scale, 1 * scale, -2 * scale, 1 * scale, 15)); // Linie sus
    logoPoints = logoPoints.concat(createLightningLine(-3 * scale, 0, -2.2 * scale, 0, 15)); // Linie mijloc
    logoPoints = logoPoints.concat(createLightningLine(-3 * scale, -1 * scale, -2 * scale, -1 * scale, 15)); // Linie jos
    
    // Litera C - apropiată de celelalte litere pentru a forma ElectraX (nu Elec traX)
    // Ajustăm poziția pentru a nu lăsa spațiu și facem-o mai vizibilă
    const cBaseX = -1.5 * scale; // Mai aproape de E
    const cRadius = 0.9 * scale;
    
    // Definim C ca un arc de cerc incomplet (nu 360 de grade)
    // Rotim C-ul cu 180 de grade (oglindă) - inversăm unghiurile
    const cArcStart = Math.PI * 0.3; // Începem deasupra mijlocului din dreapta
    const cArcEnd = Math.PI * 1.7;   // Terminăm sub mijlocul din dreapta
    
    const cPoints = [];
    const cPointCount = 60; // Mai multe puncte pentru vizibilitate mai bună
    
    // Creăm doar un arc de cerc, nu un cerc complet
    for (let i = 0; i < cPointCount; i++) {
        const angle = cArcStart + (cArcEnd - cArcStart) * (i / (cPointCount - 1));
        cPoints.push([
            cBaseX + Math.cos(angle) * cRadius,
            Math.sin(angle) * cRadius,
            zOffset
        ]);
    }
    
    // Adăugăm puncte suplimentare la capetele C-ului pentru a face deschiderea mai evidentă
    // Oglindim toate punctele pentru a reflecta rotația de 180 de grade
    const cExtras = [
        // Puncte pentru accentuarea marginii din dreapta a C-ului (fost stânga)
        [cBaseX + 0.5 * scale, 0.8 * scale, zOffset],
        [cBaseX + 0.6 * scale, 0.6 * scale, zOffset],
        [cBaseX + 0.7 * scale, 0.4 * scale, zOffset],
        [cBaseX + 0.7 * scale, 0.2 * scale, zOffset],
        [cBaseX + 0.7 * scale, 0 * scale, zOffset],
        [cBaseX + 0.7 * scale, -0.2 * scale, zOffset],
        [cBaseX + 0.7 * scale, -0.4 * scale, zOffset],
        [cBaseX + 0.6 * scale, -0.6 * scale, zOffset],
        [cBaseX + 0.5 * scale, -0.8 * scale, zOffset],
        
        // Puncte pentru evidențierea deschiderii C-ului (partea stângă, fost dreapta)
        [cBaseX - 0.3 * scale, 0.8 * scale, zOffset],
        [cBaseX - 0.4 * scale, 0.7 * scale, zOffset],
        [cBaseX - 0.5 * scale, 0.6 * scale, zOffset],
        
        [cBaseX - 0.3 * scale, -0.8 * scale, zOffset],
        [cBaseX - 0.4 * scale, -0.7 * scale, zOffset],
        [cBaseX - 0.5 * scale, -0.6 * scale, zOffset],
        
        // Puncte pentru a întări marginile deschiderii
        [cBaseX - 0.2 * scale, 0.85 * scale, zOffset],
        [cBaseX - 0.2 * scale, -0.85 * scale, zOffset]
    ];
    
    // Adăugăm densitate suplimentară, dar doar în zonele corecte pentru un C
    const cDensity = [];
    
    // Generăm puncte aleatorii doar în partea dreaptă și centrală a C-ului oglindit
    for (let i = 0; i < 80; i++) { // Măresc numărul de puncte pentru mai multă vizibilitate
        // Generăm unghiuri doar în intervalul care formează C-ul oglindit
        const angle = cArcStart + (cArcEnd - cArcStart) * Math.random();
        const radius = (0.6 + Math.random() * 0.4) * cRadius; // Variație în raza cercului
        
        // Calculăm poziția punctului
        const x = cBaseX + Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        // Adăugăm punctul la lista de densitate
        cDensity.push([x, y, zOffset]);
    }
    
    // Adăugăm puncte speciale pentru accentuarea deschiderii C-ului
    for (let i = 0; i < 20; i++) {
        // Generăm puncte pentru capătul superior al C-ului
        const topAngle = cArcStart + Math.random() * 0.3; // Unghiuri aproape de capătul superior
        const topRadius = (0.85 + Math.random() * 0.3) * cRadius;
        
        cDensity.push([
            cBaseX + Math.cos(topAngle) * topRadius,
            Math.sin(topAngle) * topRadius,
            zOffset
        ]);
        
        // Generăm puncte pentru capătul inferior al C-ului
        const bottomAngle = cArcEnd - Math.random() * 0.3; // Unghiuri aproape de capătul inferior
        const bottomRadius = (0.85 + Math.random() * 0.3) * cRadius;
        
        cDensity.push([
            cBaseX + Math.cos(bottomAngle) * bottomRadius,
            Math.sin(bottomAngle) * bottomRadius,
            zOffset
        ]);
    }
    
    logoPoints = logoPoints.concat(cPoints);
    logoPoints = logoPoints.concat(cExtras);
    logoPoints = logoPoints.concat(cDensity);
    
    // Litera T - ajustată pentru spațiere corectă
    const tBaseX = 0 * scale; // Ajustat pentru a fi mai aproape de C
    logoPoints = logoPoints.concat(createLightningLine(tBaseX - 0.5 * scale, 1 * scale, tBaseX + 0.5 * scale, 1 * scale, 15)); // Linie sus
    logoPoints = logoPoints.concat(createLightningLine(tBaseX, 1 * scale, tBaseX, -1 * scale, 25)); // Linie verticală
    
    // Litera R - ajustată pentru spațiere
    const rBaseX = tBaseX + 1 * scale;
    logoPoints = logoPoints.concat(createLightningLine(rBaseX, -1 * scale, rBaseX, 1 * scale, 25)); // Linie verticală
    logoPoints = logoPoints.concat(createLightningLine(rBaseX, 1 * scale, rBaseX + 0.8 * scale, 1 * scale, 15)); // Linie sus
    logoPoints = logoPoints.concat(createLightningLine(rBaseX + 0.8 * scale, 1 * scale, rBaseX + 0.8 * scale, 0, 15)); // Vertical dreapta sus
    logoPoints = logoPoints.concat(createLightningLine(rBaseX, 0, rBaseX + 0.8 * scale, 0, 15)); // Linie mijloc
    logoPoints = logoPoints.concat(createLightningLine(rBaseX, 0, rBaseX + 0.8 * scale, -1 * scale, 20)); // Linie diagonală
    
    // Litera A - ajustată pentru spațiere
    const aBaseX = rBaseX + 1.3 * scale;
    logoPoints = logoPoints.concat(createLightningLine(aBaseX, -1 * scale, aBaseX + 0.5 * scale, 1 * scale, 25)); // Linie stânga
    logoPoints = logoPoints.concat(createLightningLine(aBaseX + 0.5 * scale, 1 * scale, aBaseX + 1 * scale, -1 * scale, 25)); // Linie dreapta
    logoPoints = logoPoints.concat(createLightningLine(aBaseX + 0.2 * scale, 0, aBaseX + 0.8 * scale, 0, 15)); // Linie mijloc
    
    // Litera X - ajustată pentru spațiere
    const xBaseX = aBaseX + 1.5 * scale;
    logoPoints = logoPoints.concat(createLightningLine(xBaseX, 1 * scale, xBaseX + 1 * scale, -1 * scale, 25, 0.25)); // Diagonală '\'
    logoPoints = logoPoints.concat(createLightningLine(xBaseX, -1 * scale, xBaseX + 1 * scale, 1 * scale, 25, 0.25)); // Diagonală '/'

    // Create real lightning bolts that connect to the letters
    const realLightningCount = 8;
    const realLightningPoints = [];
    
    for (let i = 0; i < realLightningCount; i++) {
        // Decide where the lightning will hit (randomly select a target from logo points)
        const targetPoint = logoPoints[Math.floor(Math.random() * logoPoints.length)];
        
        // Create a zigzag path from above the logo to the target point
        const startX = targetPoint[0] + (Math.random() - 0.5) * 2;
        const startY = targetPoint[1] + 3 + Math.random() * 4; // Above the logo
        
        // Generate a jagged lightning bolt with 8-15 segments
        let currentX = startX;
        let currentY = startY;
        const segments = 8 + Math.floor(Math.random() * 7);
        
        for (let j = 0; j < segments; j++) {
            const nextY = currentY - (startY - targetPoint[1]) / segments;
            // More jagged in the middle of the bolt
            const jagFactor = 0.3 * Math.sin((j / segments) * Math.PI);
            const nextX = currentX + (targetPoint[0] - currentX) / (segments - j) + (Math.random() - 0.5) * jagFactor;
            
            // Create a mini-segment with multiple points
            const linePoints = createLightningLine(
                currentX, currentY, 
                nextX, nextY, 
                4, 0.4 // Higher jaggedness for more realistic lightning
            );
            
            realLightningPoints.push(...linePoints);
            
            currentX = nextX;
            currentY = nextY;
        }
        
        // Add small branches to some lightning bolts
        if (Math.random() < 0.7) {
            const branchCount = 1 + Math.floor(Math.random() * 3);
            
            for (let b = 0; b < branchCount; b++) {
                // Pick a random point on the main bolt to branch from
                const branchIndex = Math.floor(Math.random() * segments * 3); // 3 points per segment
                if (branchIndex < realLightningPoints.length - 2) {
                    const branchStart = realLightningPoints[branchIndex];
                    
                    // Create a short branch in a random direction
                    const branchLength = 0.3 + Math.random() * 0.5;
                    const branchAngle = Math.random() * Math.PI * 2;
                    
                    const branchEndX = branchStart[0] + Math.cos(branchAngle) * branchLength;
                    const branchEndY = branchStart[1] + Math.sin(branchAngle) * branchLength;
                    
                    const branchPoints = createLightningLine(
                        branchStart[0], branchStart[1],
                        branchEndX, branchEndY,
                        3, 0.5 // Very jagged for small branches
                    );
                    
                    realLightningPoints.push(...branchPoints);
                }
            }
        }
    }
    
    // Aplică offsetul Y și scalarea la toate punctele
    const finalLogoPoints = logoPoints.map(point => [
        point[0], 
        point[1] + yOffset, 
        point[2]
    ]);
    
    // Also apply offset to real lightning points
    const finalLightningPoints = realLightningPoints.map(point => [
        point[0], 
        point[1] + yOffset, 
        point[2]
    ]);
    
    // Create additional density points around letters to make them more defined
    const additionalLetterDensity = [];
    const letterCount = 500; // Mai multe puncte pentru a face literele mai clare
    
    // For each letter, add some random points near its position
    for (let i = 0; i < letterCount; i++) {
        // Pick a random point from the logo
        const basePoint = finalLogoPoints[Math.floor(Math.random() * finalLogoPoints.length)];
        
        // Add slight variation to create density
        additionalLetterDensity.push([
            basePoint[0] + (Math.random() - 0.5) * 0.15,
            basePoint[1] + (Math.random() - 0.5) * 0.15,
            basePoint[2] + (Math.random() - 0.5) * 0.05
        ]);
    }
    
    // Create more points by interpolation for smoother areas
    const additionalPoints = [];
    for (let i = 0; i < 150; i++) {
        const basePoint = finalLogoPoints[Math.floor(Math.random() * finalLogoPoints.length)];
        additionalPoints.push([
            basePoint[0] + (Math.random() - 0.5) * 0.1,
            basePoint[1] + (Math.random() - 0.5) * 0.1,
            basePoint[2] + (Math.random() - 0.5) * 0.1
        ]);
    }
    
    // Add lightning branch points
    const lightningBranches = [];
    for (let i = 0; i < 80; i++) {
        const basePoint = finalLogoPoints[Math.floor(Math.random() * finalLogoPoints.length)];
        // Create small branch from base point
        const branchLength = 0.2 + Math.random() * 0.3;
        const angle = Math.random() * Math.PI * 2;
        
        lightningBranches.push([
            basePoint[0],
            basePoint[1],
            basePoint[2]
        ]);
        
        lightningBranches.push([
            basePoint[0] + Math.cos(angle) * branchLength,
            basePoint[1] + Math.sin(angle) * branchLength,
            basePoint[2]
        ]);
    }
    
    // Combine all points
    const allPoints = [
        ...finalLogoPoints, 
        ...additionalPoints,
        ...additionalLetterDensity, // Adăugăm punctele suplimentare de densitate
        ...lightningBranches,
        ...finalLightningPoints
    ];
    const particleCount = allPoints.length;
    
    // Create lightning bolt geometries (lines instead of particles)
    const lightningMaterial = new THREE.LineBasicMaterial({
        color: 0xffff00, // Bright yellow
        linewidth: 3,
        transparent: true,
        opacity: 0.7,
    });
    
    const lightningGeometries = [];
    const lightningLines = [];
    
    // Create 5-8 lightning bolts that connect to different parts of the logo
    const boltCount = 18 + Math.floor(Math.random() * 100); // Increased for more dispersed lightning
    for (let i = 0; i < boltCount; i++) {
        // Pick a random point from the logo
        const targetPoint = finalLogoPoints[Math.floor(Math.random() * finalLogoPoints.length)];
        
        // Make sure there are enough lightning bolts for the C
        let targetX = targetPoint[0];
        let targetY = targetPoint[1];
        
        // Keep some lightning bolts targeting the C for visibility
        if (i < 4) { // First few bolts specifically target the C
            const cLetter = cPoints.concat(cExtras).concat(cDensity);
            const cTarget = cLetter[Math.floor(Math.random() * cLetter.length)];
            targetX = cTarget[0];
            targetY = cTarget[1] + yOffset;
        }
        
        // IMPORTANT: Disperse lightning bolts AWAY from the text
        // This makes sure bolts don't overlap with text in the center
        if (i >= 4) { // For most bolts, avoid the center text area
            // Define the "protected zone" where the text is
            const textCenterX = 0;
            const textWidth = 12 * 1.5; // Width of the text area to protect, mărit cu 1.5
            const textHeight = 3 * 1.5; // Height of the text area to protect, mărit cu 1.5
            
            // Choose a position that's outside the text zone
            let randomX, randomY;
            let outsideZone = false;
            
            while (!outsideZone) {
                // Generate a random position on screen
                randomX = (Math.random() - 0.5) * 40; // -20 to 20
                randomY = (Math.random() - 0.5) * 30 + yOffset; // Keep at similar height to text
                
                // Check if it's outside the protected text zone
                const distanceFromCenterX = Math.abs(randomX - textCenterX);
                const distanceFromCenterY = Math.abs(randomY - yOffset);
                
                // If bolt is far enough from the text center OR very far to the sides
                if ((distanceFromCenterX > textWidth/2 || distanceFromCenterY > textHeight) || 
                    (distanceFromCenterX > textWidth)) {
                    outsideZone = true;
                    // Use this position instead of targeting the logo
                    targetX = randomX;
                    targetY = randomY;
                }
            }
        }
        
        // Start from all directions, not just above
        const angle = Math.random() * Math.PI * 2; // 360 degrees
        const distance = 4 + Math.random() * 7; // Start further away
        
        const startX = targetX + Math.cos(angle) * distance;
        const startY = targetY + Math.sin(angle) * distance;
        
        const points = [];
        let currentX = startX;
        let currentY = startY;
        const segments = 5 + Math.floor(Math.random() * 5);
        
        points.push(new THREE.Vector3(currentX, currentY, zOffset));
        
        // Create jagged path to target
        for (let j = 1; j < segments; j++) {
            const ratio = j / (segments - 1);
            // More jaggedness
            const jitter = (1 - ratio) * (Math.random() - 0.5) * 2.5; 
            
            currentX = startX + (targetX - startX) * ratio + jitter;
            currentY = startY + (targetY - startY) * ratio + jitter * 0.7;
            
            points.push(new THREE.Vector3(currentX, currentY, zOffset));
        }
        
        // Add the target point at the end
        points.push(new THREE.Vector3(targetX, targetY, zOffset));
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        // All lightning is yellow now
        const lightningMaterial = new THREE.LineBasicMaterial({
            color: Math.random() < 0.7 ? 0xffff00 : 0xffffaa, // Only yellow to white-yellow variations
            linewidth: 2 + Math.random() * 2,
            transparent: true,
            opacity: 0.7 + Math.random() * 0.3,
        });
        
        const line = new THREE.Line(geometry, lightningMaterial);
        
        lightningGeometries.push(geometry);
        lightningLines.push(line);
        
        // Add some branch lightning for larger bolts
        if (Math.random() < 0.5 && segments > 6) {
            // Pick a random segment to branch from
            const branchSegment = 1 + Math.floor(Math.random() * (segments - 2));
            const branchStart = points[branchSegment];
            
            // Random branch direction
            const branchAngle = Math.random() * Math.PI * 2;
            const branchLength = 1 + Math.random() * 2;
            
            const branchEnd = new THREE.Vector3(
                branchStart.x + Math.cos(branchAngle) * branchLength,
                branchStart.y + Math.sin(branchAngle) * branchLength,
                branchStart.z
            );
            
            const branchPoints = [];
            branchPoints.push(branchStart.clone());
            
            // Add a few segments to the branch
            const branchSegments = 2 + Math.floor(Math.random() * 3);
            let currentBranchX = branchStart.x;
            let currentBranchY = branchStart.y;
            
            for (let b = 1; b <= branchSegments; b++) {
                const ratio = b / branchSegments;
                const jitter = (1 - ratio) * (Math.random() - 0.5);
                
                currentBranchX = branchStart.x + (branchEnd.x - branchStart.x) * ratio + jitter;
                currentBranchY = branchStart.y + (branchEnd.y - branchStart.y) * ratio + jitter;
                
                branchPoints.push(new THREE.Vector3(currentBranchX, currentBranchY, zOffset));
            }
            
            const branchGeometry = new THREE.BufferGeometry().setFromPoints(branchPoints);
            const branchMaterial = new THREE.LineBasicMaterial({
                color: 0xffff00, // Pure yellow for branches
                linewidth: 1.5,
                transparent: true,
                opacity: 0.6 + Math.random() * 0.4,
            });
            
            const branchLine = new THREE.Line(branchGeometry, branchMaterial);
            lightningLines.push(branchLine);
            lightningGeometries.push(branchGeometry);
        }
    }
    
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
        
        // Lightning colors - with stronger yellow accents
        const useYellow = Math.random() < 0.8; // 80% chance for yellow (increased from 60%)
        
        if (i < finalLogoPoints.length) {
            if (useYellow) {
                // Yellow electric core - enhanced saturation
                colors[i3] = 1.0; // R - full for yellow
                colors[i3 + 1] = 1.0; // G - full for intense yellow
                colors[i3 + 2] = 0.0; // B - none for pure yellow
            } else {
                // Bright white with yellow tint
                colors[i3] = 1.0; // R - full
                colors[i3 + 1] = 1.0; // G - full
                colors[i3 + 2] = 0.7; // B - lower for yellowish white
            }
            sizes[i] = 0.25; // Larger particles for main lightning
        } else if (i < finalLogoPoints.length + additionalPoints.length + additionalLetterDensity.length) {
            // Punctele pentru densitatea literelor - mai mari pentru vizibilitate mai bună
            if (useYellow) {
                // Yellow-orange for letter density particles
                colors[i3] = 1.0; // R - full for yellow
                colors[i3 + 1] = 1.0; // G - high for yellow
                colors[i3 + 2] = 0.0; // B - none for pure yellow
            } else {
                // Bright white-yellow
                colors[i3] = 1.0; // R - full
                colors[i3 + 1] = 1.0; // G - full
                colors[i3 + 2] = 0.5; // B - medium for yellowish white
            }
            sizes[i] = 0.2; // Mai mari decât particule normale, dar nu la fel de mari ca literele principale
        } else {
            // These are the real lightning bolt points
            colors[i3] = 1.0; // R - full
            colors[i3 + 1] = 1.0; // G - full for true yellow/white
            colors[i3 + 2] = Math.random() < 0.7 ? 0.0 : 0.8; // 70% pure yellow, 30% bluish white
            sizes[i] = 0.14 + Math.random() * 0.12; // Various sizes for lightning effects
        }
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(originalPositions.slice(), 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // Custom lightning texture
    const lightningTexturePath = '/static/images/lightning_particle.png';
    
    const particleMaterial = new THREE.PointsMaterial({
        size: 0.15, // Larger particles
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        sizeAttenuation: true, // Particles change size with distance
        blending: THREE.AdditiveBlending
    });
    
    // Adaugă textură pentru particule pentru un aspect mai plăcut
    const textureLoader = new THREE.TextureLoader();
    
    // Create lightning texture directly
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas with transparent background
    ctx.clearRect(0, 0, 128, 128);
    
    // Create lightning bolt shape
    ctx.fillStyle = 'rgba(255, 255, 0, 0.0)'; // Transparent yellow
    ctx.fillRect(0, 0, 128, 128);
    
    // Draw a jagged lightning shape
    ctx.beginPath();
    ctx.moveTo(64, 10);  // Top
    ctx.lineTo(75, 25);
    ctx.lineTo(100, 40);
    ctx.lineTo(80, 50);
    ctx.lineTo(90, 70);
    ctx.lineTo(64, 85);  // Middle
    ctx.lineTo(45, 70);
    ctx.lineTo(55, 50);
    ctx.lineTo(35, 40);
    ctx.lineTo(53, 25);
    ctx.closePath();
    
    // Create bright gradient
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 0, 0.9)');  // Yellow core
    gradient.addColorStop(0.5, 'rgba(255, 200, 0, 0.5)');  // Orange-yellow middle
    gradient.addColorStop(0.8, 'rgba(200, 100, 0, 0.2)');  // Faint orange edge
    gradient.addColorStop(1, 'rgba(100, 50, 0, 0)');       // Transparent edge
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Add glow effect
    ctx.shadowColor = 'rgba(255, 255, 0, 0.8)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fill();
    
    // Add a bright center line
    ctx.beginPath();
    ctx.moveTo(64, 10);
    ctx.lineTo(64, 118);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Use the created texture
    const particleTexture = new THREE.CanvasTexture(canvas);
    particleMaterial.map = particleTexture;
    particleMaterial.needsUpdate = true;
    
    // Create the particle system
    const particleSystem = new THREE.Points(particles, particleMaterial);
    
    // Create a group to hold both particles and lightning lines
    const logoGroup = new THREE.Group();
    logoGroup.add(particleSystem);
    
    // Add all lightning lines to the group
    lightningLines.forEach(line => {
        logoGroup.add(line);
    });
    
    // Position adjustment
    logoGroup.position.y = 0; // No additional Y positioning
    logoGroup.position.z = zOffset; // Add extra Z offset
    
    // Create a function to update the lightning (will be called from the main animate loop)
    const updateLightning = function(time) {
        // Control lightning visibility based on time
        lightningLines.forEach((line, index) => {
            // Make lines flicker and occasionally disappear
            const flicker = Math.sin(time * 10 + index * 5) * 0.3 + 0.7;
            line.material.opacity = flicker * (Math.random() < 0.94 ? 1 : 0); // 6% chance to disappear
            
            // Occasionally change color (only between yellow shades)
            if (Math.random() < 0.05) {
                // Yellow to white color range for lightning
                const yellowTint = Math.random() < 0.8;
                if (yellowTint) {
                    line.material.color.set(0xffff00); // Pure yellow
                } else {
                    line.material.color.set(0xffffaa); // White-yellow
                }
            }
            
            // Regenerate some bolts occasionally
            if (Math.random() < 0.01) {
                // Define the text protection zone
                const textCenterX = 0;
                const textWidth = 12 * 1.5; // Width of the text area to protect, mărit cu 1.5
                const textHeight = 3 * 1.5; // Height of the text area to protect, mărit cu 1.5
                
                // Choose a position that's outside the text zone
                let targetX, targetY;
                let outsideZone = false;
                
                while (!outsideZone) {
                    // Generate a random position on screen
                    targetX = (Math.random() - 0.5) * 40; // -20 to 20
                    targetY = (Math.random() - 0.5) * 30 + yOffset; // Keep at similar height to text
                    
                    // Check if it's outside the protected text zone
                    const distanceFromCenterX = Math.abs(targetX - textCenterX);
                    const distanceFromCenterY = Math.abs(targetY - yOffset);
                    
                    // If bolt is far enough from the text center OR very far to the sides
                    if ((distanceFromCenterX > textWidth/2 || distanceFromCenterY > textHeight) || 
                        (distanceFromCenterX > textWidth)) {
                        outsideZone = true;
                    }
                }
                
                // Start from a random direction
                const angle = Math.random() * Math.PI * 2;
                const distance = 3 + Math.random() * 5;
                const startX = targetX + Math.cos(angle) * distance;
                const startY = targetY + Math.sin(angle) * distance;
                
                const points = [];
                let currentX = startX;
                let currentY = startY;
                const segments = 5 + Math.floor(Math.random() * 5);
                
                points.push(new THREE.Vector3(currentX, currentY, zOffset));
                
                // Create jagged path to target
                for (let j = 1; j < segments; j++) {
                    const ratio = j / (segments - 1);
                    const jitter = (1 - ratio) * (Math.random() - 0.5) * 2.0;
                    
                    currentX = startX + (targetX - startX) * ratio + jitter;
                    currentY = startY + (targetY - startY) * ratio + jitter * 0.5;
                    
                    points.push(new THREE.Vector3(currentX, currentY, zOffset));
                }
                
                // Add the target point at the end
                points.push(new THREE.Vector3(targetX, targetY, zOffset));
                
                // Update existing geometry
                lightningGeometries[index].setFromPoints(points);
                lightningGeometries[index].verticesNeedUpdate = true;
            }
        });
    };
    
    return {
        particleSystem: logoGroup, // Return the whole group instead of just the particle system
        positions: originalPositions,
        targetPositions: targetPositions,
        count: particleCount,
        updateLightning: updateLightning // Return the update function
    };
} 