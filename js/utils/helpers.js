import * as THREE from 'three';

export function createMeshWithMaterial(geometry, materialConfig, color) {
    const material = new THREE.MeshStandardMaterial({
        color: color,
        roughness: materialConfig.roughness,
        metalness: materialConfig.metalness
    });
    return new THREE.Mesh(geometry, material);
}

export function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function loadTexture(textureLoader, path, options = {}) {
    return new Promise((resolve, reject) => {
        textureLoader.load(
            path,
            (texture) => {
                if (options.repeat) {
                    texture.wrapS = THREE.RepeatWrapping;
                    texture.wrapT = THREE.RepeatWrapping;
                    texture.repeat.set(options.repeat.x, options.repeat.y);
                }
                resolve(texture);
            },
            undefined,
            reject
        );
    });
}

export function createVideoTexture(videoPath) {
    const video = document.createElement('video');
    video.src = videoPath;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;

    const texture = new THREE.VideoTexture(video);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    video.addEventListener('canplay', () => {
        video.play().catch(e => console.error('Error playing video:', e));
    });

    return texture;
} 