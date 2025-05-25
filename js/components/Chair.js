import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CHAIR_CONFIG, COLORS, MATERIALS } from '../utils/constants.js';

class Chair {
    constructor(scene) {
        this.scene = scene;
        this.instancedMesh = null;
        this.loader = new GLTFLoader();
        this.originalMaterials = new Map();
        
        // Configuration du modèle de chaise
        this.modelConfig = {
            path: './models/cinema_chair_simple__0410212306_texture.glb',
            scale: { x: 1, y: 1, z: 1 },
            rotation: { x: 0, y: Math.PI * 0.5, z: 0 },
            position: { x: 0, y: 3, z: 0 }
        };
    }

    // Méthode pour changer facilement le modèle de chaise
    setModel(config) {
        this.modelConfig = {
            ...this.modelConfig,  // Garde les valeurs par défaut
            ...config            // Remplace par les nouvelles valeurs
        };
    }

    async loadModel() {
        return new Promise((resolve, reject) => {
            this.loader.load(
                this.modelConfig.path,
                (gltf) => {
                    const chairModel = gltf.scene;
                    
                    // Appliquer la configuration
                    chairModel.scale.set(
                        this.modelConfig.scale.x,
                        this.modelConfig.scale.y,
                        this.modelConfig.scale.z
                    );
                    
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
                (progress) => {
                    console.log('Loading model:', (progress.loaded / progress.total * 100) + '%');
                },
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
            
            const instanceCount = CHAIR_CONFIG.ROWS * CHAIR_CONFIG.CHAIRS_PER_ROW;
            this.instancedMesh = new THREE.InstancedMesh(
                chairMesh.geometry,
                chairMesh.material,
                instanceCount
            );
            this.instancedMesh.castShadow = true;
            this.instancedMesh.receiveShadow = true;

            const matrix = new THREE.Matrix4();
            let instanceIndex = 0;

            for (let row = 0; row < CHAIR_CONFIG.ROWS; row++) {
                const rowZ = roomDimensions.depth/4 - row * CHAIR_CONFIG.ROW_SPACING;
                const rowY = row * CHAIR_CONFIG.ROW_ELEVATION;

                if (row < CHAIR_CONFIG.ROWS-1) {
                    this.createPlatform(rowY, rowZ, roomDimensions.width);
                }

                for (let chair = 0; chair < CHAIR_CONFIG.CHAIRS_PER_ROW; chair++) {
                    const chairX = (chair - (CHAIR_CONFIG.CHAIRS_PER_ROW - 1) / 2) * CHAIR_CONFIG.SPACING;
                    
                    matrix.makeRotationFromEuler(new THREE.Euler(
                        this.modelConfig.rotation.x,
                        this.modelConfig.rotation.y,
                        this.modelConfig.rotation.z
                    ));
                    matrix.setPosition(
                        chairX + this.modelConfig.position.x,
                        rowY + this.modelConfig.position.y,
                        rowZ + this.modelConfig.position.z
                    );
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
        const platform = new THREE.Mesh(
            platformGeometry,
            new THREE.MeshStandardMaterial({
                color: COLORS.PLATFORM,
                ...MATERIALS.CHAIR
            })
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