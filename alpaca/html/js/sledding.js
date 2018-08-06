let racers = [
  {
    name: "Luge",
    mph: 81.3
  },/*
  {
    name: "Bobsled",
    mph: 78.7
  },
  {
    name: "Skeleton slider",
    mph: 71.9
  }
  {
    name: "Downhill skier",
    mph: 66.0
  },
  {
    name: "Long-track speed skater",
    mph: 32.8
  },
  {
    name: "Hockey player",
    mph: 24.9
  },
  {
    name: "Figure skater",
    mph: 20.9
  },
*/  {
    name: "Cross-country skier",
    mph: 17.1
  },
/*  {
    name: "Curler",
    mph: 11.0
  }
*/
];

let snowScene = new THREE.Scene(),
  trackGroup = new THREE.Group(),
  racerGroup = new THREE.Group(),
  axesHelper = new THREE.AxesHelper();
window.scene.add(trackGroup, racerGroup, axesHelper);

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

let x = -0.05,
  racersLeft = 0;
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
  racerMesh.name = racer.name + ' ' + racer.mph + ' true';
  racerGroup.add(racerMesh);
  x += 0.1;
  racersLeft += 1;
}
racerGroup.rotation.set(0.5 * Math.PI, 0, 0, "XYZ");
racerGroup.updateMatrixWorld();

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
setTimeout(() => requestAnimationFrame(step), 2000); //used to see them move during testing

async function updateScene() {
  fetch("http://accona.eecs.utk.edu:8599/store/alpaca/index.json", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(window.scene.toJSON())
  })
    .then(response => response.json())
    .catch(err => console.error("Fetch Error =\n", err));
  if (racersLeft > 0) setTimeout(updateScene, 1000/60);
}

function step() {
  let racerCount = 0;
  for (let racer of racerGroup.children) {
    let racerInfo = racer.name.split(' '),
      speed = parseFloat(racerInfo[racerInfo.length - 2]),
      stillRacing = (racerInfo[racerInfo.length - 1] === "true");
    if (stillRacing && racer.position.y > (-4 * size + size / 10)) {
      racer.position.y -= speed / 0.681818 / 60 / 100; // mph to feet per second to feet per frame to Three.js distance per frame
    } else {
      racer.position.y = - 4 * size + size / 10;
      racer.name = racer.name.replace('true', 'false');
    }
    if (stillRacing) racerCount += 1;
  }
  racersLeft = racerCount;
  (racersLeft > 0) ? requestAnimationFrame(step) : setTimeout(updateScene, 1000/60);
}