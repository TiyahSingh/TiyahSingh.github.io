import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { createStreet } from "./environment.js?v=13";
import { createPlayer } from "./player.js?v=5";
import { createCamera } from "./camera.js?v=6";
import { createLocations } from "./locations.js?v=17";

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
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  } catch (error) {
    showFallback(mount);
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setSize(mount.clientWidth, mount.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.shadowMap.enabled = true;
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.28;
  pmrem.dispose();

  const fade = document.createElement("div");
  fade.className = "location-fade";
  fade.textContent = "Entering";
  document.body.appendChild(fade);
  const panel = createPanel();
  const hud = document.querySelector(".explore-hud");
  const act = document.getElementById("explore-act");
  if (act) {
    act.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      openMachine();
    });
  }

  let street;
  let player;
  let projects;
  let profile;
  try {
    const loaded = await Promise.all([
      createStreet(scene),
      createPlayer(),
      fetch("/js/explore/projects.json").then(function (response) { return response.json(); }),
      fetch("/js/explore/profile.json").then(function (response) { return response.json(); }),
    ]);
    street = loaded[0];
    player = loaded[1];
    projects = loaded[2];
    profile = loaded[3];
  } catch (error) {
    showFallback(mount, "The street models could not be loaded. " + (error && error.message ? error.message : ""));
    return;
  }

  scene.add(player.group);
  const rig = createCamera(mount.clientWidth / Math.max(mount.clientHeight, 1));
  rig.setOccluders(street.occluders);
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, rig.camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(mount.clientWidth, mount.clientHeight), 0.14, 0.12, 0.9);
  composer.addPass(bloom);

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
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function setKey(event, down) {
    const box = mount.getBoundingClientRect();
    if (box.bottom < 80 || box.top > window.innerHeight - 40) return;
    const key = event.key.toLowerCase();
    if (key === "w" || key === "arrowup") input.forward = down;
    else if (key === "s" || key === "arrowdown") input.back = down;
    else if (key === "a" || key === "arrowleft") input.left = down;
    else if (key === "d" || key === "arrowright") input.right = down;
    else if (down && (key === "e" || key === "enter")) openMachine();
    else if (down && key === "escape") panel.hidden = true;
    else return;
    event.preventDefault();
  }

  function openMachine() {
    const project = places.interact();
    if (!project) return;
    fillPanel(panel, project);
    panel.hidden = false;
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

  renderer.domElement.addEventListener("pointerdown", function (event) {
    if (!panel.hidden && panel.contains(event.target)) return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, rig.camera);
    const world = places.active();
    const hits = raycaster.intersectObjects(world.grounds, false);
    if (hits[0]) player.walkTo(hits[0].point);
  });

  function resize() {
    const width = mount.clientWidth;
    const height = Math.max(mount.clientHeight, 1);
    renderer.setSize(width, height);
    composer.setSize(width, height);
    rig.resize(width / height);
  }
  window.addEventListener("resize", resize);
  resize();

  let last = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    const world = places.active();
    player.update(dt, input, rig.camera, world.colliders, world.bounds);
    places.update();
    if (hud) hud.textContent = places.prompt();
    if (act) {
      const next = places.action();
      if (next) {
        act.hidden = false;
        act.textContent = next.label + " · " + next.detail;
        act.setAttribute("aria-label", next.label + " " + next.detail);
      } else {
        act.hidden = true;
      }
    }
    rig.update(dt, player.group, reduced);
    composer.render();
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
  }
}

function createPanel() {
  const panel = document.createElement("aside");
  panel.className = "project-screen";
  panel.hidden = true;
  panel.innerHTML = "<button type='button' class='pixel-btn project-close'>Close</button><img alt=''><h2></h2><p class='meta'></p><p class='project-copy'></p><p class='project-role'></p><p class='project-tech'></p><p class='project-links'></p>";
  panel.querySelector(".project-close").addEventListener("click", function () { panel.hidden = true; });
  document.body.appendChild(panel);
  return panel;
}

function fillPanel(panel, project) {
  const image = panel.querySelector("img");
  if (project.poster) {
    image.hidden = false;
    image.src = project.poster;
    image.alt = "Poster for " + project.title;
  } else {
    image.hidden = true;
    image.removeAttribute("src");
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
