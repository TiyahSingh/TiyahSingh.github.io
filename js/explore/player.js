import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const MODEL = "/assets/models/character/animated-woman.glb";

export async function createPlayer(options) {
  const lite = !!(options && options.lite);
  const gltf = await new GLTFLoader().loadAsync(MODEL);
  const model = gltf.scene;
  model.traverse(function (child) {
    if (!child.isMesh) return;
    child.castShadow = !lite;
    child.receiveShadow = !lite;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach(paintOutfit);
  });

  gltf.animations.forEach(freezeHips);
  const mixer = new THREE.AnimationMixer(model);
  const idleClip = THREE.AnimationClip.findByName(gltf.animations, "Armature|Idle");
  const walkClip = THREE.AnimationClip.findByName(gltf.animations, "Armature|Walking");
  if (!idleClip || !walkClip) {
    throw new Error("The character file is missing Idle or Walking.");
  }
  const idle = mixer.clipAction(idleClip);
  const walk = mixer.clipAction(walkClip);
  idle.play();

  fitToStreet(model);

  const group = new THREE.Group();
  group.add(model);
  group.position.set(0, 0, 14);

  const velocity = new THREE.Vector3();
  const desired = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const target = new THREE.Vector3();
  let hasTarget = false;
  let moving = false;

  function hits(x, z, colliders) {
    return colliders.some(function (box) {
      return x > box.minX - 0.4 && x < box.maxX + 0.4 && z > box.minZ - 0.4 && z < box.maxZ + 0.4;
    });
  }

  function update(dt, input, camera, colliders, bounds) {
    camera.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() < 0.0001) forward.set(0, 0, -1);
    forward.normalize();
    right.crossVectors(up, forward).normalize();

    const ix = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const iz = (input.forward ? 1 : 0) - (input.back ? 1 : 0);
    if (ix !== 0 || iz !== 0) hasTarget = false;

    desired.set(0, 0, 0);
    if (ix !== 0 || iz !== 0) {
      desired.addScaledVector(right, ix);
      desired.addScaledVector(forward, iz);
      desired.normalize();
    } else if (hasTarget) {
      desired.subVectors(target, group.position);
      desired.y = 0;
      if (desired.lengthSq() < 0.12) hasTarget = false;
      else desired.normalize();
    }

    desired.multiplyScalar(desired.lengthSq() ? 4.2 : 0);
    velocity.lerp(desired, 1 - Math.exp(-8 * dt));

    let nextX = group.position.x + velocity.x * dt;
    let nextZ = group.position.z + velocity.z * dt;
    const limits = bounds || { minX: -8.2, maxX: 8.2, minZ: -20, maxZ: 17 };
    nextX = Math.max(limits.minX, Math.min(limits.maxX, nextX));
    nextZ = Math.max(limits.minZ, Math.min(limits.maxZ, nextZ));
    if (!hits(nextX, group.position.z, colliders)) group.position.x = nextX;
    if (!hits(group.position.x, nextZ, colliders)) group.position.z = nextZ;

    const nowMoving = velocity.lengthSq() > 0.05;
    if (nowMoving !== moving) {
      const next = nowMoving ? walk : idle;
      const prev = nowMoving ? idle : walk;
      next.reset().fadeIn(0.18).play();
      prev.fadeOut(0.18);
      moving = nowMoving;
    }
    if (nowMoving) {
      const yaw = Math.atan2(velocity.x, velocity.z);
      const delta = Math.atan2(Math.sin(yaw - group.rotation.y), Math.cos(yaw - group.rotation.y));
      group.rotation.y += delta * (1 - Math.exp(-10 * dt));
    }
    mixer.update(dt);
  }

  function walkTo(point) {
    target.copy(point);
    hasTarget = true;
  }

  return { group: group, update: update, walkTo: walkTo };
}

function fitToStreet(model) {
  const box = new THREE.Box3().setFromObject(model);
  const height = box.max.y - box.min.y;
  if (height > 0.01) model.scale.multiplyScalar(1.7 / height);
  const fitted = new THREE.Box3().setFromObject(model);
  model.position.y -= fitted.min.y;
}

function paintOutfit(material) {
  if (!material || !material.map || !material.map.image) return;
  const image = material.map.image;
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(image, 0, 0);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const bands = [
    [0, 5, [226, 176, 148]],
    [6, 10, [123, 70, 48]],
    [11, 16, [18, 12, 20]],
    [17, 22, [255, 62, 200]],
    [23, 27, [22, 12, 28]],
    [28, 31, [28, 14, 32]],
  ];
  for (let y = 0; y < canvas.height; y += 1) {
    const band = bands.find(function (entry) {
      const start = Math.floor(entry[0] * canvas.height / 32);
      const end = Math.floor((entry[1] + 1) * canvas.height / 32);
      return y >= start && y < end;
    });
    if (!band) continue;
    for (let x = 0; x < canvas.width; x += 1) {
      const i = (y * canvas.width + x) * 4;
      pixels.data[i] = band[2][0];
      pixels.data[i + 1] = band[2][1];
      pixels.data[i + 2] = band[2][2];
    }
  }
  ctx.putImageData(pixels, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = material.map.flipY;
  material.map = texture;
  material.roughness = 0.62;
  material.metalness = 0.08;
  material.needsUpdate = true;
}

function freezeHips(clip) {
  clip.tracks.forEach(function (track) {
    if (!/Hips\.position$/.test(track.name)) return;
    const values = track.values;
    const x = values[0];
    const y = values[1];
    const z = values[2];
    for (let i = 0; i < values.length; i += 3) {
      values[i] = x;
      values[i + 1] = y;
      values[i + 2] = z;
    }
  });
}
