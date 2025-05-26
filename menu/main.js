import * as THREE from 'three';

// Variables globales Three.js
let scene,
  camera,
  renderer,
  objects = [],
  controls,
  textureLoader;

const themeSelect = document.getElementById('themeSelect');
const newConferenceBtn = document.getElementById('newConferenceBtn');
const cameraOverlay = document.getElementById('cameraOverlay');
const closeCameraBtn = document.getElementById('closeCamera');
const userVideo = document.getElementById('userVideo');

// Initialisation de Three.js
function initThreeJS() {
  // Création de la scène
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x1c1c3c, 0.02);

  // Création de la caméra
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 30;

  // Création du rendu
  renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById("threejs-canvas"),
    antialias: true,
    alpha: false,
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;

  // Lumière ambiante
  const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
  scene.add(ambientLight);

  // Lumière directionnelle principale
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(1, 1, 1);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  // Chargeur de textures
  textureLoader = new THREE.TextureLoader();

  // Gestion du redimensionnement
  window.addEventListener("resize", onWindowResize);
}

// SCIENCES - Réseaux neuronaux et molécules
function createScienceScene() {
  clearScene();

  // Couleurs scientifiques
  const colors = [0xff4136, 0x2ecc40, 0x0074d9, 0xffdc00, 0xb10dc9];

  // Créer un réseau neuronal
  const layers = 5;
  const neuronsPerLayer = 8;
  const neurons = [];

  // Créer les couches de neurones
  for (let l = 0; l < layers; l++) {
    const layerNeurons = [];
    const xPos = (l - layers / 2) * 8;

    for (let n = 0; n < neuronsPerLayer; n++) {
      const yPos = (n - neuronsPerLayer / 2) * 4;
      const neuron = createNeuron(xPos, yPos, 0, colors[l % colors.length]);
      layerNeurons.push(neuron);

      // Animation spécifique
      objects.push({
        mesh: neuron,
        pulseSpeed: 0.5 + Math.random(),
        originalPosition: { x: xPos, y: yPos, z: 0 },
      });
    }
    neurons.push(layerNeurons);
  }

  // Connecter les neurones
  for (let l = 0; l < layers - 1; l++) {
    for (let n1 = 0; n1 < neurons[l].length; n1++) {
      for (let n2 = 0; n2 < neurons[l + 1].length; n2++) {
        if (Math.random() > 0.7) continue; // Pas toutes les connexions
        createNeuronConnection(neurons[l][n1], neurons[l + 1][n2], 0xaaaaaa);
      }
    }
  }

  // Ajouter des molécules flottantes
  for (let i = 0; i < 10; i++) {
    createMolecule(
      (Math.random() - 0.5) * 40,
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 40,
      colors
    );
  }

  // Ajouter une image de fond stylisée (cerveau)
  textureLoader.load(
    "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    function (texture) {
      const bgGeometry = new THREE.PlaneGeometry(60, 40);
      const bgMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.15,
      });
      const bg = new THREE.Mesh(bgGeometry, bgMaterial);
      bg.position.z = -20;
      scene.add(bg);
      objects.push({ mesh: bg });
    }
  );
}

// TECHNOLOGIE - IA et circuits
function createTechScene() {
  clearScene();

  const techColor = 0x00a8ff;

  // Créer un fond de circuit imprimé
  textureLoader.load(
    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    function (texture) {
      const bgGeometry = new THREE.PlaneGeometry(80, 60);
      const bgMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.2,
      });
      const bg = new THREE.Mesh(bgGeometry, bgMaterial);
      bg.position.z = -30;
      scene.add(bg);
      objects.push({ mesh: bg });
    }
  );

  // Créer un cerveau IA stylisé
  const brainGeometry = new THREE.SphereGeometry(8, 32, 32);
  brainGeometry.scale(1, 0.6, 1);
  const brainMaterial = new THREE.MeshStandardMaterial({
    color: techColor,
    wireframe: true,
    transparent: true,
    opacity: 0.3,
    emissive: techColor,
    emissiveIntensity: 0.2,
  });
  const brain = new THREE.Mesh(brainGeometry, brainMaterial);
  scene.add(brain);
  objects.push({
    mesh: brain,
    rotationSpeed: 0.005,
  });

  // Ajouter des points de données
  for (let i = 0; i < 100; i++) {
    createDataPoint(
      (Math.random() - 0.5) * 30,
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 30,
      techColor
    );
  }

  // Ajouter des lignes de code flottantes
  for (let i = 0; i < 15; i++) {
    createCodeLine(
      (Math.random() - 0.5) * 40,
      (Math.random() - 0.5) * 25,
      (Math.random() - 0.5) * 40
    );
  }
}

