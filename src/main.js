import * as THREE from "three";
import * as CANNON from "cannon-es";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { ConvexGeometry } from "three/examples/jsm/geometries/ConvexGeometry.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { initUI } from "./ui.js";
import { createFX } from "./fx.js";

// Models that can drop (Blender: File → Export → glTF 2.0 → .glb, put in public/models/).
// Nothing drops on its own: opening a project / experience / about drops the models
// listed in its `drops` (see content.js), by the ids below. Per model:
//   size     longest side in world units
//   collider "box" (boxy models), "hull" (follows the outline, for odd shapes), "sphere"
//            or "cylinder"
//   make     instead of url: a function that builds the model in code
//   upright  true = drop mostly the model's top side (+Y) up; false = any orientation
//   steady   0..0.5: moves the center of mass down by this fraction of the height
//            (a weighted base) so it tends to land and stay on its feet
//   impact   "dust" (default) or "sparks" when it hits something hard
//   name     tooltip title shown when hovering over it
// If none load, a placeholder shape is used instead.
const MODELS = {
  gpu: { url: "/models/gpu.glb", size: 1.9, collider: "box", upright: true, impact: "sparks", name: "old gpu" },
  embedding: { url: "/models/embedding.glb", size: 2.45, collider: "box", upright: true, name: "high-dimensional embedding" },
  graph: { url: "/models/graph.glb", size: 1.2, collider: "hull", upright: false, name: "k nearest neighbors" },
  container: { url: "/models/container.glb", size: 1.9, collider: "box", upright: true, impact: "sparks", name: "container" },
  chair: { url: "/models/chair.glb", size: 2.0, collider: "hull", upright: true, steady: 0.35, impact: "dust", name: "chair" },
  rack: { url: "/models/rack.glb", size: 1.6, collider: "box", upright: true, steady: 0.35, impact: "sparks", name: "server rack" },
  trident: { url: "/models/trident.glb", size: 2.2, collider: "hull", upright: false, impact: "sparks", name: "trident" },
  bridge: { url: "/models/bridge.glb", size: 2.6, collider: "hull", upright: true, steady: 0.3, impact: "sparks", name: "golden gate bridge" },
  medal: { url: "/models/medal.glb", size: 1.4, collider: "box", upright: true, steady: 0.3, impact: "sparks", name: "medal" },
  trophy: { url: "/models/trophy.glb", size: 1.6, collider: "hull", upright: true, steady: 0.35, impact: "sparks", name: "1st place trophy" },
  // placeholder for entries whose prop isn't decided yet
  tbd: { make: thinkingPuck, size: 1.2, collider: "cylinder", upright: true, steady: 0.15, name: "placeholder" },
  cup: { url: "/models/cup.glb", size: 0.9, collider: "hull", upright: true, impact: "dust", name: "coffee" },
};
const ENV_STRENGTH = 0.25; // faint reflections so metal parts aren't black; floor ignores this
const MAX_OBJECTS = 14;   // oldest gets removed past this
const LIGHT_Y = 22;       // light sits above the top of the frame, out of view
const DROP_Y = 7.5;       // spawn height: low keeps the falling shadow small (it grows near the light)
const APPEAR_TIME = 0.35; // seconds for a new object to fade/scale in
const POOL_RADIUS = 1.3;  // past this distance from center, objects get pulled back into the light
// light color: soft warm white (~4000K) (0xffffff = no tint, 0xfff3d6 = previous tint)
const LIGHT_COLOR = 0xfff3e0;
const POOL_SHIFT = 0.21; // fraction of screen width to move the scene left
const READING_SHIFT = 0.07; // extra shift while a write-up is open, to make room for it
let shift = POOL_SHIFT;
let shiftTarget = POOL_SHIFT;
const TARGET = new THREE.Vector3(0, 1.3, 0); // camera look-at point

const canvas = document.querySelector("#scene");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor(0x000000);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x000000, 13, 32);

const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
camera.position.set(0, 7.2, 16.2); // about 20° above the floor, looking down at the pool
camera.lookAt(TARGET);

