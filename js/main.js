import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import ChairManager from './ChairManager.js';
import CameraManager from './CameraManager.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 15);

// Renderer setup with optimization
const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Room setup
const roomConfig = {
    width: 20,
    height: 10,
    depth: 25
};

// Initialize managers with room config
const chairManager = new ChairManager(scene, roomConfig);
const cameraManager = new CameraManager(camera, controls);

// Lighting with optimization
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const spotLight = new THREE.SpotLight(0xffffff, 1);
spotLight.position.set(0, 10, 10);
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
scene.add(spotLight);

// Floor with optimized materials
const floorGeometry = new THREE.PlaneGeometry(roomConfig.width, roomConfig.depth);
const floorMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x4a4a4a,
    roughness: 0.8,
    metalness: 0.2
});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Optimize texture loading
const textureLoader = new THREE.TextureLoader();
textureLoader.setPath('textures/');

const loadTexture = (url) => new Promise((resolve) => {
    textureLoader.load(url, (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 2);
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        resolve(texture);
    });
});

// Create walls with optimized materials
const createWalls = async () => {
    const woodTexture = await loadTexture('wood_texture.svg');
    const wallMaterial = new THREE.MeshStandardMaterial({
        map: woodTexture,
        roughness: 0.8,
        metalness: 0.2
    });

    // Create walls function
    const createWall = (width, height, position, rotation) => {
        const geometry = new THREE.PlaneGeometry(width, height);
        const wall = new THREE.Mesh(geometry, wallMaterial);
        wall.position.copy(position);
        wall.rotation.copy(rotation);
        wall.receiveShadow = true;
        scene.add(wall);
        return wall;
    };

    // Back wall
    createWall(
        roomConfig.width,
        roomConfig.height,
        new THREE.Vector3(0, roomConfig.height/2, -roomConfig.depth/2),
        new THREE.Euler(0, 0, 0)
    );

    // Side walls
    createWall(
        roomConfig.depth,
        roomConfig.height,
        new THREE.Vector3(-roomConfig.width/2, roomConfig.height/2, 0),
        new THREE.Euler(0, Math.PI/2, 0)
    );

    createWall(
        roomConfig.depth,
        roomConfig.height,
        new THREE.Vector3(roomConfig.width/2, roomConfig.height/2, 0),
        new THREE.Euler(0, -Math.PI/2, 0)
    );
};

// Initialize walls
createWalls();

// Screen setup with optimized video texture
const screenWidth = roomConfig.width * 0.8;
const screenHeight = roomConfig.height * 0.6;
const video = document.createElement('video');
video.src = './video/cinema_screen.mp4';
video.loop = true;
video.muted = true;
video.playsInline = true;

const videoTexture = new THREE.VideoTexture(video);
videoTexture.minFilter = THREE.LinearFilter;
videoTexture.magFilter = THREE.LinearFilter;

const screenGeometry = new THREE.PlaneGeometry(screenWidth, screenHeight);
const screenMaterial = new THREE.MeshBasicMaterial({
    map: videoTexture,
    side: THREE.DoubleSide
});
const screen = new THREE.Mesh(screenGeometry, screenMaterial);
screen.position.set(0, roomConfig.height * 0.5, -roomConfig.depth/2 + 0.1);
scene.add(screen);

video.addEventListener('canplay', () => {
    video.play().catch(e => console.error('Error playing video:', e));
});

// Chair loading with optimized instancing
const loader = new GLTFLoader();

// Pre-define chair configuration
const chairConfig = {
    rowCount: 5,
    chairsPerRow: 8,
    spacing: 2,
    rowSpacing: 2.5,
    rowElevation: -0.5
};

// Load chairs
loader.load('cinema_chair_simple__0410212306_texture.glb', (gltf) => {
    let chairMesh = null;
    gltf.scene.traverse((node) => {
        if (node.isMesh) {
            chairMesh = node;
        }
    });

    if (!chairMesh) {
        console.error('No mesh found in the chair model');
        return;
    }

    // Create instanced mesh for all chairs
    const totalChairs = chairConfig.rowCount * chairConfig.chairsPerRow;
    const instancedChairs = new THREE.InstancedMesh(
        chairMesh.geometry,
        chairMesh.material,
        totalChairs
    );
    instancedChairs.castShadow = true;
    instancedChairs.receiveShadow = true;
    scene.add(instancedChairs);

    // Create transformation matrix for each chair
    const matrix = new THREE.Matrix4();
    let instanceIndex = 0;

    // Create platforms and position chairs
    for (let row = 0; row < chairConfig.rowCount; row++) {
        const rowZ = roomConfig.depth/4 - row * chairConfig.rowSpacing;
        const rowY = row * chairConfig.rowElevation;

        // Create platform for each row
        if (row < chairConfig.rowCount-1) {
            const platformGeometry = new THREE.BoxGeometry(
                roomConfig.width - 0.2,
                Math.abs(chairConfig.rowElevation) + 2,
                chairConfig.rowSpacing * 1
            );
            const platform = new THREE.Mesh(
                platformGeometry,
                new THREE.MeshStandardMaterial({
                    color: 0x555759,
                    roughness: 0.7,
                    metalness: 0.3
                })
            );
            platform.position.set(
                0,
                rowY + 2 - (Math.abs(chairConfig.rowElevation) + 2)/2,
                rowZ
            );
            platform.receiveShadow = true;
            scene.add(platform);
        }

        // Position chairs in the row
        for (let chair = 0; chair < chairConfig.chairsPerRow; chair++) {
            const chairX = (chair - (chairConfig.chairsPerRow - 1) / 2) * chairConfig.spacing;
            matrix.makeRotationY(Math.PI * 0.5);
            matrix.setPosition(chairX, rowY + 3, rowZ);
            instancedChairs.setMatrixAt(instanceIndex, matrix);
            chairManager.addChair(instancedChairs, row, chair, instanceIndex);
            instanceIndex++;
        }
    }

    instancedChairs.instanceMatrix.needsUpdate = true;
}, undefined, console.error);

// Raycaster for chair selection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    for (const intersect of intersects) {
        if (intersect.object.isInstancedMesh) {
            const instanceId = intersect.instanceId;
            const chairId = chairManager.getChairIdFromInstanceId(instanceId);
            
            if (chairId && chairManager.selectChair(chairId)) {
                const chairPosition = chairManager.getChairCameraPosition(chairId);
                if (chairPosition) {
                    cameraManager.transitionToChair(chairPosition);
                    chairManager.occupyChair(chairId);
                }
            }
            break;
        }
    }
}

// Add event listeners
window.addEventListener('click', onMouseClick);
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}, false);

// Add escape key listener to reset view
window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        const selectedChairId = chairManager.selectedChair;
        if (selectedChairId) {
            chairManager.releaseChair(selectedChairId);
            cameraManager.resetView();
        }
    }
});

// Animation loop with optimization
const clock = new THREE.Clock();
let deltaTime = 0;

function animate() {
    requestAnimationFrame(animate);
    
    deltaTime = clock.getDelta();
    
    // Update only when necessary
    if (controls.enabled) {
        controls.update();
    }
    
    // Update camera transitions
    cameraManager.update();
    
    // Render scene
    renderer.render(scene, camera);
}

animate();