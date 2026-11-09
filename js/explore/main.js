import * as THREE from "three";
import { createStreet } from "./environment.js?v=18";
import { createPlayer } from "./player.js?v=7";
import { createCamera } from "./camera.js?v=6";
import { createLocations } from "./locations.js?v=26";

const WRITTEN = {
  "#about": "/about.html",
  "#skills": "/skills.html",
  "#work": "/games.html",
  "#cv": "/cv.html",
  "#contact": "/contact.html",
  "#education": "/cv.html",
  "#awards": "/cv.html",
};
const EXPLORE = {
  "#explore/about": "about",
  "#explore/skills": "skills",
  "#explore/games": "games",
  "#explore/cv": "cv",
  "#explore/contact": "contact",
};
const ARRIVE = {
  "#explore/at/about": "about",
  "#explore/at/skills": "skills",
  "#explore/at/games": "games",
  "#explore/at/cv": "cv",
  "#explore/at/contact": "contact",
};

const root = document.getElementById("explore-root");
if (WRITTEN[location.hash]) location.replace(WRITTEN[location.hash]);
else if (root) boot(root);

async function boot(mount) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = window.matchMedia("(max-width: 820px), (pointer: coarse)").matches;
  const lite = reduced || mobile || (navigator.hardwareConcurrency || 8) <= 4;

  const loading = document.createElement("p");
  loading.className = "explore-loading";
  loading.textContent = "Loading the street…";
  mount.appendChild(loading);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: !lite,
      alpha: false,
      powerPreference: lite ? "low-power" : "high-performance",
    });
  } catch (error) {
    loading.remove();
    showFallback(mount);
    return;
  }

  renderer.setClearColor(0x100814, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lite ? 1.1 : 1.35));
  renderer.setSize(Math.max(mount.clientWidth, 1), Math.max(mount.clientHeight, 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.shadowMap.enabled = !lite;
  if (renderer.shadowMap.enabled) renderer.shadowMap.type = THREE.BasicShadowMap;
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x100814);

  if (!lite) {
    try {
      const { RoomEnvironment } = await import("three/addons/environments/RoomEnvironment.js");
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environmentIntensity = 0.28;
      pmrem.dispose();
    } catch (error) {
      scene.add(new THREE.AmbientLight(0xffb0e8, 0.35));
    }
  } else {
    scene.add(new THREE.AmbientLight(0xffb0e8, 0.42));
  }

  const fade = document.createElement("div");
  fade.className = "location-fade";
  fade.textContent = "Entering";
  document.body.appendChild(fade);
  const panel = createPanel();
  const hud = document.querySelector(".explore-hud");
  const act = document.getElementById("explore-act");
  let hoveredDoorId = null;
  if (act) {
    act.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      const next = places.action(hoveredDoorId);
      if (!next) return;
      if (next.kind === "enter" || next.kind === "exit") places.go(next.id);
      else openMachine();
    });
  }

  let street;
  let player;
  let projects;
  let profile;
  try {
    const loaded = await Promise.all([
      createStreet(scene, { lite: lite }),
      createPlayer({ lite: lite }),
      fetch("/js/explore/projects.json").then(function (response) { return response.json(); }),
      fetch("/js/explore/profile.json").then(function (response) { return response.json(); }),
    ]);
    street = loaded[0];
    player = loaded[1];
    projects = loaded[2];
    profile = loaded[3];
  } catch (error) {
    loading.remove();
    showFallback(mount, "The street models could not be loaded. " + (error && error.message ? error.message : ""));
    return;
  }

  loading.remove();
  scene.add(player.group);
  const rig = createCamera(mount.clientWidth / Math.max(mount.clientHeight, 1));
  rig.setOccluders(street.occluders);

  let composer = null;
  if (!lite) {
    try {
      const { EffectComposer } = await import("three/addons/postprocessing/EffectComposer.js");
      const { RenderPass } = await import("three/addons/postprocessing/RenderPass.js");
      const { UnrealBloomPass } = await import("three/addons/postprocessing/UnrealBloomPass.js");
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, rig.camera));
      composer.addPass(new UnrealBloomPass(new THREE.Vector2(mount.clientWidth, mount.clientHeight), 0.12, 0.1, 0.92));
    } catch (error) {
      composer = null;
    }
  }

  const places = createLocations({
    scene: scene,
    street: street,
    player: player,
    camera: rig,
    fade: fade,
    projects: projects,
    profile: profile,
    onPlace: function (place) {
      const names = { about: "About", skills: "Skills", games: "Games arcade", cv: "CV", contact: "Contact" };
      fade.textContent = names[place] || "Back on the street";
      panel.hidden = true;
    },
  });

  const input = { forward: false, back: false, left: false, right: false };
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const coarse = window.matchMedia("(pointer: coarse), (max-width: 860px)").matches;
  if (hud) {
    hud.textContent = coarse
      ? "TAP THE ROAD TO WALK · TAP A DOOR TO ENTER"
      : "WASD / ARROWS MOVE · TAP THE ROAD · HOVER A DOORWAY FOR ENTER";
    hud.classList.add("is-intro");
  }
  if (hud) {
    const syncCaps = function () {
      if (hud.textContent !== hud.textContent.toUpperCase()) {
        hud.textContent = hud.textContent.toUpperCase();
      }
    };
    syncCaps();
    const capsWatch = new MutationObserver(syncCaps);
    capsWatch.observe(hud, { characterData: true, childList: true, subtree: true });
  }
  bindPad(input);

  function setKey(event, down) {
    const box = mount.getBoundingClientRect();
    if (box.bottom < 80 || box.top > window.innerHeight - 40) return;
    const key = event.key.toLowerCase();
    if (key === "w" || key === "arrowup") input.forward = down;
    else if (key === "s" || key === "arrowdown") input.back = down;
    else if (key === "a" || key === "arrowleft") input.left = down;
    else if (key === "d" || key === "arrowright") input.right = down;
    else if (down && (key === "e" || key === "enter")) {
      const next = places.action(hoveredDoorId);
      if (next && (next.kind === "enter" || next.kind === "exit")) places.go(next.id);
      else openMachine();
    }
    else if (down && key === "escape") panel.hidden = true;
    else return;
    event.preventDefault();
  }

  function openMachine() {
    const project = places.interact();
    if (!project) return;
    if (project.href) {
      location.href = project.href;
      return;
    }
    if (project.slug) {
      location.href = "/games/" + project.slug + ".html";
      return;
    }
    fillPanel(panel, project);
    panel.hidden = false;
  }

  function doorIdFromObject(object) {
    let node = object;
    while (node) {
      if (node.userData && node.userData.doorId) return node.userData.doorId;
      node = node.parent;
    }
    return null;
  }

  function pickDoor(clientX, clientY) {
    if (places.place() !== "street") return null;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, rig.camera);
    const hits = raycaster.intersectObjects(street.group.children, true);
    for (let i = 0; i < hits.length; i += 1) {
      const id = doorIdFromObject(hits[i].object);
      if (id) return id;
    }
    return null;
  }

  window.addEventListener("keydown", function (event) { setKey(event, true); });
  window.addEventListener("keyup", function (event) { setKey(event, false); });
  window.addEventListener("hashchange", function () {
    if (WRITTEN[location.hash]) {
      location.assign(WRITTEN[location.hash]);
      return;
    }
    const at = ARRIVE[location.hash];
    if (at) {
      places.arrive(at);
      return;
    }
    const next = EXPLORE[location.hash];
    if (next) {
      if (places.place() !== next) places.go(next);
      return;
    }
    if (places.place() !== "street") places.go("street");
  });

  renderer.domElement.addEventListener("pointermove", function (event) {
    hoveredDoorId = pickDoor(event.clientX, event.clientY);
    renderer.domElement.style.cursor = hoveredDoorId ? "pointer" : "";
  });

  renderer.domElement.addEventListener("pointerdown", function (event) {
    if (!panel.hidden && panel.contains(event.target)) return;
    const doorId = pickDoor(event.clientX, event.clientY);
    if (doorId) {
      hoveredDoorId = doorId;
      const door = places.doorById(doorId);
      if (door) {
        const center = places.doorCenter(door);
        const dx = center.x - player.group.position.x;
        const dz = center.z - player.group.position.z;
        if (Math.hypot(dx, dz) < 3.2) places.go(doorId);
        else player.walkTo(center);
      }
      return;
    }
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, rig.camera);
    const world = places.active();
    const hits = raycaster.intersectObjects(world.grounds, false);
    if (hits[0]) player.walkTo(hits[0].point);
  });

  function resize() {
    const width = Math.max(mount.clientWidth, 1);
    const height = Math.max(mount.clientHeight, 1);
    renderer.setSize(width, height);
    if (composer) composer.setSize(width, height);
    rig.resize(width / height);
  }
  window.addEventListener("resize", resize);
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", resize);
  }
  resize();

  let last = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    const world = places.active();
    player.update(dt, input, rig.camera, world.colliders, world.bounds);
    places.update();
    if (hud) hud.textContent = places.prompt(hoveredDoorId);
    if (act) {
      const next = places.action(hoveredDoorId);
      if (next) {
        act.hidden = false;
        act.textContent = next.label + " · " + next.detail;
        act.setAttribute("aria-label", next.label + " " + next.detail);
        act.dataset.kind = next.kind || "";
      } else {
        act.hidden = true;
        act.dataset.kind = "";
      }
    }
    rig.update(dt, player.group, reduced);
    if (composer) composer.render();
    else renderer.render(scene, rig.camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  const doorParam = new URLSearchParams(location.search).get("door");
  const arriveId = doorParam || ARRIVE[location.hash];
  if (arriveId) {
    places.standOutside(arriveId);
    if (doorParam) {
      history.replaceState({ place: "street", at: arriveId }, "", "/explore.html#explore/at/" + arriveId);
    }
  } else if (EXPLORE[location.hash]) {
    places.go(EXPLORE[location.hash]);
  } else {
    flashGuidePaths(scene, player, places, street, reduced);
  }

  window.setTimeout(function () {
    if (hud) hud.classList.remove("is-intro");
  }, 3200);
}

