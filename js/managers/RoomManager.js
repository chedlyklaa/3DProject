import * as THREE from 'three';
import { ROOM_CONFIG, COLORS, MATERIALS, PATHS } from '../utils/constants.js';
import { createMeshWithMaterial, loadTexture } from '../utils/helpers.js';

class RoomManager {
    constructor(scene) {
        this.scene = scene;
        this.roomWidth = ROOM_CONFIG.WIDTH;
        this.roomHeight = ROOM_CONFIG.HEIGHT;
        this.roomDepth = ROOM_CONFIG.DEPTH;
        
        this.setupRoom();
        this.currentTheme = 'default';
        this.screenMesh = null;
        this.videoTexture = null;
        this.currentStream = null;
        this.isCameraActive = false;
        this.isMirrored = false;

        this.setupControls();
    }

    setupControls() {
        // Bouton pour activer/désactiver la caméra
        const toggleButton = document.getElementById('toggleCamera');
        toggleButton.addEventListener('click', () => this.toggleCamera());

        // Sélecteur de caméra
        const cameraSelect = document.getElementById('cameraSelect');
        cameraSelect.addEventListener('change', (e) => this.switchCamera(e.target.value));

        // Contrôles de taille
        const widthControl = document.getElementById('videoWidth');
        const heightControl = document.getElementById('videoHeight');
        widthControl.addEventListener('input', () => this.updateVideoSize());
        heightControl.addEventListener('input', () => this.updateVideoSize());

        // Bouton pour inverser la vidéo
        const mirrorButton = document.getElementById('mirrorVideo');
        mirrorButton.addEventListener('click', () => this.toggleMirror());

        // Charger la liste des caméras
        this.loadCameraList();
    }

    async loadCameraList() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            const cameraSelect = document.getElementById('cameraSelect');
            cameraSelect.innerHTML = '';
            
