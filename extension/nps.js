document.body.appendChild(document.createElement("script")).src =
  "https://threejs.org/build/three.min.js";

const url = navigator.userAgent.includes('X11') ? "http://accona.eecs.utk.edu:8800" : "http://accona.eecs.utk.edu:8599",
  mapSelector =
    ".npmap-map .leaflet-tile-pane > .leaflet-layer:nth-child(1) > .leaflet-tile-container:last-child",
  speciesSelector =
    ".npmap-map .leaflet-pane > .leaflet-tile-pane > .leaflet-layer:nth-child(n+2)",
  watchDefaultConfig = { attributes: true, childList: true, subtree: true };

function watch(element, callback, config = watchDefaultConfig, delay = 1000) {
  const func = callback.bind(null, element),
    wait = delay,
    immediate = false,
    debounced = debounce(func, wait, immediate),
    observer = new MutationObserver(debounced);
  observer.observe(element, config);
  return observer;
}

function debounce(func, wait, immediate) {
  let timeout;
  return function() {
    let context = this,
      args = arguments;
    clearTimeout(timeout);
    if (immediate && !timeout) func.apply(context, args);
    timeout = setTimeout(function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    }, wait);
  };
}

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
      species = watch(
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

  watch(document.querySelector(".npmap-map .leaflet-tile-pane"), mapWatcher);

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
  for (let image of images) {
    if (image.src.startsWith("data")) continue;
    const transform = image.style.transform,
      match = /translate3d\((-?\d+)px, (-?\d+)px, (-?\d+)px\)/.exec(transform),
      x = (-256 + +match[1]) / 256,
      y = (-256 + +match[2]) / -256,
      z = +match[3] / 256;

    tiles[x + ", " + y] = true;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;

    const { promise, texture } = loadTexture(image.src);
    promises.push(promise);

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide
    });

    const scale = 1,
      geometry = new THREE.PlaneBufferGeometry(scale, scale);

    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(x, y, z);
    mesh.updateMatrixWorld();

    mapGroup.add(mesh);
  }

  const { promise, texture } = loadTexture(
    url + "/img/512x512.png"
  );
  promises.push(promise);

  const width = maxX - minX + 3,
    height = maxY - minY + 3,
    tileCount = width * height;
  let currentX, currentY;
  for (let i = 0; i < tileCount; i++) {
    currentX = minX - 1 + (i % width);
    currentY = maxY + 1 - Math.floor(i / width);
    if (tiles[currentX + ", " + currentY] !== true) {
      const material = new THREE.MeshBasicMaterial({
        color: 0x191919,
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
        currentY <= maxY
      ) {
        tile.material.map = texture;
        tile.material.color.setRGB(1, 1, 1);
      }
      tile.updateMatrixWorld();
      mapGroup.add(tile);
    }
  }

  mapGroup.scale.set(0.1, 0.1, 0.1);
  mapGroup.updateMatrixWorld();

  await Promise.all(promises).catch(e => console.log(e));

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
    for (let image of images) {
      if (image.src.startsWith("data")) continue;
      const transform = image.style.transform,
        match = /translate3d\((-?\d+)px, (-?\d+)px, (-?\d+)px\)/.exec(
          transform
        ),
        x = (-256 + +match[1]) / 256,
        y = (-256 + +match[2]) / -256,
        z = +match[3] / 256;

      const { promise, texture } = loadTexture(image.src);
      promises.push(promise);

      const material = new THREE.ShaderMaterial({
        uniforms: {
          uTextureMap: { value: texture },
        },
        vertexShader: `
          varying vec2 vUv;
          varying float vValue;
          uniform sampler2D uTextureMap;
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
          	// = tex.a;
          	vValue = val;
          	gl_Position = projectionMatrix * modelViewMatrix * vec4(position + 0.2 * val * normal, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D uTextureMap;
          varying vec2 vUv;
          varying float vValue;
          void main() {
          	//if (vValue < 0.1) discard;
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
      });

      const scale = 1,
        geometry = new THREE.PlaneBufferGeometry(scale, scale);

      const mesh = new THREE.Mesh(geometry, material);

      mesh.position.set(x, y, z);
      mesh.updateMatrixWorld();

      speciesGroup.add(mesh);
    }

    speciesGroup.scale.set(0.1, 0.1, 0.1);
    speciesGroup.position.z = 0.1;
    speciesGroup.updateMatrixWorld();

    await Promise.all(promises).catch(e => console.log(e));

    speciesGroup.name = "species";
    parentGroup.add(speciesGroup);
  }
  updateNamespaceObject();
}
