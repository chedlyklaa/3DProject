import * as THREE from 'three';
import SceneManager from './managers/SceneManager.js';
import RoomManager from './managers/RoomManager.js';
import ChairManager from './managers/ChairManager.js';
import CameraManager from './managers/CameraManager.js';
import EventManager from './managers/EventManager.js';
import MenuManager from './menuManager.js';
import Chair from './components/Chair.js';
import { CHAIR_CONFIG } from './utils/constants.js';

// Détecter si nous sommes sur la page de la salle ou la page du menu
const isRoomPage = window.location.pathname.includes('room');

if (!isRoomPage) {
    // Initialisation du menu (page d'accueil)
    const menuManager = new MenuManager();
    menuManager.setupEventListeners();
} else {
    // Initialisation de la salle
    const sceneManager = new SceneManager();
    const scene = sceneManager.getScene();
    const renderer = sceneManager.getRenderer();
    document.body.appendChild(renderer.domElement);

    const cameraManager = new CameraManager(renderer);
    const roomManager = new RoomManager(scene);
    const chairManager = new ChairManager(scene);
    const eventManager = new EventManager(sceneManager, cameraManager, chairManager);

    // Initialize and create chairs
    async function initializeChairs() {
        try {
            const chair = new Chair(scene);
            const roomDimensions = roomManager.getRoomDimensions();
            const instancedMesh = await chair.createInstances(roomDimensions);

            // Add chairs to chair manager
            for (let row = 0; row < CHAIR_CONFIG.ROWS; row++) {
                for (let chair = 0; chair < CHAIR_CONFIG.CHAIRS_PER_ROW; chair++) {
                    const instanceId = row * CHAIR_CONFIG.CHAIRS_PER_ROW + chair;
                    chairManager.addChair(instancedMesh, row, chair, instanceId);
                }
            }

            // Récupérer le thème sélectionné si disponible
            const selectedTheme = localStorage.getItem('selectedTheme');
            if (selectedTheme) {
                // Appliquer le thème à la salle
                roomManager.applyTheme(selectedTheme);
            }
        } catch (error) {
            console.error('Error initializing chairs:', error);
        }
    }

    // Start initialization
    initializeChairs();

    // Animation loop
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const deltaTime = clock.getDelta();
        
        cameraManager.update(deltaTime);
        
        sceneManager.render(cameraManager.getCamera());
    }

    animate();
}
