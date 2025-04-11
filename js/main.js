import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111); // Dark background

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 15);

// Renderer setup
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const spotLight = new THREE.SpotLight(0xffffff, 1);
spotLight.position.set(0, 10, 10);
spotLight.castShadow = true;
scene.add(spotLight);

// Store original spotlight intensity
const originalIntensity = spotLight.intensity;

// Light toggle function
function toggleLight() {
    spotLight.intensity = spotLight.intensity > 0 ? 0 : originalIntensity;
}

// Add click event listener to the light button
document.getElementById('lightButton').addEventListener('click', toggleLight);

// Cinema room dimensions
const roomWidth = 20;
const roomHeight = 10;
const roomDepth = 25;

// Floor
const floorGeometry = new THREE.PlaneGeometry(roomWidth, roomDepth);
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a4a });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Walls
// Load wood texture
const textureLoader = new THREE.TextureLoader();
const woodTexture = textureLoader.load('textures/wood_texture.svg');
woodTexture.wrapS = THREE.RepeatWrapping;
woodTexture.wrapT = THREE.RepeatWrapping;
woodTexture.repeat.set(4, 2);

const wallMaterial = new THREE.MeshStandardMaterial({
    map: woodTexture,
    roughness: 0.8,
    metalness: 0.2
});

// Back wall
const backWallGeometry = new THREE.PlaneGeometry(roomWidth, roomHeight);
const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
backWall.position.z = -roomDepth/2;
backWall.position.y = roomHeight/2;
scene.add(backWall);

// Side walls
const sideWallGeometry = new THREE.PlaneGeometry(roomDepth, roomHeight);
const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
leftWall.position.x = -roomWidth/2;
leftWall.position.y = roomHeight/2;
leftWall.rotation.y = Math.PI/2;
scene.add(leftWall);

const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
rightWall.position.x = roomWidth/2;
rightWall.position.y = roomHeight/2;
rightWall.rotation.y = -Math.PI/2;
scene.add(rightWall);

// Screen
const screenWidth = roomWidth * 0.8;
const screenHeight = roomHeight * 0.6;
// Create video element
const video = document.createElement('video');
video.src = './video/cinema_screen.mp4';
video.loop = true;
video.muted = true;
video.playsInline = true;
video.crossOrigin = 'anonymous';

// Create video texture and screen before playing the video
const videoTexture = new THREE.VideoTexture(video);
videoTexture.minFilter = THREE.LinearFilter;
videoTexture.magFilter = THREE.LinearFilter;
videoTexture.format = THREE.RGBAFormat;

const screenGeometry = new THREE.PlaneGeometry(screenWidth, screenHeight);
const screenMaterial = new THREE.MeshBasicMaterial({
    map: videoTexture,
    side: THREE.DoubleSide,
    transparent: true
});
const screen = new THREE.Mesh(screenGeometry, screenMaterial);
screen.position.z = -roomDepth/2 + 0.1; // Slightly in front of back wall
screen.position.y = roomHeight * 0.5;
scene.add(screen);

// Add event listeners for video
video.addEventListener('canplay', () => {
    console.log('Video can play');
    video.play().catch(e => console.error('Error playing video:', e));
});

video.addEventListener('error', (e) => {
    console.error('Video error:', e);
    console.error('Video error details:', e.target.error);
});

// Load and play the video
video.load();


// Handle window resize
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// Chair arrangement parameters
const rowCount = 5;
const chairsPerRow = 8;
const chairSpacing = 2;
const rowSpacing = 2.5;
const rowElevation = -0.5; // Each row is higher than the previous


const platformThickness = 1;
const grayPlatformMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x555759,  // Gray color
    roughness: 0.7,
    metalness: 0.3
});

const bluePlatformMaterial = new THREE.MeshStandardMaterial({
    color: 0x3498db,  // Blue color
    roughness: 0.7,
    metalness: 0.3
});



// Load cinema chair model
const loader = new GLTFLoader();
loader.load(
    'cinema_chair_simple__0410212306_texture.glb',
    function (gltf) {
        const chairModel = gltf.scene;
        chairModel.scale.set(1, 1, 1); // Adjust scale as needed
        chairModel.traverse((node) => {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
            }
        });

        // Create chair rows
        for (let row = 0; row < rowCount; row++) {
            const rowZ = roomDepth/4 - row * rowSpacing;
            const rowY = row * rowElevation;
            
            if (row < rowCount-1) {
                const platformWidth = roomWidth - 0.2;
                const platformDepth = rowSpacing * 1;
                const requiredThickness = rowY + 2;
                
                const platformGeometry = new THREE.BoxGeometry(platformWidth, requiredThickness, platformDepth);
                const platform = new THREE.Mesh(platformGeometry, grayPlatformMaterial);
                
                platform.position.set(
                    0,
                    rowY + 2 - (requiredThickness/2),
                    rowZ
                );
                platform.receiveShadow = true;
                scene.add(platform);
            }


            for (let chair = 0; chair < chairsPerRow; chair++) {
                const chairX = (chair - (chairsPerRow - 1) / 2) * chairSpacing;
                const chairClone = chairModel.clone();
                
                chairClone.position.set(chairX, rowY + 3, rowZ);
                chairClone.rotation.y = 0.5*Math.PI; // Face the screen
                scene.add(chairClone);
            }
        }
    },
    undefined,
    function (error) {
        console.error('An error occurred loading the model:', error);
    }
);
animate();