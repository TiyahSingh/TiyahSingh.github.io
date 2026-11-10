import * as THREE from "three";
import { makeSign } from "./load.js?v=11";

const textureLoader = new THREE.TextureLoader();

export function createGamesInterior(scene, cache, projects) {
  const group = new THREE.Group();
  group.name = "games-interior";
  group.visible = false;
  scene.add(group);

  const grounds = [];
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 16),
    new THREE.MeshStandardMaterial({ color: 0x140816, metalness: 0.74, roughness: 0.22 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.name = "ground";
  floor.receiveShadow = true;
  grounds.push(floor);
  group.add(floor);

  const occluders = [];
  [[8.2, 0, Math.PI / 2], [-8.2, 0, -Math.PI / 2], [8.2, -4, Math.PI / 2], [-8.2, -4, -Math.PI / 2], [0, -8.2, Math.PI]].forEach(function (spot) {
    const wall = cache.kenney["low-detail-building-wide-a"].clone(true);
    wall.scale.setScalar(4.2);
    wall.position.set(spot[0], 0, spot[1]);
    wall.rotation.y = spot[2];
    group.add(wall);
    occluders.push(wall);
  });

  const sign = makeSign("GAMES", "#ff3ec8", 4.2, 1.1, "INSERT COIN");
  sign.position.set(0, 3.6, -5.4);
  group.add(sign);

  const showcase = (projects || []).filter(function (project) { return project && project.showcase; });
  const showcaseSign = makeSign("SHOWCASE", "#ff3ec8", 6.2, 1.25, "GAMES");
  showcaseSign.position.set(0, 2.55, -5.35);
  group.add(showcaseSign);

  const exitZ = 6.4;
  [[-3.4, exitZ], [3.4, exitZ]].forEach(function (spot) {
    const wing = cache.kenney["low-detail-building-a"].clone(true);
    wing.scale.setScalar(3.2);
    wing.position.set(spot[0], 0, spot[1]);
    wing.rotation.y = Math.PI;
    group.add(wing);
    occluders.push(wing);
  });
  const exitMat = new THREE.MeshStandardMaterial({
    color: 0x7af0ff, emissive: 0x7af0ff, emissiveIntensity: 1.35, roughness: 0.4,
  });
  [-1.05, 1.05].forEach(function (offset) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.5, 0.14), exitMat);
    post.position.set(offset, 1.25, exitZ);
    group.add(post);
  });
  const exitBar = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 0.14), exitMat);
  exitBar.position.set(0, 2.55, exitZ);
  group.add(exitBar);
  const exitSign = makeSign("EXIT", "#7af0ff", 1.7, 0.58, "TO STREET");
  exitSign.material.side = THREE.DoubleSide;
  exitSign.position.set(0, 3.15, exitZ - 0.05);
  exitSign.rotation.y = Math.PI;
  group.add(exitSign);

  const machines = [];
  showcase.forEach(function (project, index) {
    const x = showcase.length === 1 ? 0 : (index === 0 ? -1.35 : 1.35);
    machines.push(addMachine(group, cache.eh.vending, project, x, -4.35, 0, true));
  });

  const lampA = new THREE.PointLight(0xff3ec8, 4.4, 12, 2);
  lampA.position.set(0, 3.2, -3.2);
  group.add(lampA);

  group.updateMatrixWorld(true);
  const colliders = [];
  occluders.forEach(function (wall) {
    const box = new THREE.Box3().setFromObject(wall);
    colliders.push({ minX: box.min.x, maxX: box.max.x, minZ: box.min.z, maxZ: box.max.z });
  });
  machines.forEach(function (machine) {
    const box = new THREE.Box3().setFromObject(machine.object);
    colliders.push({ minX: box.min.x, maxX: box.max.x, minZ: box.min.z, maxZ: box.max.z });
  });
  for (let i = colliders.length - 1; i >= 0; i -= 1) {
    const box = colliders[i];
    if (box.minZ > 5.2 && box.minX < -0.4 && box.maxX > 0.4) {
      colliders.push({ minX: box.minX, maxX: Math.min(box.maxX, -1.15), minZ: box.minZ, maxZ: box.maxZ });
      colliders.push({ minX: Math.max(box.minX, 1.15), maxX: box.maxX, minZ: box.minZ, maxZ: box.maxZ });
      colliders.splice(i, 1);
    }
  }

  return {
    group, grounds, occluders, colliders, machines,
    exit: { minX: -1.2, maxX: 1.2, minZ: 5.8, maxZ: 7.0 },
    bounds: { minX: -5.2, maxX: 5.2, minZ: -6.4, maxZ: 6.6 },
    spawn: new THREE.Vector3(0, 0, 1.2),
  };
}

function addMachine(parent, source, project, x, z, rot, highlight) {
  if (!project) return { object: new THREE.Group(), project: null, poster: null };
  const object = source.clone(true);
  object.position.set(x, 0, z);
  object.rotation.y = rot;
  if (highlight) {
    object.scale.set(1.12, 1.12, 1.12);
    const glow = new THREE.PointLight(0xff3ec8, 1.8, 4.5, 2);
    glow.position.set(0, 1.4, 0.6);
    object.add(glow);
  }
  const poster = new THREE.Mesh(
    new THREE.PlaneGeometry(highlight ? 0.82 : 0.7, highlight ? 1.05 : 0.9),
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
  );
  poster.position.set(0, highlight ? 1.22 : 1.12, 0.5);
  object.add(poster);
  if (project.poster) {
    textureLoader.load(project.poster, function (texture) {
      texture.colorSpace = THREE.SRGBColorSpace;
      poster.material.map = texture;
      poster.material.needsUpdate = true;
    });
  }
  parent.add(object);
  return { object, project, poster };
}
