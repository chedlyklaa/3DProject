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
    // Vérification de la session et du rôle
    const urlParams = new URLSearchParams(window.location.search);
    const role = urlParams.get('role');
    const sessionId = urlParams.get('session');
    const storedRole = localStorage.getItem('userRole');
    const storedSessionId = localStorage.getItem('sessionId');

    // Vérifier si l'utilisateur a le droit d'accéder à cette session
    if (!sessionId || sessionId !== storedSessionId) {
        console.log('Session invalide, redirection vers l\'accueil');
        window.location.href = 'index.html';
        throw new Error('Session invalide');
    }

    // Initialisation de la salle
    const sceneManager = new SceneManager();
    const scene = sceneManager.getScene();
    const renderer = sceneManager.getRenderer();
    document.body.appendChild(renderer.domElement);

    const cameraManager = new CameraManager(renderer);
    const roomManager = new RoomManager(scene);
    const chairManager = new ChairManager(scene, cameraManager);
    const eventManager = new EventManager(sceneManager, cameraManager, chairManager);

    // Configuration selon le rôle
    if (role === 'presenter' && storedRole === 'presenter') {
        console.log('Mode présentateur activé');
        cameraManager.setPresenterView();
        
        // Désactiver la sélection des chaises pour le présentateur
        chairManager.disableChairSelection = true;
    } else if (role === 'participant' && storedRole === 'participant') {
        console.log('Mode participant activé');
        cameraManager.setParticipantView();
        
        // Activer la sélection des chaises
        chairManager.disableChairSelection = false;
        
        // Setup escape key for chair view
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && chairManager.selectedChair) {
                chairManager.unselectChair();
            }
        });

        // Ajouter les contrôles de participant
        setupParticipantControls(chairManager, cameraManager);
    } else {
        console.log('Rôle invalide, redirection vers l\'accueil');
        window.location.href = 'index.html';
        throw new Error('Rôle invalide');
    }

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

function setupParticipantControls(chairManager, cameraManager) {
    // Ajouter un panneau de contrôle pour le participant
    const controlPanel = document.createElement('div');
    controlPanel.className = 'participant-controls';
    controlPanel.innerHTML = `
        <button id="returnToRoom">Retourner à la vue de la salle</button>
        <button id="leaveChair">Quitter la chaise</button>
    `;
    document.body.appendChild(controlPanel);

    // Gérer les événements des boutons
    document.getElementById('returnToRoom').addEventListener('click', () => {
        if (chairManager.selectedChair) {
            chairManager.unselectChair();
        }
        cameraManager.setParticipantView();
    });

    document.getElementById('leaveChair').addEventListener('click', () => {
        if (chairManager.selectedChair) {
            chairManager.unselectChair();
        }
    });

    // Ajouter le style CSS pour les contrôles
    const style = document.createElement('style');
    style.textContent = `
        .participant-controls {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 10px;
            z-index: 1000;
        }
        .participant-controls button {
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            background: rgba(33, 150, 243, 0.8);
            color: white;
            cursor: pointer;
            font-weight: bold;
            backdrop-filter: blur(5px);
        }
        .participant-controls button:hover {
            background: rgba(33, 150, 243, 1);
        }
    `;
    document.head.appendChild(style);
}