// ÉCONOMIE - Argent et finances
function createEconomyScene() {
  clearScene();

  // Fond de graphiques boursiers
  textureLoader.load(
    "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    function (texture) {
      const bgGeometry = new THREE.PlaneGeometry(80, 60);
      const bgMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.15,
      });
      const bg = new THREE.Mesh(bgGeometry, bgMaterial);
      bg.position.z = -30;
      scene.add(bg);
      objects.push({ mesh: bg });
    }
  );

  // Texture de billet de dollar
  textureLoader.load(
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/US_one_dollar_bill%2C_obverse%2C_series_2009.jpg/640px-US_one_dollar_bill%2C_obverse%2C_series_2009.jpg",
    function (texture) {
      // Créer des billets volants
      for (let i = 0; i < 20; i++) {
        createBill(
          (Math.random() - 0.5) * 40,
          (Math.random() - 0.5) * 25,
          (Math.random() - 0.5) * 40,
          texture
        );
      }
    }
  );

  // Créer des pièces de monnaie
  for (let i = 0; i < 30; i++) {
    createCoin(
      (Math.random() - 0.5) * 40,
      (Math.random() - 0.5) * 25,
      (Math.random() - 0.5) * 40
    );
  }

  // Ajouter des graphiques 3D
  createStockChart(0, -5, 0);
  createPieChart(-15, 5, -10);
  createBarChart(15, 5, -10);
}

// UTILITAIRES Three.js
function createNeuron(x, y, z, color) {
  const geometry = new THREE.SphereGeometry(0.8, 32, 32);
  const material = new THREE.MeshStandardMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: 0.3,
    metalness: 0.3,
    roughness: 0.4,
  });

  const neuron = new THREE.Mesh(geometry, material);
  neuron.position.set(x, y, z);
  scene.add(neuron);
  return neuron;
}

function createNeuronConnection(neuron1, neuron2, color) {
  const distance = neuron1.position.distanceTo(neuron2.position);
  const geometry = new THREE.CylinderGeometry(0.1, 0.1, distance, 8);
  geometry.rotateZ(Math.PI / 2);

  const material = new THREE.MeshStandardMaterial({
    color: color,
    transparent: true,
    opacity: 0.6,
  });

  const connection = new THREE.Mesh(geometry, material);
  connection.position.x = (neuron1.position.x + neuron2.position.x) / 2;
  connection.position.y = (neuron1.position.y + neuron2.position.y) / 2;
  connection.position.z = (neuron1.position.z + neuron2.position.z) / 2;
  connection.lookAt(neuron2.position);

  scene.add(connection);
  objects.push({
    mesh: connection,
    neuron1: neuron1,
    neuron2: neuron2,
  });
}

function createMolecule(x, y, z, colors) {
  const atomCount = 3 + Math.floor(Math.random() * 4);
  const atoms = [];

  for (let i = 0; i < atomCount; i++) {
    const offsetX = (Math.random() - 0.5) * 4;
    const offsetY = (Math.random() - 0.5) * 4;
    const offsetZ = (Math.random() - 0.5) * 4;

    const atom = createAtom(
      x + offsetX,
      y + offsetY,
      z + offsetZ,
      colors[i % colors.length],
      0.5 + Math.random() * 0.8
    );
    atoms.push(atom);
  }

  // Créer des liaisons
  for (let i = 0; i < atomCount; i++) {
    for (let j = i + 1; j < atomCount; j++) {
      if (Math.random() > 0.5) {
        createBond(atoms[i], atoms[j], 0xaaaaaa);
      }
    }
  }
}