// ---------- lighting ----------
scene.add(new THREE.AmbientLight(0xffffff, 0.015));

const spot = new THREE.SpotLight(LIGHT_COLOR, 840, 40, 0.106, 1, 2);
spot.position.set(0, LIGHT_Y, 0);
spot.target.position.set(0, 0, 0);
spot.castShadow = true;
spot.shadow.mapSize.set(2048, 2048);
spot.shadow.camera.near = 3;
spot.shadow.camera.far = 40;
spot.shadow.bias = -0.0004;
spot.shadow.normalBias = 0.02;
spot.shadow.radius = 4;
scene.add(spot, spot.target);

// floor: only visible where the spotlight hits it
// reflection map applied to model materials only (not scene-wide, so the floor stays black)
const envMap = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;

const floorMat = new THREE.MeshStandardMaterial({ color: 0x8a8a8a, roughness: 0.92, metalness: 0, envMapIntensity: 0 });

// The floor has a square hole under the light, covered by two trapdoor panels that sit
// flush with it (same material), so normally it looks like one solid floor.
const HOLE = 2.1; // half-width of the trapdoor opening
const floorShape = new THREE.Shape();
floorShape.moveTo(-30, -30).lineTo(30, -30).lineTo(30, 30).lineTo(-30, 30).lineTo(-30, -30);
const holePath = new THREE.Path();
holePath.moveTo(-HOLE, -HOLE).lineTo(-HOLE, HOLE).lineTo(HOLE, HOLE).lineTo(HOLE, -HOLE).lineTo(-HOLE, -HOLE);
floorShape.holes.push(holePath);
const floor = new THREE.Mesh(new THREE.ShapeGeometry(floorShape), floorMat);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// each door is hinged at its outer edge; rotating the hinge swings it down into the dark
const DOOR_THICK = 0.06;
function makeDoor(side) {
  const geo = new THREE.BoxGeometry(HOLE, DOOR_THICK, HOLE * 2);
  // shift so the hinge (outer edge) is at the origin and the top face is at y = 0
  geo.translate((-side * HOLE) / 2, -DOOR_THICK / 2, 0);
  const door = new THREE.Mesh(geo, floorMat);
  door.receiveShadow = true;
  door.castShadow = true;
  const hinge = new THREE.Group();
  hinge.position.x = side * HOLE;
  hinge.add(door);
  scene.add(hinge);
  return hinge;
}
const doors = [makeDoor(-1), makeDoor(1)]; // left, right
let doorOpen = 0; // 0 = closed, 1 = hanging straight down
function setDoors(k) {
  doorOpen = k;
  const angle = k * Math.PI * 0.5;
  doors[0].rotation.z = -angle;
  doors[1].rotation.z = angle;
}
const DOOR_OPEN_TIME = 0.35;  // swing open (fast, like it gave way)
const DOOR_CLOSE_TIME = 0.7;  // swing back shut
let trapdoor = null;          // { phase: "open" | "wait" | "close", t }

// faint visible beam (additive cone that fades with distance and at its edges)
const beamHeight = LIGHT_Y;
const beamGeo = new THREE.CylinderGeometry(0.05, Math.tan(0.106) * beamHeight, beamHeight, 64, 1, true);
beamGeo.translate(0, -beamHeight / 2, 0);
const beam = new THREE.Mesh(
  beamGeo,
  new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false, // draw the beam over objects so they never look like they block the light
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: { uHeight: { value: beamHeight }, uStrength: { value: 0.06 }, uColor: { value: new THREE.Color(LIGHT_COLOR) } },
    vertexShader: `
      varying float vT;
      varying vec3 vN;
      varying vec3 vView;
      uniform float uHeight;
      void main() {
        vT = -position.y / uHeight;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vView = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying float vT;
      varying vec3 vN;
      varying vec3 vView;
      uniform float uStrength;
      uniform vec3 uColor;
      void main() {
        float edge = pow(abs(dot(normalize(vN), normalize(vView))), 2.0);
        float fall = pow(1.0 - vT, 1.6);
        gl_FragColor = vec4(uColor * edge * fall * uStrength, 1.0);
      }`,
  })
);
beam.position.y = LIGHT_Y;
beam.renderOrder = 10;
scene.add(beam);

