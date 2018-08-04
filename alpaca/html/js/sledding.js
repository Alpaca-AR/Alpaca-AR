let racers = [
  "Downhill skier",
  "Skeleton Slider" //,
  //  "Speed Skater",
  //  "Cross-country skier",
  //  "Luger",
  //  "Bobsledder"
];

let snowScene = new THREE.Scene(),
  trackGroup = new THREE.Group(),
  racerGroup = new THREE.Group(),
  axesHelper = new THREE.AxesHelper();
snowScene.add(trackGroup, racerGroup, axesHelper);

let size = 0.5;

let groundGeometry = new THREE.PlaneBufferGeometry(size * 2, size * 4),
  groundMaterial = new THREE.MeshBasicMaterial({
    color: 0xb8b8b8,
    side: THREE.DoubleSide
  }),
  groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);

trackGroup.rotation.set(0.5 * Math.PI, 0, 0, "XYZ");
trackGroup.updateMatrixWorld();
groundMesh.position.set(0, -size * 2, 0.0001);
groundMesh.updateMatrixWorld();
trackGroup.add(groundMesh);

let x = -0.05;
for (let racer of racers) {
  let racerGeometry = new THREE.BoxBufferGeometry(
      size / 20,
      size / 10,
      size / 20
    ),
    racerMaterial = new THREE.MeshBasicMaterial({
      color: 0x000099
    }),
    racerMesh = new THREE.Mesh(racerGeometry, racerMaterial);
  racerMesh.position.set(x, -size / 10, -size / 40);
  racerMesh.updateMatrixWorld();
  racerMesh.name = racer;
  trackGroup.add(racerMesh);
  x += 0.1;
}

let poleGeometry = new THREE.CylinderGeometry(0.025, 0.05, 0.25),
  poleMaterial = new THREE.MeshBasicMaterial({ color: 0xb20000 }),
  poleMesh = new THREE.Mesh(poleGeometry, poleMaterial);
poleMesh.rotation.set(-0.5 * Math.PI, 0, 0, "XYZ");

let startRightPoleMesh = poleMesh.clone();
startRightPoleMesh.position.set(0.15, -size / 5, -0.125);
startRightPoleMesh.updateMatrixWorld();

let startLeftPoleMesh = poleMesh.clone();
startLeftPoleMesh.position.set(-0.15, -size / 5, -0.125);
startLeftPoleMesh.updateMatrixWorld();

let finishRightPoleMesh = poleMesh.clone();
finishRightPoleMesh.position.set(0.15, -4 * size + size / 5, -0.125);
finishRightPoleMesh.updateMatrixWorld();

let finishLeftPoleMesh = poleMesh.clone();
finishLeftPoleMesh.position.set(-0.15, -4 * size + size / 5, -0.125);
finishLeftPoleMesh.updateMatrixWorld();

let bannerGeometry = new THREE.BoxBufferGeometry(0.3, 0.01, size / 10),
  bannerMaterial = new THREE.MeshBasicMaterial({
    color: 0xf8f8ff
  }),
  bannerMesh = new THREE.Mesh(bannerGeometry, bannerMaterial);

let startBannerMesh = bannerMesh.clone();
startBannerMesh.position.set(0, -size / 5, -0.2499 + size / 20);
startBannerMesh.updateMatrixWorld();

let finishBannerMesh = bannerMesh.clone();
finishBannerMesh.position.set(0, -4 * size + size / 5, -0.2499 + size / 20);
finishBannerMesh.updateMatrixWorld();

let barrierGeometry = new THREE.PlaneBufferGeometry(
    0.05,
    4 * size - (2 * size) / 5
  ),
  barrierMaterial = new THREE.MeshBasicMaterial({ color: 0x990000, side: THREE.DoubleSide }),
  barrierMesh = new THREE.Mesh(barrierGeometry, barrierMaterial);
barrierMesh.rotation.set(0, Math.PI * 0.5, 0, "XYZ");

let rightBarrierMesh = barrierMesh.clone();
rightBarrierMesh.position.set(0.15, -size * 2, -0.025);
rightBarrierMesh.updateMatrixWorld();

let leftBarrierMesh = barrierMesh.clone();
leftBarrierMesh.position.set(-0.15, -size * 2, -0.025);
leftBarrierMesh.updateMatrixWorld();

trackGroup.add(
  startRightPoleMesh,
  startLeftPoleMesh,
  startBannerMesh,
  finishRightPoleMesh,
  finishLeftPoleMesh,
  finishBannerMesh,
  rightBarrierMesh,
  leftBarrierMesh
);

updateScene();

async function updateScene() {
  return fetch("http://accona.eecs.utk.edu:8599/store/alpaca/index.json", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(snowScene.toJSON())
  })
    .then(response => response.json())
    .catch(err => console.error("Fetch Error =\n", err));
}