function flashGuidePaths(scene, player, places, street, reduced) {
  if (reduced || !street || !street.doors || !street.doors.length) return;
  const guides = new THREE.Group();
  guides.name = "guide-paths";
  scene.add(guides);
  const start = player.group.position.clone();
  start.y = 0.1;
  street.doors.forEach(function (door, index) {
    const end = places.doorCenter(door);
    end.y = 0.1;
    const isGames = door.id === "games";
    const points = [];
    const steps = isGames ? 16 : 10;
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      points.push(new THREE.Vector3(
        start.x + (end.x - start.x) * t,
        0.12 + Math.sin(t * Math.PI) * (isGames ? 0.16 : 0.08),
        start.z + (end.z - start.z) * t
      ));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, isGames ? 36 : 24, isGames ? 0.16 : 0.07, 8, false),
      new THREE.MeshBasicMaterial({
        color: isGames ? 0xffd15c : (index % 2 === 0 ? 0xff4eb8 : 0x7af0ff),
        transparent: true,
        opacity: isGames ? 1 : 0.85,
        depthWrite: false,
      })
    );
    tube.userData.guideBoost = isGames ? 1 : 0.82;
    guides.add(tube);
    if (isGames) {
      const outer = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 36, 0.28, 8, false),
        new THREE.MeshBasicMaterial({
          color: 0xff3ec8,
          transparent: true,
          opacity: 0.35,
          depthWrite: false,
        })
      );
      outer.userData.guideBoost = 0.4;
      guides.add(outer);
    }
    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(isGames ? 0.38 : 0.22, 14, 14),
      new THREE.MeshBasicMaterial({
        color: isGames ? 0xffd15c : 0xff9adf,
        transparent: true,
        opacity: 0.98,
      })
    );
    beacon.position.set(end.x, isGames ? 0.75 : 0.55, end.z);
    beacon.userData.guideBoost = isGames ? 1.1 : 1;
    guides.add(beacon);
  });

  const born = performance.now();
  const life = 3400;
  function fadeGuides(now) {
    const age = now - born;
    const opacity = age < 1100 ? 1 : Math.max(0, 1 - (age - 1100) / (life - 1100));
    guides.children.forEach(function (child) {
      if (!child.material) return;
      const boost = child.userData.guideBoost || 0.85;
      child.material.opacity = opacity * boost;
    });
    if (age < life) requestAnimationFrame(fadeGuides);
    else {
      scene.remove(guides);
      guides.traverse(function (child) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
    }
  }
  requestAnimationFrame(fadeGuides);
}