// ---------- physics ----------
const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });
world.allowSleep = true;
const physMat = new CANNON.Material("obj");
world.defaultContactMaterial.friction = 0.45;
world.defaultContactMaterial.restitution = 0.15;
world.addContactMaterial(new CANNON.ContactMaterial(physMat, physMat, { friction: 0.4, restitution: 0.08 }));

const ground = new CANNON.Body({ type: CANNON.Body.STATIC, shape: new CANNON.Plane() });
ground.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(ground);

// no walls: objects that roll past POOL_RADIUS get a soft pull back toward the
// middle of the light, stronger the farther out they are
function keepInPool() {
  for (const { body } of items) {
    const d = Math.hypot(body.position.x, body.position.z);
    if (d <= POOL_RADIUS || body.position.y > 2) continue;
    const nx = -body.position.x / d;
    const nz = -body.position.z / d;
    // strong enough past ~1.75 to beat floor friction, so resting objects slide back too
    const pull = (d - POOL_RADIUS) * 10 * body.mass;
    body.applyForce(new CANNON.Vec3(nx * pull, 0, nz * pull));
    // brake outward motion so knocked objects can't coast into the dark
    const outward = -(body.velocity.x * nx + body.velocity.z * nz);
    if (outward > 0) {
      const brake = Math.min(1, (d - POOL_RADIUS) * 0.15);
      body.velocity.x += nx * outward * brake;
      body.velocity.z += nz * outward * brake;
    }
    body.wakeUp();
  }
}

// ---------- model ----------
const templates = {}; // model id → { object, shape, upright, ... } once loaded

function normalize(object, targetSize) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const s = targetSize / Math.max(size.x, size.y, size.z);
  object.scale.multiplyScalar(s);
  const center = new THREE.Box3().setFromObject(object).getCenter(new THREE.Vector3());
  object.position.sub(center);
  const wrapper = new THREE.Group();
  wrapper.add(object);
  return wrapper;
}

// Build a convex hull of every vertex in the model and turn it into a cannon shape.
function hullShape(object) {
  object.updateMatrixWorld(true);
  const pts = [];
  const v = new THREE.Vector3();
  object.traverse((o) => {
    if (!o.isMesh) return;
    const pos = o.geometry.attributes.position;
    const step = Math.max(1, Math.floor(pos.count / 1500));
    for (let i = 0; i < pos.count; i += step) pts.push(v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld).clone());
  });
  // Collision cost grows with the hull's face count, so keep only the outermost
  // point in each of HULL_DIRS evenly spread directions. That gives a simplified
  // hull (≤ HULL_DIRS corners) that still follows the model's outline.
  const HULL_DIRS = 32;
  const picked = new Set();
  const dir = new THREE.Vector3();
  const dirs = [];
  for (let i = 0; i < HULL_DIRS; i++) {
    const y = 1 - (2 * (i + 0.5)) / HULL_DIRS;
    const r = Math.sqrt(1 - y * y);
    const a = i * Math.PI * (3 - Math.sqrt(5));
    dirs.push([Math.cos(a) * r, y, Math.sin(a) * r]);
  }
  // plus a ring pointing down and out, so the hull gets a proper flat base made of
  // the model's feet (otherwise the bottom can be a single point it wobbles on)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    dirs.push([Math.cos(a) * 0.45, -0.89, Math.sin(a) * 0.45]);
  }
  for (const [dx, dy, dz] of dirs) {
    dir.set(dx, dy, dz);
    let best = 0;
    let bestDot = -Infinity;
    for (let j = 0; j < pts.length; j++) {
      const d = pts[j].dot(dir);
      if (d > bestDot) { bestDot = d; best = j; }
    }
    picked.add(best);
  }
  let hull = new ConvexGeometry([...picked].map((j) => pts[j]));
  hull.deleteAttribute("normal");
  hull.deleteAttribute("uv");
  hull = mergeVertices(hull, 1e-4);
  const p = hull.attributes.position;
  const vertices = [];
  for (let i = 0; i < p.count; i++) vertices.push(new CANNON.Vec3(p.getX(i), p.getY(i), p.getZ(i)));
  const idx = hull.index.array;
  const faces = [];
  for (let i = 0; i < idx.length; i += 3) faces.push([idx[i], idx[i + 1], idx[i + 2]]);
  return new CANNON.ConvexPolyhedron({ vertices, faces });
}

