import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { loadModel, tuneCity, makeSign } from "../explore/load.js";

const mount = document.getElementById("world-map");
const pinsHost = document.getElementById("world-pins");
if (!mount || !pinsHost) throw new Error("Missing home map mount");

const DESTINATIONS = [
  { id: "explore", label: "Explore", href: "/explore.html", color: "#ff4ae8", x: 0.6, z: 1.2, y: 4.8 },
  { id: "about", label: "About Me", href: "/explore.html#explore/about", color: "#e0b0ff", x: -7.2, z: -1.4, y: 4.2 },
  { id: "skills", label: "Skills", href: "/explore.html#explore/skills", color: "#c45cff", x: 7.4, z: -0.6, y: 4.4 },
  { id: "games", label: "Games", href: "/explore.html#explore/games", color: "#ff4ae8", x: -1.8, z: -5.6, y: 5.4 },
  { id: "cv", label: "CV", href: "/explore.html#explore/cv", color: "#e0b0ff", x: 5.2, z: -5.8, y: 4.6 },
  { id: "contact", label: "Contact", href: "/explore.html#explore/contact", color: "#ff9cf0", x: -6.4, z: 4.6, y: 3.8 },
];

const BUILDINGS = [
  "/assets/models/kenney/commercial/building-skyscraper-a.glb",
  "/assets/models/kenney/commercial/building-skyscraper-e.glb",
  "/assets/models/kenney/commercial/building-a.glb",
  "/assets/models/kenney/commercial/building-d.glb",
  "/assets/models/kenney/commercial/building-f.glb",
  "/assets/models/kenney/commercial/building-h.glb",
  "/assets/models/kenney/commercial/building-i.glb",
  "/assets/models/kenney/commercial/low-detail-building-wide-a.glb",
  "/assets/models/kenney/commercial/low-detail-building-c.glb",
];

boot().catch(function (error) {
  console.error(error);
  mount.classList.add("is-fallback");
  placeCssPins();
});