function createPanel() {
  const panel = document.createElement("aside");
  panel.className = "project-screen";
  panel.hidden = true;
  panel.innerHTML = "<button type='button' class='pixel-btn project-close'>Close</button><div class='project-media'></div><h2></h2><p class='meta'></p><p class='project-copy'></p><p class='project-role'></p><p class='project-tech'></p><p class='project-links'></p>";
  panel.querySelector(".project-close").addEventListener("click", function () { panel.hidden = true; });
  document.body.appendChild(panel);
  return panel;
}

function fillPanel(panel, project) {
  const media = panel.querySelector(".project-media");
  media.replaceChildren();
  if (project.poster) {
    const image = document.createElement("img");
    image.src = project.poster;
    image.alt = "Poster for " + project.title;
    media.appendChild(image);
  }
  panel.querySelector("h2").textContent = project.title;
  panel.querySelector(".meta").textContent = project.genre || project.meta || "";
  panel.querySelector(".project-copy").textContent = project.card || project.copy || "";
  panel.querySelector(".project-role").textContent = project.role || "";
  panel.querySelector(".project-tech").textContent = project.tech ? project.tech.join(" · ") : (project.tools || "");
  const links = panel.querySelector(".project-links");
  links.replaceChildren();
  if (project.links) project.links.forEach(function (link) { addLink(links, link.href, link.label); });
  else {
    addLink(links, project.demo, project.demoLabel);
    addLink(links, project.download, project.downloadLabel);
  }
}