function prepare(object, cfg) {
  object.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  const wrapped = normalize(object, cfg.size);
  // faint environment reflections on the model only (the floor has none, so it stays black)
  wrapped.traverse((o) => {
    if (o.isMesh) for (const m of [].concat(o.material)) if ("envMapIntensity" in m) {
      m.envMap = envMap;
      m.envMapIntensity = ENV_STRENGTH;
    }
  });
  const shape =
    cfg.collider === "box" ? boxShape(wrapped)
    : cfg.collider === "sphere" ? new CANNON.Sphere(cfg.size / 2)
    : cfg.collider === "cylinder" ? cylinderShape(wrapped)
    : hullShape(wrapped);
  const size = new THREE.Box3().setFromObject(wrapped).getSize(new THREE.Vector3());
  // weighted base: the physics body's origin is its center of mass, so lift the model
  // and its collider above the origin by `steady` × height
  const lift = (cfg.steady ?? 0) * size.y;
  wrapped.children[0].position.y += lift;
  return {
    object: wrapped,
    shape,
    shapeOffset: new CANNON.Vec3(0, lift, 0),
    // radius of a sphere that fully contains the model (used to keep spawns apart)
    radius: size.length() / 2 + lift,
    upright: cfg.upright,
    steady: !!cfg.steady,
    impact: cfg.impact ?? "dust",
    name: cfg.name ?? "",
  };
}

// upright (Y-axis) cylinder matching the model's bounds
function cylinderShape(object) {
  const size = new THREE.Box3().setFromObject(object).getSize(new THREE.Vector3());
  const r = Math.max(size.x, size.z) / 2;
  return new CANNON.Cylinder(r, r, size.y, 24);
}

function boxShape(object) {
  const size = new THREE.Box3().setFromObject(object).getSize(new THREE.Vector3());
  return new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2));
}

