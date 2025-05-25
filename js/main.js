const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("three-container").appendChild(renderer.domElement);

// Particules
const particleCount = 300;
const geometry = new THREE.BufferGeometry();
const positions = [];

for (let i = 0; i < particleCount; i++) {
  positions.push((Math.random() - 0.5) * 10);
  positions.push((Math.random() - 0.5) * 10);
  positions.push((Math.random() - 0.5) * 10);
}

geometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(positions, 3)
);

const material = new THREE.PointsMaterial({ color: 0xffffff, size: 0.05 });
const particles = new THREE.Points(geometry, material);
scene.add(particles);

// Animation
function animate() {
  requestAnimationFrame(animate);
  particles.rotation.y += 0.001;
  particles.rotation.x += 0.0005;
  renderer.render(scene, camera);
}
animate();

// Responsive
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Boutons (tu peux mettre tes actions ici)
document.getElementById("newMeeting").onclick = () => {
  alert("Créer une nouvelle réunion !");
};

document.getElementById("joinMeeting").onclick = () => {
  const code = prompt("Entrer le code de réunion :");
  if (code) alert("Vous avez rejoint la réunion : " + code);
};
