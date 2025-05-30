import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CAMERA } from '../utils/constants.js';
import { CAMERA_POSITIONS } from '../utils/cameraPositions.js';
import { easeInOutCubic } from '../utils/helpers.js';

class CameraManager {
    constructor(renderer) {
        // Get participant info
        this.participantInfo = JSON.parse(localStorage.getItem('participantInfo') || '{}');
        this.isCreator = this.participantInfo.role === 'host';

        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            CAMERA.FOV,
            window.innerWidth / window.innerHeight,
            CAMERA.NEAR,
            CAMERA.FAR
        );

        // Set initial position based on role
        this.setInitialPosition();

        // Controls setup
        this.controls = new OrbitControls(this.camera, renderer.domElement);
        this.setupControlsBasedOnRole();

        // Transition parameters
        this.isTransitioning = false;
        this.transitionDuration = 1000; // 1 second transition
        this.transitionStartTime = 0;
        this.startPosition = new THREE.Vector3();
        this.targetPosition = new THREE.Vector3();
        this.startRotation = new THREE.Quaternion();
        this.targetRotation = new THREE.Quaternion();

        // Chair view parameters
        this.isInChairView = false;
        this.chairPosition = null;
    }

    setInitialPosition() {
        const config = this.isCreator ? CAMERA_POSITIONS.CREATOR : CAMERA_POSITIONS.PARTICIPANT;
        
        // Set position
        this.camera.position.set(
            config.position.x,
            config.position.y,
            config.position.z
        );

        // Set look at point
        this.camera.lookAt(
            config.lookAt.x,
            config.lookAt.y,
            config.lookAt.z
        );
    }

    setupControlsBasedOnRole() {
        const config = this.isCreator ? CAMERA_POSITIONS.CREATOR : CAMERA_POSITIONS.PARTICIPANT;

        if (this.isCreator) {
            // Creator has no camera controls - completely fixed position
            this.controls.enabled = false;
            this.controls.enableZoom = false;
            this.controls.enablePan = false;
            this.controls.enableRotate = false;
            this.controls.enableDamping = false;

            // Set fixed target for creator's view
            this.controls.target.set(
                CAMERA_POSITIONS.CREATOR.lookAt.x,
                CAMERA_POSITIONS.CREATOR.lookAt.y,
                CAMERA_POSITIONS.CREATOR.lookAt.z
            );
        } else {
            // Participants can move and look around
            this.controls.enabled = true;
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.enablePan = false;
            this.controls.enableZoom = true;
            this.controls.rotateSpeed = 0.5;

            // Apply rotation limits for participants
            this.controls.minPolarAngle = config.limits.minPolarAngle;
            this.controls.maxPolarAngle = config.limits.maxPolarAngle;
            this.controls.minAzimuthAngle = config.limits.minAzimuthAngle;
            this.controls.maxAzimuthAngle = config.limits.maxAzimuthAngle;
        }
    }

    transitionToChairView(chairPosition) {
        if (this.isCreator) return;

        this.isTransitioning = true;
        this.transitionStartTime = Date.now();
        this.isInChairView = true;

        // Save start position and rotation
        this.startPosition.copy(this.camera.position);
        this.startRotation.copy(this.camera.quaternion);

        // Calculate target position (at eye level)
        this.targetPosition.set(
            chairPosition.x,
            chairPosition.y + CAMERA_POSITIONS.SEATED.heightOffset,
            chairPosition.z
        );

        // Calculate target rotation (looking at screen)
        const targetLookAt = new THREE.Vector3(
            chairPosition.x,
            chairPosition.y + CAMERA_POSITIONS.SEATED.heightOffset,
            CAMERA_POSITIONS.SEATED.lookAtOffset
        );

        // Create rotation matrix and convert to quaternion
        const rotationMatrix = new THREE.Matrix4();
        rotationMatrix.lookAt(this.targetPosition, targetLookAt, new THREE.Vector3(0, 1, 0));
        this.targetRotation.setFromRotationMatrix(rotationMatrix);

        // Store chair position and update controls
        this.chairPosition = this.targetPosition.clone();
        this.updateSeatedControls();
    }

    updateSeatedControls() {
        const config = CAMERA_POSITIONS.SEATED;

        // Update control limits for seated view
        this.controls.minPolarAngle = config.limits.minPolarAngle;
        this.controls.maxPolarAngle = config.limits.maxPolarAngle;
        this.controls.minAzimuthAngle = config.limits.minAzimuthAngle;
        this.controls.maxAzimuthAngle = config.limits.maxAzimuthAngle;

        // Disable zoom while seated
        this.controls.enableZoom = false;
        this.controls.minDistance = 0;
        this.controls.maxDistance = 0;
    }

    resetView() {
        if (this.isCreator) return;

        this.isTransitioning = true;
        this.transitionStartTime = Date.now();

        // Save start position and rotation
        this.startPosition.copy(this.camera.position);
        this.startRotation.copy(this.camera.quaternion);

        // Reset to initial participant position
        const config = CAMERA_POSITIONS.PARTICIPANT;
        this.targetPosition.set(config.position.x, config.position.y, config.position.z);

        // Calculate target rotation
        const targetLookAt = new THREE.Vector3(config.lookAt.x, config.lookAt.y, config.lookAt.z);
        const rotationMatrix = new THREE.Matrix4();
        rotationMatrix.lookAt(this.targetPosition, targetLookAt, new THREE.Vector3(0, 1, 0));
        this.targetRotation.setFromRotationMatrix(rotationMatrix);

        // Reset controls
        this.controls.enabled = true;
        this.setupControlsBasedOnRole();
        
        this.isInChairView = false;
        this.chairPosition = null;
    }

    update() {
        // For creator, ensure camera stays in fixed position
        if (this.isCreator) {
            const creatorPos = CAMERA_POSITIONS.CREATOR.position;
            const creatorLookAt = CAMERA_POSITIONS.CREATOR.lookAt;
            
            // Force position to stay fixed
            this.camera.position.set(creatorPos.x, creatorPos.y, creatorPos.z);
            this.camera.lookAt(creatorLookAt.x, creatorLookAt.y, creatorLookAt.z);
            return; // Skip other updates for creator
        }

        if (this.isTransitioning) {
            const elapsed = Date.now() - this.transitionStartTime;
            const progress = Math.min(elapsed / this.transitionDuration, 1);
            
            // Smooth transition using easing
            const easeProgress = easeInOutCubic(progress);
            
            // Update position
            this.camera.position.lerpVectors(this.startPosition, this.targetPosition, easeProgress);
            
            // Update rotation
            THREE.Quaternion.slerp(this.startRotation, this.targetRotation, this.camera.quaternion, easeProgress);
            
            if (progress >= 1) {
                this.isTransitioning = false;
                if (this.isInChairView) {
                    // Update controls target for seated view
                    this.controls.target.set(
                        this.camera.position.x,
                        this.camera.position.y,
                        CAMERA_POSITIONS.SEATED.lookAtOffset
                    );
                }
            }
        }

        if (this.isInChairView && !this.isTransitioning) {
            // Keep camera at chair position but allow looking around
            this.camera.position.copy(this.chairPosition);
        }

        // Only update controls for participants
        if (!this.isCreator) {
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