// a flat puck with the 🤔 emoji on the top and bottom faces, yellow around the edge
function thinkingPuck() {
  const N = 512;
  const c = document.createElement("canvas");
  c.width = c.height = N;
  const g = c.getContext("2d");
  g.font = `${Math.round(N * 0.86)}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("🤔", N / 2, N / 2 + N * 0.04);
  // the face's own yellow (sampled from the left cheek, so it matches whichever
  // emoji font the visitor has) fills around the glyph and colors the rim
  const [r, gr, bl] = g.getImageData(N * 0.2, N * 0.55, 1, 1).data;
  const yellow = `rgb(${r}, ${gr}, ${bl})`;
  g.globalCompositeOperation = "destination-over";
  g.fillStyle = yellow;
  g.fillRect(0, 0, N, N);
  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;

  const face = new THREE.MeshStandardMaterial({ map, roughness: 0.55, metalness: 0 });
  const rim = new THREE.MeshStandardMaterial({ color: new THREE.Color(yellow), roughness: 0.55, metalness: 0 });
  // cylinder material slots: side, top, bottom
  return new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, PUCK_HEIGHT, 64), [rim, face, face]);
}
const PUCK_HEIGHT = 0.1; // relative to a diameter of 1

function placeholder() {
  const geo = new THREE.TorusKnotGeometry(0.42, 0.15, 160, 24);
  const mat = new THREE.MeshStandardMaterial({ color: 0xd9d4cc, roughness: 0.35, metalness: 0.1 });
  return new THREE.Mesh(geo, mat);
}

const items = [];

// impact dust / sparks (see fx.js)
const fx = createFX(scene, LIGHT_COLOR);
const IMPACT_MIN_SPEED = 1.2; // m/s along the contact normal; softer bumps make nothing
const IMPACT_COOLDOWN = 0.12; // seconds between effects from the same object

// ---------- dissolve shader ----------
// Every dropped object's materials get a tiny shader addition: when its uDissolve
// uniform rises from 0 to ~1, pixels whose noise value is below it are discarded,
// with a glowing edge right at the boundary. At 0 it skips the noise entirely.
const DISSOLVE_EDGE = new THREE.Color(0x37d4ff); // glow color at the dissolving edge
const dissolveVertex = `
  #include <project_vertex>
  vDissolveWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;`;
const dissolveCommon = `
  uniform float uDissolve;
  varying vec3 vDissolveWorld;
  float dHash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float dNoise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(dHash(i), dHash(i + vec3(1, 0, 0)), f.x), mix(dHash(i + vec3(0, 1, 0)), dHash(i + vec3(1, 1, 0)), f.x), f.y),
      mix(mix(dHash(i + vec3(0, 0, 1)), dHash(i + vec3(1, 0, 1)), f.x), mix(dHash(i + vec3(0, 1, 1)), dHash(i + vec3(1, 1, 1)), f.x), f.y),
      f.z);
  }
  float dissolveNoise() {
    return dNoise(vDissolveWorld * 6.0) * 0.65 + dNoise(vDissolveWorld * 14.0) * 0.35;
  }`;
const dissolveDiscard = `
  #include <clipping_planes_fragment>
  float dn = 1.0;
  if (uDissolve > 0.0) {
    dn = dissolveNoise();
    if (dn < uDissolve) discard;
  }`;

function addDissolve(material, uniform, withGlow) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uDissolve = uniform;
    shader.uniforms.uEdgeColor = { value: DISSOLVE_EDGE };
    shader.vertexShader = shader.vertexShader
      .replace("void main() {", "varying vec3 vDissolveWorld;\nvoid main() {")
      .replace("#include <project_vertex>", dissolveVertex);
    shader.fragmentShader = shader.fragmentShader
      .replace("void main() {", dissolveCommon + "\nuniform vec3 uEdgeColor;\nvoid main() {")
      .replace("#include <clipping_planes_fragment>", dissolveDiscard);
    if (withGlow) {
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        if (uDissolve > 0.0) totalEmissiveRadiance += uEdgeColor * 4.0 * (1.0 - smoothstep(uDissolve, uDissolve + 0.07, dn));`
      );
    }
  };
  // same code for every material → three.js compiles it once and reuses it
  material.customProgramCacheKey = () => (withGlow ? "dissolve" : "dissolve-depth");
}