            videoDevices.forEach(device => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.text = device.label || `Caméra ${cameraSelect.options.length + 1}`;
                cameraSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Erreur lors du chargement des caméras:', error);
        }
    }

    async toggleCamera() {
        const toggleButton = document.getElementById('toggleCamera');
        
        if (this.isCameraActive) {
            // Désactiver la caméra et le son
            if (this.currentStream) {
                this.currentStream.getTracks().forEach(track => track.stop());
                this.currentStream = null;
            }
            if (this.screenMesh) {
                this.scene.remove(this.screenMesh);
                this.screenMesh = null;
            }
            this.isCameraActive = false;
            toggleButton.classList.remove('active');
        } else {
            // Activer la caméra
            this.setupCamera();
            toggleButton.classList.add('active');
        }
    }

    async switchCamera(deviceId) {
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
        }
        await this.setupCamera(deviceId);
    }

    updateVideoSize() {
        if (!this.screenMesh) return;
        
        const widthScale = document.getElementById('videoWidth').value / 100;
        const heightScale = document.getElementById('videoHeight').value / 100;
        
        const baseWidth = this.roomWidth * 0.8;
        const baseHeight = this.roomHeight * 0.6;
        
        this.screenMesh.scale.set(widthScale, heightScale, 1);
    }

    toggleMirror() {
        if (!this.screenMesh) return;
        
        this.isMirrored = !this.isMirrored;
        this.screenMesh.scale.x *= -1;
        
        const mirrorButton = document.getElementById('mirrorVideo');
        mirrorButton.classList.toggle('active');
    }

    async setupCamera(deviceId = null) {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error('API de la caméra non disponible');
            return;
        }

        try {
            const constraints = {
                video: deviceId ? { deviceId: { exact: deviceId } } : true,
                audio: true // Ajout de l'audio
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.currentStream = stream;

            // Créer ou réutiliser l'élément vidéo
            const video = document.createElement('video');
            video.autoplay = true;
            video.playsInline = true;
            
            // Ne plus mettre la vidéo en muet pour entendre le son
            video.muted = false;
            video.volume = 0.5; // Volume par défaut à 50%

            // Ajouter le contrôle du volume
            const volumeControl = document.getElementById('videoVolume');
            if (volumeControl) {
                volumeControl.addEventListener('input', (e) => {
                    video.volume = e.target.value / 100;
                });
            }

            // Attendre que la vidéo soit chargée
            video.addEventListener('loadedmetadata', () => {
                console.log('Vidéo chargée, dimensions:', video.videoWidth, 'x', video.videoHeight);
                if (this.videoTexture) {
                    this.videoTexture.needsUpdate = true;
                }
            });

            // Connecter le flux à la vidéo
            video.srcObject = stream;
            await video.play().catch(e => console.error('Erreur lecture vidéo:', e));

            // S'assurer qu'il n'y a qu'un seul écran
            if (this.screenMesh) {
                this.scene.remove(this.screenMesh);
            }

            // Créer ou mettre à jour la texture
            if (!this.videoTexture) {
                this.videoTexture = new THREE.VideoTexture(video);
                this.videoTexture.minFilter = THREE.LinearFilter;
                this.videoTexture.magFilter = THREE.LinearFilter;
                this.videoTexture.format = THREE.RGBAFormat;
                this.videoTexture.needsUpdate = true;
            } else {
                this.videoTexture.image = video;
                this.videoTexture.needsUpdate = true;
            }

            // Créer l'écran
            this.createScreen();
            this.isCameraActive = true;

        } catch (error) {
            console.error('Erreur lors de l\'accès à la caméra:', error);
        }
    }

    setupRoom() {
        this.createFloor();
        this.createWalls();
        this.createScreen();
        this.setupCamera();
    }

    createFloor() {
        const floorGeometry = new THREE.PlaneGeometry(this.roomWidth, this.roomDepth);
        const floor = createMeshWithMaterial(
            floorGeometry,
            MATERIALS.FLOOR,
            COLORS.FLOOR
        );
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);
    }

    async createWalls() {
        const textureLoader = new THREE.TextureLoader();

        try {
            const woodTexture = await new Promise((resolve, reject) => {
                textureLoader.load(
                    '/textures/wood_texture.svg',
                    (texture) => {
                        texture.wrapS = THREE.RepeatWrapping;
                        texture.wrapT = THREE.RepeatWrapping;
                        texture.repeat.set(4, 2);
                        resolve(texture);
                    },
                    undefined,
                    (error) => reject(error)
                );
            });

            const wallMaterial = new THREE.MeshStandardMaterial({
                map: woodTexture,
                side: THREE.DoubleSide,
                ...MATERIALS.WALL
            });

            // Helper function to create walls
            const createWall = (width, height, position, rotation) => {
                const geometry = new THREE.PlaneGeometry(width, height);
                const wall = new THREE.Mesh(geometry, wallMaterial);
                wall.position.copy(position);
                wall.rotation.copy(rotation);
                wall.receiveShadow = true;
                this.scene.add(wall);
            };

            // Back wall
            createWall(
                this.roomWidth,
                this.roomHeight,
                new THREE.Vector3(0, this.roomHeight/2, -this.roomDepth/2),
                new THREE.Euler(0, 0, 0)
            );

            // Side walls
            createWall(
                this.roomDepth,
                this.roomHeight,
                new THREE.Vector3(-this.roomWidth/2, this.roomHeight/2, 0),
                new THREE.Euler(0, Math.PI/2, 0)
            );

            createWall(
                this.roomDepth,
                this.roomHeight,
                new THREE.Vector3(this.roomWidth/2, this.roomHeight/2, 0),
                new THREE.Euler(0, -Math.PI/2, 0)
            );
        } catch (error) {
            console.error('Erreur chargement texture mur:', error);
            // Fallback material si la texture ne charge pas
            const fallbackMaterial = new THREE.MeshStandardMaterial({
                color: 0x808080,
                side: THREE.DoubleSide,
                ...MATERIALS.WALL
            });
            // Créer les murs avec le matériau de secours
            this.createWallsWithMaterial(fallbackMaterial);
        }
    }

    createWallsWithMaterial(material) {
        const createWall = (width, height, position, rotation) => {
            const geometry = new THREE.PlaneGeometry(width, height);
            const wall = new THREE.Mesh(geometry, material);
            wall.position.copy(position);
            wall.rotation.copy(rotation);
            wall.receiveShadow = true;
            this.scene.add(wall);
        };

        // Back wall
        createWall(
            this.roomWidth,
            this.roomHeight,
            new THREE.Vector3(0, this.roomHeight/2, -this.roomDepth/2),
            new THREE.Euler(0, 0, 0)
        );

        // Side walls
        createWall(
            this.roomDepth,
            this.roomHeight,
            new THREE.Vector3(-this.roomWidth/2, this.roomHeight/2, 0),
            new THREE.Euler(0, Math.PI/2, 0)
        );

        createWall(
            this.roomDepth,
            this.roomHeight,
            new THREE.Vector3(this.roomWidth/2, this.roomHeight/2, 0),
            new THREE.Euler(0, -Math.PI/2, 0)
        );
    }

    createScreen() {
        const screenWidth = this.roomWidth * 0.8;
        const screenHeight = this.roomHeight * 0.6;
        
        const screenGeometry = new THREE.PlaneGeometry(screenWidth, screenHeight);
        const screenMaterial = new THREE.MeshBasicMaterial({
            map: this.videoTexture,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 1
        });
        
        this.screenMesh = new THREE.Mesh(screenGeometry, screenMaterial);
        this.screenMesh.position.set(0, this.roomHeight * 0.5, -this.roomDepth/2 + 0.1);
        this.scene.add(this.screenMesh);
    }

    applyTheme(theme) {
        const themes = {
            science: {
                walls: 0x1a237e,    // Bleu foncé
                floor: 0x0d47a1,    // Bleu profond
                ceiling: 0x283593,  // Bleu royal
                ambient: 0x4fc3f7,  // Bleu clair
                screen: 0xbbdefb    // Bleu très clair
            },
            technologie: {
                walls: 0x212121,    // Gris foncé
                floor: 0x424242,    // Gris
                ceiling: 0x616161,  // Gris clair
                ambient: 0x00e676,  // Vert néon
                screen: 0x69f0ae    // Vert clair
            },
            économie: {
                walls: 0x1b5e20,    // Vert foncé
                floor: 0x2e7d32,    // Vert
                ceiling: 0x388e3c,  // Vert clair
                ambient: 0xffd54f,  // Jaune doré
                screen: 0xffecb3    // Jaune clair
            }
        };

        const themeColors = themes[theme] || themes.default;
        
        // Mettre à jour les matériaux
        this.scene.traverse((object) => {
            if (object instanceof THREE.Mesh) {
                if (object.material && object !== this.screenMesh) { // Ne pas modifier la texture de l'écran
                    // Identifier l'élément par sa position/géométrie
                    if (object.position.y === -this.roomHeight/2) {
                        // C'est le sol
                        object.material.color.setHex(themeColors.floor);
                    } else if (object.position.y === this.roomHeight/2) {
                        // C'est le plafond
                        object.material.color.setHex(themeColors.ceiling);
                    } else {
                        // Ce sont les murs
                        object.material.color.setHex(themeColors.walls);
                    }
                }
            }
        });

        // Mettre à jour la lumière ambiante
        const ambientLight = this.scene.children.find(child => child instanceof THREE.AmbientLight);
        if (ambientLight) {
            ambientLight.color.setHex(themeColors.ambient);
        }

        this.currentTheme = theme;
    }

    getRoomDimensions() {
        return {
            width: this.roomWidth,
            height: this.roomHeight,
            depth: this.roomDepth
        };
    }
}

export default RoomManager; 