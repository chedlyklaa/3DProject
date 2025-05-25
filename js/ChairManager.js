import * as THREE from 'three';

class ChairManager {
    constructor(scene, roomConfig) {
        this.scene = scene;
        this.roomConfig = roomConfig; // Store room configuration
        this.chairs = new Map(); // Map to store chair objects with their IDs
        this.selectedChair = null;
        this.occupiedChairs = new Set();
        this.instancedMesh = null;
        this.originalColor = new THREE.Color(0xffffff);
        this.selectedColor = new THREE.Color(0x00ff00);
        this.occupiedColor = new THREE.Color(0xff0000);
        
        // Pre-allocate reusable objects for performance
        this._matrix = new THREE.Matrix4();
        this._position = new THREE.Vector3();
        this._quaternion = new THREE.Quaternion();
        this._scale = new THREE.Vector3();
    }

    // Add a chair to the manager
    addChair(instancedMesh, rowIndex, chairIndex, instanceId) {
        const chairId = `chair_${rowIndex}_${chairIndex}`;
        
        if (!this.instancedMesh) {
            this.instancedMesh = instancedMesh;
            this.instancedMesh.material = this.instancedMesh.material.clone();
            
            // Initialize instance colors once
            const colorArray = new Float32Array(instancedMesh.count * 3);
            colorArray.fill(this.originalColor.r);
            this.instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(colorArray, 3);
            this.instancedMesh.geometry.setAttribute('instanceColor', this.instancedMesh.instanceColor);
        }

        const chair = {
            id: chairId,
            instanceId: instanceId,
            row: rowIndex,
            position: chairIndex,
            isOccupied: false
        };

        this.chairs.set(chairId, chair);
        
        if (!instancedMesh.userData.chairs) {
            instancedMesh.userData.chairs = new Map();
        }
        instancedMesh.userData.chairs.set(instanceId, chairId);
    }

    // Select a chair
    selectChair(chairId) {
        if (this.occupiedChairs.has(chairId)) {
            console.log('Cette chaise est déjà occupée');
            return false;
        }

        const chair = this.chairs.get(chairId);
        if (!chair) return false;

        if (this.selectedChair) {
            const prevChair = this.chairs.get(this.selectedChair);
            if (prevChair && !this.occupiedChairs.has(this.selectedChair)) {
                this.updateChairColor(prevChair.instanceId, this.originalColor);
            }
        }

        this.updateChairColor(chair.instanceId, this.selectedColor);
        this.selectedChair = chairId;

        return true;
    }

    // Occupy a chair
    occupyChair(chairId) {
        const chair = this.chairs.get(chairId);
        if (!chair || this.occupiedChairs.has(chairId)) return false;

        chair.isOccupied = true;
        this.occupiedChairs.add(chairId);
        this.updateChairColor(chair.instanceId, this.occupiedColor);
        return true;
    }

    // Release a chair
    releaseChair(chairId) {
        const chair = this.chairs.get(chairId);
        if (!chair || !this.occupiedChairs.has(chairId)) return false;

        chair.isOccupied = false;
        this.occupiedChairs.delete(chairId);
        this.updateChairColor(chair.instanceId, this.originalColor);

        return true;
    }

    // Update chair color (optimized)
    updateChairColor(instanceId, color) {
        if (!this.instancedMesh || !this.instancedMesh.instanceColor) return;
        
        this.instancedMesh.instanceColor.setXYZ(instanceId, color.r, color.g, color.b);
        this.instancedMesh.instanceColor.needsUpdate = true;
    }

    // Get chair position for camera (optimized)
    getChairCameraPosition(chairId) {
        const chair = this.chairs.get(chairId);
        if (!chair || !this.instancedMesh) return null;

        // Reuse pre-allocated objects
        this.instancedMesh.getMatrixAt(chair.instanceId, this._matrix);
        this._matrix.decompose(this._position, this._quaternion, this._scale);

        // Calculate camera position and target
        const eyeHeight = 1.2; // Hauteur des yeux assis
        const screenDistance = this.roomConfig.depth / 2; // Distance jusqu'à l'écran

        return {
            position: new THREE.Vector3(
                this._position.x,
                this._position.y + eyeHeight,
                this._position.z
            ),
            target: new THREE.Vector3(
                0, // Centre de l'écran en x
                this._position.y + eyeHeight, // Même hauteur que la position
                -screenDistance // Position de l'écran en z
            )
        };
    }

    // Check if a chair is occupied
    isChairOccupied(chairId) {
        return this.occupiedChairs.has(chairId);
    }

    // Get chairId from instanceId (for raycasting)
    getChairIdFromInstanceId(instanceId) {
        return this.instancedMesh?.userData.chairs?.get(instanceId) || null;
    }
}

export default ChairManager; 