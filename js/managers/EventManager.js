import * as THREE from 'three';

class EventManager {
    constructor(sceneManager, cameraManager, chairManager) {
        this.sceneManager = sceneManager;
        this.cameraManager = cameraManager;
        this.chairManager = chairManager;
        
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Mouse click event
        window.addEventListener('click', (event) => this.onMouseClick(event));
        
        // Window resize event
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Escape key event
        window.addEventListener('keydown', (event) => this.onKeyDown(event));
    }

    onMouseClick(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.cameraManager.getCamera());
        const intersects = this.raycaster.intersectObjects(this.sceneManager.getScene().children, true);

        for (const intersect of intersects) {
            if (intersect.object.isInstancedMesh) {
                const instanceId = intersect.instanceId;
                const chairId = this.chairManager.getChairIdFromInstanceId(instanceId);
                
                if (chairId && this.chairManager.selectChair(chairId)) {
                    const chairPosition = this.chairManager.getChairCameraPosition(chairId);
                    if (chairPosition) {
                        this.cameraManager.transitionToChair(chairPosition);
                        this.chairManager.occupyChair(chairId);
                    }
                }
                break;
            }
        }
    }

    onWindowResize() {
        this.cameraManager.onWindowResize();
        this.sceneManager.onWindowResize();
    }

    onKeyDown(event) {
        if (event.key === 'Escape') {
            const selectedChairId = this.chairManager.selectedChair;
            if (selectedChairId) {
                this.chairManager.releaseChair(selectedChairId);
                this.cameraManager.resetView();
            }
        }
    }
}

export default EventManager; 