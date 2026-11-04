import * as THREE from "three";
import { loadModel, tuneFlat, tuneCity, makeSign } from "./load.js?v=7";

const EH = "/assets/models/eh98/";
const KENNEY = "/assets/models/kenney/commercial/";
const BUILDING = 5.5;

export async function createStreet(scene, options) {
  const lite = !!(options && options.lite);
  const ehNames = ["road", "lamp", "sign", "vending", "noodle"];
  const kenneyNames = lite
    ? [
      "building-a", "building-b", "building-c", "building-d", "building-e",
      "building-f", "building-j", "building-skyscraper-e",
      "low-detail-building-a", "low-detail-building-wide-a", "detail-awning-wide",
    ]
    : [
      "building-a", "building-b", "building-c", "building-d", "building-e",
      "building-f", "building-g", "building-h", "building-j", "building-skyscraper-e",
      "low-detail-building-a", "low-detail-building-wide-a", "detail-awning-wide",
    ];
  const [eh, kenney] = await Promise.all([
    loadSet(ehNames.map(function (name) { return EH + name + ".glb"; }), ehNames, tuneFlat),
    loadSet(kenneyNames.map(function (name) { return KENNEY + name + ".glb"; }), kenneyNames, function (root) { tuneCity(root, false, lite); }),
  ]);

  scene.background = new THREE.Color(0x100814);
  scene.fog = new THREE.FogExp2(0x140818, lite ? 0.02 : 0.016);
  scene.add(new THREE.HemisphereLight(0x6a3d98, 0x100814, lite ? 0.7 : 0.55));
  const moon = new THREE.DirectionalLight(0xb9a4d8, lite ? 0.5 : 0.38);
  moon.position.set(18, 28, 12);
  moon.castShadow = !lite;
  if (!lite) {
    moon.shadow.mapSize.set(1024, 1024);
    moon.shadow.camera.near = 1;
    moon.shadow.camera.far = 90;
    moon.shadow.camera.left = -40;
    moon.shadow.camera.right = 40;
    moon.shadow.camera.top = 40;
    moon.shadow.camera.bottom = -40;
  }
  scene.add(moon);

  const group = new THREE.Group();
  group.name = "street";
  scene.add(group);
  const grounds = [];
  const occluders = [];

  [-12, 0, 12].forEach(function (z) {
    const road = place(group, eh.road, 0, z, 0);
    road.traverse(function (child) {
      if (child.isMesh) {
        child.name = "ground";
        grounds.push(child);
      }
    });
  });

  const shops = [
    ["building-a", 11.2, 9, -Math.PI / 2, "ABOUT", "#ff3ec8"],
    ["building-b", -11.2, 9, Math.PI / 2, "SKILLS", "#b14bff"],
    ["building-c", 11.2, 3, -Math.PI / 2, "CV", "#7af0ff"],
    ["building-d", -11.2, 3, Math.PI / 2, "CONTACT", "#ff3ec8"],
    ["building-e", 11.2, -3, -Math.PI / 2],
    ["building-f", -11.2, -3, Math.PI / 2],
    ["building-g", 11.6, 14, -Math.PI / 2],
    ["building-h", -11.6, 14, Math.PI / 2],
  ];
  shops.forEach(function (shop) {
    if (!kenney[shop[0]]) return;
    const building = placeKenney(group, kenney[shop[0]], shop[1], shop[2], shop[3]);
    occluders.push(building);
    if (shop[4]) {
      const sign = makeSign(shop[4], shop[5], 3.4, 1.05);
      const side = shop[1] > 0 ? -1 : 1;
      sign.position.set(shop[1] + side * 2.7, 3.3, shop[2]);
      sign.rotation.y = shop[1] > 0 ? -Math.PI / 2 : Math.PI / 2;
      group.add(sign);
      if (!lite) glow(scene, sign.position.x, 4.2, sign.position.z, shop[5], 2.2, 8);
    }
  });

  placeKenney(group, kenney["low-detail-building-wide-a"], 16.5, 8, -Math.PI / 2);
  placeKenney(group, kenney["low-detail-building-a"], -16.5, 6, Math.PI / 2);
  placeKenney(group, kenney["building-j"], 0, -23.5, 0);
  const tower = placeKenney(group, kenney["building-skyscraper-e"], 0, -27, 0);
  occluders.push(tower);
  const leftWing = placeKenney(group, kenney["building-a"], -4.4, -16.2, 0);
  const rightWing = placeKenney(group, kenney["building-b"], 4.4, -16.2, 0);
  occluders.push(leftWing, rightWing);
  placeKenney(group, kenney["detail-awning-wide"], -1.7, -13.6, 0, 3.1);
  placeKenney(group, kenney["detail-awning-wide"], 1.7, -13.6, 0, 3.1);

  const marquee = makeSign("GAMES", "#ff3ec8", 6.4, 1.7, "TIYAH SINGH");
  marquee.position.set(0, 6.4, -13.4);
  group.add(marquee);
  if (!lite) {
    glow(scene, 0, 7.2, -12.2, 0xff3ec8, 4.5, 14);
    glow(scene, -3.2, 4, -14, 0xb14bff, 1.8, 7);
    glow(scene, 3.2, 4, -14, 0x7af0ff, 1.8, 7);
  }

  [[7.4, 10], [-7.4, 4], [7.4, -2], [-7.4, -8]].forEach(function (spot, index) {
    place(group, eh.lamp, spot[0], spot[1], spot[0] > 0 ? 0 : Math.PI);
    if (!lite) glow(scene, spot[0], 4.2, spot[1], index % 2 ? 0x7af0ff : 0xff3ec8, 1.4, 7);
  });
  place(group, eh.noodle, 7.6, 6.2, -Math.PI / 2);
  place(group, eh.vending, -7.5, -1.2, Math.PI / 2);
  place(group, eh.sign, 8.2, -8.5, -Math.PI / 2);
  place(group, eh.sign, -8.2, 12.5, Math.PI / 2);

  const markers = [];
  const doors = [
    entrance("about", 7.55, 9, Math.PI / 2, "ABOUT", "#ff3ec8", 4.6, -Math.PI / 2),
    entrance("skills", -7.55, 9, -Math.PI / 2, "SKILLS", "#b14bff", -4.6, Math.PI / 2),
    entrance("cv", 7.55, 3, Math.PI / 2, "CV", "#7af0ff", 4.6, -Math.PI / 2),
    entrance("contact", -7.55, 3, -Math.PI / 2, "CONTACT", "#ff3ec8", -4.6, Math.PI / 2),
  ];
  doors.forEach(function (door) {
    markers.push(addPortal(group, door.x, door.z, door.yaw, door.label, door.color, door.id));
  });
  const gamesSign = makeSign("GAMES", "#ff3ec8", 2.1, 0.85, "ARCADE");
  gamesSign.material.side = THREE.DoubleSide;
  gamesSign.position.set(0, 3.5, -12.7);
  gamesSign.userData.doorId = "games";
  group.add(gamesSign);
  markers.push({ mesh: gamesSign, base: 3.5, phase: 0.4 });
  doors.push({
    id: "games",
    x: 0,
    z: -14.6,
    label: "GAMES",
    color: "#ff3ec8",
    minX: -1.35,
    maxX: 1.35,
    minZ: -15.6,
    maxZ: -13.6,
    exitAt: new THREE.Vector3(0, 0, -11),
    yawOut: Math.PI,
  });

  group.updateMatrixWorld(true);
  const colliders = [];
  group.traverse(function (child) {
    if (!child.isMesh) return;
    const name = child.name.toLowerCase();
    if (!name.includes("building")) return;
    const box = new THREE.Box3().setFromObject(child);
    if (box.isEmpty()) return;
    colliders.push({ minX: box.min.x, maxX: box.max.x, minZ: box.min.z, maxZ: box.max.z });
  });

  return {
    group: group,
    colliders: colliders,
    grounds: grounds,
    occluders: occluders,
    cache: { eh: eh, kenney: kenney },
    doors: doors,
    markers: markers,
    bounds: { minX: -8.2, maxX: 8.2, minZ: -20, maxZ: 17 },
    spawn: new THREE.Vector3(0, 0, 14),
  };
}

