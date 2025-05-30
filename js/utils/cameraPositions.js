// Camera positions and configurations for different user roles
export const CAMERA_POSITIONS = {
    CREATOR: {
        // Position near the screen looking towards chairs
        position: {
            x: 0,      // Center of the room
            y: 7,      // Elevated position
            z: -12     // In front of the screen, facing chairs
        },
        lookAt: {
            x: 0,      // Center of the room
            y: -3,      // Eye level of seated participants
            z: 10      // Looking back towards the chairs
        },
        limits: {
            minPolarAngle: Math.PI * 0.25,    // 45 degrees up
            maxPolarAngle: Math.PI * 0.75,    // 45 degrees down
            minAzimuthAngle: -Math.PI * 0.3,  // ~60 degrees left
            maxAzimuthAngle: Math.PI * 0.3    // ~60 degrees right
        }
    },
    PARTICIPANT: {
        // Initial position at the back of the room
        position: {
            x: 0,      // Center of the room
            y: 7,      // Standing height
            z: 13      // Back of the room
        },
        lookAt: {
            x: 0,      // Center of the room
            y: 2,      // Screen center height
            z: -12     // Looking towards the screen
        },
        limits: {
            minPolarAngle: Math.PI * 0.25,    // 45 degrees up
            maxPolarAngle: Math.PI * 0.75,    // 45 degrees down
            minAzimuthAngle: -Math.PI * 0.5,  // 90 degrees left
            maxAzimuthAngle: Math.PI * 0.5    // 90 degrees right
        }
    },
    SEATED: {
        // Configuration for seated view
        heightOffset: 1.6,  // Eye level when seated
        lookAtOffset: -12,  // Distance to look at when seated
        limits: {
            minPolarAngle: Math.PI * 0.3,     // ~54 degrees up
            maxPolarAngle: Math.PI * 0.7,     // ~54 degrees down
            minAzimuthAngle: -Math.PI * 0.4,  // ~72 degrees left
            maxAzimuthAngle: Math.PI * 0.4    // ~72 degrees right
        }
    }
}; 