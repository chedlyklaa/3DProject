import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';

class CameraManager {
    constructor(camera, controls) {
        this.camera = camera;
        this.controls = controls;
        this.isTransitioning = false;
        this.originalPosition = camera.position.clone();
        this.originalTarget = new THREE.Vector3(0, 0, 0);
    }

    // Transition to chair view
    transitionToChair(chairPosition) {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        // Disable controls during transition
        this.controls.enabled = false;

        // Store current camera position and target
        const startPosition = this.camera.position.clone();
        const startTarget = this.controls.target.clone();

        // Create position tween
        new TWEEN.Tween(startPosition)
            .to(chairPosition.position, 1000)
            .easing(TWEEN.Easing.Cubic.InOut)
            .onUpdate(() => {
                this.camera.position.copy(startPosition);
            })
            .start();

        // Create target tween
        new TWEEN.Tween(startTarget)
            .to(chairPosition.target, 1000)
            .easing(TWEEN.Easing.Cubic.InOut)
            .onUpdate(() => {
                this.controls.target.copy(startTarget);
                this.controls.update();
            })
            .onComplete(() => {
                this.isTransitioning = false;
                this.controls.enabled = true;
            })
            .start();
    }

    // Reset to original view
    resetView() {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        // Disable controls during transition
        this.controls.enabled = false;

        // Store current camera position and target
        const startPosition = this.camera.position.clone();
        const startTarget = this.controls.target.clone();

        // Create position tween
        new TWEEN.Tween(startPosition)
            .to(this.originalPosition, 1000)
            .easing(TWEEN.Easing.Cubic.InOut)
            .onUpdate(() => {
                this.camera.position.copy(startPosition);
            })
            .start();

        // Create target tween
        new TWEEN.Tween(startTarget)
            .to(this.originalTarget, 1000)
            .easing(TWEEN.Easing.Cubic.InOut)
            .onUpdate(() => {
                this.controls.target.copy(startTarget);
                this.controls.update();
            })
            .onComplete(() => {
                this.isTransitioning = false;
                this.controls.enabled = true;
            })
            .start();
    }

    update() {
        TWEEN.update();
    }
}

export default CameraManager; 