async function loadSet(urls, names, prepare) {
  const loaded = await Promise.all(urls.map(function (url, index) {
    return loadModel(url).then(function (gltf) {
      prepare(gltf.scene);
      return [names[index], gltf.scene];
    });
  }));
  return Object.fromEntries(loaded);
}

function place(parent, source, x, z, rot) {
  const obj = source.clone(true);
  obj.position.set(x, 0, z);
  obj.rotation.y = rot || 0;
  parent.add(obj);
  return obj;
}

function placeKenney(parent, source, x, z, rot, y) {
  const obj = source.clone(true);
  obj.scale.setScalar(BUILDING);
  obj.position.set(x, y || 0, z);
  obj.rotation.y = rot || 0;
  parent.add(obj);
  return obj;
}

function entrance(id, x, z, yaw, label, color, exitX, yawOut) {
  return {
    id: id,
    x: x,
    z: z,
    yaw: yaw,
    label: label,
    color: color,
    minX: x - 0.85,
    maxX: x + 0.7,
    minZ: z - 0.9,
    maxZ: z + 0.9,
    exitAt: new THREE.Vector3(exitX, 0, z),
    yawOut: yawOut,
  };
}

function addPortal(group, x, z, yaw, label, color, doorId) {
  const frame = new THREE.Group();
  frame.position.set(x, 0, z);
  frame.rotation.y = yaw;
  frame.userData.doorId = doorId;
  const material = new THREE.MeshStandardMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: 1.7,
    roughness: 0.42,
  });
  const post = new THREE.BoxGeometry(0.14, 2.7, 0.14);
  [-1.1, 1.1].forEach(function (offset) {
    const mesh = new THREE.Mesh(post, material);
    mesh.position.set(offset, 1.35, 0);
    mesh.userData.doorId = doorId;
    frame.add(mesh);
  });
  const bar = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.12, 0.14), material);
  bar.position.set(0, 2.7, 0);
  bar.userData.doorId = doorId;
  frame.add(bar);
  /* Place name on the doorway — Enter is an HTML hover/click button instead */
  const sign = makeSign(label, color, 1.55, 0.58);
  sign.material.side = THREE.DoubleSide;
  sign.position.set(0, 1.55, 0.05);
  sign.rotation.y = -yaw;
  sign.userData.doorId = doorId;
  frame.add(sign);
  group.add(frame);
  return { mesh: sign, base: 1.55, phase: x + z, doorId: doorId };
}

function glow(scene, x, y, z, color, intensity, distance) {
  const light = new THREE.PointLight(color, intensity, distance, 2);
  light.position.set(x, y, z);
  scene.add(light);
}
