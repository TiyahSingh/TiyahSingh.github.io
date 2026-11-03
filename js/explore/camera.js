import * as THREE from "three";

export function createCamera(aspect) {
  const camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 160);
  const offsets = {
    street: new THREE.Vector3(0, 5.4, 9.6),
    room: new THREE.Vector3(0, 3.2, 4.4),
  };
  let mode = "street";
  let occluders = [];
  const raycaster = new THREE.Raycaster();
  const look = new THREE.Vector3();
  const desired = new THREE.Vector3();
  const from = new THREE.Vector3();
  const direction = new THREE.Vector3();

  function resize(nextAspect) {
    camera.aspect = nextAspect;
    camera.updateProjectionMatrix();
  }

  function setMode(next) { mode = next === "street" ? "street" : "room"; }
  function setOccluders(list) { occluders = list || []; }

  function update(dt, player, reduced) {
    desired.copy(player.position).add(offsets[mode]);
    const blend = reduced ? 1 : 1 - Math.exp(-3.2 * dt);
    camera.position.lerp(desired, blend);
    from.set(player.position.x, player.position.y + 1.35, player.position.z);
    direction.copy(camera.position).sub(from);
    const distance = direction.length();
    if (occluders.length && distance > 0.4) {
      direction.multiplyScalar(1 / distance);
      raycaster.set(from, direction);
      raycaster.far = distance;
      const hit = raycaster.intersectObjects(occluders, true)[0];
      if (hit && hit.distance < distance - 0.25) {
        camera.position.copy(from).addScaledVector(direction, Math.max(1.1, hit.distance - 0.4));
      }
    }
    look.set(player.position.x, player.position.y + 1.25, player.position.z);
    camera.lookAt(look);
  }

  camera.position.copy(offsets.street).add(new THREE.Vector3(0, 0, 14));
  return { camera: camera, resize: resize, update: update, setMode: setMode, setOccluders: setOccluders };
}
