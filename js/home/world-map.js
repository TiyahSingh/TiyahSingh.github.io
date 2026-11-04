import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { loadModel, tuneCity } from "../explore/load.js";

const mount = document.getElementById("world-map");
const pinsHost = document.getElementById("world-pins");
if (!mount || !pinsHost) throw new Error("Missing home map mount");

const DESTINATIONS = [
  { id: "explore", label: "EXPLORE", href: "/explore.html", color: "#ff4ae8", x: 0.6, z: 1.2, y: 4.8 },
  { id: "about", label: "ABOUT", href: "/explore.html?door=about", color: "#e0b0ff", x: -7.2, z: -1.4, y: 4.2 },
  { id: "skills", label: "SKILLS", href: "/explore.html?door=skills", color: "#c45cff", x: 7.4, z: -0.6, y: 4.4 },
  { id: "games", label: "GAMES", href: "/explore.html#explore/games", color: "#ff4ae8", x: -1.8, z: -5.6, y: 5.4 },
  { id: "cv", label: "CV", href: "/explore.html?door=cv", color: "#e0b0ff", x: 5.2, z: -5.8, y: 4.6 },
  { id: "contact", label: "CONTACT", href: "/explore.html?door=contact", color: "#ff9cf0", x: -6.4, z: 4.6, y: 3.8 },
];

