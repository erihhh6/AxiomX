/**
 * Particles Module - Modulul pentru particulele din animația 3D
 * Modified for a lightning storm effect
 */

export function createEnhancedParticleSystem(particleCount) {
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const speeds = new Float32Array(particleCount);
    const lifetimes = new Float32Array(particleCount);
    const branchFactors = new Float32Array(particleCount);
    const lightningSegments = new Float32Array(particleCount); // Track which segment of a lightning bolt
    
    // Store lightning bolt origins for more realistic pattern
    const lightningOrigins = [];
    const lightningCount = 8; // Number of main lightning bolts
    
    // Create main lightning bolt origins
    for (let i = 0; i < lightningCount; i++) {
        // Definim zona protejată pentru text
        const textCenterX = 0;
        const textWidth = 12 * 1.5; // Mărit cu același factor ca și textul
        
        // Generăm poziții pentru originile fulgerelor
        let boltX;
        let isOutsideTextZone = false;
        
        // Ne asigurăm că originile fulgerelor sunt în afara zonei textului
        while (!isOutsideTextZone) {
            boltX = (Math.random() - 0.5) * 40;
            
            // Verificăm dacă e în afara zonei de protecție
            if (Math.abs(boltX - textCenterX) > textWidth/2) {
                isOutsideTextZone = true;
            }
        }
        
        lightningOrigins.push({
            x: boltX,
            y: 15 + Math.random() * 5,
            z: -5 + Math.random() * 10,
            width: 0.5 + Math.random() * 1.0, // Width of the bolt
            segments: 8 + Math.floor(Math.random() * 8), // How many segments in this bolt
            active: false, // Will be activated during flashes
            branchChance: 0.3 + Math.random() * 0.3 // Chance to create branches
        });
    }
    
    // Distribuție de particule pentru fulgere
    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        // Distribuție în forma unui nor de furtună
        const particleType = Math.random();
        
        // Definim zona protejată unde se află textul
        const textCenterX = 0;
        const textCenterY = 3; // yOffset
        const textWidth = 12 * 1.5; // Mărit cu același factor ca și textul
        const textHeight = 3 * 1.5; // Mărit cu același factor ca și textul
        
        if (particleType < 0.4) {
            // Main lightning bolts - organized by lightning origin instead of random
            const boltIndex = i % lightningCount;
            const bolt = lightningOrigins[boltIndex];
            const segmentIndex = Math.floor(Math.random() * bolt.segments);
            
            // Position along the jagged path of the lightning bolt
            const segmentOffset = segmentIndex / bolt.segments;
            const verticalPos = bolt.y - (bolt.y + 10) * segmentOffset; // Top to bottom
            
            // Add zigzag effect to make it look like lightning
            const zigzagX = Math.sin(segmentIndex * 1.5) * (1.5 - segmentOffset) * bolt.width;
            const zigzagZ = Math.cos(segmentIndex * 1.5) * (1.5 - segmentOffset) * bolt.width;
            
            // Evităm zona de text pentru particule de fulger
            let posX = bolt.x + zigzagX;
            
            // Verificăm dacă particula ar fi în zona textului și o mutăm dacă e nevoie
            const distanceFromCenterX = Math.abs(posX - textCenterX);
            const distanceFromCenterY = Math.abs(verticalPos - textCenterY);
            
            // Dacă e în zona de text, o mutăm în afara zonei
            if (distanceFromCenterX < textWidth/2 && distanceFromCenterY < textHeight) {
                // Deplasăm particula la stânga sau la dreapta textului
                const moveDirection = posX < textCenterX ? -1 : 1; // stânga sau dreapta
                posX = textCenterX + moveDirection * (textWidth/2 + 1 + Math.random() * 3);
            }
            
            positions[i3] = posX;
            positions[i3 + 1] = verticalPos;
            positions[i3 + 2] = bolt.z + zigzagZ;
            
            // Fast-moving lightning
            speeds[i] = 1.0 + Math.random() * 0.8;
            lifetimes[i] = Math.random(); // Randomized lifetime phase
            branchFactors[i] = bolt.branchChance; // How much it branches
            lightningSegments[i] = segmentIndex; // Store segment for animation
        }
        else if (particleType < 0.7) {
            // Cloud particles - distributed in a dome above
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI * 0.5; // Half-sphere (dome)
            const radius = 15 + Math.random() * 10;
            
            let posX = radius * Math.sin(phi) * Math.cos(theta);
            let posY = 10 + Math.abs(radius * Math.cos(phi)); // Always above, higher
            
            // Verificăm dacă e în zona textului
            const distanceFromCenterX = Math.abs(posX - textCenterX);
            const distanceFromCenterY = Math.abs(posY - textCenterY);
            
            // Dacă particula de nor e aproape de zona textului, o deplasăm
            if (distanceFromCenterX < textWidth/2 && distanceFromCenterY < textHeight) {
                // Deplasăm norul în afara zonei
                const moveDirection = posX < textCenterX ? -1 : 1;
                posX = textCenterX + moveDirection * (textWidth/2 + Math.random() * 3);
            }
            
            positions[i3] = posX;
            positions[i3 + 1] = posY;
            positions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
            
            // Slower speeds for clouds
            speeds[i] = 0.1 + Math.random() * 0.3;
            lifetimes[i] = Math.random(); // Randomized phase
            branchFactors[i] = 0; // Clouds don't branch
            lightningSegments[i] = 0;
        }
        else {
            // Background atmosphere particles
            const theta = Math.random() * Math.PI * 2;
            const radius = 5 + Math.random() * 25;
            
            let posX = radius * Math.cos(theta);
            let posY = -5 + Math.random() * 15; // Distributed vertically
            
            // Verificăm dacă particula de atmosferă e în zona textului
            const distanceFromCenterX = Math.abs(posX - textCenterX);
            const distanceFromCenterY = Math.abs(posY - textCenterY);
            
            // Dacă e în zonă, o mutăm
            if (distanceFromCenterX < textWidth/2 && distanceFromCenterY < textHeight) {
                // Generăm o nouă poziție X
                const moveDirection = posX < textCenterX ? -1 : 1;
                posX = textCenterX + moveDirection * (textWidth/2 + 2 + Math.random() * 3);
            }
            
            positions[i3] = posX;
            positions[i3 + 1] = posY; 
            positions[i3 + 2] = radius * Math.sin(theta) - 10; // Further back
            
            // Medium speed for atmosphere
            speeds[i] = 0.2 + Math.random() * 0.2;
            lifetimes[i] = Math.random(); // Random phase
            branchFactors[i] = 0; // No branching
            lightningSegments[i] = 0;
        }
        
        // Colors with yellow accents
        const useYellow = Math.random() < 0.8; // 80% chance for yellow particles (increased from 30%)
        
        // Lightning particles - white-blue-yellow mix for electricity effect
        if (particleType < 0.4) {
            if (useYellow) {
                // Yellow lightning core - pure bright yellow
                colors[i3] = 1.0; // R - full for yellow
                colors[i3 + 1] = 1.0; // G - full for pure yellow
                colors[i3 + 2] = 0.0; // B - none for pure yellow
            } else {
                // Bright white-yellow lightning (no blue)
                colors[i3] = 1.0; // R - full
                colors[i3 + 1] = 1.0; // G - full
                colors[i3 + 2] = 0.6; // B - reduced for yellow tint
            }
            // Larger particles for lightning core, smaller for outer segments
            sizes[i] = 0.25 + (1 - lightningSegments[i] / 10) * 0.3;
        } 
        // Cloud particles - grayish blue with hints of yellow during flashes
        else if (particleType < 0.7) {
            if (useYellow) {
                // Yellowish cloud highlight - more intense
                colors[i3] = 0.9 + Math.random() * 0.1; // R - higher for yellow
                colors[i3 + 1] = 0.9 + Math.random() * 0.1; // G - higher for yellow
                colors[i3 + 2] = 0.2 + Math.random() * 0.2; // B - low for yellow tint
            } else {
                // Gray-yellow clouds instead of blue
                colors[i3] = 0.7 + Math.random() * 0.3; // R - higher
                colors[i3 + 1] = 0.7 + Math.random() * 0.3; // G - higher
                colors[i3 + 2] = 0.4 + Math.random() * 0.2; // B - lower for yellow tint
            }
            sizes[i] = 0.2 + Math.random() * 0.3; // Larger for clouds
        }
        // Atmosphere particles - yellow instead of cyan/blue
        else {
            if (useYellow) {
                // Yellow atmosphere highlight - more intense
                colors[i3] = 0.8 + Math.random() * 0.2; // R - higher
                colors[i3 + 1] = 0.8 + Math.random() * 0.2; // G - higher
                colors[i3 + 2] = 0.1 + Math.random() * 0.1; // B - very low for golden yellow
            } else {
                // Yellowish atmosphere
                colors[i3] = 0.6 + Math.random() * 0.2; // R - higher
                colors[i3 + 1] = 0.6 + Math.random() * 0.2; // G - higher
                colors[i3 + 2] = 0.2 + Math.random() * 0.2; // B - lower for yellow tint
            }
            sizes[i] = 0.05 + Math.random() * 0.1; // Slightly larger atmosphere particles
        }
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
    textureLoader.load('/static/images/lightning_particle.png', (texture) => {
        particleMaterial.map = texture;
        particleMaterial.needsUpdate = true;
    }, null, () => {
        // Alternativă în caz de eroare - creează o textură de particulă lightning
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        // Draw a more realistic lightning particle
        ctx.fillStyle = 'rgba(0, 0, 0, 0)';
        ctx.fillRect(0, 0, 128, 128);
        
        // Create a jagged lightning bolt shape instead of a circular particle
        ctx.beginPath();
        ctx.moveTo(64, 10);  // Top
        ctx.lineTo(75, 30);
        ctx.lineTo(100, 40);
        ctx.lineTo(80, 60);
        ctx.lineTo(95, 80);
        ctx.lineTo(64, 120); // Bottom
        ctx.lineTo(40, 80);
        ctx.lineTo(48, 60);
        ctx.lineTo(30, 40);
        ctx.lineTo(55, 30);
        ctx.closePath();
        
        // Create gradient for electric effect - pure yellow
        const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');  
        gradient.addColorStop(0.1, 'rgba(255, 255, 0, 1.0)'); // Intense pure yellow core
        gradient.addColorStop(0.4, 'rgba(255, 200, 0, 0.8)'); // Orange-yellow middle
        gradient.addColorStop(0.7, 'rgba(220, 120, 0, 0.4)'); // Orange edge
        gradient.addColorStop(1, 'rgba(120, 60, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Add multiple glow effects for enhanced lightning appearance
        ctx.shadowColor = 'rgba(255, 255, 0, 0.9)';
        ctx.shadowBlur = 30;
        ctx.fill();
        
        // Add a second layer with a different shadow for more intense glow
        ctx.shadowColor = 'rgba(255, 200, 0, 0.7)';
        ctx.shadowBlur = 15;
        ctx.fill();
        
        const particleTexture = new THREE.CanvasTexture(canvas);
        particleMaterial.map = particleTexture;
        particleMaterial.needsUpdate = true;
    });
    
    const particlePoints = new THREE.Points(particles, particleMaterial);
    
    // Lightning flash timing variables
    let lastFlashTime = 0;
    let flashIntensity = 0;
    let flashDecay = 0.05;
    let timeToNextFlash = 2 + Math.random() * 3;
    
    // Activate different lightning bolts over time
    function updateLightningBolts(flashActive) {
        lightningOrigins.forEach(bolt => {
            // Randomly activate/deactivate bolts when a flash occurs
            if (flashActive && Math.random() < 0.7) {
                bolt.active = true;
                // Give it a new origin point on flash
                bolt.x = (Math.random() - 0.5) * 40;
            } else if (Math.random() < 0.05) {
                bolt.active = false;
            }
        });
    }
    
    // Returnează atât sistemul de particule cât și datele pentru animație
    return {
        particles: particlePoints,
        positions: positions,
        colors: colors,
        sizes: sizes,
        speeds: speeds,
        lifetimes: lifetimes,
        branchFactors: branchFactors,
        lightningSegments: lightningSegments,
        originalPositions: positions.slice(),
        lightningOrigins: lightningOrigins,
        animate: function(time) {
            // Update lightning flash timing
            lastFlashTime += 0.016; // Approximate time between frames
            flashIntensity = Math.max(0, flashIntensity - flashDecay);
            
            // Create a new lightning flash
            let flashActive = false;
            if (lastFlashTime > timeToNextFlash) {
                flashIntensity = 0.8 + Math.random() * 0.2; // Stronger flash (increased from 0.7)
                lastFlashTime = 0;
                timeToNextFlash = 1.2 + Math.random() * 2.8; // 1.2-4 seconds between flashes (more frequent)
                flashDecay = 0.02 + Math.random() * 0.03; // Slower decay for longer-lasting flashes
                flashActive = true;
                
                // Activate new lightning bolts on flash
                updateLightningBolts(true);
            } else {
                // Update bolts occasionally even without flash
                if (Math.random() < 0.01) {
                    updateLightningBolts(false);
                }
            }
            
            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                
                // Update based on particle type
                if (i3 < particleCount * 0.4 * 3) { // Lightning particles
                    const boltIndex = i % lightningCount;
                    const bolt = lightningOrigins[boltIndex];
                    
                    if (bolt.active || flashActive) {
                        // Lightning bolts - zigzag pattern
                        positions[i3 + 1] -= speeds[i] * (0.3 + flashIntensity * 0.7); // Move down faster during flash
                        
                        const segment = lightningSegments[i];
                        // Add dynamic jagged movement to look like real lightning
                        const jitterX = Math.sin(time * 10 + segment * 2) * 0.15 * (bolt.width + flashIntensity);
                        const jitterZ = Math.cos(time * 10 + segment * 2) * 0.15 * (bolt.width + flashIntensity);
                        
                        positions[i3] += jitterX;
                        positions[i3 + 2] += jitterZ;
                        
                        // Reset lightning that goes below certain point
                        if (positions[i3 + 1] < -10) {
                            // Reset to top of the bolt
                            const newSegment = Math.floor(Math.random() * bolt.segments);
                            const zigzagX = Math.sin(newSegment * 1.5) * bolt.width;
                            const zigzagZ = Math.cos(newSegment * 1.5) * bolt.width;
                            
                            // Verificăm poziția pe X pentru a evita zona textului
                            let newPosX = bolt.x + zigzagX;
                            const distanceFromCenterX = Math.abs(newPosX);
                            
                            // Dacă e în zona textului, deplasăm
                            if (distanceFromCenterX < textWidth/2) { // textWidth/2
                                const moveDirection = newPosX < 0 ? -1 : 1;
                                newPosX = moveDirection * (textWidth/2 + 1 + Math.random() * 3);
                            }
                            
                            positions[i3] = newPosX;
                            positions[i3 + 1] = bolt.y - (newSegment / bolt.segments) * 5; 
                            positions[i3 + 2] = bolt.z + zigzagZ;
                            lightningSegments[i] = newSegment;
                        }
                        
                        // Create branching effect based on lifetime and flash
                        if (Math.random() < branchFactors[i] * 0.3 * (1 + flashIntensity)) {
                            const branchAngle = Math.random() * Math.PI * 2;
                            const branchStrength = 0.3 + flashIntensity * 0.7;
                            positions[i3] += Math.cos(branchAngle) * branchStrength;
                            positions[i3 + 2] += Math.sin(branchAngle) * branchStrength;
                        }
                    }
                    
                    // Modulate colors with yellow accents during flash
                    if (Math.random() < 0.3 + flashIntensity * 0.4) {
                        // Yellow flash highlight - pure yellow
                        colors[i3] = 1.0; // R - max for yellow
                        colors[i3 + 1] = 1.0; // G - max for yellow
                        colors[i3 + 2] = 0.0; // B - none for pure yellow
                    } else {
                        // White-yellow core (no blue)
                        colors[i3] = 1.0; // R - full
                        colors[i3 + 1] = 0.9 + flashIntensity * 0.1; // G - high
                        colors[i3 + 2] = 0.3 + flashIntensity * 0.2; // B - low for yellow tint
                    }
                    
                    // Modulate size with flash and lifetime
                    const sizePulse = Math.sin(time * 8 + lifetimes[i] * 10) * 0.3;
                    sizes[i] = (0.15 + Math.random() * 0.15) * (1 + flashIntensity * 1.2 + sizePulse);
                }
                else if (i3 < particleCount * 0.7 * 3) { // Cloud particles
                    // Slow drift for clouds
                    positions[i3] += (Math.sin(time * 0.2 + i) * 0.05) * speeds[i];
                    positions[i3 + 2] += (Math.cos(time * 0.2 + i) * 0.05) * speeds[i];
                    
                    // Modulate cloud color with yellow highlights during flashes
                    if (Math.random() < 0.2 + flashIntensity * 0.4) {
                        // Yellow highlight during flash - more intense
                        colors[i3] = 0.9 + flashIntensity * 0.1; // R - higher during flash
                        colors[i3 + 1] = 0.9 + flashIntensity * 0.1; // G - higher during flash
                        colors[i3 + 2] = 0.1 + flashIntensity * 0.1; // B - very low for yellow
                    } else {
                        // Normal cloud color with yellow tint
                        colors[i3] = 0.7 + flashIntensity * 0.3; // R - brighter during flash
                        colors[i3 + 1] = 0.7 + flashIntensity * 0.3; // G - brighter during flash
                        colors[i3 + 2] = 0.4 + flashIntensity * 0.1; // B - lower for yellow tint
                    }
                }
                else { // Atmosphere particles
                    // Subtle movement for atmosphere
                    positions[i3] += Math.sin(time * 0.1 + i) * 0.02 * speeds[i];
                    positions[i3 + 1] += Math.cos(time * 0.1 + i) * 0.02 * speeds[i];
                    positions[i3 + 2] += Math.sin(time * 0.1 + i * 0.5) * 0.02 * speeds[i];
                    
                    // Subtle color changes with yellow during flash
                    if (flashIntensity > 0.5 && Math.random() < 0.3) {
                        // Yellow tint during strong flash - more intense
                        colors[i3] = 0.8 + flashIntensity * 0.2; // R - increases with flash
                        colors[i3 + 1] = 0.8 + flashIntensity * 0.2; // G - increases with flash
                        colors[i3 + 2] = 0.0; // B - none for pure yellow
                    } else {
                        // Normal atmosphere color with yellow tint
                        colors[i3] = 0.5 + Math.random() * 0.2 + flashIntensity * 0.3; // R - higher
                        colors[i3 + 1] = 0.5 + Math.random() * 0.2 + flashIntensity * 0.3; // G - higher
                        colors[i3 + 2] = 0.2 + Math.sin(time + i) * 0.1 + flashIntensity * 0.1; // B - lower for yellow tint
                    }
                }
            }
            
            // Actualizează atributele
            particlePoints.geometry.attributes.position.needsUpdate = true;
            particlePoints.geometry.attributes.color.needsUpdate = true;
            particlePoints.geometry.attributes.size.needsUpdate = true;
        }
    };
} 