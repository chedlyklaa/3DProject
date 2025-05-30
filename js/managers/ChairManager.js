import * as THREE from 'three';
import { COLORS } from '../utils/constants.js';

class ChairManager {
    constructor(scene) {
        this.scene = scene;
        this.chairs = new Map(); // Map to store chair data
        this.selectedChair = null;
        this.occupiedChairs = new Set(); // Track occupied chairs
        
        // Get participant info
        this.participantInfo = JSON.parse(localStorage.getItem('participantInfo') || '{}');
        this.isCreator = this.participantInfo.role === 'host';

        // Reference to camera manager (will be set later)
        this.cameraManager = null;
    }

    addChair(instancedMesh, row, chairNumber, instanceId) {
        const chairData = {
            instanceId,
            row,
            chairNumber,
            mesh: instancedMesh,
            isOccupied: false,
            occupiedBy: null,
            color: new THREE.Color(0xcccccc) // Default chair color
        };
        
        this.chairs.set(instanceId, chairData);

        // Only add click listeners for participants
        if (!this.isCreator) {
            this.addChairClickListener(chairData);
        }
    }

    addChairClickListener(chairData) {
        // Add raycaster for chair selection
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        window.addEventListener('click', (event) => {
            if (!this.cameraManager || this.isCreator) return;

            // Calculate mouse position in normalized device coordinates
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, this.cameraManager.getCamera());

            // Check for intersections with this specific chair
            const intersects = raycaster.intersectObject(chairData.mesh);
            
            if (intersects.length > 0) {
                const instanceId = intersects[0].instanceId;
                if (instanceId === chairData.instanceId) {
                    this.selectChair(chairData);
                }
            }
        });
    }

    selectChair(chairData) {
        if (this.isCreator) return; // Creator can't select chairs
        
        if (chairData.isOccupied && chairData.occupiedBy !== this.participantInfo.name) {
            alert('Cette chaise est déjà occupée par ' + chairData.occupiedBy);
            return;
        }

        // If participant was sitting somewhere else, free that chair
        if (this.selectedChair) {
            this.selectedChair.isOccupied = false;
            this.selectedChair.occupiedBy = null;
            this.updateChairAppearance(this.selectedChair, false);
        }

        // Select new chair
        this.selectedChair = chairData;
        chairData.isOccupied = true;
        chairData.occupiedBy = this.participantInfo.name;
        this.updateChairAppearance(chairData, true);

        // Get chair position for camera
        const chairPosition = this.getChairPosition(chairData);
        
        // Trigger camera transition to chair view
        if (this.cameraManager) {
            this.cameraManager.transitionToChairView(chairPosition);
        }

        // Store chair selection in localStorage
        this.saveChairSelection(chairData);
    }

    updateChairAppearance(chairData, isSelected) {
        if (!chairData.mesh || !chairData.mesh.instanceColor) return;

        const color = isSelected ? new THREE.Color(0x00ff00) : chairData.color;
        const colorArray = chairData.mesh.instanceColor.array;
        const index = chairData.instanceId * 3;

        colorArray[index] = color.r;
        colorArray[index + 1] = color.g;
        colorArray[index + 2] = color.b;

        chairData.mesh.instanceColor.needsUpdate = true;
    }

    getChairPosition(chairData) {
        const position = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3();

        chairData.mesh.getMatrixAt(chairData.instanceId, new THREE.Matrix4()).decompose(
            position,
            quaternion,
            scale
        );

        return position;
    }

    saveChairSelection(chairData) {
        const selectionData = {
            instanceId: chairData.instanceId,
            row: chairData.row,
            chairNumber: chairData.chairNumber,
            participantName: this.participantInfo.name,
            conferenceId: this.participantInfo.conferenceId
        };
        localStorage.setItem('selectedChair', JSON.stringify(selectionData));
    }

    loadSavedChairSelection() {
        if (this.isCreator) return; // Creator doesn't need to load chair selection

        const savedSelection = JSON.parse(localStorage.getItem('selectedChair'));
        if (savedSelection && 
            savedSelection.conferenceId === this.participantInfo.conferenceId &&
            savedSelection.participantName === this.participantInfo.name) {
            const chairData = this.chairs.get(savedSelection.instanceId);
            if (chairData) {
                this.selectChair(chairData);
            }
        }
    }

    setCameraManager(cameraManager) {
        this.cameraManager = cameraManager;
    }
}

export default ChairManager;