async function boot() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (error) {
    mount.classList.add("is-fallback");
    placeCssPins();
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setSize(mount.clientWidth, mount.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.55;
  renderer.setClearColor(0x000000, 0);
  mount.appendChild(renderer.domElement);
  mount.classList.add("is-live");

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x090614, 0.018);

  const camera = new THREE.PerspectiveCamera(38, mount.clientWidth / Math.max(mount.clientHeight, 1), 0.1, 120);
  camera.position.set(14, 13.5, 16);
  camera.lookAt(0, 1.5, 0);

  scene.add(new THREE.AmbientLight(0x9a70c4, 2.1));
  const key = new THREE.DirectionalLight(0xffb0f0, 2.4);
  key.position.set(8, 16, 6);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x9af8ff, 1.7);
  fill.position.set(-10, 10, -4);
  scene.add(fill);
  scene.add(new THREE.HemisphereLight(0xff8ae0, 0x241438, 1.35));
  const rim = new THREE.PointLight(0xff3ec8, 70, 48, 2);
  rim.position.set(0, 8, 0);
  scene.add(rim);
  const cyan = new THREE.PointLight(0x7af0ff, 55, 42, 2);
  cyan.position.set(-4, 6, 6);
  scene.add(cyan);
  const magenta = new THREE.PointLight(0xb14bff, 45, 40, 2);
  magenta.position.set(6, 7, -5);
  scene.add(magenta);

  addStarfield(scene);
  addVoidGlow(scene);

  const city = new THREE.Group();
  scene.add(city);

  const templates = await Promise.all(BUILDINGS.map(function (url) {
    return loadModel(url).then(function (gltf) {
      tuneCity(gltf.scene, false);
      boostGlow(gltf.scene);
      return gltf.scene;
    });
  }));

  const props = await Promise.all([
    loadModel("/assets/models/eh98/lamp.glb"),
    loadModel("/assets/models/eh98/sign.glb"),
    loadModel("/assets/models/eh98/vending.glb"),
  ]).then(function (list) {
    return list.map(function (gltf) {
      tuneCity(gltf.scene, false);
      boostGlow(gltf.scene);
      return gltf.scene;
    });
  }).catch(function () { return []; });

  const islands = [
    { x: 0, z: 0, w: 9.5, d: 8.2, h: 0.55, hue: 0xff3ec8 },
    { x: -8.2, z: -2.2, w: 5.6, d: 5.2, h: 0.7, hue: 0x7af0ff },
    { x: 8.4, z: -1.4, w: 5.8, d: 5.4, h: 0.65, hue: 0xb14bff },
    { x: -2.2, z: -7.2, w: 6.4, d: 5.0, h: 0.8, hue: 0xff3ec8 },
    { x: 5.8, z: -7.0, w: 5.2, d: 4.6, h: 0.7, hue: 0x7af0ff },
    { x: -7.2, z: 4.8, w: 5.0, d: 4.4, h: 0.6, hue: 0xff7ad9 },
  ];

  islands.forEach(function (spec, index) {
    city.add(makeIsland(spec));
    scatterBuildings(city, templates, props, spec, index);
  });

  addBridge(city, islands[0], islands[1]);
  addBridge(city, islands[0], islands[2]);
  addBridge(city, islands[0], islands[3]);
  addBridge(city, islands[3], islands[4]);
  addBridge(city, islands[0], islands[5]);

  const anchors = DESTINATIONS.map(function (dest) {
    const marker = new THREE.Object3D();
    marker.position.set(dest.x, dest.y, dest.z);
    city.add(marker);
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.22, dest.y + 0.4, 10, 1, true),
      new THREE.MeshBasicMaterial({
        color: dest.color,
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    beam.position.set(dest.x, dest.y * 0.5 - 0.1, dest.z);
    city.add(beam);
    const pin = document.createElement("a");
    pin.className = "map-pin";
    pin.href = dest.href;
    pin.style.setProperty("--pin", dest.color);
    pin.innerHTML = "<span class='map-pin-dot'></span><span class='map-pin-label'>" + dest.label + "</span>";
    pinsHost.appendChild(pin);
    return { marker: marker, pin: pin, beam: beam };
  });

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(mount.clientWidth, mount.clientHeight), 0.85, 0.55, 0.35);
  composer.addPass(bloom);

  let dragging = false;
  let lastX = 0;
  let yaw = 0.35;
  let pitch = 0.42;
  const target = new THREE.Vector3(0, 1.4, 0);
  const radius = 22;

  function applyOrbit() {
    camera.position.set(
      target.x + Math.cos(yaw) * Math.cos(pitch) * radius,
      target.y + Math.sin(pitch) * radius,
      target.z + Math.sin(yaw) * Math.cos(pitch) * radius
    );
    camera.lookAt(target);
  }
  applyOrbit();

  mount.addEventListener("pointerdown", function (event) {
    if (event.target.closest(".map-pin, .world-copy, a, button")) return;
    dragging = true;
    lastX = event.clientX;
    mount.setPointerCapture(event.pointerId);
  });
  mount.addEventListener("pointermove", function (event) {
    if (!dragging) return;
    yaw += (event.clientX - lastX) * 0.005;
    lastX = event.clientX;
  });
  mount.addEventListener("pointerup", function () { dragging = false; });
  mount.addEventListener("pointercancel", function () { dragging = false; });

  window.addEventListener("resize", function () {
    const w = mount.clientWidth;
    const h = Math.max(mount.clientHeight, 1);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
    bloom.setSize(w, h);
  });

  const clock = new THREE.Clock();
  function frame() {
    const t = clock.getElapsedTime();
    if (!dragging) yaw += 0.00055;
    city.position.y = Math.sin(t * 0.55) * 0.12;
    anchors.forEach(function (item, index) {
      item.beam.material.opacity = 0.18 + Math.sin(t * 2.2 + index) * 0.08;
      const pos = item.marker.getWorldPosition(new THREE.Vector3());
      pos.project(camera);
      const x = (pos.x * 0.5 + 0.5) * mount.clientWidth;
      const y = (-pos.y * 0.5 + 0.5) * mount.clientHeight;
      const visible = pos.z < 1 && x > -40 && y > -40 && x < mount.clientWidth + 40 && y < mount.clientHeight + 40;
      item.pin.style.display = visible ? "grid" : "none";
      item.pin.style.left = x + "px";
      item.pin.style.top = y + "px";
    });
    applyOrbit();
    composer.render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function boostGlow(root) {
  root.traverse(function (child) {
    if (!child.isMesh) return;
    const list = Array.isArray(child.material) ? child.material : [child.material];
    list.forEach(function (material) {
      if (!material) return;
      if (material.emissiveIntensity != null) {
        material.emissiveIntensity = Math.max(material.emissiveIntensity * 2.8, 2.2);
      }
      if (material.color) material.color.multiplyScalar(1.15);
      material.needsUpdate = true;
    });
  });
}

function makeIsland(spec) {
  const group = new THREE.Group();
  group.position.set(spec.x, 0, spec.z);

  const top = new THREE.Mesh(
    new THREE.BoxGeometry(spec.w, spec.h, spec.d),
    new THREE.MeshStandardMaterial({
      color: 0x1a1228,
      emissive: spec.hue,
      emissiveIntensity: 0.75,
      metalness: 0.45,
      roughness: 0.35,
    })
  );
  top.position.y = 0;
  group.add(top);

  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(spec.w - 0.3, 0.05, spec.d - 0.3),
    new THREE.MeshStandardMaterial({
      color: 0x221433,
      emissive: 0x7af0ff,
      emissiveIntensity: 0.45,
      metalness: 0.6,
      roughness: 0.25,
    })
  );
  deck.position.y = spec.h * 0.5 + 0.02;
  group.add(deck);

  const rim = new THREE.Mesh(
    new THREE.BoxGeometry(spec.w + 0.22, 0.14, spec.d + 0.22),
    new THREE.MeshBasicMaterial({ color: spec.hue, transparent: true, opacity: 0.95 })
  );
  rim.position.y = spec.h * 0.5 + 0.04;
  group.add(rim);

  const under = new THREE.Mesh(
    new THREE.CylinderGeometry(Math.min(spec.w, spec.d) * 0.28, Math.min(spec.w, spec.d) * 0.08, 2.4, 6),
    new THREE.MeshStandardMaterial({
      color: 0x0c0814,
      emissive: 0x7af0ff,
      emissiveIntensity: 0.55,
      flatShading: true,
    })
  );
  under.position.y = -1.4;
  group.add(under);

  for (let i = 0; i < 3; i += 1) {
    const fall = new THREE.Mesh(
      new THREE.PlaneGeometry(0.18 + i * 0.05, 2.8 + i * 0.4),
      new THREE.MeshBasicMaterial({
        color: 0x7af0ff,
        transparent: true,
        opacity: 0.22 - i * 0.04,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    fall.position.set((i - 1) * (spec.w * 0.18), -1.6, spec.d * 0.42);
    group.add(fall);
  }

  return group;
}

function scatterBuildings(city, templates, props, island, seed) {
  const slots = [
    [island.x - island.w * 0.28, island.z - island.d * 0.22],
    [island.x + island.w * 0.24, island.z - island.d * 0.18],
    [island.x - island.w * 0.05, island.z + island.d * 0.2],
    [island.x + island.w * 0.3, island.z + island.d * 0.12],
    [island.x - island.w * 0.18, island.z + island.d * 0.02],
    [island.x + island.w * 0.08, island.z - island.d * 0.02],
  ];
  slots.forEach(function (slot, index) {
    const template = templates[(seed * 3 + index) % templates.length];
    const building = template.clone(true);
    const tall = index < 3;
    const scale = tall ? 1.45 + (seed % 3) * 0.14 : 0.9 + (index % 2) * 0.18;
    building.scale.setScalar(scale);
    building.position.set(slot[0], island.h * 0.5, slot[1]);
    building.rotation.y = ((seed + index) % 4) * Math.PI * 0.5;
    city.add(building);

    if (index === 0 && DESTINATIONS[seed]) {
      const sign = makeSign(DESTINATIONS[seed].label.toUpperCase(), DESTINATIONS[seed].color, 2.6, 0.75);
      sign.position.set(slot[0], island.h * 0.5 + scale * 2.35, slot[1] + 1.15);
      city.add(sign);
    }
  });

  if (props[0]) {
    const lamp = props[0].clone(true);
    lamp.scale.setScalar(1.4);
    lamp.position.set(island.x + island.w * 0.32, island.h * 0.5, island.z + island.d * 0.28);
    city.add(lamp);
  }
  if (props[2] && seed % 2 === 0) {
    const cab = props[2].clone(true);
    cab.scale.setScalar(1.2);
    cab.position.set(island.x - island.w * 0.3, island.h * 0.5, island.z + island.d * 0.22);
    city.add(cab);
  }
}

function addBridge(city, a, b) {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const length = Math.hypot(dx, dz);
  const bridge = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.12, length),
    new THREE.MeshStandardMaterial({
      color: 0x120818,
      emissive: 0xff3ec8,
      emissiveIntensity: 0.7,
      metalness: 0.4,
      roughness: 0.35,
    })
  );
  bridge.position.set((a.x + b.x) * 0.5, 0.15, (a.z + b.z) * 0.5);
  bridge.rotation.y = Math.atan2(dx, dz);
  city.add(bridge);

  const rail = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.08, length),
    new THREE.MeshBasicMaterial({ color: 0x7af0ff })
  );
  rail.position.copy(bridge.position);
  rail.position.y = 0.28;
  rail.rotation.y = bridge.rotation.y;
  city.add(rail);
}

