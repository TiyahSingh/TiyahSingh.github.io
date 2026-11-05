import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const loader = new GLTFLoader();
const baked = new Map();

export function loadModel(url) {
  return loader.loadAsync(url);
}

export function tuneFlat(root) {
  root.traverse(function (child) {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
    const list = Array.isArray(child.material) ? child.material : [child.material];
    list.forEach(function (material) {
      if (!material || material.userData.tuned) return;
      const name = (material.name || "").toLowerCase();
      if ("clearcoat" in material) material.clearcoat = 0;
      if (name.includes("asphalt") || name.includes("grate") || name.includes("concrete")) {
        material.map = null;
        material.emissiveMap = null;
        material.color.set(name.includes("concrete") ? 0x1c1424 : 0x121016);
        material.metalness = 0;
        material.roughness = 1;
        material.envMapIntensity = 0.22;
      } else if (name.includes("puddle")) {
        material.map = null;
        material.color.set(0x1a1422);
        material.metalness = 0.45;
        material.roughness = 0.38;
        material.envMapIntensity = 0.3;
      } else if (name.includes("neonorange") || name.includes("warm")) {
        material.color.set(0xff3ec8);
        material.emissive.set(0xff3ec8);
        material.emissiveIntensity = name.includes("face") ? 0.85 : 1.5;
      } else if (name.includes("neongreen")) {
        material.color.set(0x7af0ff);
        material.emissive.set(0x7af0ff);
        material.emissiveIntensity = 2.2;
      } else if (name.includes("magenta") || name.includes("tarp") || name.includes("cloth")) {
        material.color.set(0xff4ad4);
        if (name.includes("neon") || name.includes("magenta")) {
          material.emissive.set(0xff3ec8);
          material.emissiveIntensity = 2.3;
        }
      } else if (name.includes("cyan") || name.includes("neonwhite")) {
        material.emissiveIntensity = Math.max(material.emissiveIntensity || 1, 2);
      } else if (name.includes("glass")) {
        material.transparent = true;
        material.opacity = 0.35;
        material.emissive.set(0x7af0ff);
        material.emissiveIntensity = 0.6;
      } else {
        material.color.multiply(new THREE.Color(0.45, 0.32, 0.62));
        material.roughness = 0.62;
        material.metalness = 0.18;
      }
      material.userData.tuned = true;
      material.needsUpdate = true;
    });
  });
}

export function tuneCity(root, road, lite) {
  root.traverse(function (child) {
    if (!child.isMesh) return;
    child.castShadow = !lite;
    child.receiveShadow = !lite;
    const list = Array.isArray(child.material) ? child.material : [child.material];
    list.forEach(function (material) {
      if (!material || material.userData.tuned) return;
      /* Keep textures on mobile/lite — flat pink wash looked broken */
      if (!material.map) {
        material.color = new THREE.Color(road ? 0x2a1838 : 0x3a2458);
        material.emissive = new THREE.Color(road ? 0x180818 : 0x6a3088);
        material.emissiveIntensity = road ? 0.12 : 0.22;
        material.roughness = road ? 0.35 : 0.62;
        material.metalness = road ? 0.45 : 0.12;
        material.emissiveMap = null;
      } else {
        const maps = neonize(material.map, lite ? 256 : 512);
        material.map = maps.color;
        material.emissiveMap = maps.glow;
        material.emissive = new THREE.Color(0xffffff);
        material.emissiveIntensity = road ? 0.35 : (lite ? 0.72 : 0.9);
        material.color = new THREE.Color(0xffffff);
        material.roughness = road ? 0.22 : 0.55;
        material.metalness = road ? 0.7 : 0.16;
      }
      material.userData.tuned = true;
      material.needsUpdate = true;
    });
  });
}

function neonize(texture, maxSize) {
  const key = ((texture.image && texture.image.src) || texture.uuid) + ":" + (maxSize || "full");
  if (baked.has(key)) return baked.get(key);
  const image = texture.image;
  const canvas = document.createElement("canvas");
  const sourceW = image.width || 256;
  const sourceH = image.height || 256;
  const scale = maxSize ? Math.min(1, maxSize / Math.max(sourceW, sourceH)) : 1;
  canvas.width = Math.max(1, Math.round(sourceW * scale));
  canvas.height = Math.max(1, Math.round(sourceH * scale));
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = pixels.data;
  const glowCanvas = document.createElement("canvas");
  glowCanvas.width = canvas.width;
  glowCanvas.height = canvas.height;
  const glowContext = glowCanvas.getContext("2d");
  const glow = glowContext.createImageData(canvas.width, canvas.height);
  for (let i = 0; i < data.length; i += 4) {
    const color = retint(data[i], data[i + 1], data[i + 2]);
    data[i] = color[0];
    data[i + 1] = color[1];
    data[i + 2] = color[2];
    glow.data[i] = Math.round(color[0] * color[3]);
    glow.data[i + 1] = Math.round(color[1] * color[3]);
    glow.data[i + 2] = Math.round(color[2] * color[3]);
    glow.data[i + 3] = 255;
  }
  context.putImageData(pixels, 0, 0);
  glowContext.putImageData(glow, 0, 0);
  const color = new THREE.CanvasTexture(canvas);
  const glowMap = new THREE.CanvasTexture(glowCanvas);
  color.colorSpace = THREE.SRGBColorSpace;
  glowMap.colorSpace = THREE.SRGBColorSpace;
  color.flipY = false;
  glowMap.flipY = false;
  const result = { color: color, glow: glowMap };
  baked.set(key, result);
  return result;
}

function retint(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const v = max / 255;
  const sat = max === 0 ? 0 : (max - min) / max;
  let hue = 0;
  if (max !== min) {
    const d = max - min;
    if (max === r) hue = ((g - b) / d) % 6;
    else if (max === g) hue = (b - r) / d + 2;
    else hue = (r - g) / d + 4;
    hue = ((hue % 6) + 6) % 6 / 6;
  }
  if (hue > 0.5 && hue < 0.72 && sat > 0.4) {
    const t = 0.55 + v * 0.45;
    return [Math.round(70 * t), Math.round(220 * t), 255, 0.9];
  }
  if ((hue >= 0.72 || hue < 0.05) && sat > 0.28) {
    const t = 0.5 + v * 0.5;
    return [Math.round(255 * t), Math.round(40 * t), Math.round(180 * t), 0.75];
  }
  if (hue < 0.18 && sat > 0.5) {
    const t = 0.45 + v * 0.5;
    return [Math.round(255 * t), Math.round(36 * t), Math.round(140 * t), 0.5];
  }
  const shade = 12 + v * 22;
  return [Math.round(shade * 1.1), Math.round(shade * 0.45), Math.round(shade * 1.6), 0];
}

export function signTexture(label, color, subtitle) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = subtitle ? 420 : 280;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#120810";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = color;
  ctx.lineWidth = 16;
  ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);
  ctx.shadowColor = color;
  ctx.shadowBlur = 24;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "700 " + (subtitle ? 148 : 160) + "px Arial, sans-serif";
  ctx.fillText(label, 512, subtitle ? 165 : 140);
  if (subtitle) {
    ctx.font = "700 58px Arial, sans-serif";
    ctx.fillStyle = "#7af0ff";
    ctx.shadowColor = "#7af0ff";
    ctx.fillText(subtitle, 512, 305);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function makeSign(label, color, width, height, subtitle) {
  const texture = signTexture(label, color, subtitle);
  return new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshStandardMaterial({
      map: texture,
      emissiveMap: texture,
      emissive: new THREE.Color(color),
      emissiveIntensity: 1.2,
      roughness: 0.35,
    })
  );
}
