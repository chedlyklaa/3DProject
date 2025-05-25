import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CAMERA } from '../utils/constants.js';
import { easeInOutCubic } from '../utils/helpers.js';

class CameraManager {
    constructor(renderer) {
        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            CAMERA.FOV,
            window.innerWidth / window.innerHeight,
            CAMERA.NEAR,
            CAMERA.FAR
        );
        this.camera.position.set(
            CAMERA.INITIAL_POSITION.x,
            CAMERA.INITIAL_POSITION.y,
            CAMERA.INITIAL_POSITION.z
        );

        // Controls setup
        this.controls = new OrbitControls(this.camera, renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.1;
        this.controls.enablePan = false;
        this.controls.enableZoom = true;
        this.controls.rotateSpeed = 0.5;

        // Transition parameters
        this.isTransitioning = false;
        this.transitionDuration = CAMERA.TRANSITION_DURATION;
        this.transitionStartTime = 0;
        this.startPosition = new THREE.Vector3();
        this.targetPosition = new THREE.Vector3();
        this.startTarget = new THREE.Vector3();
        this.endTarget = new THREE.Vector3();

        // Limites de rotation verticale (en radians)
        this.controls.minPolarAngle = Math.PI * 0.25; // 45 degrés vers le haut
        this.controls.maxPolarAngle = Math.PI * 0.75; // 45 degrés vers le bas

        // Limites de rotation horizontale
        this.controls.minAzimuthAngle = -Math.PI * 0.5; // 90 degrés à gauche
        this.controls.maxAzimuthAngle = Math.PI * 0.5;  // 90 degrés à droite

        // État de la vue
        this.isInChairView = false;
        this.fixedPosition = new THREE.Vector3();
        this.initialLookAt = new THREE.Vector3();
        this.rotationCenter = new THREE.Vector3();

        // Ajouter l'écouteur d'événement pour la touche Échap
        this.setupKeyboardControls();
    }

    setupKeyboardControls() {
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.isInChairView) {
                this.resetView();
            }
        });
    }

    transitionToChair(chairView) {
        this.isTransitioning = true;
        this.transitionStartTime = Date.now();
        
        this.startPosition.copy(this.camera.position);
        this.targetPosition.copy(chairView.position);
        
        // Sauvegarder la position fixe et le point de vue initial
        this.fixedPosition.copy(chairView.position);
        this.initialLookAt.copy(chairView.target);
        
        // Définir le centre de rotation comme étant légèrement devant la caméra
        this.rotationCenter.copy(chairView.position);
        const forward = new THREE.Vector3().subVectors(chairView.target, chairView.position).normalize();
        this.rotationCenter.add(forward.multiplyScalar(1));
        
        // Configurer les contrôles pour la rotation sur place
        this.controls.target.copy(this.rotationCenter);
        this.controls.enabled = true;
        this.controls.enableZoom = false;
        this.isInChairView = true;

        // Inverser les mouvements de la souris avec une sensibilité réduite
        this.controls.rotateSpeed = -0.3;
    }

    resetView() {
        this.isTransitioning = true;
        this.transitionStartTime = Date.now();
        
        this.startPosition.copy(this.camera.position);
        this.targetPosition.set(
            CAMERA.INITIAL_POSITION.x,
            CAMERA.INITIAL_POSITION.y,
            CAMERA.INITIAL_POSITION.z
        );
        
        this.controls.target.set(0, 0, 0);
        this.controls.enabled = true;
        this.controls.enableZoom = true;
        this.isInChairView = false;

        // Remettre la vitesse de rotation normale
        this.controls.rotateSpeed = 0.5;
    }

    update() {
        if (this.isTransitioning) {
            const elapsed = Date.now() - this.transitionStartTime;
            const progress = Math.min(elapsed / this.transitionDuration, 1);
            
            // Smooth transition using easing
            const easeProgress = easeInOutCubic(progress);
            
            // Update camera position
            this.camera.position.lerpVectors(this.startPosition, this.targetPosition, easeProgress);
            
            if (progress >= 1) {
                this.isTransitioning = false;
            }
        } else if (this.isInChairView) {
            // Forcer la position de la caméra à rester fixe
            this.camera.position.copy(this.fixedPosition);
            
            // Mettre à jour le centre de rotation pour qu'il reste toujours devant la caméra
            const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
            this.rotationCenter.copy(this.fixedPosition).add(forward);
            this.controls.target.copy(this.rotationCenter);
        }

        this.controls.update();
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
}

export default CameraManager;