function createAtom(x, y, z, color, size = 1.0) {
  const geometry = new THREE.SphereGeometry(size, 32, 32);
  const material = new THREE.MeshStandardMaterial({
    color: color,
    metalness: 0.3,
    roughness: 0.4,
    emissive: color,
    emissiveIntensity: 0.1,
  });

  const atom = new THREE.Mesh(geometry, material);
  atom.position.set(x, y, z);
  scene.add(atom);

  objects.push({
    mesh: atom,
    speed: 0.01 + Math.random() * 0.02,
    rotationAxis: new THREE.Vector3(
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5
    ).normalize(),
    originalPosition: { x, y, z },
  });

  return atom;
}

function createBond(atom1, atom2, color) {
  const distance = atom1.position.distanceTo(atom2.position);
  const geometry = new THREE.CylinderGeometry(0.2, 0.2, distance, 8);
  geometry.rotateZ(Math.PI / 2);

  const material = new THREE.MeshStandardMaterial({
    color: color,
    metalness: 0.7,
    roughness: 0.3,
  });

  const bond = new THREE.Mesh(geometry, material);
  bond.position.x = (atom1.position.x + atom2.position.x) / 2;
  bond.position.y = (atom1.position.y + atom2.position.y) / 2;
  bond.position.z = (atom1.position.z + atom2.position.z) / 2;
  bond.lookAt(atom2.position);

  scene.add(bond);
  objects.push({
    mesh: bond,
    atom1: atom1,
    atom2: atom2,
  });
}

function createDataPoint(x, y, z, color) {
  const size = 0.2 + Math.random() * 0.3;
  const geometry = new THREE.OctahedronGeometry(size);
  const material = new THREE.MeshStandardMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: 0.5,
  });

  const point = new THREE.Mesh(geometry, material);
  point.position.set(x, y, z);
  scene.add(point);

  objects.push({
    mesh: point,
    speed: {
      x: (Math.random() - 0.5) * 0.02,
      y: (Math.random() - 0.5) * 0.02,
      z: (Math.random() - 0.5) * 0.02,
    },
    originalPosition: { x, y, z },
  });
}

function createCodeLine(x, y, z) {
  const length = 3 + Math.random() * 5;
  const geometry = new THREE.BoxGeometry(length, 0.1, 0.1);
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x00a8ff,
    emissiveIntensity: 0.3,
  });

  const line = new THREE.Mesh(geometry, material);
  line.position.set(x, y, z);
  line.rotation.y = Math.random() * Math.PI;
  line.rotation.z = Math.random() * Math.PI * 0.2;
  scene.add(line);

  objects.push({
    mesh: line,
    rotationSpeed: (Math.random() - 0.5) * 0.01,
  });
}

function createBill(x, y, z, texture) {
  const geometry = new THREE.PlaneGeometry(3, 1.5);
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    side: THREE.DoubleSide,
    roughness: 0.3,
  });

  const bill = new THREE.Mesh(geometry, material);
  bill.position.set(x, y, z);
  bill.rotation.x = Math.random() * Math.PI;
  bill.rotation.y = Math.random() * Math.PI;
  bill.rotation.z = Math.random() * Math.PI;

  scene.add(bill);

  objects.push({
    mesh: bill,
    floatSpeed: 0.02 + Math.random() * 0.03,
    rotationSpeed: 0.01 + Math.random() * 0.02,
    floatDirection: new THREE.Vector3(
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5
    ).normalize(),
  });
}

