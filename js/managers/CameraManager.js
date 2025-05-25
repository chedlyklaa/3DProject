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
        this.controls.dampingFactor = 0.05;

        // Transition parameters
        this.isTransitioning = false;
        this.transitionDuration = CAMERA.TRANSITION_DURATION;
        this.transitionStartTime = 0;
        this.startPosition = new THREE.Vector3();
        this.targetPosition = new THREE.Vector3();
        this.startTarget = new THREE.Vector3();
        this.endTarget = new THREE.Vector3();
    }

    transitionToChair(chairView) {
        this.isTransitioning = true;
        this.transitionStartTime = Date.now();
        
        this.startPosition.copy(this.camera.position);
        this.targetPosition.copy(chairView.position);
        
        this.controls.target.copy(chairView.target);
        this.controls.enabled = false;
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
        }

        if (this.controls.enabled) {
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
}

export default CameraManager;