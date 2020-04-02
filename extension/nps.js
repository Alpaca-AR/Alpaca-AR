const url = "http://127.0.0.1:8123",
  mapSelector =
    ".npmap-map .leaflet-tile-pane > .leaflet-layer:nth-child(1) > .leaflet-tile-container:last-child",
  speciesSelector =
    ".npmap-map .leaflet-tile-pane > .leaflet-layer:nth-child(2) > .leaflet-tile-container:last-child";

document.onreadystatechange = () => {
  if (document.readyState === "complete") initNPS();
};

let parentGroup, loadTexture;

function initNPS() {
  const id = setInterval(() => {
    if (!window.THREE) return;

    THREE.Cache.enabled = true;
    THREE.ImageUtils.getDataURL = fakeGetDataURL;
    function fakeGetDataURL(image) {
      return image.src;
    }

    const textureLoader = new THREE.TextureLoader();
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
    };

    clearInterval(id);

    parentGroup = new THREE.Group();
    main();
  }, 100);
}

async function updateNamespaceObject() {
  return fetch(url + "/store/alpaca/index.json", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(parentGroup.toJSON())
  })
    .then(response => response.json())
    .catch(err => console.error("Fetch Error =\n", err));
}

function main() {
  let watching = false,
    species = null;
  (function setSpeciesWatcher() {
    let container = document.querySelector(speciesSelector);
    if (container && !watching) {
      species = Alpaca.watch(
        document.querySelector(".npmap-map .leaflet-tile-pane"),
        speciesWatcher
      );
      watching = true;
    } else if (!container && watching) {
      if (species !== null) {
        species.disconnect();
        species = null;
      }
      watching = false;
      for (let i = 0; i < parentGroup.children.length; i++) {
        if (parentGroup.children[i].name === "species")
          parentGroup.remove(parentGroup.children[i]);
      }
      updateNamespaceObject();
    }
    setTimeout(setSpeciesWatcher, 250);
  })();

  Alpaca.watch(
    document.querySelector(".npmap-map .leaflet-tile-pane"),
    mapWatcher
  );

  let mapLayer = document.querySelector(mapSelector),
    speciesLayer = document.querySelector(speciesSelector);

  if (mapLayer) mapWatcher(mapLayer);
  if (speciesLayer) speciesWatcher();
}