function addLink(parent, href, label) {
  if (!href) return;
  const link = document.createElement("a");
  link.href = href;
  link.textContent = label;
  link.target = "_blank";
  link.rel = "noopener";
  parent.appendChild(link);
}

function showFallback(mount, message) {
  const note = document.createElement("p");
  note.className = "explore-fallback";
  note.textContent = message || "This browser could not start the 3D street. The portfolio pages below are still available from the menu.";
  mount.appendChild(note);
}

function bindPad(input) {
  const pad = document.getElementById("explore-pad");
  if (!pad) return;
  const map = {
    forward: "forward",
    back: "back",
    left: "left",
    right: "right",
  };
  function setDir(dir, down) {
    if (!map[dir]) return;
    input[map[dir]] = down;
  }
  pad.querySelectorAll("[data-dir]").forEach(function (btn) {
    const dir = btn.getAttribute("data-dir");
    btn.addEventListener("pointerdown", function (event) {
      event.preventDefault();
      event.stopPropagation();
      btn.setPointerCapture(event.pointerId);
      setDir(dir, true);
      btn.classList.add("is-held");
    });
    btn.addEventListener("pointerup", function (event) {
      event.preventDefault();
      setDir(dir, false);
      btn.classList.remove("is-held");
    });
    btn.addEventListener("pointercancel", function () {
      setDir(dir, false);
      btn.classList.remove("is-held");
    });
    btn.addEventListener("lostpointercapture", function () {
      setDir(dir, false);
      btn.classList.remove("is-held");
    });
  });
  window.addEventListener("blur", function () {
    input.forward = false;
    input.back = false;
    input.left = false;
    input.right = false;
    pad.querySelectorAll(".is-held").forEach(function (btn) {
      btn.classList.remove("is-held");
    });
  });
}
