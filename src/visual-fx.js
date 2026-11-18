/**
 * Web Audio V4 — six GPU-friendly Three.js visual effects.
 * The host supplies its existing analyser results; this module never handles audio routing.
 * Each mode uses batched BufferGeometry / Points, and inactive GPU resources are disposed.
 */
export function createVisualizerFX(THREE, parent, initialTheme) {
  const group = new THREE.Group();
  parent.add(group);
  const PI2 = Math.PI * 2;
  const mobile = matchMedia('(pointer: coarse)').matches || innerWidth < 720;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  let mode = null, density = mobile ? 1100 : 2100;
  let brightness = .7, theme = initialTheme, palette = [], items = [], extras = {};
  const resources = [];
  const register = object => { group.add(object); items.push(object); return object; };
  const track = (geometry, material) => {
    resources.push(geometry, material);
  };
  const updatePalette = () => {
    palette = [new THREE.Color(theme.main), new THREE.Color(theme.second), new THREE.Color(theme.third)];
  };
  updatePalette();
  const makeLine = (vertices, color, opacity = .68, loop = false) => {
    const positions = new Float32Array(vertices * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    const material = new THREE.LineBasicMaterial({
      color, transparent: true, opacity: opacity * brightness, depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const object = loop ? new THREE.LineLoop(geometry, material) : new THREE.Line(geometry, material);
    object.frustumCulled = false;
    track(geometry, material);
    register(object);
    return { object, geometry, positions, opacity };
  };
  const makeSegments = (vertices, withColors = false, opacity = .84) => {
    const positions = new Float32Array(vertices * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    if (withColors) geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(vertices * 3), 3));
    const material = new THREE.LineBasicMaterial({
      color: 0xffffff, vertexColors: withColors, transparent: true,
      opacity: opacity * brightness, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const object = new THREE.LineSegments(geometry, material);
    object.frustumCulled = false;
    track(geometry, material);
    register(object);
    return { object, geometry, positions, opacity };
  };
  const clear = () => {
    for (const item of items) group.remove(item);
    for (const resource of resources) resource.dispose();
    items = []; resources.length = 0; extras = {};
  };
  function buildTunnel() {
    const rings = [];
    for (let j = 0; j < 24; j++) {
      const l = makeLine(64, palette[j % 3], .46 + (j % 4) * .075, true);
      for (let i = 0; i < 64; i++) {
        const a = i / 64 * PI2, k = i * 3;
        l.positions[k] = Math.cos(a) * 4.5;
        l.positions[k + 1] = Math.sin(a) * 3;
        l.positions[k + 2] = 0;
      }
      l.geometry.attributes.position.needsUpdate = true;
      rings.push(l);
    }
    const rails = [];
    for (let j = 0; j < 12; j++) {
      const l = makeLine(36, palette[j % 3], .45);
      rails.push(l);
    }
    extras = {rings, rails};
  }
  function buildAurora() {
    const ribbons = [];
    for (let j = 0; j < 15; j++) {
      const l = makeLine(126, palette[j % 3], .23 + (j % 5) * .07);
      ribbons.push(l);
    }
    extras = { ribbons };
  }
  function buildWave() {
    const waves = [];
    for (let j = 0; j < 12; j++) {
      waves.push(makeLine(192, palette[j % 3], .32 + (j % 4) * .095));
    }
    extras = { waves };
  }
  function buildGalaxy() {
    const n = Math.min(density, mobile ? 1600 : 5000);
    const positions = new Float32Array(n * 3);
    const colors = new Float32Array(n * 3);
    const seed = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      const k = i * 4, c = palette[i % 3];
      seed[k] = Math.random(); seed[k + 1] = Math.random();
      seed[k + 2] = Math.random(); seed[k + 3] = Math.random();
      colors.set([c.r, c.g, c.b], i * 3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({
      size: mobile ? .125 : .17, sizeAttenuation: true, vertexColors: true,
      transparent: true, opacity: brightness * .85, depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const obj = new THREE.Points(geometry, material);
    obj.frustumCulled = false;
    register(obj); track(geometry, material);
    extras = { n, seed, positions, geometry };
  }
  function buildFiber() {
    const strands = Math.min(mobile ? 140 : 330, Math.max(60, Math.round(density / 8)));
    const sections = 28;
    const segments = makeSegments(strands * (sections - 1) * 2, true, .6);
    const colors = segments.geometry.attributes.color.array;
    for (let i = 0; i < strands; i++) {
      const color = palette[i % 3];
      for (let s = 0; s < sections - 1; s++) {
        const idx = (i * (sections - 1) + s) * 6;
        colors[idx] = color.r; colors[idx + 1] = color.g; colors[idx + 2] = color.b;
        colors[idx + 3] = color.r; colors[idx + 4] = color.g; colors[idx + 5] = color.b;
      }
    }
    segments.geometry.attributes.color.needsUpdate = true;
    extras = { strands, sections, segments };
  }
  function buildRing() {
    const n = mobile ? 144 : 240;
    const rings = 3;
    const segments = makeSegments(n * rings * 2, true, .87);
    const colors = segments.geometry.attributes.color.array;
    for (let layer = 0; layer < rings; layer++) {
      const c = palette[layer];
      for (let i = 0; i < n; i++) {
        const k = (layer * n + i) * 6;
        for (let p = 0; p < 2; p++) {
          colors[k + p * 3] = c.r;
          colors[k + p * 3 + 1] = c.g;
          colors[k + p * 3 + 2] = c.b;
        }
      }
    }
    segments.geometry.attributes.color.needsUpdate = true;
    extras = {n, rings, segments};
  }
  function setMode(next) {
    if (next && !['tunnel', 'aurora', 'wave', 'galaxy', 'fiber', 'ring'].includes(next)) return;
    if (next === mode) return;
    clear();
    mode = next;
    group.visible = Boolean(next);
    if (mode === 'tunnel') buildTunnel();
    if (mode === 'aurora') buildAurora();
    if (mode === 'wave') buildWave();
    if (mode === 'galaxy') buildGalaxy();
    if (mode === 'fiber') buildFiber();
    if (mode === 'ring') buildRing();
  }
  function band(levels, fraction) {
    const a = levels.bands || [];
    const index = clamp(Math.floor(fraction * (a.length - 1)), 0, a.length - 1);
    return a.length ? (a[index] || 0) : 0;
  }
  function update(t, levels) {
    if (!mode) return;
    const bass = clamp(levels.bass || 0, 0, 2);
    const mid = clamp(levels.mid || 0, 0, 2);
    const high = clamp(levels.high || 0, 0, 2);
    const beat = levels.beat || 0;
    if (mode === 'tunnel') {
      const {rings, rails} = extras;
      for (let j = 0; j < rings.length; j++) {
        const obj = rings[j].object;
        const travel = (t * (2.4 + bass * 7) + j * 1.15) % 27;
        const p = .78 + bass * .25 + beat * .22;
        obj.position.z = 10 - travel;
        obj.scale.set(p, p, 1);
        obj.rotation.z = t * .095 + j * .18;
      }
      for (let j = 0; j < rails.length; j++) {
        const l = rails[j], a = j / rails.length * PI2;
        for (let i = 0; i < 36; i++) {
          const k = i * 3, z = -24 + i;
          l.positions[k] = Math.cos(a + .13 * Math.sin(t + i * .05)) * (4.5 + bass);
          l.positions[k + 1] = Math.sin(a + .13 * Math.sin(t + i * .05)) * (3 + bass);
          l.positions[k + 2] = z;
        }
        l.geometry.attributes.position.needsUpdate = true;
      }
    } else if (mode === 'aurora') {
      for (let j = 0; j < extras.ribbons.length; j++) {
        const l = extras.ribbons[j];
        for (let i = 0; i < 126; i++) {
          const u = i / 125, k = i * 3;
          l.positions[k] = (u - .5) * 24;
          l.positions[k + 1] = (j - 7) * .27 + Math.sin(u * 8.5 + t * (.58 + j * .011) + j * .31) * (1.1 + mid * 1.6) + Math.cos(u * 19 - t + j) * (.22 + high * .45);
          l.positions[k + 2] = Math.sin(u * 5 + t * .23 + j * .45) * 1.65 + (j - 7) * .18;
        }
        l.geometry.attributes.position.needsUpdate = true;
      }
    } else if (mode === 'wave') {
      for (let j = 0; j < extras.waves.length; j++) {
        const l = extras.waves[j];
        for (let i = 0; i < 192; i++) {
          const u = i / 191, k = i * 3;
          const frequency = band(levels, u);
          const baseline = Math.sin(u * 17 + t * 1.45 + j * .25) * (.16 + mid * .65);
          const peaks = Math.sin(u * 40 - t * 2 + j * .44) * (.17 + high * .8);
          l.positions[k] = (u - .5) * 22;
          l.positions[k + 1] = (j - 5.5) * .29 + baseline + peaks + frequency * (2.2 + bass * 1.7) * Math.sin(u * PI2 * 2 + t + j * .1);
          l.positions[k + 2] = (j - 5.5) * .31;
        }
        l.geometry.attributes.position.needsUpdate = true;
      }
    } else if (mode === 'galaxy') {
      const {n, seed, positions, geometry} = extras;
      const expansion = 1 + bass * .28 + beat * .14;
      for (let i = 0; i < n; i++) {
        const k = i * 4, d = i * 3;
        const r = 1.1 + Math.pow(seed[k], .75) * 10;
        const angle = seed[k + 1] * PI2 + Math.floor(seed[k + 2] * 4) * PI2 / 4 + r * .43 + t * (.09 + .65 / (1 + r));
        positions[d] = Math.cos(angle) * r * expansion;
        positions[d + 1] = (seed[k + 3] - .5) * (2.8 + high * 2.5) + Math.sin(angle * 2.8 + t) * .4;
        positions[d + 2] = Math.sin(angle) * r * .75 * expansion;
      }
      geometry.attributes.position.needsUpdate = true;
    } else if (mode === 'fiber') {
      const {strands, sections, segments} = extras;
      const p = segments.positions;
      let offset = 0;
      for (let i = 0; i < strands; i++) {
        const side = (i / (strands - 1) - .5) * 18;
        const phase = i * 2.3999;
        for (let s = 0; s < sections - 1; s++) {
          for (let endpoint = 0; endpoint < 2; endpoint++) {
            const u = (s + endpoint) / (sections - 1);
            const sway = Math.sin(u * 7 + t * 1.1 + phase) * (1.0 + mid * 1.2) * u
              + Math.sin(u * 16 - t * 1.65 + phase) * high * .42;
            p[offset++] = side + sway;
            p[offset++] = -5.7 + u * (11.7 + bass * 2.2);
            p[offset++] = Math.sin(phase) * 3.8 + Math.cos(u * 8 + t * .4 + phase) * (1 + mid) * u;
          }
        }
      }
      segments.geometry.attributes.position.needsUpdate = true;
    } else if (mode === 'ring') {
      const {n, rings, segments} = extras;
      const p = segments.positions;
      for (let layer = 0; layer < rings; layer++) {
        for (let i = 0; i < n; i++) {
          const u = i / n, a = u * PI2 + t * .05 * (layer % 2 ? -1 : 1);
          const power = band(levels, u);
          const inner = 2.35 + layer * .62;
          const outer = inner + .19 + power * (2.5 + bass * 2.4) + beat * .12;
          const k = (layer * n + i) * 6;
          p[k] = Math.cos(a) * inner;
          p[k + 1] = Math.sin(a) * inner;
          p[k + 2] = (layer - 1) * 1.15;
          p[k + 3] = Math.cos(a) * outer;
          p[k + 4] = Math.sin(a) * outer;
          p[k + 5] = (layer - 1) * 1.15;
        }
      }
      segments.geometry.attributes.position.needsUpdate = true;
    }
  }
  function setDensity(n) {
    density = clamp(Number(n) || 1100, 500, 5000);
    if (mode === 'galaxy' || mode === 'fiber') {
      const current = mode; mode = null; setMode(current);
    }
  }
  function setTheme(t) {
    theme = t; updatePalette();
    if (mode) { const current = mode; mode = null; setMode(current); }
  }
  function setBrightness(v) {
    brightness = clamp(Number(v), .15, 1.5);
    for (const item of items) {
      if (item.material) item.material.opacity = clamp(brightness, .1, 1.5) * (item.userData.baseOpacity || 1);
    }
  }
  function dispose() { clear(); parent.remove(group); }
  return {setMode, update, setDensity, setTheme, setBrightness, dispose};
}