function drop(id) {
  const template = templates[id];
  if (!template) return;
  const mesh = template.object.clone(true);
  // own materials per object so each can fade in (and dissolve) on its own
  const mats = [];
  const dissolve = { value: 0 };
  const depthMat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
  addDissolve(depthMat, dissolve, false);
  mesh.traverse((o) => {
    if (o.isMesh) {
      o.material = Array.isArray(o.material) ? o.material.map((m) => m.clone()) : o.material.clone();
      for (const m of [].concat(o.material)) {
        m.transparent = true;
        m.opacity = 0;
        addDissolve(m, dissolve, true);
        mats.push(m);
      }
      // shadows use their own material; give it the same dissolve so shadows dissolve too
      o.customDepthMaterial = depthMat;
    }
  });
  mesh.scale.setScalar(0.001);
  scene.add(mesh);

  // weighted-base models are heavier so the rest of the pile can't easily knock them over
  const body = new CANNON.Body({ mass: template.steady ? 2.5 : 1, material: physMat });
  body.addShape(template.shape, template.shapeOffset);
  const r = Math.random() * 0.3;
  const a = Math.random() * Math.PI * 2;
  // if a falling object is still near the spawn point, spawn above it instead, so
  // new objects never start overlapping (overlaps make the physics blast them apart)
  const x = Math.cos(a) * r;
  const z = Math.sin(a) * r;
  let y = DROP_Y;
  for (let moved = true; moved; ) {
    moved = false;
    for (const other of items) {
      const p = other.body.position;
      const minGap = template.radius + other.radius + 0.05;
      if (Math.hypot(p.x - x, p.y - y, p.z - z) < minGap) {
        y = p.y + minGap;
        moved = true;
      }
    }
  }
  body.position.set(x, y, z);
  if (template.upright) {
    // start top side (+Y, e.g. the GPU's fans) up with a small random tilt, so it usually
    // lands that way; the tumble still flips it now and then
    // (weighted-base models start level with no tumble, so they land on all feet at once)
    const wobble = template.steady ? 0 : 1;
    const tilt = () => (Math.random() - 0.5) * 0.8 * wobble;
    body.quaternion.setFromEuler(tilt(), Math.random() * 6.28, tilt(), "YXZ");
    // mostly spin around the vertical axis; only a little tumble, which is what flips it
    body.angularVelocity.set((Math.random() - 0.5) * 1.6 * wobble, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 1.6 * wobble);
  } else {
    body.quaternion.setFromEuler(Math.random() * 6.28, Math.random() * 6.28, Math.random() * 6.28);
    body.angularVelocity.set((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4);
  }
  body.angularDamping = template.steady ? 0.6 : 0.15;
  body.linearDamping = 0.08;
  body.sleepSpeedLimit = 0.15;
  world.addBody(body);
  mesh.userData.label = {
    name: template.name,
  };
  const item = { mesh, body, mats, age: 0, dissolve, radius: template.radius };
  items.push(item);

  let lastImpact = -1;
  body.addEventListener("collide", (e) => {
    // nothing while being cleared, or while the trapdoor floor is open
    if (!ground.collisionResponse || !items.includes(item)) return;
    const speed = Math.abs(e.contact.getImpactVelocityAlongNormal());
    const now = performance.now() / 1000;
    if (speed < IMPACT_MIN_SPEED || now - lastImpact < IMPACT_COOLDOWN) return;
    lastImpact = now;
    const c = e.contact;
    const at = c.bi.position.vadd(c.ri); // world-space contact point
    const strength = Math.min(1, (speed - IMPACT_MIN_SPEED) / 5);
    if (template.impact === "sparks") fx.spawnSparks(at, strength);
    else if (at.y < 0.35) fx.spawnDust(at, strength); // dust only where it meets the floor
  });

  if (items.length > MAX_OBJECTS) {
    const old = items.shift();
    scene.remove(old.mesh);
    world.removeBody(old.body);
  }
}

const loader = new GLTFLoader();
const loading = {}; // model id → promise, so each file loads once
function load(id) {
  const cfg = MODELS[id];
  if (!cfg) return Promise.resolve(console.warn(`no model called "${id}"`));
  if (cfg.make) {
    templates[id] ??= prepare(cfg.make(), cfg);
    return Promise.resolve();
  }
  loading[id] ??= loader.loadAsync(cfg.url).then(
    (gltf) => (templates[id] = prepare(gltf.scene, cfg)),
    (err) => console.warn(`couldn't load ${cfg.url}`, err)
  );
  return loading[id];
}
// fetch everything in the background so drops are instant later
for (const id in MODELS) load(id);

// ---------- drop sets ----------
// Opening something with `drops` clears whatever is on the stage and drops its set,
// one after another. Reopening the set that's already there leaves it alone.
const DROP_GAP = 0.45; // seconds between objects in a set
let currentSet = null;
let queue = [];
let queueWait = 0;

function showSet(key, ids) {
  if (key === currentSet) return;
  currentSet = key;
  queue = [];
  if (items.length) {
    clearPile(Math.random() < 0.5 ? "dissolve" : "sink");
    queueWait = 0.6; // let the old pile start leaving first
  } else {
    queueWait = 0;
  }
  Promise.all(ids.map(load)).then(() => {
    if (currentSet === key) queue = [...ids];
  });
}

function updateQueue(dt) {
  if (!queue.length || trapdoor) return;
  queueWait -= dt;
  if (queueWait > 0) return;
  drop(queue.shift());
  queueWait = DROP_GAP;
}

// ---------- clearing the pile (click the name) ----------
// Picks one of these at random, evenly. Each object gets a small random delay so
// they don't all go in lockstep.
const CLEAR_EFFECTS = ["dissolve", "sink", "trapdoor"];
const DISSOLVE_TIME = 1.4; // seconds per object
const SINK_TIME = 1.8;
const leaving = []; // objects currently being cleared

function clearPile(mode = CLEAR_EFFECTS[Math.floor(Math.random() * CLEAR_EFFECTS.length)]) {
  if (!items.length) return;
  if (trapdoor) mode = "dissolve"; // doors are already busy
  for (const item of items.splice(0)) {
    // finish any fade-in instantly
    if (item.mats) {
      for (const m of item.mats) {
        m.opacity = 1;
        m.transparent = false;
      }
      item.mats = null;
      item.mesh.scale.setScalar(1);
    }
    const leave = { ...item, mode, t: -Math.random() * 0.3 };
    if (mode === "trapdoor") {
      item.body.wakeUp();
      item.body.angularVelocity.x += (Math.random() - 0.5) * 2;
      item.body.angularVelocity.z += (Math.random() - 0.5) * 2;
    } else {
      // dissolve / sink are animated directly, no physics needed
      world.removeBody(item.body);
      if (mode === "sink") {
        leave.startY = item.mesh.position.y;
        leave.depth = new THREE.Box3().setFromObject(item.mesh).getSize(new THREE.Vector3()).y + 0.6;
      }
    }
    leaving.push(leave);
  }
  // trapdoor: the floor stops being solid until everything has fallen through
  if (mode === "trapdoor") {
    ground.collisionResponse = false;
    trapdoor = { phase: "open", t: 0 };
  }
}

function updateLeaving(dt) {
  for (let i = leaving.length - 1; i >= 0; i--) {
    const l = leaving[i];
    l.t += dt;
    const t = Math.max(l.t, 0);
    let done = false;
    if (l.mode === "dissolve") {
      l.dissolve.value = t > 0 ? Math.min(t / DISSOLVE_TIME, 1) * 1.08 : 0;
      done = t >= DISSOLVE_TIME;
    } else if (l.mode === "sink") {
      const k = Math.min(t / SINK_TIME, 1);
      // slow start, then slides under; the floor hides whatever is below it
      l.mesh.position.y = l.startY - l.depth * k * k * (3 - 2 * k);
      done = k >= 1;
    } else {
      l.mesh.position.copy(l.body.position);
      l.mesh.quaternion.copy(l.body.quaternion);
      done = l.body.position.y < -9;
      if (done) world.removeBody(l.body);
    }
    if (done) {
      scene.remove(l.mesh);
      leaving.splice(i, 1);
    }
  }
  if (trapdoor) {
    trapdoor.t += dt;
    if (trapdoor.phase === "open") {
      const k = Math.min(trapdoor.t / DOOR_OPEN_TIME, 1);
      setDoors(k * k); // accelerate open, like falling
      if (k >= 1) trapdoor = { phase: "wait", t: 0 };
    } else if (trapdoor.phase === "wait") {
      if (!leaving.length && trapdoor.t > 0.3) trapdoor = { phase: "close", t: 0 };
    } else {
      const k = Math.min(trapdoor.t / DOOR_CLOSE_TIME, 1);
      setDoors(1 - k * k * (3 - 2 * k));
      if (k >= 1) {
        setDoors(0);
        trapdoor = null;
        ground.collisionResponse = true;
      }
    }
  }
}

// name + menu + panel. Clicking the name on the home screen clears the pile.
initUI({
  onNameClickHome: () => {
    clearPile();
    queue = [];
    currentSet = null;
  },
  onDrops: showSet,
  // the wide write-up view pushes the stage a bit further left (not on phones,
  // where the panel sits below the stage)
  onReadingChange: (reading) => {
    shiftTarget = POOL_SHIFT + (reading && innerWidth > 700 ? READING_SHIFT : 0);
  },
});


// ---------- hover tooltip ----------
const tooltip = document.querySelector("#tooltip");
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let mouse = null; // last mouse position, or null when off the page / using touch
let hoverQueued = false;

addEventListener("pointermove", (e) => {
  if (e.pointerType !== "mouse") return; // no hover on touch screens
  // no object tooltips while the mouse is over the name, menu or panel
  mouse = e.target.closest?.("[data-ui]") ? null : { x: e.clientX, y: e.clientY };
  if (!hoverQueued) {
    hoverQueued = true;
    requestAnimationFrame(updateHover);
  }
});
document.addEventListener("pointerleave", () => {
  mouse = null;
  updateHover();
});

function updateHover() {
  hoverQueued = false;
  let label = null;
  if (mouse) {
    pointer.set((mouse.x / innerWidth) * 2 - 1, -(mouse.y / innerHeight) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(items.map((i) => i.mesh), true)[0];
    // walk up from the part that was hit to the dropped object's root
    for (let o = hit?.object; o; o = o.parent) {
      if (o.userData.label !== undefined) {
        label = o.userData.label;
        break;
      }
    }
  }
  if (label?.name) {
    tooltip.textContent = label.name;
    tooltip.style.transform = `translate(${mouse.x + 14}px, ${mouse.y + 16}px)`;
    tooltip.classList.add("show");
  } else {
    tooltip.classList.remove("show");
  }
  document.body.style.cursor = label?.name ? "pointer" : "";
}

// ---------- loop ----------
function resize() {
  const w = innerWidth;
  const h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  // pick the smallest FOV that still shows the lamp-to-floor height and the
  // full width of the light pool, so the scene always fits the window
  const dist = camera.position.distanceTo(TARGET);
  const halfH = 3.8; // how much of the scene fits vertically (smaller = everything looks bigger)
  const halfW = 4.05; // how much fits horizontally (keep in proportion with halfH)
  const fovH = 2 * Math.atan(halfH / dist);
  const fovW = 2 * Math.atan(halfW / (dist * camera.aspect));
  camera.fov = THREE.MathUtils.radToDeg(Math.max(fovH, fovW));
  // shift the picture so the light pool sits left of the name (name is at ~70% width)
  applyShift();
}
function applyShift() {
  const w = innerWidth;
  const h = innerHeight;
  camera.setViewOffset(w, h, w * shift, 0, w, h);
  camera.updateProjectionMatrix();
}
addEventListener("resize", resize);
resize();

let last = performance.now();
renderer.setAnimationLoop((now) => {
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  if (Math.abs(shiftTarget - shift) > 1e-4) {
    shift += (shiftTarget - shift) * (1 - Math.exp(-5 * dt));
    applyShift();
  }
  keepInPool();
  world.step(1 / 60, dt, 2);
  updateLeaving(dt);
  updateQueue(dt);
  fx.update(dt, camera, renderer.domElement.height);
  for (const item of items) {
    const { mesh, body } = item;
    mesh.position.copy(body.position);
    mesh.quaternion.copy(body.quaternion);
    if (item.mats) {
      // fade + grow in (scaling also grows the shadow smoothly instead of popping)
      item.age += dt;
      const t = Math.min(item.age / APPEAR_TIME, 1);
      const e = 1 - (1 - t) ** 3;
      mesh.scale.setScalar(Math.max(e, 0.001));
      for (const m of item.mats) m.opacity = e;
      if (t === 1) {
        for (const m of item.mats) m.transparent = false;
        item.mats = null;
      }
    }
  }
  renderer.render(scene, camera);
});