function createCoin(x, y, z) {
  const geometry = new THREE.CylinderGeometry(0.8, 0.8, 0.1, 32);
  const material = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    metalness: 0.9,
    roughness: 0.2,
  });

  const coin = new THREE.Mesh(geometry, material);
  coin.position.set(x, y, z);
  coin.rotation.x = Math.random() * Math.PI;
  coin.rotation.z = Math.random() * Math.PI;

  scene.add(coin);

  objects.push({
    mesh: coin,
    rotationSpeed: 0.03 + Math.random() * 0.04,
    floatSpeed: 0.01 + Math.random() * 0.02,
    originalY: y,
  });
}

function createStockChart(x, y, z) {
  const points = [];
  const height = 5;
  const width = 10;

  for (let i = 0; i < 20; i++) {
    points.push(
      new THREE.Vector3(
        (i / 20) * width - width / 2,
        (Math.random() * 0.5 + 0.5) * height,
        0
      )
    );
  }

  const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x2ecc40,
    linewidth: 2,
  });

  const chart = new THREE.Line(lineGeometry, lineMaterial);
  chart.position.set(x, y, z);
  scene.add(chart);
  objects.push({ mesh: chart });

  // Ajouter un plan de fond
  const planeGeometry = new THREE.PlaneGeometry(width, height);
  const planeMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide,
  });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.position.set(x, y + height / 2, z - 0.1);
  scene.add(plane);
  objects.push({ mesh: plane });
}

function createPieChart(x, y, z) {
  const radius = 3;
  const segments = 5;
  const colors = [0xff4136, 0x2ecc40, 0x0074d9, 0xffdc00, 0xb10dc9];

  let startAngle = 0;
  for (let i = 0; i < segments; i++) {
    const angle = Math.PI * 2 * (0.1 + Math.random() * 0.3);
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(radius * Math.cos(startAngle), radius * Math.sin(startAngle));
    shape.absarc(0, 0, radius, startAngle, startAngle + angle, false);
    shape.lineTo(0, 0);

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.5,
      bevelEnabled: false,
    });

    const material = new THREE.MeshStandardMaterial({
      color: colors[i % colors.length],
      metalness: 0.3,
      roughness: 0.4,
    });

    const segment = new THREE.Mesh(geometry, material);
    segment.position.set(x, y, z);
    segment.rotation.x = Math.PI / 2;
    segment.rotation.z = Math.PI / 4;
    scene.add(segment);
    objects.push({
      mesh: segment,
      rotationSpeed: 0.002 * (i % 2 === 0 ? 1 : -1),
    });

    startAngle += angle;
  }
}

function createBarChart(x, y, z) {
  const barCount = 6;
  const width = 8;
  const maxHeight = 5;

  for (let i = 0; i < barCount; i++) {
    const height = (0.3 + Math.random() * 0.7) * maxHeight;
    const geometry = new THREE.BoxGeometry(width / barCount - 0.2, height, 0.5);
    const material = new THREE.MeshStandardMaterial({
      color: 0x0074d9,
      metalness: 0.5,
      roughness: 0.3,
    });

    const bar = new THREE.Mesh(geometry, material);
    bar.position.set(
      x + (i - barCount / 2 + 0.5) * (width / barCount),
      y + height / 2,
      z
    );
    scene.add(bar);
    objects.push({ mesh: bar });
  }

  // Ajouter un plan de fond
  const planeGeometry = new THREE.PlaneGeometry(width, maxHeight);
  const planeMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide,
  });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.position.set(x, y + maxHeight / 2, z - 0.3);
  scene.add(plane);
  objects.push({ mesh: plane });
}

function clearScene() {
  objects.forEach((obj) => {
    scene.remove(obj.mesh);
    if (obj.mesh.geometry) obj.mesh.geometry.dispose();
    if (obj.mesh.material) {
      if (Array.isArray(obj.mesh.material)) {
        obj.mesh.material.forEach((m) => m.dispose());
      } else {
        obj.mesh.material.dispose();
      }
    }
  });
  objects = [];
}

