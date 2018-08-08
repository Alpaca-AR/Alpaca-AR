document.body.appendChild(document.createElement("script")).src =
  "https://threejs.org/build/three.min.js";

const url = true ? "http://accona.eecs.utk.edu:8599" : "http://localhost:8080",
  bookPageSelector = ".pageImageDisplay > div:nth-child(3) > img",
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
  if (document.readyState === "complete") initGoogleBooks();
};

let bookGroup, loadTexture, scale = 1 / 10000;

function initGoogleBooks() {
  const id = setInterval(() => {
    if (!window.THREE) return;



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

    let viewport = document.querySelector("#viewport");
    bookGroup = new THREE.Group();
    watch(viewport, bookWatcher);
    bookWatcher(viewport);
  }, 100);
}

async function updateNamespaceObject() {
  return fetch(url + "/store/alpaca/index.json", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(bookGroup.toJSON())
  })
    .then(response => response.json())
    .catch(err => console.error("Fetch Error =\n", err));
}

async function bookWatcher(element) {
  let images = Array.from(element.querySelectorAll(bookPageSelector));
  if (images.length == 0) return;
  const promises = [];
  clear(bookGroup);
  let bottom = 1000000, top = 0, range = 0;
  for (let image of images) {
    let parentTop = +image.parentNode.parentNode.parentNode.parentNode.style.top.replace('px', '');
    if (parentTop < bottom) bottom = parentTop;
    if (parentTop > top) top = parentTop;
  }
  range = top - bottom; 
  for (let image of images) {
    let parent = image.parentNode.parentNode,
      width = +parent.style.width.replace("px", ""),
      height = +parent.style.height.replace("px", ""),
      left = +parent.parentNode.style.left.replace('px', ''),
      parentParent = parent.parentNode.parentNode,
      parentTop = +parentParent.style.top.replace('px', '');
    const { promise, texture } = loadTexture(image.src);
    promises.push(promise);

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide
    });

    const geometry = new THREE.PlaneBufferGeometry(width * scale, height * scale);

    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(left * scale, (bottom - parentTop + range) * scale, 0);
    mesh.updateMatrixWorld();

    bookGroup.add(mesh);
  }

  await Promise.all(promises).catch(e => console.log(e));

  updateNamespaceObject();
}

function clear(obj) {
	while(obj.children.length) {
		clear(obj.children[0]);
		obj.remove(obj.children[0]);
	}
	if (obj.geometry) {
		obj.geometry.dispose();
		obj.geometry = null;
	}
	if (obj.material && obj.material.map) {
		if (obj.material.map) {
			obj.material.map.dispose();
			obj.material.map = undefined;
		}
		obj.material.dispose();
		obj.material = null;
	}
};
