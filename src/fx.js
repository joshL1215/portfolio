import * as THREE from "three";

// Impact effects: soft dust puffs and hot metal sparks.
// Each effect is ONE particle system with a fixed pool of particles (one draw call
// total per effect, no allocations while running). An impact borrows the next few
// particles from the pool; old ones just get overwritten.

// particles fade out toward the edge of the light so puffs in the dark barely show
const LIGHT_RADIUS = 2.4;

// look tuning
const DUST_BRIGHTNESS = 0.95; // dust color vs. the light color (lighter than the lit floor so it shows)
const DUST_OPACITY = 0.17;
const DUST_MIN_STRENGTH = 0.15; // 0..1; only harder landings kick up dust
const SPARK_SIZE = 0.1;       // world units

function softDotTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.4, "rgba(255,255,255,0.45)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makePool(count, material) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const alpha = new Float32Array(count);
  const size = new Float32Array(count);
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute("aAlpha", new THREE.BufferAttribute(alpha, 1).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1).setUsage(THREE.DynamicDrawUsage));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 50); // never culled
  const points = new THREE.Points(geo, material);
  points.frustumCulled = false;
  return {
    points,
    count,
    next: 0,
    pos,
    alpha,
    size,
    vel: new Float32Array(count * 3),
    age: new Float32Array(count),
    life: new Float32Array(count).fill(0),
    base: new Float32Array(count), // starting size / brightness per particle
    take() {
      const i = this.next;
      this.next = (this.next + 1) % this.count;
      return i;
    },
  };
}

function pointMaterial({ color, blending, fragmentExtra = "" }) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending,
    uniforms: {
      uMap: { value: softDotTexture() },
      uColor: { value: new THREE.Color(color) },
      uScale: { value: 500 },
      uLightRadius: { value: LIGHT_RADIUS },
    },
    vertexShader: `
      attribute float aAlpha;
      attribute float aSize;
      uniform float uScale;
      uniform float uLightRadius;
      varying float vAlpha;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * uScale / -mv.z;
        float d = length(position.xz);
        vAlpha = aAlpha * (1.0 - smoothstep(uLightRadius * 0.45, uLightRadius, d));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform sampler2D uMap;
      uniform vec3 uColor;
      varying float vAlpha;
      void main() {
        float a = texture2D(uMap, gl_PointCoord).a * vAlpha;
        if (a < 0.003) discard;
        vec3 col = uColor;
        ${fragmentExtra}
        gl_FragColor = vec4(col, a);
      }`,
  });
}

export function createFX(scene, lightColor) {
  // dust: warm grey, normal blending so it reads as matter, not light
  const dust = makePool(
    500,
    pointMaterial({ color: new THREE.Color(lightColor).multiplyScalar(DUST_BRIGHTNESS), blending: THREE.NormalBlending })
  );
  // sparks: additive, white-hot at birth cooling to orange
  const sparks = makePool(
    260,
    pointMaterial({
      color: 0xffb347,
      blending: THREE.AdditiveBlending,
      fragmentExtra: "col = mix(col, vec3(1.0, 0.95, 0.8), vAlpha * vAlpha) * 1.6;",
    })
  );
  scene.add(dust.points, sparks.points);

  // strength: 0..1 from how hard the hit was
  function spawnDust(at, strength) {
    if (strength < DUST_MIN_STRENGTH) return; // light bumps make no dust
    const n = Math.round(3 + 9 * strength);
    for (let k = 0; k < n; k++) {
      const i = dust.take();
      const a = Math.random() * Math.PI * 2;
      const speed = (0.25 + Math.random() * 0.6) * (0.5 + strength);
      dust.pos.set([at.x + Math.cos(a) * 0.1, 0.03 + Math.random() * 0.06, at.z + Math.sin(a) * 0.1], i * 3);
      dust.vel.set([Math.cos(a) * speed, 0.1 + Math.random() * 0.35 * (0.5 + strength), Math.sin(a) * speed], i * 3);
      dust.age[i] = 0;
      dust.life[i] = 0.8 + Math.random() * 0.7;
      dust.base[i] = (0.2 + Math.random() * 0.14) * (0.6 + strength);
    }
  }

  function spawnSparks(at, strength) {
    const n = Math.round(10 + 30 * strength);
    for (let k = 0; k < n; k++) {
      const i = sparks.take();
      const a = Math.random() * Math.PI * 2;
      const out = (1.2 + Math.random() * 2.8) * (0.5 + strength);
      sparks.pos.set([at.x, Math.max(at.y, 0.02), at.z], i * 3);
      sparks.vel.set([Math.cos(a) * out, (1.0 + Math.random() * 3.0) * (0.4 + strength), Math.sin(a) * out], i * 3);
      sparks.age[i] = 0;
      sparks.life[i] = 0.25 + Math.random() * 0.4;
      sparks.base[i] = SPARK_SIZE * (0.7 + Math.random() * 0.6);
    }
  }

  function update(dt, camera, viewportHeight) {
    // point size in world units → pixels
    const scale = viewportHeight / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
    dust.points.material.uniforms.uScale.value = scale;
    sparks.points.material.uniforms.uScale.value = scale;

    // dust: drifts outward and a bit up, slows down, grows, fades
    const drag = Math.exp(-3.2 * dt);
    for (let i = 0; i < dust.count; i++) {
      if (dust.age[i] >= dust.life[i]) {
        dust.alpha[i] = 0;
        continue;
      }
      dust.age[i] += dt;
      const t = Math.min(dust.age[i] / dust.life[i], 1);
      const j = i * 3;
      dust.vel[j] *= drag;
      dust.vel[j + 1] *= drag;
      dust.vel[j + 2] *= drag;
      dust.pos[j] += dust.vel[j] * dt;
      dust.pos[j + 1] += dust.vel[j + 1] * dt;
      dust.pos[j + 2] += dust.vel[j + 2] * dt;
      dust.size[i] = dust.base[i] * (1 + 1.6 * t);
      dust.alpha[i] = DUST_OPACITY * (1 - t) ** 1.6 * Math.min(1, t * 12);
    }

    // sparks: ballistic with gravity, bounce once off the floor, cool and fade fast
    for (let i = 0; i < sparks.count; i++) {
      if (sparks.age[i] >= sparks.life[i]) {
        sparks.alpha[i] = 0;
        continue;
      }
      sparks.age[i] += dt;
      const t = Math.min(sparks.age[i] / sparks.life[i], 1);
      const j = i * 3;
      sparks.vel[j + 1] -= 9.8 * dt;
      sparks.pos[j] += sparks.vel[j] * dt;
      sparks.pos[j + 1] += sparks.vel[j + 1] * dt;
      sparks.pos[j + 2] += sparks.vel[j + 2] * dt;
      if (sparks.pos[j + 1] < 0.01 && sparks.vel[j + 1] < 0) {
        sparks.pos[j + 1] = 0.01;
        sparks.vel[j + 1] *= -0.3;
        sparks.vel[j] *= 0.6;
        sparks.vel[j + 2] *= 0.6;
      }
      sparks.size[i] = sparks.base[i];
      sparks.alpha[i] = (1 - t) ** 1.2;
    }

    for (const p of [dust, sparks]) {
      const g = p.points.geometry;
      g.attributes.position.needsUpdate = true;
      g.attributes.aAlpha.needsUpdate = true;
      g.attributes.aSize.needsUpdate = true;
    }
  }

  return { spawnDust, spawnSparks, update };
}
