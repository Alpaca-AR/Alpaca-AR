document.body.appendChild(document.createElement('script')).src = 
	'https://threejs.org/build/three.min.js';

const watchDefaultConfig = { attributes: true, childList: true, subtree: true };
function watch(element, callback, config=watchDefaultConfig, delay=1000) {
	const func = callback.bind(null, element),
	      wait = delay,
	      immediate = true,
	      debounced = debounce(func, wait, immediate),
	      observer = new MutationObserver(debounced);
	observer.observe(element, config);
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

const id = setInterval(() => {
	if (!window.THREE) {
		return;
	}

	const textureLoader = new THREE.TextureLoader();
	const loadTexture = (src) => {
		let _resolve, _reject;
		const promise = new Promise((resolve, reject) => {
			_resolve = resolve;
			_reject = reject;
		});
		const texture = textureLoader.load(src, (...args) => {
			if (_resolve) _resolve(...args);
		}, undefined, (...args) => {
			if (_reject) _reject(...args);
		});
		
		return { promise, texture };
	};
	
	clearInterval(id);
	
	main();
}, 100);

function main() {
	watch(document.querySelector('.npmap-map .leaflet-tile-pane > .leaflet-layer:nth-child(1) > .leaflet-tile-container'), async (element) => {
		const images = Array.from(element.querySelectorAll('img.leaflet-tile'));
		const promises = [];
		const group = new THREE.Group();
		for (let image of images) {
			const transform = image.style.transform,
			      match = /translate3d\((-?\d+)px, (-?\d+)px, (-?\d+)px\)/.exec(transform),
			      x = (-256 + +match[1]) / 256,
			      y = (-256 + +match[2]) / -256,
			      z = +match[3] / 256;
			console.log({ x, y, z });
			
			const { promise, texture } = loadTexture(image.src);
			promises.push(promise);

			const material = new THREE.MeshBasicMaterial({
				map: texture,
				side: THREE.DoubleSide,
			});
			
			const scale = 1,
			      geometry = new THREE.PlaneBufferGeometry(scale, scale);
			
			const mesh = new THREE.Mesh(geometry, material);
			
			mesh.position.set(x, y, z);
			mesh.updateMatrixWorld();
			
			group.add(mesh);
		}
		
		group.scale.set(0.1, 0.1, 0.1);
		group.updateMatrixWorld();
		
		await Promise.all(promises);
		
		await fetch('http://localhost:8080/store/alpaca/index.json', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(group.toJSON()),
		}).then((res) => {
			return res.json();
		}).then((json) => {
			console.log(json);
		});
	});
}, 100);

/*
 > img.leaflet-tile', (images) => {
	const objects = images.map((image) => {
		const transform = image.style.transform,
		      match = /translate3d\((-?\d+)px, (-?\d+)px, (-?\d+)px\)/.exec(transform),
		      x = (-256 + +match[1]) / 256,
		      y = (-256 + +match[2]) / -256,
		      z = +match[3] / 256;

		return { image: image.src, x, y, z };
	});

	return { objects, rotationX: -90, scale: 256/800 };
});

driver.watch('.npmap-map .leaflet-tile-pane > .leaflet-layer:nth-child(2) > .leaflet-tile-container > img.leaflet-tile', (images) => {
	const objects = images.map((image) => {
		const transform = image.style.transform,
		      match = /translate3d\((-?\d+)px, (-?\d+)px, (-?\d+)px\)/.exec(transform),
		      x = (-256 + +match[1]) / 256,
		      y = (-256 + +match[2]) / -256,
		      z = +match[3] / 256;
		return { image: image.src, x, y, z, useGeometryShader: true };
	});

	return { objects, rotationX: -90, scale: 256/800 };
});
*/

/*
const smallCanvas = document.createElement('canvas');
//document.body.appendChild(smallCanvas);
smallCanvas.width = smallCanvas.height = 256;
const ctx = smallCanvas.getContext('2d');

driver.watch('#map canvas.leaflet-heatmap-layer', (layers) => {
	const objects = layers.map((layer) => {
		const transform = layer.style.transform,
		      match = /translate3d\((-?\d+)px, (-?\d+)px, (-?\d+)px\)/.exec(transform),
		      x = +match[1] / 800,
		      y = +match[2] / 800,
		      z = .1;

		ctx.resetTransform();
		ctx.clearRect(0, 0, +smallCanvas.width, +smallCanvas.height);
		ctx.fillStyle = 'rgba(0, 0, 0, 0)';
		ctx.fillRect(0, 0, +smallCanvas.width, +smallCanvas.height);
		ctx.setTransform(+smallCanvas.width / +layer.width, 0, 0, +smallCanvas.height / +layer.height, 0, 0);
		ctx.drawImage(layer, 0, 0);

		const image = smallCanvas.toDataURL('image/png');

		return { image, x, y, z, useGeometryShader: true };
	});

	return { objects, rotationX: -90, scale: 1 };
});
*/
