/**
 * Utils Module - Modulul cu funcții utilitare pentru animația 3D
 */

// Funcție pentru poziționarea obiectelor pe orbite
export function positionInOrbit(mesh, radius, angle, yOffset = 0) {
    if (!mesh || !mesh.position) {
        console.warn('Invalid mesh in positionInOrbit');
        return;
    }
    mesh.position.x = Math.cos(angle) * radius;
    mesh.position.z = Math.sin(angle) * radius;
    mesh.position.y = yOffset;
}

// Funcție de easing pentru animații fluide
export function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Încarcă script-uri JavaScript dinamic
export function loadScript(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
        document.head.appendChild(script);
    });
}

// Variable to check if animation is working
let animationFrameCount = 0;
let lastPositions = {};

// Funcție pentru animarea unui grup de obiecte care orbitează
export function animateFloatingObjects(objects, deltaTime = 1/60) {
    // Folosim valori fixe mari pentru a asigura mișcarea vizibilă indiferent de deltaTime
    const fixedDeltaTime = 0.05; // Impunem o valoare mare fixă
    
    // Debug info
    animationFrameCount++;
    if (animationFrameCount % 50 === 0 || animationFrameCount === 1) {
        console.log(`Animation frame ${animationFrameCount}, objects: ${objects.length}, fixedDeltaTime: ${fixedDeltaTime}`);
    }
    
    if (!objects || objects.length === 0) {
        console.warn('No floating objects to animate!');
        return;
    }
    
    // Valorile exacte pentru rotație și orbită - foarte mari pentru a forța mișcarea vizibilă
    const rotationAmount = 0.05; // Rotație foarte vizibilă
    const orbitAmount = 0.04;   // Mișcare orbitală foarte vizibilă
    
    objects.forEach((obj, index) => {
        if (!obj || !obj.mesh) {
            console.warn(`Invalid object at index ${index}`);
            return;
        }
        
        try {
            // Forțăm rotația direct
            if (obj.mesh.rotation) {
                obj.mesh.rotation.x += rotationAmount;
                obj.mesh.rotation.y += rotationAmount;
            }
            
            // Inițializăm unghiul orbital dacă nu există
            if (typeof obj.orbitAngle !== 'number') {
                obj.orbitAngle = index * (Math.PI / 4);
            }
            
            // Actualizăm unghiul cu o valoare mare
            obj.orbitAngle += orbitAmount;
            
            // Determinăm raza orbitei și offsetul vertical
            const radius = obj.orbitRadius || 10;
            const vertOffset = obj.verticalOffset || 0;
            
            // Actualizăm poziția direct
            if (obj.mesh.position) {
                obj.mesh.position.x = Math.cos(obj.orbitAngle) * radius;
                obj.mesh.position.z = Math.sin(obj.orbitAngle) * radius;
                obj.mesh.position.y = vertOffset + Math.sin(obj.orbitAngle * 2) * 2; // Amplitudine mai mare
                
                // Verificăm dacă obiectul s-a mișcat (doar pentru primul obiect)
                if (index === 0 && (animationFrameCount === 10 || animationFrameCount === 20 || animationFrameCount === 50)) {
                    const currentPos = {
                        x: obj.mesh.position.x,
                        y: obj.mesh.position.y,
                        z: obj.mesh.position.z
                    };
                    
                    const previousPos = lastPositions[index] || {x: 0, y: 0, z: 0};
                    const hasMoved = 
                        Math.abs(currentPos.x - previousPos.x) > 0.1 ||
                        Math.abs(currentPos.y - previousPos.y) > 0.1 ||
                        Math.abs(currentPos.z - previousPos.z) > 0.1;
                        
                    console.log(`Object ${index} position at frame ${animationFrameCount}:`, currentPos);
                    console.log(`Object ${index} moved: ${hasMoved}`);
                    
                    lastPositions[index] = currentPos;
                }
            }
        } catch (error) {
            console.error(`Error animating object ${index}:`, error);
        }
    });
}

// Detectează dacă browserul este pe mobil
export function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Ajustează calitatea renderului în funcție de performanța dispozitivului
export function adjustRenderQuality(renderer, isMobile) {
    if (isMobile) {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1));
        return 0.7; // factor de reducere pentru dispozitive mobile
    } else {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        return 1.0; // calitate completă pentru desktop
    }
} 