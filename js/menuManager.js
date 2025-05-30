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
        // Bouton pour rejoindre une conférence
        const joinButton = document.getElementById('joinConferenceBtn');
        if (joinButton) {
            joinButton.addEventListener('click', () => {
                // Générer un ID unique pour la session
                const sessionId = Math.random().toString(36).substring(7);
                // Stocker le rôle dans le localStorage
                localStorage.setItem('userRole', 'participant');
                localStorage.setItem('sessionId', sessionId);
                // Rediriger vers la salle avec les paramètres
                window.location.href = `room.html?role=participant&session=${sessionId}`;
            });
        }

        // Bouton pour nouvelle conférence
        const newConfButton = document.getElementById('newConferenceBtn');
        if (newConfButton) {
            newConfButton.addEventListener('click', () => {
                // Générer un ID unique pour la session
                const sessionId = Math.random().toString(36).substring(7);
                // Stocker le rôle dans le localStorage
                localStorage.setItem('userRole', 'presenter');
                localStorage.setItem('sessionId', sessionId);
                // Rediriger vers la salle avec les paramètres
                window.location.href = `room.html?role=presenter&session=${sessionId}`;
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