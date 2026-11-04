import * as THREE from "three";
import { makeSign } from "./load.js";

const textureLoader = new THREE.TextureLoader();

export function createGamesInterior(scene, cache, projects) {
  const group = new THREE.Group();
  group.name = "games-interior";
  group.visible = false;
  scene.add(group);

  const grounds = [];
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 14),
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
  sign.position.set(0, 3.2, -5.6);
  sign.rotation.y = 0;
  group.add(sign);

  /* Clear exit doorway facing the spawn so players can find the way out */
  const exitFrame = new THREE.Group();
  exitFrame.position.set(0, 0, 4.9);
  const exitMat = new THREE.MeshStandardMaterial({
    color: 0x7af0ff,
    emissive: 0x7af0ff,
    emissiveIntensity: 1.5,
    roughness: 0.4,
  });
  [-1.15, 1.15].forEach(function (offset) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.8, 0.16), exitMat);
    post.position.set(offset, 1.4, 0);
    exitFrame.add(post);
  });
  const exitBar = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.14, 0.16), exitMat);
  exitBar.position.set(0, 2.8, 0);
  exitFrame.add(exitBar);
  const exitSign = makeSign("EXIT", "#7af0ff", 1.9, 0.7, "TO STREET");
  exitSign.material.side = THREE.DoubleSide;
  exitSign.position.set(0, 1.55, -0.08);
  exitSign.rotation.y = Math.PI;
  exitFrame.add(exitSign);
  exitFrame.userData.isExit = true;
  group.add(exitFrame);

  const machines = [];
  const left = [-2.4, -0.8, 0.8, 2.4, 4];
  left.forEach(function (z, index) {
    machines.push(addMachine(group, cache.eh.vending, projects[index], -3.3, z, Math.PI / 2));
  });
  const right = [-2.4, -0.8, 0.8, 2.4, 4];
  right.forEach(function (z, index) {
    machines.push(addMachine(group, cache.eh.vending, projects[index + 5], 3.3, z, -Math.PI / 2));
  });
  [-1.6, 0, 1.6].forEach(function (x, index) {
    machines.push(addMachine(group, cache.eh.vending, projects[index + 10], x, -4.6, 0));
  });

  const lampA = new THREE.PointLight(0xff3ec8, 4, 12, 2);
  lampA.position.set(-2, 3.2, 0);
  const lampB = new THREE.PointLight(0x7af0ff, 3.2, 12, 2);
  lampB.position.set(2, 3.2, -2);
  group.add(lampA, lampB);

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

  return {
    group: group,
    grounds: grounds,
    occluders: occluders,
    colliders: colliders,
    machines: machines,
    exit: { minX: -1.4, maxX: 1.4, minZ: 4.3, maxZ: 5.6 },
    bounds: { minX: -5.2, maxX: 5.2, minZ: -6.4, maxZ: 5.2 },
    spawn: new THREE.Vector3(0, 0, 3.2),
  };
}

function addMachine(parent, source, project, x, z, rot) {
  const object = source.clone(true);
  object.position.set(x, 0, z);
  object.rotation.y = rot;
  const poster = new THREE.Mesh(
    new THREE.PlaneGeometry(0.7, 0.9),
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
  );
  poster.position.set(0, 1.12, 0.5);
  object.add(poster);
  textureLoader.load(project.poster, function (texture) {
    texture.colorSpace = THREE.SRGBColorSpace;
    poster.material.map = texture;
    poster.material.needsUpdate = true;
  });
  parent.add(object);
  return { object: object, project: project, poster: poster };
}
