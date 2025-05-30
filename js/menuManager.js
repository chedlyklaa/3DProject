import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class MenuManager {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x1c1c3c, 0.02);
        
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 30;
        
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('threejs-canvas'),
            antialias: true,
            alpha: false
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;

        // Lumière ambiante
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);

        // Lumière directionnelle
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 1);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        this.objects = [];
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.textureLoader = new THREE.TextureLoader();

        // Gestionnaire de redimensionnement
        window.addEventListener('resize', () => this.onWindowResize());

        // Animation
        this.animate();
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Animation des objets
        for (const obj of this.objects) {
            if (obj.mesh) {
                if (obj.rotationSpeed) {
                    obj.mesh.rotation.y += obj.rotationSpeed;
                }
                if (obj.pulseSpeed) {
                    const scale = 1 + Math.sin(Date.now() * 0.001 * obj.pulseSpeed) * 0.1;
                    obj.mesh.scale.set(scale, scale, scale);
                }
            }
        }

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    clearScene() {
        while (this.scene.children.length > 0) {
            this.scene.remove(this.scene.children[0]);
        }
        this.objects = [];
    }

    setupEventListeners() {
        // Modal elements
        const joinModal = document.getElementById('joinModal');
        const joinButton = document.getElementById('joinConferenceBtn');
        const closeModal = document.getElementById('closeModal');
        const confirmJoin = document.getElementById('confirmJoin');
        const conferenceId = document.getElementById('conferenceId');
        const participantName = document.getElementById('participantName');

        // Join conference button
        if (joinButton) {
            joinButton.addEventListener('click', () => {
                joinModal.classList.add('active');
            });
        }

        // Close modal button
        if (closeModal) {
            closeModal.addEventListener('click', () => {
                joinModal.classList.remove('active');
            });
        }

        // Confirm join button
        if (confirmJoin) {
            confirmJoin.addEventListener('click', () => {
                const confId = conferenceId.value.trim();
                const partName = participantName.value.trim();
                
                if (!confId || !partName) {
                    alert('Veuillez remplir tous les champs');
                    return;
                }

                // Store participant info
                const participantInfo = {
                    conferenceId: confId,
                    name: partName,
                    role: 'participant',
                    joinTime: new Date().toISOString()
                };

                // Store in localStorage
                localStorage.setItem('participantInfo', JSON.stringify(participantInfo));

                // Redirect to room
                window.location.href = 'room.html';
            });
        }

        // Bouton pour nouvelle conférence
        const newConfButton = document.getElementById('newConferenceBtn');
        if (newConfButton) {
            newConfButton.addEventListener('click', () => {
                // Generate a unique conference ID
                const conferenceId = 'conf-' + Math.random().toString(36).substr(2, 9);
                
                // Store host info
                const hostInfo = {
                    conferenceId: conferenceId,
                    name: 'Hôte',
                    role: 'host',
                    joinTime: new Date().toISOString()
                };

                localStorage.setItem('participantInfo', JSON.stringify(hostInfo));
                window.location.href = 'room.html';
            });
        }

        // Sélecteur de thème
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                this.changeTheme(e.target.value);
                if (e.target.value) {
                    localStorage.setItem('selectedTheme', e.target.value);
                }
            });
        }

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === joinModal) {
                joinModal.classList.remove('active');
            }
        });
    }

    changeTheme(theme) {
        this.clearScene();
        switch (theme) {
            case 'science':
                this.createScienceScene();
                break;
            case 'technologie':
                this.createTechScene();
                break;
            case 'économie':
                this.createEconomyScene();
                break;
        }
    }

    // Vous pouvez ajouter ici les méthodes createScienceScene, createTechScene, etc.
    // depuis menu/main.js si vous souhaitez les utiliser
}

export default MenuManager; 