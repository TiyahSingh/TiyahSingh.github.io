import * as THREE from "three";
import { makeSign } from "./load.js";

const textureLoader = new THREE.TextureLoader();

export function createInterior(scene, cache, profile, id) {
  if (id === "about") return aboutRoom(scene, cache, profile.about);
  if (id === "skills") return skillsRoom(scene, cache, profile.skills);
  if (id === "cv") return cvRoom(scene, cache, profile.cv);
  return contactRoom(scene, cache, profile.contact);
}

function aboutRoom(scene, cache, about) {
  const room = shell(scene, cache, "about", 0xff3ec8);
  const frame = new THREE.Mesh(
    new THREE.PlaneGeometry(1.7, 2.05),
    new THREE.MeshStandardMaterial({ color: 0xff3ec8, emissive: 0xff3ec8, emissiveIntensity: 0.45, roughness: 0.5 })
  );
  const photo = new THREE.Mesh(
    new THREE.PlaneGeometry(1.45, 1.8),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  photo.position.z = 0.03;
  const portrait = new THREE.Group();
  portrait.add(frame, photo);
  portrait.position.set(0, 1.85, -4.35);
  room.group.add(portrait);
  textureLoader.load("/assets/portrait.jpg", function (texture) {
    texture.colorSpace = THREE.SRGBColorSpace;
    photo.material.map = texture;
    photo.material.needsUpdate = true;
  });
  room.spots.push(kiosk(room, "INTRO", "#ff3ec8", -2.3, -1.5, {
    title: "Tiyah Singh",
    meta: "Player 01",
    copy: about.intro,
    role: about.portfolio,
  }));
  room.spots.push(kiosk(room, "PLAYER FILE", "#b14bff", 2.3, -1.5, {
    title: "Player file",
    meta: "Programming · Game design · UI and UX · Story",
    copy: about.file,
  }));
  return finish(room);
}

function skillsRoom(scene, cache, skills) {
  const room = shell(scene, cache, "skills", 0x7af0ff);
  const xs = [-2.5, 0, 2.5];
  skills.forEach(function (skill, index) {
    const x = xs[index % 3];
    const z = index < 3 ? -3.5 : -1.2;
    room.spots.push(kiosk(room, skill.label, index % 2 ? "#7af0ff" : "#b14bff", x, z, {
      title: skill.title,
      meta: skill.tools,
      copy: skill.copy,
    }));
  });
  return finish(room);
}

function cvRoom(scene, cache, cv) {
  const room = shell(scene, cache, "cv", 0xb14bff);
  room.spots.push(kiosk(room, "EDUCATION", "#b14bff", -2.4, -2.2, {
    title: "Education",
    meta: "Vega · Johannesburg",
    copy: cv.intro,
    role: cv.education.join(" "),
  }));
  room.spots.push(kiosk(room, "ACHIEVEMENTS", "#7af0ff", 2.4, -2.2, {
    title: "Achievements",
    meta: "Record",
    copy: cv.achievements.join(" "),
  }));
  room.spots.push(kiosk(room, "CV FILE", "#ff3ec8", 0, 0.2, {
    title: "Download CV",
    meta: "No file on the site yet",
    copy: cv.download,
    links: [{ href: "/cv.html", label: "Open the CV page" }],
  }));
  return finish(room);
}

function contactRoom(scene, cache, contact) {
  const room = shell(scene, cache, "contact", 0xff3ec8);
  contact.links.forEach(function (link, index) {
    const booth = cache.eh.vending.clone(true);
    const x = [-2.5, 0, 2.5][index];
    booth.position.set(x, 0, -2.6);
    room.group.add(booth);
    const label = makeSign(link.label, index === 1 ? "#b14bff" : "#ff3ec8", 1.5, 0.48);
    label.position.set(x, 2.35, -2.15);
    room.group.add(label);
    room.spots.push({
      object: booth,
      info: {
        title: link.title,
        meta: contact.blurb,
        copy: link.text,
        links: [{ href: link.href, label: link.text }],
      },
    });
    room.colliders.push({ minX: x - 0.7, maxX: x + 0.7, minZ: -3.2, maxZ: -2.0 });
  });
  return finish(room);
}

function shell(scene, cache, id, color) {
  const group = new THREE.Group();
  group.name = id + "-interior";
  group.visible = false;
  scene.add(group);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 12),
    new THREE.MeshStandardMaterial({ color: 0x120814, metalness: 0.35, roughness: 0.55 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.name = "ground";
  floor.receiveShadow = true;
  group.add(floor);

  const title = makeSign(id.toUpperCase(), "#" + color.toString(16).padStart(6, "0"), 3.2, 0.8);
  title.position.set(0, 3.3, -4.7);
  group.add(title);

  const occluders = [];
  [[6.4, -0.4, Math.PI / 2], [-6.4, -0.4, -Math.PI / 2], [0, -5.6, Math.PI]].forEach(function (spot) {
    const wall = cache.kenney["low-detail-building-wide-a"].clone(true);
    wall.scale.setScalar(3.6);
    wall.position.set(spot[0], 0, spot[1]);
    wall.rotation.y = spot[2];
    group.add(wall);
    occluders.push(wall);
  });

  const lamp = new THREE.PointLight(color, 5, 14, 2);
  lamp.position.set(0, 3.2, -1);
  group.add(lamp);

  return { group: group, grounds: [floor], occluders: occluders, colliders: [], spots: [] };
}

function kiosk(room, label, color, x, z, info) {
  const sign = makeSign(label, color, 1.7, 0.72);
  sign.position.set(x, 1.45, z);
  room.group.add(sign);
  room.colliders.push({ minX: x - 0.7, maxX: x + 0.7, minZ: z - 0.2, maxZ: z + 0.2 });
  return { object: sign, info: info };
}

function finish(room) {
  room.group.updateMatrixWorld(true);
  return {
    group: room.group,
    grounds: room.grounds,
    occluders: room.occluders,
    colliders: room.colliders,
    spots: room.spots,
    exit: { minX: -1.3, maxX: 1.3, minZ: 4.15, maxZ: 5.3 },
    bounds: { minX: -4.4, maxX: 4.4, minZ: -4.3, maxZ: 4.7 },
    spawn: new THREE.Vector3(0, 0, 2.5),
  };
}