function animateObjects() {
  const time = Date.now() * 0.001;

  objects.forEach((obj) => {
    // Rotation
    if (obj.rotationSpeed) {
      obj.mesh.rotation.y += obj.rotationSpeed;
    }

    // Flottement
    if (obj.floatSpeed) {
      if (obj.floatDirection) {
        obj.mesh.position.addScaledVector(obj.floatDirection, obj.floatSpeed);

        // Changement aléatoire de direction
        if (Math.random() < 0.01) {
          obj.floatDirection = new THREE.Vector3(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5
          ).normalize();
        }
      }

      // Flottement vertical pour les pièces
      if (obj.originalY !== undefined) {
        obj.mesh.position.y = obj.originalY + Math.sin(time * 2) * 2;
      }
    }

    // Pulsation
    if (obj.pulseSpeed) {
      const pulse = 1 + Math.sin(time * obj.pulseSpeed) * 0.1;
      obj.mesh.scale.set(pulse, pulse, pulse);
    }

    // Vibration
    if (obj.originalPosition) {
      const vibIntensity = 0.3;
      obj.mesh.position.x =
        obj.originalPosition.x + Math.sin(time * 2) * vibIntensity;
      obj.mesh.position.y =
        obj.originalPosition.y + Math.sin(time * 2.3) * vibIntensity;
      obj.mesh.position.z =
        obj.originalPosition.z + Math.sin(time * 1.7) * vibIntensity;
    }

    // Mise à jour des liaisons
    if (obj.atom1 && obj.atom2) {
      const geometry = obj.mesh.geometry;
      const positions = geometry.attributes.position;

      positions.setXYZ(
        0,
        obj.atom1.position.x,
        obj.atom1.position.y,
        obj.atom1.position.z
      );
      positions.setXYZ(
        1,
        obj.atom2.position.x,
        obj.atom2.position.y,
        obj.atom2.position.z
      );

      positions.needsUpdate = true;
      geometry.computeBoundingSphere();
    }
  });

  // Animation subtile de la caméra
  const camRadius = 30;
  camera.position.x = Math.sin(time * 0.1) * camRadius;
  camera.position.z = Math.cos(time * 0.1) * camRadius;
  camera.lookAt(0, 0, 0);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  animateObjects();
  renderer.render(scene, camera);
}

function changeTheme(theme) {
  if (theme === "économie") {
    createEconomyScene();
  } else if (theme === "technologie") {
    createTechScene();
  } else if (theme === "science") {
    createScienceScene();
  } else {
    clearScene();
    scene.background = new THREE.Color(0x1c1c3c);
  }
}

// Gestion de la caméra
async function setupCamera() {
  const newConferenceBtn = document.getElementById("newConferenceBtn");
  const cameraContainer = document.getElementById("cameraContainer");
  const closeCameraBtn = document.getElementById("closeCamera");
  const userVideo = document.getElementById("userVideo");

  newConferenceBtn.addEventListener("click", async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      userVideo.srcObject = stream;
      cameraContainer.style.display = "block";
    } catch (err) {
      console.error("Erreur d'accès à la caméra: ", err);
      alert(
        "Impossible d'accéder à la caméra. Veuillez vérifier vos permissions."
      );
    }
  });
  
  closeCameraBtn.addEventListener('click', () => {
    const stream = userVideo.srcObject;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      userVideo.srcObject = null;
    }
    cameraContainer.style.display = "none";
  });
}

// Initialisation
document.addEventListener("DOMContentLoaded", () => {
  initThreeJS();
  animate();

  const themeSelect = document.getElementById("themeSelect");
  themeSelect.addEventListener("change", (event) => {
    const selectedTheme = event.target.value;
    changeTheme(selectedTheme);
  });

  // Ne pas démarrer avec un thème sélectionné par défaut
  themeSelect.value = "";
  changeTheme("");

  // Configurer la caméra
  setupCamera();
});