const BUILDINGS = [
  "/assets/models/kenney/commercial/building-skyscraper-a.glb",
  "/assets/models/kenney/commercial/building-skyscraper-e.glb",
  "/assets/models/kenney/commercial/building-a.glb",
  "/assets/models/kenney/commercial/building-b.glb",
  "/assets/models/kenney/commercial/building-c.glb",
  "/assets/models/kenney/commercial/building-d.glb",
  "/assets/models/kenney/commercial/building-e.glb",
  "/assets/models/kenney/commercial/building-f.glb",
  "/assets/models/kenney/commercial/building-g.glb",
  "/assets/models/kenney/commercial/building-h.glb",
  "/assets/models/kenney/commercial/building-i.glb",
  "/assets/models/kenney/commercial/building-j.glb",
  "/assets/models/kenney/commercial/low-detail-building-wide-a.glb",
  "/assets/models/kenney/commercial/low-detail-building-wide-b.glb",
  "/assets/models/kenney/commercial/low-detail-building-a.glb",
  "/assets/models/kenney/commercial/low-detail-building-b.glb",
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

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.35));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.setClearColor(0x090614, 1);
  mount.appendChild(renderer.domElement);
  mount.classList.add("is-live");

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x090614);
  scene.fog = new THREE.FogExp2(0x090614, 0.016);

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
  camera.position.set(22, 16, 24);
  camera.lookAt(0, 2.2, 0);

  scene.add(new THREE.AmbientLight(0x8a60b8, 0.55));
  const key = new THREE.DirectionalLight(0xffd0f0, 0.7);
  key.position.set(8, 16, 6);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xb8f0ff, 0.35);
  fill.position.set(-10, 10, -4);
  scene.add(fill);
  scene.add(new THREE.HemisphereLight(0xffb0e8, 0x180820, 0.4));
  const rim = new THREE.PointLight(0xff3ec8, 16, 42, 2);
  rim.position.set(0, 8, 0);
  scene.add(rim);
  const cyan = new THREE.PointLight(0x7af0ff, 11, 36, 2);
  cyan.position.set(-5, 6, 5);
  scene.add(cyan);
  const magenta = new THREE.PointLight(0xb14bff, 10, 34, 2);
  magenta.position.set(6, 7, -5);
  scene.add(magenta);
  const warm = new THREE.PointLight(0xff7ad9, 7, 28, 2);
  warm.position.set(-2, 5, -7);
  scene.add(warm);

  const starLayers = addStarfield(scene) || [];
  addVoidGlow(scene);

  const city = new THREE.Group();
  scene.add(city);

  const templates = await Promise.all(BUILDINGS.map(function (url) {
    return loadModel(url).then(function (gltf) {
      tuneCity(gltf.scene, false, false);
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
      tuneCity(gltf.scene, false, false);
      boostGlow(gltf.scene);
      return gltf.scene;
    });
  }).catch(function () { return []; });

  const islands = [
    { x: 0, z: 0, w: 11.2, d: 9.6, h: 0.55, hue: 0xff3ec8 },
    { x: -8.6, z: -2.4, w: 6.8, d: 6.2, h: 0.7, hue: 0x7af0ff },
    { x: 8.8, z: -1.6, w: 7.0, d: 6.4, h: 0.65, hue: 0xb14bff },
    { x: -2.4, z: -7.8, w: 7.4, d: 5.8, h: 0.8, hue: 0xff3ec8 },
    { x: 6.2, z: -7.4, w: 6.2, d: 5.4, h: 0.7, hue: 0x7af0ff },
    { x: -7.6, z: 5.2, w: 6.0, d: 5.2, h: 0.6, hue: 0xff7ad9 },
    { x: 3.4, z: 6.4, w: 5.4, d: 4.8, h: 0.58, hue: 0xb14bff },
    { x: 9.6, z: 4.2, w: 4.8, d: 4.4, h: 0.62, hue: 0xff3ec8 },
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
  addBridge(city, islands[0], islands[6]);
  addBridge(city, islands[2], islands[7]);
  addBridge(city, islands[6], islands[7]);
  addBridge(city, islands[5], islands[6]);

  /* Tight bloom: high threshold so only neon windows/signs glow, not the whole city */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.28, 0.22, 0.82);
  composer.addPass(bloom);

  const anchors = DESTINATIONS.map(function (dest, index) {
    const board = makeBuildingBillboard(dest.label, dest.color);
    /* Rooftop neon billboards — readable from orbit distance */
    const boardY = Math.max(3.4, dest.y * 0.72);
    board.position.set(dest.x, boardY, dest.z);
    board.rotation.y = Math.atan2(dest.x, dest.z) + Math.PI;
    board.rotation.y += (index % 2 === 0 ? -0.14 : 0.16);
    board.scale.setScalar(1.15 + (index % 3) * 0.06);
    city.add(board);

    const marker = new THREE.Object3D();
    marker.position.set(dest.x, boardY + 1.55, dest.z);
    city.add(marker);

    const pin = document.createElement("a");
    pin.className = "map-pin";
    pin.href = dest.href;
    pin.style.setProperty("--pin", dest.color);
    pin.setAttribute("aria-label", dest.label);
    pin.innerHTML =
      "<span class='map-pin-label'>" +
      "<span class='map-pin-tag'>ZONE</span>" +
      "<span class='map-pin-title'>" + dest.label + "</span>" +
      "</span>";
    pinsHost.appendChild(pin);
    return { marker: marker, pin: pin, beam: board };
  });

  let dragging = false;
  let lastX = 0;
  let yaw = 0.55;
  let pitch = 0.34;
  /* Far enough out to read the whole floating city */
  const target = new THREE.Vector3(0.2, 2.2, 0);
  const radius = 32;

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

  let lastW = 0;
  let lastH = 0;
  function syncSize(force) {
    const frame = mount.parentElement || mount;
    const w = Math.max(1, Math.floor(frame.clientWidth || mount.clientWidth));
    const h = Math.max(1, Math.floor(frame.clientHeight || mount.clientHeight));
    if (w < 8 || h < 8) return false;
    if (!force && w === lastW && h === lastH) return false;
    lastW = w;
    lastH = h;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    bloom.setSize(w, h);
    return true;
  }

  syncSize(true);
  requestAnimationFrame(function () { syncSize(true); });
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { syncSize(true); });
  });
  window.addEventListener("resize", function () { syncSize(true); });
  window.addEventListener("load", function () { syncSize(true); });
  if (typeof ResizeObserver !== "undefined") {
    const ro = new ResizeObserver(function () { syncSize(true); });
    ro.observe(mount);
    if (mount.parentElement) ro.observe(mount.parentElement);
    const stage = mount.closest(".world-stage");
    if (stage) ro.observe(stage);
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { syncSize(true); });
  }

  const clock = new THREE.Clock();
  function frame() {
    syncSize(false);
    const t = clock.getElapsedTime();
    if (!dragging) yaw += 0.00055;
    city.position.y = Math.sin(t * 0.55) * 0.12;
    if (starLayers[0]) starLayers[0].rotation.y = t * 0.012;
    if (starLayers[1]) starLayers[1].rotation.y = -t * 0.018;
    if (starLayers[0]) starLayers[0].rotation.x = Math.sin(t * 0.08) * 0.04;
    rim.intensity = 14 + Math.sin(t * 0.9) * 2;
    cyan.intensity = 10 + Math.sin(t * 1.1 + 1) * 1.5;
    magenta.intensity = 9 + Math.sin(t * 0.85 + 2) * 1.4;
    anchors.forEach(function (item, index) {
      if (item.beam && item.beam.userData && item.beam.userData.pulseMats) {
        item.beam.userData.pulseMats.forEach(function (mat) {
          mat.emissiveIntensity = 0.55 + Math.sin(t * 1.6 + index) * 0.12;
        });
      }
      const pos = item.marker.getWorldPosition(new THREE.Vector3());
      pos.project(camera);
      const x = (pos.x * 0.5 + 0.5) * lastW;
      const y = (-pos.y * 0.5 + 0.5) * lastH;
      const visible = pos.z < 1 && x > -40 && y > -40 && x < lastW + 40 && y < lastH + 40;
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
      if (!material || material.emissiveIntensity == null) return;
      material.emissiveIntensity = Math.min(Math.max(material.emissiveIntensity * 1.35, 0.55), 1.45);
      if (material.emissiveMap) {
        material.emissiveIntensity = Math.min(material.emissiveIntensity, 1.35);
      }
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
      emissiveIntensity: 0.95,
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
    [island.x - island.w * 0.34, island.z - island.d * 0.28],
    [island.x - island.w * 0.08, island.z - island.d * 0.3],
    [island.x + island.w * 0.18, island.z - island.d * 0.26],
    [island.x + island.w * 0.34, island.z - island.d * 0.1],
    [island.x - island.w * 0.32, island.z - island.d * 0.02],
    [island.x - island.w * 0.06, island.z + island.d * 0.02],
    [island.x + island.w * 0.14, island.z + island.d * 0.04],
    [island.x + island.w * 0.32, island.z + island.d * 0.16],
    [island.x - island.w * 0.2, island.z + island.d * 0.26],
    [island.x + island.w * 0.04, island.z + island.d * 0.28],
    [island.x + island.w * 0.24, island.z + island.d * 0.3],
    [island.x - island.w * 0.16, island.z - island.d * 0.14],
  ];
  slots.forEach(function (slot, index) {
    const template = templates[(seed * 5 + index * 2) % templates.length];
    const building = template.clone(true);
    const tall = index % 4 === 0 || index % 5 === 1;
    const mid = index % 3 === 0;
    const scale = tall
      ? 1.55 + (seed % 3) * 0.16
      : mid
        ? 1.15 + (index % 2) * 0.12
        : 0.78 + (index % 3) * 0.1;
    building.scale.setScalar(scale);
    building.position.set(slot[0], island.h * 0.5, slot[1]);
    building.rotation.y = ((seed + index) % 8) * Math.PI * 0.25;
    city.add(building);

  });

  if (props[0]) {
    [[0.36, 0.3], [-0.34, 0.28], [0.3, -0.3], [-0.28, -0.26]].forEach(function (offset, i) {
      if ((seed + i) % 2 !== 0 && i > 1) return;
      const lamp = props[0].clone(true);
      lamp.scale.setScalar(1.25 + (i % 2) * 0.2);
      lamp.position.set(island.x + island.w * offset[0], island.h * 0.5, island.z + island.d * offset[1]);
      city.add(lamp);
    });
  }
  if (props[1] && seed % 3 !== 2) {
    const board = props[1].clone(true);
    board.scale.setScalar(1.15);
    board.position.set(island.x + island.w * 0.12, island.h * 0.5, island.z - island.d * 0.34);
    board.rotation.y = (seed % 4) * Math.PI * 0.5;
    city.add(board);
  }
  if (props[2]) {
    const cab = props[2].clone(true);
    cab.scale.setScalar(1.15);
    cab.position.set(island.x - island.w * 0.28, island.h * 0.5, island.z + island.d * 0.2);
    city.add(cab);
    if (seed % 2 === 0) {
      const cab2 = props[2].clone(true);
      cab2.scale.setScalar(1.05);
      cab2.position.set(island.x + island.w * 0.26, island.h * 0.5, island.z - island.d * 0.18);
      cab2.rotation.y = Math.PI * 0.5;
      city.add(cab2);
    }
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
      emissiveIntensity: 0.95,
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
  const count = 1200;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 110;
    positions[i * 3 + 1] = Math.random() * 48 - 10;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 110;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const stars = new THREE.Points(
    geo,
    new THREE.PointsMaterial({ color: 0xffb6f0, size: 0.09, transparent: true, opacity: 0.9, sizeAttenuation: true })
  );
  scene.add(stars);

  const cyan = new THREE.Points(
    geo.clone(),
    new THREE.PointsMaterial({ color: 0x7af0ff, size: 0.055, transparent: true, opacity: 0.6, sizeAttenuation: true })
  );
  cyan.rotation.y = 0.4;
  scene.add(cyan);
  return [stars, cyan];
}
function addVoidGlow(scene) {
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(20, 48),
    new THREE.MeshBasicMaterial({
      color: 0xb14bff,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  disc.rotation.x = -Math.PI * 0.5;
  disc.position.y = -2.8;
  scene.add(disc);

  const halo = new THREE.Mesh(
    new THREE.CircleGeometry(10, 40),
    new THREE.MeshBasicMaterial({
      color: 0xff3ec8,
      transparent: true,
      opacity: 0.1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  halo.rotation.x = -Math.PI * 0.5;
  halo.position.y = -2.6;
  scene.add(halo);
}

function neonBillboardTexture(label, colorHex) {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 384;
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = "#0a0612";
  ctx.fillRect(0, 0, w, h);

  const glow = ctx.createRadialGradient(w * 0.5, h * 0.55, 20, w * 0.5, h * 0.5, w * 0.55);
  glow.addColorStop(0, colorHex + "55");
  glow.addColorStop(1, "#00000000");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = colorHex;
  ctx.lineWidth = 10;
  ctx.strokeRect(18, 18, w - 36, h - 36);
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.55;
  ctx.strokeRect(34, 34, w - 68, h - 68);
  ctx.globalAlpha = 1;

  const corner = 48;
  ctx.lineWidth = 8;
  ctx.lineCap = "square";
  [[18, 18, 1, 1], [w - 18, 18, -1, 1], [18, h - 18, 1, -1], [w - 18, h - 18, -1, -1]].forEach(function (c) {
    ctx.beginPath();
    ctx.moveTo(c[0], c[1] + corner * c[3]);
    ctx.lineTo(c[0], c[1]);
    ctx.lineTo(c[0] + corner * c[2], c[1]);
    ctx.stroke();
  });

  for (let y = 48; y < h - 48; y += 6) {
    ctx.fillStyle = "rgba(255,255,255,0.035)";
    ctx.fillRect(42, y, w - 84, 2);
  }

  ctx.shadowColor = colorHex;
  ctx.shadowBlur = 28;
  ctx.fillStyle = "#ffe8fb";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = '700 92px "Spicy Rice", "Fredoka", Arial, sans-serif';
  ctx.fillText(label, w * 0.5, h * 0.46);
  ctx.shadowBlur = 0;
  ctx.fillStyle = colorHex;
  ctx.globalAlpha = 0.9;
  ctx.fillText(label, w * 0.5, h * 0.46);
  ctx.globalAlpha = 1;

  ctx.font = '700 28px "Fredoka", Arial, sans-serif';
  ctx.fillStyle = "#7af0ff";
  ctx.shadowColor = "#7af0ff";
  ctx.shadowBlur = 12;
  ctx.fillText("◆ ENTER ◆", w * 0.5, h * 0.78);
  ctx.shadowBlur = 0;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function makeBuildingBillboard(label, colorHex) {
  const group = new THREE.Group();
  const color = new THREE.Color(colorHex);
  const faceW = 3.6;
  const faceH = 1.55;

  const poleMat = new THREE.MeshStandardMaterial({
    color: 0x140818,
    metalness: 0.65,
    roughness: 0.3,
    emissive: color,
    emissiveIntensity: 0.35,
  });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 2.8, 8), poleMat);
  pole.position.set(0, 0.2, -0.35);
  group.add(pole);

  const arm = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.14, 0.85),
    new THREE.MeshStandardMaterial({
      color: 0x120818,
      metalness: 0.5,
      roughness: 0.35,
      emissive: color,
      emissiveIntensity: 0.5,
    })
  );
  arm.position.set(0, 1.45, -0.05);
  group.add(arm);

  const back = new THREE.Mesh(
    new THREE.BoxGeometry(faceW + 0.2, faceH + 0.2, 0.18),
    new THREE.MeshStandardMaterial({
      color: 0x08040f,
      metalness: 0.25,
      roughness: 0.5,
      emissive: color,
      emissiveIntensity: 0.55,
    })
  );
  back.position.set(0, 1.45, 0.18);
  group.add(back);

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(faceW + 0.38, faceH + 0.38, 0.08),
    new THREE.MeshStandardMaterial({
      color: 0x1a0b22,
      emissive: color,
      emissiveIntensity: 0.85,
      metalness: 0.4,
      roughness: 0.25,
    })
  );
  frame.position.set(0, 1.45, 0.08);
  group.add(frame);

  const texture = neonBillboardTexture(label, colorHex);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(faceW, faceH),
    new THREE.MeshStandardMaterial({
      map: texture,
      emissiveMap: texture,
      emissive: color,
      emissiveIntensity: 1.15,
      roughness: 0.28,
      metalness: 0.1,
    })
  );
  face.position.set(0, 1.45, 0.3);
  group.add(face);

  /* Soft neon wash under the board — cheap additive plane */
  const wash = new THREE.Mesh(
    new THREE.PlaneGeometry(faceW * 0.95, 0.55),
    new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    })
  );
  wash.rotation.x = -Math.PI * 0.5;
  wash.position.set(0, 0.55, 0.15);
  group.add(wash);

  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 10, 10),
    new THREE.MeshBasicMaterial({ color: color })
  );
  bulb.position.set(0, 2.45, 0.05);
  group.add(bulb);

  group.userData.pulseMats = [frame.material, back.material, face.material];
  return group;
}

function placeCssPins() {
  DESTINATIONS.forEach(function (dest) {
    const pin = document.createElement("a");
    pin.className = "map-pin";
    pin.href = dest.href;
    pin.style.setProperty("--pin", dest.color);
    pin.style.left = (58 + dest.x * 3.2) + "%";
    pin.style.top = (42 + dest.z * 3.1) + "%";
    pin.setAttribute("aria-label", dest.label);
    pin.innerHTML =
      "<span class='map-pin-label'>" +
      "<span class='map-pin-tag'>ZONE</span>" +
      "<span class='map-pin-title'>" + dest.label + "</span>" +
      "</span>";
    pinsHost.appendChild(pin);
  });
}
