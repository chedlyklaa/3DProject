import * as THREE from 'three';
import { COLORS, CHAIR_CONFIG } from '../utils/constants.js';

class ChairManager {
    constructor(scene, cameraManager) {
        this.scene = scene;
        this.cameraManager = cameraManager;
        this.chairs = new Map();
        this.selectedChair = null;
        this.occupiedChairs = new Set();
        this.instancedMesh = null;
        this.originalColor = new THREE.Color(COLORS.CHAIR_DEFAULT);
        this.selectedColor = new THREE.Color(COLORS.CHAIR_SELECTED);
        this.occupiedColor = new THREE.Color(COLORS.CHAIR_OCCUPIED);
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.hoveredChair = null;

        // Setup interactions
        this.setupInteractions();
    }

    setupInteractions() {
        // Ne configurer les interactions que pour les participants
        if (localStorage.getItem('userRole') !== 'participant') return;

        // Gestion du clic
        window.addEventListener('click', (event) => {
            if (event.target.tagName === 'BUTTON') return; // Ignorer les clics sur les boutons
            this.handleChairClick(event);
        });

        // Gestion du survol
        window.addEventListener('mousemove', (event) => {
            this.handleChairHover(event);
        });

        // Gestion de la touche Échap
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.selectedChair) {
                this.unselectChair();
            }
        });
    }

    handleChairClick(event) {
        this.updateMousePosition(event);
        const intersectedChair = this.getIntersectedChair();

        if (intersectedChair) {
            if (this.selectedChair === intersectedChair.id) {
                this.unselectChair();
            } else if (!this.occupiedChairs.has(intersectedChair.id)) {
                this.selectChair(intersectedChair);
            }
        }
    }

    handleChairHover(event) {
        this.updateMousePosition(event);
        const intersectedChair = this.getIntersectedChair();

        // Réinitialiser la chaise survolée précédente
        if (this.hoveredChair && (!intersectedChair || this.hoveredChair.id !== intersectedChair.id)) {
            if (this.hoveredChair.id !== this.selectedChair) {
                this.updateChairColor(this.hoveredChair.instanceId, this.originalColor);
            }
            this.hoveredChair = null;
        }

        // Mettre en surbrillance la nouvelle chaise survolée
        if (intersectedChair && !this.occupiedChairs.has(intersectedChair.id) && intersectedChair.id !== this.selectedChair) {
            this.hoveredChair = intersectedChair;
            this.updateChairColor(intersectedChair.instanceId, new THREE.Color(0x88ccff));
        }
    }

    updateMousePosition(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    getIntersectedChair() {
        this.raycaster.setFromCamera(this.mouse, this.cameraManager.getCamera());
        const intersects = this.raycaster.intersectObject(this.instancedMesh);
        
        if (intersects.length > 0) {
            const instanceId = intersects[0].instanceId;
            const chairId = this.getChairIdFromInstanceId(instanceId);
            return this.chairs.get(chairId);
        }
        return null;
    }

    selectChair(chair) {
        if (this.occupiedChairs.has(chair.id)) return false;

        // Désélectionner la chaise précédente
        if (this.selectedChair) {
            const prevChair = this.chairs.get(this.selectedChair);
            if (prevChair) {
                this.updateChairColor(prevChair.instanceId, this.originalColor);
            }
        }

        // Sélectionner la nouvelle chaise
        this.updateChairColor(chair.instanceId, this.selectedColor);
        this.selectedChair = chair.id;
        this.occupiedChairs.add(chair.id);

        // Déplacer la caméra à la position de la chaise
        this.cameraManager.setChairView(chair.worldPosition);

        // Afficher un message de confirmation
        this.showMessage(`Vous êtes assis sur la chaise ${chair.row + 1}-${chair.position + 1}`);

        return true;
    }

    unselectChair() {
        if (this.selectedChair) {
            const chair = this.chairs.get(this.selectedChair);
            if (chair) {
                this.updateChairColor(chair.instanceId, this.originalColor);
                this.occupiedChairs.delete(this.selectedChair);
                this.selectedChair = null;
                this.cameraManager.returnFromChairView();
                this.showMessage('Vous vous êtes levé de la chaise');
            }
        }
    }

    showMessage(text) {
        // Créer ou mettre à jour le message
        let messageEl = document.getElementById('chairMessage');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.id = 'chairMessage';
            messageEl.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 10px 20px;
                border-radius: 5px;
                font-family: Arial, sans-serif;
                z-index: 1000;
                transition: opacity 0.3s;
                backdrop-filter: blur(5px);
            `;
            document.body.appendChild(messageEl);
        }

        messageEl.textContent = text;
        messageEl.style.opacity = '1';

        // Faire disparaître le message après 3 secondes
        setTimeout(() => {
            messageEl.style.opacity = '0';
        }, 3000);
    }

    // Add a chair to the manager
    addChair(mesh, row, position, instanceId) {
        const chairId = `chair_${row}_${position}`;
        
        // Store the instanced mesh on first chair
        if (!this.instancedMesh) {
            this.instancedMesh = mesh;
            
            // Initialize instance colors
            const colorArray = new Float32Array(mesh.count * 3);
            for (let i = 0; i < mesh.count; i++) {
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
            row: row,
            position: position,
            isOccupied: false,
            mesh: mesh,
            worldPosition: new THREE.Vector3()
        };

        // Calculate world position
        const x = (position - (CHAIR_CONFIG.CHAIRS_PER_ROW - 1) / 2) * CHAIR_CONFIG.SPACING;
        const z = row * CHAIR_CONFIG.ROW_SPACING;
        chair.worldPosition.set(x, CHAIR_CONFIG.ROW_ELEVATION, z);

        this.chairs.set(chairId, chair);
        
        // Store chair data for raycasting
        mesh.userData.chairs = mesh.userData.chairs || new Map();
        mesh.userData.chairs.set(instanceId, chairId);
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

    getChairs() {
        return this.chairs;
    }
}

export default ChairManager;