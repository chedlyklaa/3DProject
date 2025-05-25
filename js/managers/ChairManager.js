import * as THREE from 'three';
import { COLORS } from '../utils/constants.js';

class ChairManager {
    constructor(scene) {
        this.scene = scene;
        this.chairs = new Map(); // Map to store chair objects with their IDs
        this.selectedChair = null;
        this.occupiedChairs = new Set();
        this.instancedMesh = null;
        this.originalColor = new THREE.Color(COLORS.CHAIR_DEFAULT);
        this.selectedColor = new THREE.Color(COLORS.CHAIR_SELECTED);
        this.occupiedColor = new THREE.Color(COLORS.CHAIR_OCCUPIED);
    }

    // Add a chair to the manager
    addChair(instancedMesh, rowIndex, chairIndex, instanceId) {
        const chairId = `chair_${rowIndex}_${chairIndex}`;
        
        // Store the instanced mesh on first chair
        if (!this.instancedMesh) {
            this.instancedMesh = instancedMesh;
            
            // Initialize instance colors
            const colorArray = new Float32Array(instancedMesh.count * 3);
            for (let i = 0; i < instancedMesh.count; i++) {
                colorArray[i * 3] = this.originalColor.r;
                colorArray[i * 3 + 1] = this.originalColor.g;
                colorArray[i * 3 + 2] = this.originalColor.b;
            }
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
        
        // Store chair data for raycasting
        instancedMesh.userData.chairs = instancedMesh.userData.chairs || new Map();
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

        // Reset previous selection
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

    // Update chair color
    updateChairColor(instanceId, color) {
        if (!this.instancedMesh || !this.instancedMesh.instanceColor) return;
        
        this.instancedMesh.instanceColor.setXYZ(instanceId, color.r, color.g, color.b);
        this.instancedMesh.instanceColor.needsUpdate = true;
    }

    // Get chair position for camera
    getChairCameraPosition(chairId) {
        const chair = this.chairs.get(chairId);
        if (!chair || !this.instancedMesh) return null;

        const matrix = new THREE.Matrix4();
        this.instancedMesh.getMatrixAt(chair.instanceId, matrix);
        const position = new THREE.Vector3();
        matrix.decompose(position, new THREE.Quaternion(), new THREE.Vector3());

        return {
            position: new THREE.Vector3(
                position.x,
                position.y + 1.2,
                position.z + 0.3
            ),
            target: new THREE.Vector3(0, position.y + 1.0, -12.5)
        };
    }

    // Check if a chair is occupied
    isChairOccupied(chairId) {
        return this.occupiedChairs.has(chairId);
    }

    // Get chairId from instanceId (for raycasting)
    getChairIdFromInstanceId(instanceId) {
        if (!this.instancedMesh || !this.instancedMesh.userData.chairs) return null;
        return this.instancedMesh.userData.chairs.get(instanceId);
    }
}

export default ChairManager;