const host = navigator.userAgent.includes("X11")
    ? "accona.eecs.utk.edu:8800"
    : "accona.eecs.utk.edu:8599",
  bookPageSelector = ".pageImageDisplay > div:nth-child(3) > img",
  viewport = document.querySelector("#viewport");

let leftArrow, rightArrow;

let port = chrome.runtime.connect();

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

    const arrowMaterial = new THREE.MeshNormalMaterial({
        side: THREE.DoubleSide
      }),
      rightArrowGeometry = new THREE.Geometry(),
      leftArrowGeometry = new THREE.Geometry(),
      r1 = new THREE.Vector3(0.5, 0, 0),
      r2 = new THREE.Vector3(1, 0.5, 0),
      r3 = new THREE.Vector3(0.5, 1, 0),
      l1 = new THREE.Vector3(-0.5, 0, 0),
      l2 = new THREE.Vector3(-1, 0.5, 0),
      l3 = new THREE.Vector3(-0.5, 1, 0);

    rightArrowGeometry.vertices.push(r1, r2, r3);
    rightArrowGeometry.faces.push(new THREE.Face3(0, 1, 2));
    rightArrowGeometry.computeFaceNormals();
    rightArrow = new THREE.Mesh(rightArrowGeometry, arrowMaterial);
    rightArrow.scale.set(0.1, 0.1, 1);

    leftArrowGeometry.vertices.push(l1, l2, l3);
    leftArrowGeometry.faces.push(new THREE.Face3(0, 1, 2));
    leftArrowGeometry.computeFaceNormals();
    leftArrow = new THREE.Mesh(leftArrowGeometry, arrowMaterial);
    leftArrow.scale.set(0.1, 0.1, 1);

    Alpaca.configure({ host, prefix: "store" });
    Alpaca.addEventListener(
      "press",
      leftArrow,
      () => click(document.getElementById(":g")),
      "alpaca"
    );
    Alpaca.addEventListener(
      "press",
      rightArrow,
      () => click(document.getElementById(":h")),
      "alpaca"
    );

    bookGroup = new THREE.Group();
    bookGroupParent = new THREE.Group();
    Alpaca.watch(viewport, bookWatcher);
    bookWatcher(viewport);
  }, 100);
}

function click(element) {
  event = document.createEvent("MouseEvents");
  event.initEvent("mousedown", true, false);
  element.dispatchEvent(event, true);
  event = document.createEvent("MouseEvents");
  event.initEvent("mouseup", true, false);
  element.dispatchEvent(event, true);
}

async function updateStore() {
  let bookGroupJSON = JSON.stringify(bookGroupParent.toJSON());
  port.postMessage({ setStorage: bookGroupJSON, key: "books" });
  return Alpaca.update(
    "application/json",
    bookGroupJSON,
    "alpaca",
    "index.json"
  );
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
  port.postMessage({ getStorage: true, key: "books" });
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

  let right = 0;
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

    if ((width * scale) / 2 > right) right = (width * scale) / 2;
    mesh.position.set(left * scale, (bottom - parentTop + range) * scale, 0);
    mesh.updateMatrixWorld();

    bookGroup.add(mesh);
  }

  let tempRightArrow = rightArrow.clone(),
    tempLeftArrow = leftArrow.clone();

  tempRightArrow.position.setX(right);
  tempLeftArrow.position.setX(-right);

  bookGroup.add(tempRightArrow, tempLeftArrow);

  bookGroup.name = location.href;

  for (let i = 0, n = bookGroupParent.children.length; i < n; i++) {
    if (
      typeof bookGroupParent.children[i] !== "undefined" &&
      bookGroupParent.children[i].name == location.href
    )
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
