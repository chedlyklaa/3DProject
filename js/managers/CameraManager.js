import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CAMERA, ROOM_CONFIG } from '../utils/constants.js';

class CameraManager {
    constructor(renderer) {
        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            CAMERA.FOV,
            window.innerWidth / window.innerHeight,
            CAMERA.NEAR,
            CAMERA.FAR
        );
        
        // Set initial camera position
        this.camera.position.set(
            CAMERA.INITIAL_POSITION.x,
            CAMERA.INITIAL_POSITION.y,
            CAMERA.INITIAL_POSITION.z
        );

        // Initialize controls
        this.controls = new OrbitControls(this.camera, renderer.domElement);
        
        // Camera modes and states
        this.isPresenterMode = false;
        this.isQuickViewActive = false;
        this.isInChairView = false;
        this.previousPosition = new THREE.Vector3();
        this.previousTarget = new THREE.Vector3();
        
        // Store renderer for potential mode switches
        this.renderer = renderer;
        
        // Set default participant view
        this.setParticipantView();
        
        // Setup UI controls
        this.setupUIControls();
        
        // Create control panel
        this.createControlPanel();
        
        // Update mode indicator
        this.updateModeIndicator();
    }

    createControlPanel() {
        // Créer le conteneur principal
        const controlPanel = document.createElement('div');
        controlPanel.id = 'controlPanel';
        controlPanel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            padding: 15px;
            background: rgba(0, 0, 0, 0.7);
            border-radius: 8px;
            z-index: 1000;
        `;

        // Style commun pour les boutons
        const buttonStyle = `
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            background: #2196F3;
            color: white;
            cursor: pointer;
            font-family: Arial, sans-serif;
            transition: background 0.3s;
        `;

        // Créer les boutons avec leur style
        const quickViewBtn = document.createElement('button');
        quickViewBtn.id = 'quickViewToggle';
        quickViewBtn.textContent = 'Vue Rapide';
        quickViewBtn.style.cssText = buttonStyle;

        const cameraToggle = document.createElement('button');
        cameraToggle.id = 'toggleCamera';
        cameraToggle.textContent = 'Activer Caméra';
        cameraToggle.style.cssText = buttonStyle;

        // Ajouter les éléments au panel
        controlPanel.appendChild(quickViewBtn);
        controlPanel.appendChild(cameraToggle);

        // Ajouter le panel au document
        document.body.appendChild(controlPanel);

        // Mettre à jour la visibilité selon le mode
        this.updateControlsVisibility();
    }

    updateControlsVisibility() {
        const controlPanel = document.getElementById('controlPanel');
        if (controlPanel) {
            controlPanel.style.display = this.isPresenterMode ? 'flex' : 'none';
        }
    }

    setupUIControls() {
        // Quick view toggle button
        const quickViewBtn = document.getElementById('quickViewToggle');
        if (quickViewBtn) {
            quickViewBtn.addEventListener('click', () => this.toggleQuickView());
            quickViewBtn.style.display = this.isPresenterMode ? 'block' : 'none';
        }

        // Keyboard controls
        this.setupKeyboardControls();
    }

    toggleQuickView() {
        if (!this.isPresenterMode) return;

        const quickViewBtn = document.getElementById('quickViewToggle');
        
        if (!this.isQuickViewActive) {
            // Save current position and target
            this.previousPosition.copy(this.camera.position);
            this.previousTarget.copy(this.controls.target);

            // Move to participant room view position
            const pos = CAMERA.PARTICIPANT.ROOM_POSITION;
            const target = CAMERA.PARTICIPANT.ROOM_LOOK_AT;
            this.camera.position.set(pos.x, pos.y, pos.z);
            this.camera.lookAt(target.x, target.y, target.z);
            this.controls.target.set(target.x, target.y, target.z);
            
            quickViewBtn.classList.add('active');
        } else {
            // Return to presenter view
            const pos = CAMERA.PRESENTER.POSITION;
            const target = CAMERA.PRESENTER.LOOK_AT;
            this.camera.position.set(pos.x, pos.y, pos.z);
            this.camera.lookAt(target.x, target.y, target.z);
            this.controls.target.set(target.x, target.y, target.z);
            
            quickViewBtn.classList.remove('active');
        }

        this.isQuickViewActive = !this.isQuickViewActive;
    }

    setPresenterView() {
        const pos = CAMERA.PRESENTER.POSITION;
        const target = CAMERA.PRESENTER.LOOK_AT;
        
        // Position the camera for presenter view
        this.camera.position.set(pos.x, pos.y, pos.z);
        this.camera.lookAt(target.x, target.y, target.z);
        
        // Configure controls for presenter
        this.controls.enabled = false;
        
        this.isPresenterMode = true;
        this.isInChairView = false;
        this.updateModeIndicator();
        
        // Show quick view button
        const quickViewBtn = document.getElementById('quickViewToggle');
        if (quickViewBtn) {
            quickViewBtn.style.display = 'block';
        }
    }

    setParticipantView() {
        const pos = CAMERA.PARTICIPANT.ROOM_POSITION;
        const target = CAMERA.PARTICIPANT.ROOM_LOOK_AT;
        
        // Position the camera for participant view
        this.camera.position.set(pos.x, pos.y, pos.z);
        this.camera.lookAt(target.x, target.y, target.z);
        
        // Enable and configure controls for participants
        this.controls.enabled = true;
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.1;
        this.controls.enablePan = false;
        this.controls.enableZoom = true;
        this.controls.rotateSpeed = 0.5;

        // Set rotation limits
        this.controls.minPolarAngle = Math.PI * 0.25;
        this.controls.maxPolarAngle = Math.PI * 0.75;
        this.controls.minAzimuthAngle = -Math.PI * 0.5;
        this.controls.maxAzimuthAngle = Math.PI * 0.5;
        
        // Set the target for orbit controls
        this.controls.target.set(target.x, target.y, target.z);
        
        this.isPresenterMode = false;
        this.isInChairView = false;
        this.updateModeIndicator();
        
        // Hide quick view button
        const quickViewBtn = document.getElementById('quickViewToggle');
        if (quickViewBtn) {
            quickViewBtn.style.display = 'none';
        }
    }

    setChairView(chairPosition) {
        if (!this.isPresenterMode) {
            const chairConfig = CAMERA.PARTICIPANT.CHAIR;
            
            // Sauvegarder la position précédente
            this.previousPosition.copy(this.camera.position);
            this.previousTarget.copy(this.controls.target);
            
            // Calculer la position de la caméra sur la chaise
            const pos = new THREE.Vector3(
                chairPosition.x,
                chairPosition.y + chairConfig.HEIGHT,
                chairPosition.z + chairConfig.FORWARD_OFFSET
            );
            
            // Positionner la caméra
            this.camera.position.copy(pos);
            
            // Regarder vers l'écran initialement
            this.camera.lookAt(0, chairConfig.HEIGHT * 1.5, -this.roomDepth/2);
            
            // Configurer les contrôles pour la vue assise
            this.setupChairControls();
            
            this.isInChairView = true;
            this.updateModeIndicator();
        }
    }

    setupChairControls() {
        const limits = CAMERA.PARTICIPANT.CHAIR.HEAD_LIMITS;
        
        // Activer les contrôles
        this.controls.enabled = true;
        
        // Désactiver le zoom
        this.controls.enableZoom = false;
        this.controls.enablePan = false;
        
        // Configurer les limites de rotation
        this.controls.minPolarAngle = THREE.MathUtils.degToRad(90 - limits.VERTICAL_UP);
        this.controls.maxPolarAngle = THREE.MathUtils.degToRad(90 + limits.VERTICAL_DOWN);
        this.controls.minAzimuthAngle = THREE.MathUtils.degToRad(-limits.HORIZONTAL);
        this.controls.maxAzimuthAngle = THREE.MathUtils.degToRad(limits.HORIZONTAL);
        
        // Ajuster la vitesse de rotation pour un mouvement plus naturel
        this.controls.rotateSpeed = 0.5;
        this.controls.dampingFactor = 0.05;
        
        // Définir le point de pivot au niveau des yeux
        this.controls.target.copy(this.camera.position);
        this.controls.target.z -= 1; // Point de pivot légèrement devant
    }

    returnFromChairView() {
        if (this.isInChairView) {
            // Restaurer la position précédente
            this.camera.position.copy(this.previousPosition);
            this.controls.target.copy(this.previousTarget);
            
            // Restaurer les contrôles normaux
            this.setupParticipantControls();
            
            this.isInChairView = false;
            this.updateModeIndicator();
        }
    }

    setupParticipantControls() {
        // Configuration standard pour la vue participant
        this.controls.enabled = true;
        this.controls.enableZoom = true;
        this.controls.enablePan = false;
        this.controls.minDistance = 1;
        this.controls.maxDistance = 20;
        this.controls.minPolarAngle = Math.PI * 0.25;
        this.controls.maxPolarAngle = Math.PI * 0.75;
        this.controls.minAzimuthAngle = -Math.PI * 0.5;
        this.controls.maxAzimuthAngle = Math.PI * 0.5;
        this.controls.rotateSpeed = 1.0;
        this.controls.dampingFactor = 0.1;
    }

    updateModeIndicator() {
        const indicator = document.getElementById('cameraModeIndicator');
        if (!indicator) {
            const newIndicator = document.createElement('div');
            newIndicator.id = 'cameraModeIndicator';
            document.body.appendChild(newIndicator);
        }

        const currentIndicator = document.getElementById('cameraModeIndicator');
        if (currentIndicator) {
            let mode = this.isPresenterMode ? 'Présentateur' : 
                      this.isInChairView ? 'Vue Assise' : 'Participant';
            let color = this.isPresenterMode ? '#4CAF50' : 
                       this.isInChairView ? '#FF9800' : '#2196F3';
            
            currentIndicator.textContent = `Mode: ${mode}`;
            currentIndicator.style.cssText = `
                position: fixed;
                top: 20px;
                left: 20px;
                padding: 8px 16px;
                background-color: ${color};
                color: white;
                border-radius: 4px;
                font-family: Arial, sans-serif;
                font-size: 14px;
                z-index: 1000;
                transition: background-color 0.3s;
            `;
        }
    }

    switchCameraMode(isPresenter) {
        this.isPresenterMode = isPresenter;
        if (isPresenter) {
            this.setPresenterView();
        } else {
            this.setParticipantView();
        }
        this.updateControlsVisibility();
    }

    setupKeyboardControls() {
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                if (this.isInChairView) {
                    this.returnFromChairView();
                } else if (this.isQuickViewActive) {
                    this.toggleQuickView();
                } else if (!this.isPresenterMode) {
                    this.setParticipantView();
                }
            } else if (event.key === 'v' && this.isPresenterMode) {
                this.toggleQuickView();
            }
        });
    }

    update(deltaTime) {
        if (!this.isPresenterMode || this.isQuickViewActive || this.isInChairView) {
            this.controls.update();
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
    }

    getCamera() {
        return this.camera;
    }

    getControls() {
        return this.controls;
    }

    isInPresenterMode() {
        return this.isPresenterMode;
    }
}

export default CameraManager;