async function mapWatcher(element) {
  element = document.querySelector(mapSelector);
  if (!element) return;
  const images = Array.from(element.querySelectorAll("img.leaflet-tile"));
  if (images.length == 0)
    return setTimeout(() => {
      let el = document.querySelector(mapSelector);
      if (el) mapWatcher(el);
    }, 500);
  const promises = [];
  let mapGroup = new THREE.Group();
  let minX = 100,
    minY = 100,
    maxX = -100,
    maxY = -100,
    tiles = {};

  const scale = 1,
    segments = 128,
    geometry = new THREE.PlaneBufferGeometry(scale, scale, segments, segments);
  for (let image of images) {
    if (image.src.startsWith("data")) continue;
    const x = Math.floor(parseInt(image.style.left) / 256),
      y = -Math.floor(parseInt(image.style.top) / 256),
      z = 0;
    //console.log({ xi: parseInt(image.style.left), yi: parseInt(image.style.top), x, y });

    tiles[x + ", " + y] = true;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;

    const { promise, texture } = loadTexture(image.src);
    promises.push(promise);

    // https://atlas-stg.geoplatform.gov/styles/v1/atlas-user/ck58pyquo009v01p99xebegr9/tiles/256/10/278/402@2x?access_token=pk.eyJ1IjoiYXRsYXMtdXNlciIsImEiOiJjazFmdGx2bjQwMDAwMG5wZmYwbmJwbmE2In0.lWXK2UexpXuyVitesLdwUg
    // http://a.tiles.mapbox.com/v4/mapbox.terrain-rgb/10/278/402.pngraw?access_token=pk.eyJ1IjoibnBzIiwiYSI6IkdfeS1OY1UifQ.K8Qn5ojTw4RV1GwBlsci-Q

    let coords;
    if (!coords) coords = image.src.match(/tiles\/256\/(\d+\/\d+\/\d+)/);
    if (!coords) coords = image.src.match(/v4\/[^/]+\/(\d+\/\d+\/\d+)/);
    const heightUrl = `https://a.tiles.mapbox.com/v4/mapbox.terrain-rgb/${coords[1]}.pngraw?access_token=pk.eyJ1IjoibnBzIiwiYSI6IkdfeS1OY1UifQ.K8Qn5ojTw4RV1GwBlsci-Q`;

    const { promise: promise2, texture: texture2 } = loadTexture(heightUrl);
    promises.push(promise2);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTextureMap: { value: texture },
        uHeightMap: { value: texture2 }
      },
      vertexShader: `
        varying vec2 vUv;
        uniform sampler2D uTextureMap;
        uniform sampler2D uHeightMap;
        float lookup(vec2 uv) {
        	// Thanks https://www.mapbox.com/help/access-elevation-data/
        	// height(meters) = -10000 + ((R * 256 * 256 + G * 256 + B) * 0.1)
        	vec4 hc = texture2D(uHeightMap, uv);
        	float height = -10000.0 + ((hc.r * 256.0 * 256.0 + hc.g * 256.0 + hc.b) * 0.1) + 9960.0;
        	return height;
        }
        void main() {
        	vUv = uv;
        	float away = 2.;
        	float height =
        		lookup(vec2(uv.s, uv.t)) +
        		lookup(vec2(uv.s - away/256., uv.t - away/256.)) +
        		lookup(vec2(uv.s - 0./256., uv.t - away/256.)) +
        		lookup(vec2(uv.s + away/256., uv.t - away/256.)) +
        		lookup(vec2(uv.s + away/256., uv.t - 0./256.)) +
        		lookup(vec2(uv.s + away/256., uv.t + away/256.)) +
        		lookup(vec2(uv.s - 0./256., uv.t + away/256.)) +
        		lookup(vec2(uv.s - away/256., uv.t + away/256.)) +
        		lookup(vec2(uv.s - away/256., uv.t + 0./256.));
        	height /= 9.;
        	gl_Position = projectionMatrix * modelViewMatrix * vec4(position + 0.1 * height * normal, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uTextureMap;
        varying vec2 vUv;
        void main() {
        	gl_FragColor = texture2D(uTextureMap, vUv);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(x, y, z);
    mesh.updateMatrixWorld();

    mapGroup.add(mesh);
  }

  let error = loadTexture(url + "/img/wood.jpg"),
    wood = loadTexture(url + "/img/wood.jpg");

  promises.push(error.promise);
  promises.push(wood.promise);

  const width = maxX - minX + 3,
    height = maxY - minY + 3,
    tileCount = width * height;
  let currentX, currentY;
  for (let i = 0; i < tileCount; i++) {
    currentX = minX - 1 + (i % width);
    currentY = maxY + 1 - Math.floor(i / width);
    const material = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide
    });

    const scale = 1,
      geometry = new THREE.PlaneBufferGeometry(scale, scale);

    let tile = new THREE.Mesh(geometry, material);
    tile.position.set(currentX, currentY, 0);
    if (
      currentX >= minX &&
      currentX <= maxX &&
      currentY >= minY &&
      currentY <= maxY &&
      tiles[currentX + ", " + currentY] !== true
    ) {
      const material = new THREE.MeshBasicMaterial({
          map: error.texture,
          color: 0xffffff,
          side: THREE.DoubleSide
        }),
        geometry = new THREE.PlaneBufferGeometry(scale, scale);

      let errorTile = new THREE.Mesh(geometry, material);
      errorTile.position.set(currentX, currentY, 0.01);
      mapGroup.add(errorTile);
    }

    tile.material.map = wood.texture;
    tile.updateMatrixWorld();
    mapGroup.add(tile);
  }

  mapGroup.scale.set(0.1, 0.1, 0.1);
  mapGroup.updateMatrixWorld();

  await Promise.all(promises.map(d => d.catch(() => undefined))).catch(e =>
    console.log(e)
  );

  for (let i = 0; i < parentGroup.children.length; i++) {
    if (parentGroup.children[i].name === "map")
      parentGroup.remove(parentGroup.children[i]);
  }

  mapGroup.name = "map";
  parentGroup.add(mapGroup);

  speciesWatcher();
}

async function speciesWatcher() {
  let elements = document.querySelectorAll(speciesSelector);
  if (!elements) return;
  for (let i = 0; i < parentGroup.children.length; i++) {
    if (parentGroup.children[i].name === "species")
      parentGroup.remove(parentGroup.children[i]);
  }
  for (let element of elements) {
    const images = Array.from(element.querySelectorAll("img.leaflet-tile"));
    if (images.length == 0)
      return setTimeout(() => {
        let el = document.querySelector(speciesSelector);
        if (el) speciesWatcher(el);
      }, 500);
    const promises = [];
    let speciesGroup = new THREE.Group();

    const scale = 1,
      segments = 128,
      geometry = new THREE.PlaneBufferGeometry(
        scale,
        scale,
        segments,
        segments
      );
    for (let image of images) {
      if (image.src.startsWith("data")) continue;
      const x = Math.floor(parseInt(image.style.left) / 256),
        y = -Math.floor(parseInt(image.style.top) / 256),
        z = 0;
      //console.log({ xi: parseInt(image.style.left), yi: parseInt(image.style.top), x, y });

      const { promise, texture } = loadTexture(image.src);
      promises.push(promise);

      // https://atlas-stg.geoplatform.gov/styles/v1/atlas-user/ck58pyquo009v01p99xebegr9/tiles/256/10/278/402@2x?access_token=pk.eyJ1IjoiYXRsYXMtdXNlciIsImEiOiJjazFmdGx2bjQwMDAwMG5wZmYwbmJwbmE2In0.lWXK2UexpXuyVitesLdwUg
      // http://a.tiles.mapbox.com/v4/mapbox.terrain-rgb/10/278/402.pngraw?access_token=pk.eyJ1IjoibnBzIiwiYSI6IkdfeS1OY1UifQ.K8Qn5ojTw4RV1GwBlsci-Q
  
      let coords;
      if (!coords) coords = image.src.match(/tiles\/256\/(\d+\/\d+\/\d+)/);
      if (!coords) coords = image.src.match(/v4\/[^/]+\/(\d+\/\d+\/\d+)/);
      const heightUrl = `https://a.tiles.mapbox.com/v4/mapbox.terrain-rgb/${coords[1]}.pngraw?access_token=pk.eyJ1IjoibnBzIiwiYSI6IkdfeS1OY1UifQ.K8Qn5ojTw4RV1GwBlsci-Q`;
  
      const { promise: promise2, texture: texture2 } = loadTexture(heightUrl);
      promises.push(promise2);

      const material = new THREE.ShaderMaterial({
        uniforms: {
          uTextureMap: { value: texture },
          uHeightMap: { value: texture2 }
        },
        vertexShader: `
          varying vec2 vUv;
          varying float vValue;
          uniform sampler2D uTextureMap;
          uniform sampler2D uHeightMap;
          const float cLevel0 = 50./255.;
          const float cValue0 = 0.;
          const float cLevel1 = 150./255.;
          const float cValue1 = .75;
          const float cLevel2 = 230./255.;
          const float cValue2 = .5;
          const float cValue3 = .25;
          float lookup(vec2 uv) {
          	vec4 tex = texture2D(uTextureMap, uv);
          	float val = tex.r < cLevel0 ? cValue0 :
          	            tex.r < cLevel1 ? cValue1 :
          	            tex.r < cLevel2 ? cValue2 :
          	                              cValue3;
          	return val;
          }
        float lookup2(vec2 uv) {
        	// Thanks https://www.mapbox.com/help/access-elevation-data/
        	// height(meters) = -10000 + ((R * 256 * 256 + G * 256 + B) * 0.1)
        	vec4 hc = texture2D(uHeightMap, uv);
        	float height = -10000.0 + ((hc.r * 256.0 * 256.0 + hc.g * 256.0 + hc.b) * 0.1) + 9960.0;
        	return height;
        }
          void main() {
          	vUv = uv;
          	float away = 2.;
          	float val =
          		lookup(vec2(uv.s, uv.t)) +
          		lookup(vec2(uv.s - away/256., uv.t - away/256.)) +
          		lookup(vec2(uv.s - 0./256., uv.t - away/256.)) +
          		lookup(vec2(uv.s + away/256., uv.t - away/256.)) +
          		lookup(vec2(uv.s + away/256., uv.t - 0./256.)) +
          		lookup(vec2(uv.s + away/256., uv.t + away/256.)) +
          		lookup(vec2(uv.s - 0./256., uv.t + away/256.)) +
          		lookup(vec2(uv.s - away/256., uv.t + away/256.)) +
          		lookup(vec2(uv.s - away/256., uv.t + 0./256.));
          	val /= 9.;
        	float height =
        		lookup2(vec2(uv.s, uv.t)) +
        		lookup2(vec2(uv.s - away/256., uv.t - away/256.)) +
        		lookup2(vec2(uv.s - 0./256., uv.t - away/256.)) +
        		lookup2(vec2(uv.s + away/256., uv.t - away/256.)) +
        		lookup2(vec2(uv.s + away/256., uv.t - 0./256.)) +
        		lookup2(vec2(uv.s + away/256., uv.t + away/256.)) +
        		lookup2(vec2(uv.s - 0./256., uv.t + away/256.)) +
        		lookup2(vec2(uv.s - away/256., uv.t + away/256.)) +
        		lookup2(vec2(uv.s - away/256., uv.t + 0./256.));
        	height /= 9.;
          	vValue = val;
          	gl_Position = projectionMatrix * modelViewMatrix * vec4(position + (0.1 * height) * normal, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D uTextureMap;
          varying vec2 vUv;
          varying float vValue;
          void main() {
          	if (vValue < 0.1) discard;
          	float away = 2.;
          	vec4 color =
          		texture2D(uTextureMap, vec2(vUv.s, vUv.t)) +
          		texture2D(uTextureMap, vec2(vUv.s - away/256., vUv.t - away/256.)) +
          		texture2D(uTextureMap, vec2(vUv.s - 0./256., vUv.t - away/256.)) +
          		texture2D(uTextureMap, vec2(vUv.s + away/256., vUv.t - away/256.)) +
          		texture2D(uTextureMap, vec2(vUv.s + away/256., vUv.t - 0./256.)) +
          		texture2D(uTextureMap, vec2(vUv.s + away/256., vUv.t + away/256.)) +
          		texture2D(uTextureMap, vec2(vUv.s - 0./256., vUv.t + away/256.)) +
          		texture2D(uTextureMap, vec2(vUv.s - away/256., vUv.t + away/256.)) +
          		texture2D(uTextureMap, vec2(vUv.s - away/256., vUv.t + 0./256.));
          		
          	gl_FragColor = color / vec4(9.);
          }
        `,
        transparent: true,
        side: THREE.DoubleSide
      });

      const mesh = new THREE.Mesh(geometry, material);

      mesh.position.set(x, y, z);
      mesh.updateMatrixWorld();

      speciesGroup.add(mesh);
    }

    speciesGroup.scale.set(0.1, 0.1, 0.1);
    speciesGroup.position.z = 1.0 /* millimeters */ / 1000.0;
    speciesGroup.updateMatrixWorld();

    await Promise.all(promises.map(d => d.catch(() => undefined))).catch(e =>
      console.log(e)
    );

    speciesGroup.name = "species";
    parentGroup.add(speciesGroup);
  }
  updateNamespaceObject();
}
