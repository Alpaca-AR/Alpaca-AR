(async () => {
  const host = navigator.userAgent.includes("X11")
    ? "accona.eecs.utk.edu:8800"
    : "accona.eecs.utk.edu:8599";
  Alpaca.configure({ host });

  let racers = [
    {
      name: "Luge",
      mph: 81.3
    },
    /*
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
*/ {
      name: "Cross-country skier",
      mph: 17.1
    }
    /*  {
      name: "Curler",
      mph: 11.0
    }
  */
  ];

  let trackGroup = new THREE.Group(),
    racerGroup = new THREE.Group();
  window.scene.add(trackGroup, racerGroup);

  let textureLoader = new THREE.TextureLoader(),
    loadTexture = src => {
      let _resolve, _reject;
      const promise = new Promise((resolve, reject) => {
        _resolve = resolve;
        _reject = reject;
      });
      const texture = textureLoader.load(
        src,
        (...args) => {
          if (_resolve) _resolve(...args);
        },
        undefined,
        (...args) => {
          if (_reject) _reject(...args);
        }
      );

      return { promise, texture };
    },
    objLoader = new THREE.OBJLoader2(),
    loadObj = src => {
      let _resolve, _reject;
      const promise = new Promise((resolve, reject) => {
        _resolve = resolve;
        _reject = reject;
      });
      const onLoad = (...args) => {
        console.log("load", args);
        if (_resolve) _resolve(...args);
        else setTimeout(() => onLoad(...args), 50);
      };
      const onError = (...args) => {
        if (_reject) _reject(...args);
        else setTimeout(() => onError(...args), 50);
      };
      const obj = objLoader.load(src, onLoad, undefined, onError);
      return promise;
    };

  let promises = [];
  let poles = loadTexture("../img/checkerboard.jpg"),
    start = loadTexture("../img/start.jpg"),
    finish = loadTexture("../img/finish.jpg");
  snowFlat = loadTexture("../img/snow-flat.jpg");
  promises.push(poles.promise, start.promise, finish.promise, snowFlat.promise);

  let groundGeometry = new THREE.PlaneBufferGeometry(0.5 * 2, 0.5 * 4),
    groundMaterial = new THREE.MeshBasicMaterial({
      map: snowFlat.texture,
      side: THREE.DoubleSide
    }),
    groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);

  trackGroup.rotation.set(0.5 * Math.PI, 0, 0, "XYZ");
  trackGroup.updateMatrixWorld();
  groundMesh.position.set(0, -1, 0.0001);
  groundMesh.updateMatrixWorld();
  trackGroup.add(groundMesh);

  let x = -0.05,
    racersLeft = 0;
  const racerMeshBase = (await loadObj("/obj/person.obj")).detail
    .loaderRootNode;
  for (let racer of racers) {
    const racerMesh = racerMeshBase.clone();
    racerMesh.position.set(x, -0.05, -0.0125);
    racerMesh.updateMatrixWorld();
    racerMesh.name = racer.name + " " + racer.mph + " true";
    racerGroup.add(racerMesh);
    x += 0.1;
    racersLeft += 1;
  }
  racerGroup.rotation.set(0.5 * Math.PI, 0, 0, "XYZ");
  racerGroup.updateMatrixWorld();

  poles.texture.wrapS = THREE.RepeatWrapping;
  poles.texture.wrapT = THREE.RepeatWrapping;
  poles.texture.repeat.set(3, 3);

  start.texture.flipY = true;
  finish.texture.flipY = true;

  let poleGeometry = new THREE.CylinderGeometry(0.025, 0.05, 0.25),
    poleMaterial = new THREE.MeshBasicMaterial({
      map: poles.texture,
      side: THREE.DoubleSide,
      color: 0xffffff
    }),
    poleMesh = new THREE.Mesh(poleGeometry, poleMaterial);
  poleMesh.rotation.set(-0.5 * Math.PI, 0, 0, "XYZ");

  let startRightPoleMesh = poleMesh.clone();
  startRightPoleMesh.position.set(0.15, -0.1, -0.125);
  startRightPoleMesh.updateMatrixWorld();

  let startLeftPoleMesh = poleMesh.clone();
  startLeftPoleMesh.position.set(-0.15, -0.1, -0.125);
  startLeftPoleMesh.updateMatrixWorld();

  let finishRightPoleMesh = poleMesh.clone();
  finishRightPoleMesh.position.set(0.15, -1.9, -0.125);
  finishRightPoleMesh.updateMatrixWorld();

  let finishLeftPoleMesh = poleMesh.clone();
  finishLeftPoleMesh.position.set(-0.15, -1.9, -0.125);
  finishLeftPoleMesh.updateMatrixWorld();

  let startBannerGeometry = new THREE.BoxBufferGeometry(0.3, 0.01, 0.05),
    startBannerMaterial = new THREE.MeshBasicMaterial({
      map: start.texture,
      color: 0xf8f8ff
    }),
    startBannerMesh = new THREE.Mesh(startBannerGeometry, startBannerMaterial);

  startBannerMesh.scale.set(-1, -1, 1);
  startBannerMesh.position.set(0, -0.1, -0.2249);
  startBannerMesh.updateMatrixWorld();

  let finishBannerGeometry = new THREE.BoxBufferGeometry(0.3, 0.01, 0.5 / 10),
    finishBannerMaterial = new THREE.MeshBasicMaterial({
      map: finish.texture,
      color: 0xf8f8ff
    }),
    finishBannerMesh = new THREE.Mesh(
      finishBannerGeometry,
      finishBannerMaterial
    );

  finishBannerMesh.scale.set(-1, -1, 1);
  finishBannerMesh.position.set(0, -1.9, -0.2249);
  finishBannerMesh.updateMatrixWorld();

  let barrierGeometry = new THREE.PlaneBufferGeometry(0.05, 1.8),
    barrierMaterial = new THREE.MeshBasicMaterial({
      color: 0x990000,
      side: THREE.DoubleSide
    }),
    barrierMesh = new THREE.Mesh(barrierGeometry, barrierMaterial);
  barrierMesh.rotation.set(0, Math.PI * 0.5, 0, "XYZ");

  let rightBarrierMesh = barrierMesh.clone();
  rightBarrierMesh.position.set(0.15, -1, -0.025);
  rightBarrierMesh.updateMatrixWorld();

  let leftBarrierMesh = barrierMesh.clone();
  leftBarrierMesh.position.set(-0.15, -1, -0.025);
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

  await Promise.all(promises).catch(d => console.error(d));

  updateScene();
  setTimeout(() => requestAnimationFrame(step), 2000); //used to see them move during testing

  async function updateScene() {
    Alpaca.update(
      "application/json",
      JSON.stringify(window.scene.toJSON()),
      "alpaca",
      "index.json"
    )
      .then(response => response.json())
      .catch(err => console.error("Fetch Error =\n", err));

    if (racersLeft > 0) setTimeout(updateScene, 1000 / 60);
  }

  function step() {
    let racerCount = 0;
    for (let racer of racerGroup.children) {
      let racerInfo = racer.name.split(" "),
        speed = parseFloat(racerInfo[racerInfo.length - 2]),
        stillRacing = racerInfo[racerInfo.length - 1] === "true";
      if (stillRacing && racer.position.y > -1.95) {
        racer.position.y -= speed / 0.681818 / 60 / 100; // mph to feet per second to feet per frame to Three.js distance per frame
      } else {
        racer.position.y = -1.95;
        racer.name = racer.name.replace("true", "false");
      }
      if (stillRacing) racerCount += 1;
    }
    racersLeft = racerCount;
    racersLeft > 0
      ? requestAnimationFrame(step)
      : setTimeout(updateScene, 1000 / 60);
  }
})();
