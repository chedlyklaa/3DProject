import * as THREE from 'three';
import { ROOM_CONFIG, COLORS, MATERIALS, PATHS } from '../utils/constants.js';
import { createMeshWithMaterial, loadTexture, createVideoTexture } from '../utils/helpers.js';

class RoomManager {
    constructor(scene) {
        this.scene = scene;
        this.roomWidth = ROOM_CONFIG.WIDTH;
        this.roomHeight = ROOM_CONFIG.HEIGHT;
        this.roomDepth = ROOM_CONFIG.DEPTH;
        
        this.setupRoom();
    }

    setupRoom() {
        this.createFloor();
        this.createWalls();
        this.createScreen();
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
        textureLoader.setPath(PATHS.TEXTURES);

        try {
            const woodTexture = await loadTexture(textureLoader, 'wood_texture.svg', {
                repeat: { x: 4, y: 2 }
            });

            const wallMaterial = new THREE.MeshStandardMaterial({
                map: woodTexture,
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
            console.error('Error loading wall texture:', error);
        }
    }

    createScreen() {
        const screenWidth = this.roomWidth * 0.8;
        const screenHeight = this.roomHeight * 0.6;
        
        const videoTexture = createVideoTexture(`${PATHS.VIDEO}cinema_screen.mp4`);

        const screenGeometry = new THREE.PlaneGeometry(screenWidth, screenHeight);
        const screenMaterial = new THREE.MeshBasicMaterial({
            map: videoTexture,
            side: THREE.DoubleSide
        });
        const screen = new THREE.Mesh(screenGeometry, screenMaterial);
        screen.position.set(0, this.roomHeight * 0.5, -this.roomDepth/2 + 0.1);
        this.scene.add(screen);
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