function addStarfield(scene) {
  const count = 900;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 90;
    positions[i * 3 + 1] = Math.random() * 40 - 8;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 90;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const stars = new THREE.Points(
    geo,
    new THREE.PointsMaterial({ color: 0xffb6f0, size: 0.08, transparent: true, opacity: 0.85, depthAttenuation: true })
  );
  scene.add(stars);

  const pink = new THREE.Points(
    geo.clone(),
    new THREE.PointsMaterial({ color: 0x7af0ff, size: 0.05, transparent: true, opacity: 0.55, sizeAttenuation: true })
  );
  pink.rotation.y = 0.4;
  scene.add(pink);
}

function addVoidGlow(scene) {
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(18, 48),
    new THREE.MeshBasicMaterial({
      color: 0xb14bff,
      transparent: true,
      opacity: 0.08,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  disc.rotation.x = -Math.PI * 0.5;
  disc.position.y = -2.8;
  scene.add(disc);
}

function placeCssPins() {
  DESTINATIONS.forEach(function (dest, index) {
    const pin = document.createElement("a");
    pin.className = "map-pin";
    pin.href = dest.href;
    pin.style.setProperty("--pin", dest.color);
    pin.style.left = (58 + dest.x * 3.2) + "%";
    pin.style.top = (42 + dest.z * 3.1) + "%";
    pin.style.animationDelay = (index * 0.18) + "s";
    pin.innerHTML = "<span class='map-pin-dot'></span><span class='map-pin-label'>" + dest.label + "</span>";
    pinsHost.appendChild(pin);
  });
}
