import { createGamesInterior } from "./interior-games.js?v=10";
import { createInterior } from "./interior-rooms.js?v=1";

const LABEL = {
  about: "About",
  skills: "Skills",
  games: "Games",
  cv: "CV",
  contact: "Contact",
};

export function createLocations(options) {
  const scene = options.scene;
  const street = options.street;
  const player = options.player;
  const camera = options.camera;
  const fade = options.fade;
  const projects = options.projects;
  const profile = options.profile;
  const onPlace = options.onPlace || function () {};
  const interiors = {};
  let place = "street";
  let busy = false;
  let nearest = null;
  const armed = {};
  street.doors.forEach(function (door) { armed[door.id] = true; });
  let exitArmed = false;

  function current() {
    return place === "street" ? street : interiors[place];
  }

  function active() {
    return current();
  }

  function contains(box, point) {
    return point.x > box.minX && point.x < box.maxX && point.z > box.minZ && point.z < box.maxZ;
  }

  function ensure(id) {
    if (!interiors[id]) {
      interiors[id] = id === "games"
        ? createGamesInterior(scene, street.cache, projects)
        : createInterior(scene, street.cache, profile, id);
    }
    return interiors[id];
  }

  function standOutside(doorId) {
    Object.keys(interiors).forEach(function (id) { interiors[id].group.visible = false; });
    street.group.visible = true;
    const door = street.doors.find(function (item) { return item.id === doorId; });
    if (door) {
      player.group.position.copy(door.exitAt);
      player.group.rotation.y = door.yawOut + Math.PI;
      armed[door.id] = false;
    }
    camera.setMode("street");
    camera.setOccluders(street.occluders);
    place = "street";
    nearest = null;
    onPlace("street");
  }

  async function arrive(doorId) {
    if (busy) return;
    busy = true;
    try {
      fade.textContent = "Outside " + (LABEL[doorId] || "door");
      fade.classList.add("is-on");
      await wait(180);
      standOutside(doorId);
      const hash = "#explore/at/" + doorId;
      if (location.hash !== hash) {
        history.replaceState({ place: "street", at: doorId }, "", "/explore.html" + hash);
      }
    } finally {
      fade.classList.remove("is-on");
      busy = false;
    }
  }

  async function go(next) {
    if (busy || place === next) return;
    if (next === "about") {
      busy = true;
      fade.textContent = "About";
      fade.classList.add("is-on");
      await wait(120);
      location.assign("/about.html?from=explore");
      return;
    }
    if (next === "skills") {
      busy = true;
      fade.textContent = "Skill Galaxy";
      fade.classList.add("is-on");
      await wait(120);
      location.assign("/skills.html?from=explore");
      return;
    }
    if (next === "cv") {
      busy = true;
      fade.textContent = "Digital CV";
      fade.classList.add("is-on");
      await wait(120);
      location.assign("/cv.html?from=explore");
      return;
    }
    if (next === "contact") {
      busy = true;
      fade.textContent = "Contact";
      fade.classList.add("is-on");
      await wait(120);
      location.assign("/contact.html?from=explore");
      return;
    }
    busy = true;
    fade.classList.add("is-on");
    await wait(160);
    const leaving = place;
    if (next === "street") {
      const door = street.doors.find(function (item) { return item.id === leaving; });
      Object.keys(interiors).forEach(function (id) { interiors[id].group.visible = false; });
      street.group.visible = true;
      if (door) {
        player.group.position.copy(door.exitAt);
        player.group.rotation.y = door.yawOut;
        armed[door.id] = false;
      }
      camera.setMode("street");
      camera.setOccluders(street.occluders);
      place = "street";
      if (location.hash.indexOf("#explore/") === 0) {
        history.pushState({ place: "street" }, "", "#play");
      }
    } else {
      const interior = ensure(next);
      street.group.visible = false;
      Object.keys(interiors).forEach(function (id) { interiors[id].group.visible = id === next; });
      player.group.position.copy(interior.spawn);
      player.group.rotation.y = Math.PI;
      camera.setMode("room");
      camera.setOccluders(interior.occluders);
      place = next;
      exitArmed = false;
      nearest = null;
      const hash = "#explore/" + next;
      if (location.hash !== hash) history.pushState({ place: next }, "", hash);
    }
    onPlace(place);
    fade.classList.remove("is-on");
    await wait(420);
    busy = false;
  }

  function hotspots() {
    const interior = interiors[place];
    if (!interior) return [];
    if (interior.spots) return interior.spots;
    return (interior.machines || []).map(function (machine) {
      return { object: machine.object, info: machine.project };
    });
  }

  function update() {
    const time = performance.now() / 1000;
    street.markers.forEach(function (marker) {
      marker.mesh.position.y = marker.base + Math.sin(time * 2.1 + marker.phase) * 0.16;
    });
    if (busy) return;
    const point = player.group.position;
    if (place === "street") {
      let entered = null;
      street.doors.forEach(function (door) {
        const inside = contains(door, point);
        if (!inside) armed[door.id] = true;
        else if (armed[door.id]) entered = door.id;
      });
      nearest = null;
      if (entered) go(entered);
      return;
    }
    const interior = interiors[place];
    if (!interior) return;
    const leaving = contains(interior.exit, point);
    if (!leaving) exitArmed = true;
    else if (exitArmed) go("street");
    nearest = null;
    let best = place === "games" ? 4.2 : 2.5;
    hotspots().forEach(function (spot) {
      const dx = spot.object.position.x - point.x;
      const dz = spot.object.position.z - point.z;
      const distance = Math.hypot(dx, dz);
      if (distance < best) {
        best = distance;
        nearest = spot;
      }
    });
  }

  function interact() {
    if (!nearest) return null;
    return nearest.info;
  }

  function nearDoor(maxDist) {
    const point = player.group.position;
    let best = null;
    let score = maxDist == null ? 4.8 : maxDist;
    street.doors.forEach(function (door) {
      const centerX = (door.minX + door.maxX) / 2;
      const centerZ = (door.minZ + door.maxZ) / 2;
      const distance = Math.hypot(centerX - point.x, centerZ - point.z);
      if (distance < score) {
        score = distance;
        best = door;
      }
    });
    return best;
  }

  function nearExit() {
    if (place === "street") return false;
    const interior = interiors[place];
    if (!interior || !interior.exit) return false;
    const point = player.group.position;
    const centerX = (interior.exit.minX + interior.exit.maxX) / 2;
    const centerZ = (interior.exit.minZ + interior.exit.maxZ) / 2;
    return Math.hypot(centerX - point.x, centerZ - point.z) < 3.6;
  }

  function doorById(id) {
    return street.doors.find(function (door) { return door.id === id; }) || null;
  }

  function doorCenter(door) {
    return {
      x: (door.minX + door.maxX) / 2,
      y: 0,
      z: (door.minZ + door.maxZ) / 2,
    };
  }

  function action(hoveredId) {
    if (place === "street") {
      const door = (hoveredId && doorById(hoveredId)) || nearDoor(5.2);
      if (door) {
        return {
          kind: "enter",
          id: door.id,
          label: "Enter",
          detail: LABEL[door.id] || door.label || door.id,
        };
      }
      return null;
    }
    if (nearExit()) {
      return {
        kind: "exit",
        id: "street",
        label: "Exit",
        detail: place === "games" ? "Arcade → Street" : "Back to street",
      };
    }
    if (nearest && nearest.info) {
      return { kind: "read", label: "Read", detail: nearest.info.title };
    }
    return null;
  }

  function prompt(hoveredId) {
    const touch = window.matchMedia("(pointer: coarse), (max-width: 860px)").matches;
    const next = action(hoveredId);
    let text = "";
    if (next && next.kind === "enter") {
      text = touch
        ? "ENTER " + next.detail + " — TAP ENTER"
        : "ENTER " + next.detail + " — TAP THE BUTTON OR WALK IN";
    } else if (next && next.kind === "exit") {
      text = touch
        ? next.detail + " — TAP EXIT"
        : next.detail + " — TAP EXIT OR WALK THROUGH THE DOOR";
    } else if (next && next.kind === "read") {
      text = next.detail;
    } else if (place === "games") {
      text = touch
        ? "WALK TO A CABINET, THEN TAP READ · EXIT DOOR LEAVES"
        : "WALK TO A CABINET, THEN TAP READ. FIND THE CYAN EXIT DOOR TO LEAVE.";
    } else if (place !== "street") {
      text = touch
        ? "WALK TO A GLOWING SIGN, THEN TAP READ"
        : "WALK TO A GLOWING SIGN, THEN TAP READ. WALK OUT THE DOOR TO RETURN.";
    } else {
      text = touch
        ? "TAP THE ROAD OR USE THE PAD · TAP A DOOR TO ENTER"
        : "WASD / ARROWS MOVE · TAP THE ROAD · HOVER A DOORWAY FOR ENTER";
    }
    return String(text || "").toUpperCase();
  }

  return {
    update: update,
    interact: interact,
    action: action,
    prompt: prompt,
    go: go,
    arrive: arrive,
    standOutside: standOutside,
    active: active,
    nearDoor: nearDoor,
    doorById: doorById,
    doorCenter: doorCenter,
    place: function () { return place; },
  };
}

function wait(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms); });
}
