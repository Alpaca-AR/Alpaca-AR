const url = true ? "http://accona.eecs.utk.edu:8599" : "http://localhost:8080",
  bookPageSelector = ".pageImageDisplay > div:nth-child(3) > img",
  watchDefaultConfig = { attributes: true, childList: true, subtree: true },
  viewport = document.querySelector("#viewport");

let port = chrome.runtime.connect();

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

let bookGroup,
  bookGroupParent,
  loadTexture,
  scale = 1 / 10000;

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

    Alpaca.configure({ host: "accona.eecs.utk.edu:8599", prefix: "store"});
    bookGroup = new THREE.Group();
    bookGroupParent = new THREE.Group();
    watch(viewport, bookWatcher);
    bookWatcher(viewport);
  }, 100);
}

async function updateStore() {
  let bookGroupJSON = JSON.stringify(bookGroupParent.toJSON());
  port.postMessage({ setStorage: bookGroupJSON });
  return Alpaca.update("application/json", bookGroupParent, 'alpaca', 'index.json');
}

let objectLoader = new THREE.ObjectLoader();
port.onMessage.addListener(msg => {
  if (msg.books && Object.keys(msg.books).length !== 0) {
    bookGroupParent = objectLoader.parse(JSON.parse(msg.books));
  } else {
    bookGroupParent = new THREE.Group();
  }
  updateBooks();
});

async function bookWatcher() {
  let images = Array.from(
    document.querySelector("#viewport").querySelectorAll(bookPageSelector)
  );
  if (images.length == 0) return;
  port.postMessage({ getStorage: true });
}

async function updateBooks() {
  const images = Array.from(
      document.querySelector("#viewport").querySelectorAll(bookPageSelector)
    ),
    promises = [];
  clear(bookGroup);
  let bottom = 1000000,
    top = 0,
    range = 0;
  for (let image of images) {
    let parentTop = parseInt(
      image.parentNode.parentNode.parentNode.parentNode.style.top
    );
    if (parentTop < bottom) bottom = parentTop;
    if (parentTop > top) top = parentTop;
  }
  range = top - bottom;

  for (let image of images) {
    let parent = image.parentNode.parentNode,
      width = parseInt(parent.style.width),
      height = parseInt(parent.style.height),
      left = parseInt(parent.parentNode.style.left),
      parentParent = parent.parentNode.parentNode,
      parentTop = parseInt(parentParent.style.top);
    const { promise, texture } = loadTexture(image.src);
    promises.push(promise);

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide
    });

    const geometry = new THREE.PlaneBufferGeometry(
      width * scale,
      height * scale
    );

    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(left * scale, (bottom - parentTop + range) * scale, 0);
    mesh.updateMatrixWorld();

    bookGroup.add(mesh);
  }
  bookGroup.name = location.href;

  for (let i = 0, n = bookGroupParent.children.length; i < n; i++) {
    if (bookGroupParent.children[i].name == location.href)
      bookGroupParent.remove(bookGroupParent.children[i]);
  }

  bookGroupParent.add(bookGroup);
  for (let i = 0, n = bookGroupParent.children.length; i < n; i++) {
    let x = n % 2 ? i - Math.round((n - 1) / 2) : i - (n - 1) / 2;
    bookGroupParent.children[i].position.set(x / 10, 0, 0);
  }
  bookGroupParent.updateMatrixWorld();

  await Promise.all(promises).catch(e => console.log(e));

  updateStore();
}

function clear(obj) {
  while (obj.children.length) {
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
}
