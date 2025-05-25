import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CHAIR_CONFIG, COLORS, MATERIALS, PATHS } from '../utils/constants.js';
import { createMeshWithMaterial } from '../utils/helpers.js';

class Chair {
    constructor(scene) {
        this.scene = scene;
        this.instancedMesh = null;
        this.loader = new GLTFLoader();
        this.originalMaterials = new Map();
    }

    async loadModel() {
        return new Promise((resolve, reject) => {
            this.loader.load(
                './models/cinema_chair_simple__0410212306_texture.glb',
                (gltf) => {
                    const chairModel = gltf.scene;
                    chairModel.scale.set(1, 1, 1);
                    
                    let chairMesh = null;
                    chairModel.traverse((node) => {
                        if (node.isMesh) {
                            chairMesh = node;
                            node.castShadow = true;
                            node.receiveShadow = true;
                            
                            // Store original materials
                            if (Array.isArray(node.material)) {
                                node.material.forEach((mat, index) => {
                                    this.originalMaterials.set(`${node.name}_${index}`, mat.clone());
                                });
                            } else if (node.material) {
                                this.originalMaterials.set(node.name, node.material.clone());
                            }

                            // Create new material that combines original texture with our color
                            const newMaterial = new THREE.MeshStandardMaterial({
                                map: node.material.map,
                                color: COLORS.CHAIR_DEFAULT,
                                ...MATERIALS.CHAIR
                            });

                            node.material = newMaterial;
                        }
                    });

                    if (!chairMesh) {
                        reject(new Error('No mesh found in the chair model'));
                        return;
                    }

                    resolve(chairMesh);
                },
                // Progress callback
                (progress) => {
                    console.log('Loading model:', (progress.loaded / progress.total * 100) + '%');
                },
                // Error callback
                (error) => {
                    console.error('Error loading model:', error);
                    reject(error);
                }
            );
        });
    }

    async createInstances(roomDimensions) {
        try {
            const chairMesh = await this.loadModel();
            
            // Create instanced mesh
            const instanceCount = CHAIR_CONFIG.ROWS * CHAIR_CONFIG.CHAIRS_PER_ROW;
            this.instancedMesh = new THREE.InstancedMesh(
                chairMesh.geometry,
                chairMesh.material,
                instanceCount
            );
            this.instancedMesh.castShadow = true;
            this.instancedMesh.receiveShadow = true;

            // Create and apply matrices for each instance
            const matrix = new THREE.Matrix4();
            let instanceIndex = 0;

            for (let row = 0; row < CHAIR_CONFIG.ROWS; row++) {
                const rowZ = roomDimensions.depth/4 - row * CHAIR_CONFIG.ROW_SPACING;
                const rowY = row * CHAIR_CONFIG.ROW_ELEVATION;

                // Create platform for each row
                if (row < CHAIR_CONFIG.ROWS-1) {
                    this.createPlatform(rowY, rowZ, roomDimensions.width);
                }

                // Create chairs for the row
                for (let chair = 0; chair < CHAIR_CONFIG.CHAIRS_PER_ROW; chair++) {
                    const chairX = (chair - (CHAIR_CONFIG.CHAIRS_PER_ROW - 1) / 2) * CHAIR_CONFIG.SPACING;
                    
                    matrix.makeRotationY(Math.PI * 0.5);
                    matrix.setPosition(chairX, rowY + 3, rowZ);
                    this.instancedMesh.setMatrixAt(instanceIndex, matrix);
                    instanceIndex++;
                }
            }

            this.scene.add(this.instancedMesh);
            return this.instancedMesh;

        } catch (error) {
            console.error('Error creating chair instances:', error);
            throw error;
        }
    }

    createPlatform(rowY, rowZ, roomWidth) {
        const platformGeometry = new THREE.BoxGeometry(
            roomWidth - 0.2,
            Math.abs(CHAIR_CONFIG.ROW_ELEVATION) + 2,
            CHAIR_CONFIG.ROW_SPACING * 1
        );
        const platform = createMeshWithMaterial(
            platformGeometry,
            MATERIALS.CHAIR,
            COLORS.PLATFORM
        );
        platform.position.set(
            0,
            rowY + 2 - (Math.abs(CHAIR_CONFIG.ROW_ELEVATION) + 2)/2,
            rowZ
        );
        platform.receiveShadow = true;
        this.scene.add(platform);
    }

    getInstancedMesh() {
        return this.instancedMesh;
    }
}

export default Chair; 