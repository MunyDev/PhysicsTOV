import * as glm from 'gl-matrix'
const canvas = document.createElement('canvas');
document.body.appendChild(canvas);
const gl = canvas.getContext('webgl2')
const fragShaderSrc = `#version 300 es
precision mediump float;
in vec3 vColor;
out vec4 FragColor;

void main() {
    FragColor = vec4(vColor, 1.0);
}
`
const vertexShaderSrc = `#version 300 es
in vec3 Vertex;
in vec3 aColor;
out vec3 vColor;
uniform mat4 perspective;
uniform mat4 lookat;
void main() {
    gl_Position = perspective * lookat * vec4(Vertex, 1.0);
    vColor = aColor;
    gl_PointSize = 6.0;
}
`
const vertexShader = gl.createShader(gl.VERTEX_SHADER)
gl.shaderSource(vertexShader, vertexShaderSrc);
gl.compileShader(vertexShader)
if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(vertexShader))
}

const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
gl.shaderSource(fragmentShader, fragShaderSrc);
gl.compileShader(fragmentShader)
if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(fragmentShader))
}

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    alert(gl.getProgramInfoLog(program));
}

gl.useProgram(program);

const vao = gl.createVertexArray();
gl.bindVertexArray(vao);

const positionBuffer = gl.createBuffer();
const colorBuffer = gl.createBuffer();
let vertexCount = 0;

const vertexAttribLocation = gl.getAttribLocation(program, 'Vertex');
if (vertexAttribLocation < 0) {
    throw new Error('Vertex attribute location not found');
}
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.enableVertexAttribArray(vertexAttribLocation);
gl.vertexAttribPointer(vertexAttribLocation, 3, gl.FLOAT, false, 0, 0);

const colorAttribLocation = gl.getAttribLocation(program, 'aColor');
if (colorAttribLocation < 0) {
    throw new Error('Color attribute location not found');
}
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.enableVertexAttribArray(colorAttribLocation);
gl.vertexAttribPointer(colorAttribLocation, 3, gl.FLOAT, false, 0, 0);

gl.bindVertexArray(null);

function toRadians(degrees) {
    return degrees * Math.PI / 180;
}
const perspective = glm.mat4.create();
const fov = toRadians(70);
const near = 0.1;
const far = 100.0;

function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = Math.max(1, Math.floor(window.innerWidth * dpr));
    const displayHeight = Math.max(1, Math.floor(window.innerHeight * dpr));
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    glm.mat4.perspective(perspective, fov, canvas.width / canvas.height, near, far);
}
resizeCanvas();
new ResizeObserver(resizeCanvas)
    .observe(canvas);
const lookat = glm.mat4.create();
glm.mat4.lookAt(lookat, [0, 0, 2], [0, 0, 0], [0, 1, 0]);

const perspectiveLocation = gl.getUniformLocation(program, 'perspective');
const lookatLocation = gl.getUniformLocation(program, 'lookat');

const MAX_SHELLS = 20;
const LAT_RINGS = 12;
const LON_ARCS = 16;
const RING_SEGMENTS = 48;
const ARC_SEGMENTS = 24;
const VERTS_PER_SHELL = (LAT_RINGS - 1) * RING_SEGMENTS * 2 + LON_ARCS * ARC_SEGMENTS * 2;

function buildShellLineSegments(shellRadius, pNorm, positions, colors, writeOffset) {
    let w = writeOffset;
    const r = shellRadius;
    const cR = pNorm;
    const cG = 0.2 + 0.4 * (1 - pNorm);
    const cB = 1.0 - pNorm;

    for (let i = 1; i < LAT_RINGS; i += 1) {
        const phi = Math.PI * i / LAT_RINGS;
        const y = r * Math.cos(phi);
        const ringR = r * Math.sin(phi);
        for (let j = 0; j < RING_SEGMENTS; j += 1) {
            const t0 = 2 * Math.PI * j / RING_SEGMENTS;
            const t1 = 2 * Math.PI * (j + 1) / RING_SEGMENTS;
            positions[w * 3 + 0] = ringR * Math.cos(t0);
            positions[w * 3 + 1] = y;
            positions[w * 3 + 2] = ringR * Math.sin(t0);
            colors[w * 3 + 0] = cR; colors[w * 3 + 1] = cG; colors[w * 3 + 2] = cB;
            w += 1;
            positions[w * 3 + 0] = ringR * Math.cos(t1);
            positions[w * 3 + 1] = y;
            positions[w * 3 + 2] = ringR * Math.sin(t1);
            colors[w * 3 + 0] = cR; colors[w * 3 + 1] = cG; colors[w * 3 + 2] = cB;
            w += 1;
        }
    }

    for (let i = 0; i < LON_ARCS; i += 1) {
        const theta = 2 * Math.PI * i / LON_ARCS;
        const ct = Math.cos(theta);
        const st = Math.sin(theta);
        for (let j = 0; j < ARC_SEGMENTS; j += 1) {
            const p0 = Math.PI * j / ARC_SEGMENTS;
            const p1 = Math.PI * (j + 1) / ARC_SEGMENTS;
            const r0 = r * Math.sin(p0);
            const r1 = r * Math.sin(p1);
            positions[w * 3 + 0] = r0 * ct;
            positions[w * 3 + 1] = r * Math.cos(p0);
            positions[w * 3 + 2] = r0 * st;
            colors[w * 3 + 0] = cR; colors[w * 3 + 1] = cG; colors[w * 3 + 2] = cB;
            w += 1;
            positions[w * 3 + 0] = r1 * ct;
            positions[w * 3 + 1] = r * Math.cos(p1);
            positions[w * 3 + 2] = r1 * st;
            colors[w * 3 + 0] = cR; colors[w * 3 + 1] = cG; colors[w * 3 + 2] = cB;
            w += 1;
        }
    }
    return w;
}

function updatePointGeometry(modelData) {
    const rawEntries = Array.isArray(modelData.P_for_r)
        ? modelData.P_for_r.slice()
        : Object.entries(modelData.P_for_r).map(([r, p]) => [parseFloat(r), p]);
    const entries = rawEntries.filter(([r, p]) => isFinite(r) && isFinite(p) && p > 0 && r > 0);
    entries.sort((a, b) => a[0] - b[0]);
    if (entries.length === 0) {
        vertexCount = 0;
        return;
    }

    const sampled = [];
    const step = Math.max(1, Math.floor(entries.length / MAX_SHELLS));
    for (let i = 0; i < entries.length; i += step) sampled.push(entries[i]);
    if (sampled[sampled.length - 1] !== entries[entries.length - 1]) {
        sampled.push(entries[entries.length - 1]);
    }

    // Absolute scale: 20 km -> 1 unit. Pressure normalized to central pressure
    // (entries[0] is innermost) so colors stay comparable across rho_c values.
    const METERS_PER_UNIT = 4000;
    const pRef = entries[0][1] > 0 ? entries[0][1] : 1;

    const totalVerts = sampled.length * VERTS_PER_SHELL;
    const positions = new Float32Array(totalVerts * 3);
    const colors = new Float32Array(totalVerts * 3);

    let w = 0;
    sampled.forEach(([r, p]) => {
        const pNorm = Math.min(1, Math.max(0, p / pRef));
        const shellRadius = r / METERS_PER_UNIT;
        w = buildShellLineSegments(shellRadius, pNorm, positions, colors, w);
    });

    vertexCount = totalVerts;
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
}

const cameraPos = glm.vec3.fromValues(0, 0, 2);
const cameraFront = glm.vec3.fromValues(0, 0, -1);
const cameraUp = glm.vec3.fromValues(0, 1, 0);
let yaw = -90;
let pitch = 0;
const cameraSpeed = 2.5; // units per second
const turnSpeed = 60; // degrees per second
const keys = {};
const touchControls = {
    forward: false,
    back: false,
    left: false,
    right: false,
    up: false,
    down: false,
    yawLeft: false,
    yawRight: false,
    pitchUp: false,
    pitchDown: false
};
let pointerActive = false;
let pointerLastX = 0;
let pointerLastY = 0;
const touchRotationSensitivity = 0.15;

gl.clearColor(0, 0, 0, 1);

document.addEventListener('keydown', (event) => {
    keys[event.key.toLowerCase()] = true;
});

document.addEventListener('keyup', (event) => {
    keys[event.key.toLowerCase()] = false;
});

// Allow raw touch handling on the canvas
canvas.style.touchAction = 'none';

canvas.addEventListener('pointerdown', (event) => {
    pointerActive = true;
    pointerLastX = event.clientX;
    pointerLastY = event.clientY;
    try { canvas.setPointerCapture(event.pointerId); } catch (e) {}
    event.preventDefault();
});

canvas.addEventListener('pointermove', (event) => {
    if (!pointerActive) return;
    const dx = event.clientX - pointerLastX;
    const dy = event.clientY - pointerLastY;
    yaw += dx * touchRotationSensitivity;
    pitch = Math.max(-89, Math.min(89, pitch - dy * touchRotationSensitivity));
    pointerLastX = event.clientX;
    pointerLastY = event.clientY;
    event.preventDefault();
});

canvas.addEventListener('pointerup', (event) => {
    pointerActive = false;
    try { canvas.releasePointerCapture(event.pointerId); } catch (e) {}
});

canvas.addEventListener('pointercancel', () => {
    pointerActive = false;
});

// Fallback touch events for older or restrictive environments
canvas.addEventListener('touchstart', (e) => {
    const t = e.touches && e.touches[0];
    if (!t) return;
    pointerActive = true;
    pointerLastX = t.clientX;
    pointerLastY = t.clientY;
    e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    if (!pointerActive) return;
    const t = e.touches && e.touches[0];
    if (!t) return;
    const dx = t.clientX - pointerLastX;
    const dy = t.clientY - pointerLastY;
    yaw += dx * touchRotationSensitivity;
    pitch = Math.max(-89, Math.min(89, pitch - dy * touchRotationSensitivity));
    pointerLastX = t.clientX;
    pointerLastY = t.clientY;
    e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    pointerActive = false;
    e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchcancel', (e) => {
    pointerActive = false;
    e.preventDefault();
}, { passive: false });

function createButton(text, control) {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = 'touch-control-button';
    button.addEventListener('pointerdown', (event) => {
        touchControls[control] = true;
        button.classList.add('active');
        event.preventDefault();
    });
    button.addEventListener('pointerup', () => {
        touchControls[control] = false;
        button.classList.remove('active');
    });
    button.addEventListener('pointercancel', () => {
        touchControls[control] = false;
        button.classList.remove('active');
    });
    button.addEventListener('pointerleave', () => {
        touchControls[control] = false;
        button.classList.remove('active');
    });
    return button;
}

const controlsContainer = document.createElement('div');
controlsContainer.id = 'touch-controls';
controlsContainer.innerHTML = `
    <div class="touch-section">
        <div class="touch-title">Move</div>
        <div class="touch-grid">
            <div></div>
            <button data-control="forward">W</button>
            <div></div>
            <button data-control="left">A</button>
            <button data-control="back">S</button>
            <button data-control="right">D</button>
            <button data-control="up">↑</button>
            <button data-control="down">↓</button>
        </div>
    </div>
    <div class="touch-section">
        <div class="touch-title">Look</div>
        <div class="touch-grid">
            <button data-control="pitchUp">↑</button>
            <button data-control="yawLeft">←</button>
            <button data-control="yawRight">→</button>
            <button data-control="pitchDown">↓</button>
        </div>
    </div>
`;
document.body.appendChild(controlsContainer);

controlsContainer.querySelectorAll('button[data-control]').forEach((button) => {
    const control = button.getAttribute('data-control');
    button.className = 'touch-control-button';
    button.addEventListener('pointerdown', (event) => {
        touchControls[control] = true;
        button.classList.add('active');
        event.preventDefault();
    });
    button.addEventListener('pointerup', () => {
        touchControls[control] = false;
        button.classList.remove('active');
    });
    button.addEventListener('pointercancel', () => {
        touchControls[control] = false;
        button.classList.remove('active');
    });
    button.addEventListener('pointerleave', () => {
        touchControls[control] = false;
        button.classList.remove('active');
    });
});

const style = document.createElement('style');
style.textContent = `
#touch-controls {
    position: fixed;
    bottom: 16px;
    left: 16px;
    display: grid;
    gap: 12px;
    z-index: 9999;
    user-select: none;
}
.touch-section {
    background: rgba(0, 0, 0, 0.45);
    border-radius: 14px;
    padding: 10px;
    color: white;
    font-family: sans-serif;
}
.touch-title {
    margin-bottom: 8px;
    font-size: 0.85rem;
    text-align: center;
}
.touch-grid {
    display: grid;
    grid-template-columns: repeat(3, 48px);
    gap: 8px;
    justify-items: center;
}
.touch-control-button {
    width: 48px;
    height: 48px;
    border: none;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.12);
    color: white;
    font-size: 1rem;
    touch-action: none;
}
.touch-control-button.active {
    background: rgba(255, 255, 255, 0.28);
}
.slider-panel {
    position: fixed;
    right: 16px;
    top: 16px;
    width: 240px;
    background: rgba(16, 16, 16, 0.9);
    border: 1px solid #333;
    border-radius: 16px;
    padding: 14px;
    z-index: 9999;
    color: #f1f1f1;
    font-family: sans-serif;
}
.slider-panel h2 {
    margin: 0 0 10px;
    font-size: 1rem;
}
.slider-row {
    margin-bottom: 12px;
}
.slider-row label {
    display: flex;
    justify-content: space-between;
    font-size: 0.9rem;
    margin-bottom: 6px;
}
.slider-row input[type="range"] {
    width: 100%;
}
.slider-row .slider-controls {
    display: flex;
    align-items: center;
    gap: 8px;
}
.slider-row .slider-controls input[type="range"] {
    flex: 1;
}
.slider-row .slider-controls input[type="number"] {
    width: 80px;
    background: rgba(255, 255, 255, 0.08);
    color: #f1f1f1;
    border: 1px solid #444;
    border-radius: 6px;
    padding: 4px 6px;
    font-size: 0.85rem;
}
.slider-output {
    font-size: 0.85rem;
    color: #b8d0ff;
    margin-top: 4px;
}
.slider-status {
    margin-top: 10px;
    font-size: 0.85rem;
    color: #8fe6a5;
}
.solver-badge {
    display: inline-block;
    margin-left: 8px;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 0.7rem;
    font-weight: 600;
    vertical-align: middle;
}
.solver-badge.client {
    background: #ffb347;
    color: #1a1a1a;
}
.solver-badge.server {
    background: #4a90e2;
    color: white;
}
`;
document.head.appendChild(style);

const defaultK = 1.46e-2;
const defaultGamma = 2.0;
const defaultRhoC = 1e17;
const defaultDr = 2;

const sliderPanel = document.createElement('div');
sliderPanel.className = 'slider-panel';
sliderPanel.innerHTML = `
  <h2>Model Sliders <span id="solver-badge"></span></h2>
  <div class="slider-row">
    <label for="k-slider">k <span id="k-value"></span></label>
    <div class="slider-controls">
      <input id="k-slider" type="range" min="0.001" max="0.1" step="0.0001" value="${defaultK}" />
      <input id="k-number" type="number" step="0.0001" value="${defaultK}" />
    </div>
    <div class="slider-output">Use /model?k=&amp;gamma=</div>
  </div>
  <div class="slider-row">
    <label for="gamma-slider">gamma <span id="gamma-value"></span></label>
    <div class="slider-controls">
      <input id="gamma-slider" type="range" min="1.0" max="3.0" step="0.01" value="${defaultGamma}" />
      <input id="gamma-number" type="number" step="0.01" value="${defaultGamma}" />
    </div>
    <div class="slider-output">Live fetch from server</div>
  </div>
  <div class="slider-row">
    <label for="rhoc-slider">log10(rho_c) <span id="rhoc-value"></span></label>
    <div class="slider-controls">
      <input id="rhoc-slider" type="range" min="14" max="19" step="0.05" value="${Math.log10(defaultRhoC)}" />
      <input id="rhoc-number" type="number" step="0.05" value="${Math.log10(defaultRhoC)}" />
    </div>
    <div class="slider-output">Central mass density (kg/m^3)</div>
  </div>
  <div class="slider-row">
    <label for="dr-slider">dr (m) <span id="dr-value"></span></label>
    <div class="slider-controls">
      <input id="dr-slider" type="range" min="0.5" max="50" step="0.5" value="${defaultDr}" />
      <input id="dr-number" type="number" step="0.5" value="${defaultDr}" />
    </div>
    <div class="slider-output">Integration step</div>
  </div>
  <div class="slider-status" id="slider-status">Ready</div>
`;
document.body.appendChild(sliderPanel);

const kSlider = document.getElementById('k-slider');
const gammaSlider = document.getElementById('gamma-slider');
const rhoCSlider = document.getElementById('rhoc-slider');
const drSlider = document.getElementById('dr-slider');
const kNumber = document.getElementById('k-number');
const gammaNumber = document.getElementById('gamma-number');
const rhoCNumber = document.getElementById('rhoc-number');
const drNumber = document.getElementById('dr-number');
const kValue = document.getElementById('k-value');
const gammaValue = document.getElementById('gamma-value');
const rhoCValue = document.getElementById('rhoc-value');
const drValue = document.getElementById('dr-value');
const sliderStatus = document.getElementById('slider-status');
const solverBadge = document.getElementById('solver-badge');
if (clientSolverEnabled) {
    solverBadge.className = 'solver-badge client';
    solverBadge.textContent = 'CLIENT (experimental)';
    solverBadge.title = 'Solving in-browser. Remove ?client=1 to use server.';
} else {
    solverBadge.className = 'solver-badge server';
    solverBadge.textContent = 'SERVER';
    solverBadge.title = 'Using /model endpoint. Append ?client=1 for client-side solver.';
}

function currentRhoC() {
    return Math.pow(10, parseFloat(rhoCSlider.value));
}

function updateSliderLabels() {
    kValue.textContent = parseFloat(kSlider.value).toExponential(2);
    gammaValue.textContent = parseFloat(gammaSlider.value).toFixed(2);
    rhoCValue.textContent = currentRhoC().toExponential(2);
    drValue.textContent = parseFloat(drSlider.value).toFixed(2);
}

const clientSolverEnabled = true
const CLIENT_CACHE_PREFIX = 'tov-client-cache:';

const workerSource = `
const G = 6.674e-11;
const c = 299792458;
const M_sun = 1.989e30;
const threshold = 1e-7;
const R_max = 100000;
const CHUNK_STEPS = 500;

const MAX_REL_DP = 0.05;
const MIN_DR = 1e-9;
const MAX_ITER = 5000000;

function deriv(P, r, m, k, invGamma) {
    const rho = Math.pow(P / k, invGamma);
    const dmdr = 4 * Math.PI * r * r * rho;
    const p1 = -(G * m * rho) / (r * r);
    const p2 = 1 + P / (rho * c * c);
    const p3 = 1 + (4 * Math.PI * r * r * r * P) / (m * c * c);
    const denom = 1 - (2 * G * m) / (r * c * c);
    return { dPdr: p1 * p2 * p3 / denom, dmdr, denom };
}

self.onmessage = (e) => {
    const { k, gamma, rho_c, dr: drMax } = e.data;
    const invGamma = 1 / gamma;
    let r = 1e-6;
    let P = k * Math.pow(rho_c, gamma);
    let m = (4 / 3) * Math.PI * r * r * r * rho_c;
    let chunkR = [];
    let chunkP = [];
    let emitted = 0;
    let iter = 0;
    let h = drMax;

    while (r < R_max && iter < MAX_ITER) {
        iter++;
        let d = deriv(P, r, m, k, invGamma);
        let tries = 0;
        while (true) {
            if (!isFinite(d.dPdr) || d.denom <= 0) {
                h *= 0.5; tries++;
                if (h < MIN_DR || tries > 80) break;
                d = deriv(P, r, m, k, invGamma);
                continue;
            }
            const rel = Math.abs(h * d.dPdr) / P;
            if (rel < MAX_REL_DP) break;
            h *= 0.5; tries++;
            if (h < MIN_DR || tries > 80) break;
        }
        if (h < MIN_DR || !isFinite(d.dPdr) || d.denom <= 0) break;

        P += h * d.dPdr;
        m += h * d.dmdr;
        r += h;

        if (!isFinite(P) || P < threshold) break;

        chunkR.push(r);
        chunkP.push(P);
        emitted++;
        if (emitted % CHUNK_STEPS === 0) {
            self.postMessage({ type: 'progress', rs: chunkR, ps: chunkP, r, m });
            chunkR = []; chunkP = [];
        }

        if (h < drMax) h = Math.min(drMax, h * 1.5);
    }
    if (chunkR.length) self.postMessage({ type: 'progress', rs: chunkR, ps: chunkP, r, m });
    self.postMessage({ type: 'done', R_km: r / 1000, M_solar: m / M_sun, iter });
};
`;
const workerUrl = URL.createObjectURL(new Blob([workerSource], { type: 'application/javascript' }));

let currentWorker = null;
let streamEntries = [];
let streamRenderQueued = false;

function clientCacheKey(k, gamma, rho_c, dr) {
    return `${CLIENT_CACHE_PREFIX}k=${k}_gamma=${gamma}_rho_c=${rho_c}_dr=${dr}`;
}

function queueStreamRender() {
    if (streamRenderQueued) return;
    streamRenderQueued = true;
    requestAnimationFrame(() => {
        streamRenderQueued = false;
        updatePointGeometry({ P_for_r: streamEntries });
    });
}

function fetchModelLocal() {
    const k = parseFloat(kSlider.value);
    const gamma = parseFloat(gammaSlider.value);
    const rho_c = currentRhoC();
    const dr = parseFloat(drSlider.value);
    const key = clientCacheKey(k, gamma, rho_c, dr);

    if (currentWorker) { currentWorker.terminate(); currentWorker = null; }

    try {
        const hit = localStorage.getItem(key);
        if (hit) {
            const data = JSON.parse(hit);
            sliderStatus.textContent = `Client cached (R=${data.R_km.toFixed(2)}km, M=${data.M_solar.toFixed(3)}M☉)`;
            updatePointGeometry(data);
            return;
        }
    } catch (e) {}

    streamEntries = [];
    const t0 = performance.now();
    const worker = new Worker(workerUrl);
    currentWorker = worker;

    worker.onmessage = (e) => {
        const msg = e.data;
        if (msg.type === 'progress') {
            for (let i = 0; i < msg.rs.length; i++) streamEntries.push([msg.rs[i], msg.ps[i]]);
            sliderStatus.textContent = `Streaming… ${streamEntries.length} pts (r=${(msg.r/1000).toFixed(2)}km)`;
        } else if (msg.type === 'done') {
            const ms = (performance.now() - t0).toFixed(1);
            const P_for_r = {};
            for (const [r, p] of streamEntries) P_for_r[r] = p;
            const data = { R_km: msg.R_km, M_solar: msg.M_solar, P_for_r };
            try { localStorage.setItem(key, JSON.stringify(data)); } catch (err) {}
            sliderStatus.textContent = `Client solved in ${ms}ms (R=${msg.R_km.toFixed(2)}km, M=${msg.M_solar.toFixed(3)}M☉)`;
            updatePointGeometry({ P_for_r: streamEntries });
            if (currentWorker === worker) currentWorker = null;
            worker.terminate();
        }
    };
    worker.postMessage({ k, gamma, rho_c, dr });
}

async function fetchModel() {
    if (clientSolverEnabled) { fetchModelLocal(); return; }
    const k = encodeURIComponent(kSlider.value);
    const gamma = encodeURIComponent(gammaSlider.value);
    const rhoC = encodeURIComponent(currentRhoC());
    const dr = encodeURIComponent(drSlider.value);
    const url = `/model?k=${k}&gamma=${gamma}&rho_c=${rhoC}&dr=${dr}`;
    sliderStatus.textContent = `Fetching ${url}...`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        sliderStatus.textContent = res.ok ? `Fetched (cached=${data.cached ?? 'unknown'})` : `Error ${res.status}`;
        if (res.ok && data.P_for_r) {
            updatePointGeometry(data);
        }
        console.log('Model data:', data);
    } catch (err) {
        sliderStatus.textContent = 'Fetch failed';
        console.error(err);
    }
}

const debouncedFetch = (() => {
    let timer = null;
    return () => {
        if (clientSolverEnabled) { fetchModel(); return; }
        clearTimeout(timer);
        timer = setTimeout(fetchModel, 250);
    };
})();

function bindPair(slider, number) {
    slider.addEventListener('input', () => {
        number.value = slider.value;
        updateSliderLabels();
        debouncedFetch();
    });
    number.addEventListener('input', () => {
        if (number.value === '' || isNaN(parseFloat(number.value))) return;
        slider.value = number.value;
        updateSliderLabels();
        debouncedFetch();
    });
}
bindPair(kSlider, kNumber);
bindPair(gammaSlider, gammaNumber);
bindPair(rhoCSlider, rhoCNumber);
bindPair(drSlider, drNumber);

updateSliderLabels();
fetchModel();

function updateCameraFront() {
    const front = glm.vec3.create();
    const yawRad = toRadians(yaw);
    const pitchRad = toRadians(pitch);
    front[0] = Math.cos(yawRad) * Math.cos(pitchRad);
    front[1] = Math.sin(pitchRad);
    front[2] = Math.sin(yawRad) * Math.cos(pitchRad);
    glm.vec3.normalize(cameraFront, front);
}

function updateLookAt() {
    const target = glm.vec3.create();
    glm.vec3.add(target, cameraPos, cameraFront);
    glm.mat4.lookAt(lookat, cameraPos, target, cameraUp);
    gl.uniformMatrix4fv(lookatLocation, false, lookat);
}

function updateCamera(deltaTime) {
    const velocity = cameraSpeed * deltaTime;
    const right = glm.vec3.create();
    glm.vec3.cross(right, cameraFront, cameraUp);
    glm.vec3.normalize(right, right);

    const forwardActive = keys['w'] || touchControls.forward;
    const backActive = keys['s'] || touchControls.back;
    const leftActive = keys['a'] || touchControls.left;
    const rightActive = keys['d'] || touchControls.right;
    const upActive = keys[' '] || touchControls.up;
    const downActive = keys['shift'] || touchControls.down;
    const yawLeftActive = keys['arrowleft'] || touchControls.yawLeft;
    const yawRightActive = keys['arrowright'] || touchControls.yawRight;
    const pitchUpActive = keys['arrowup'] || touchControls.pitchUp;
    const pitchDownActive = keys['arrowdown'] || touchControls.pitchDown;

    if (forwardActive) glm.vec3.scaleAndAdd(cameraPos, cameraPos, cameraFront, velocity);
    if (backActive) glm.vec3.scaleAndAdd(cameraPos, cameraPos, cameraFront, -velocity);
    if (leftActive) glm.vec3.scaleAndAdd(cameraPos, cameraPos, right, -velocity);
    if (rightActive) glm.vec3.scaleAndAdd(cameraPos, cameraPos, right, velocity);
    if (upActive) glm.vec3.scaleAndAdd(cameraPos, cameraPos, cameraUp, velocity);
    if (downActive) glm.vec3.scaleAndAdd(cameraPos, cameraPos, cameraUp, -velocity);
    if (yawLeftActive) yaw -= turnSpeed * deltaTime;
    if (yawRightActive) yaw += turnSpeed * deltaTime;
    if (pitchUpActive) pitch = Math.min(89, pitch + turnSpeed * deltaTime);
    if (pitchDownActive) pitch = Math.max(-89, pitch - turnSpeed * deltaTime);
}

function render(time) {
    const seconds = time * 0.001;
    const deltaTime = Math.min(0.05, seconds - (render.lastTime || 0));
    render.lastTime = seconds;

    updateCameraFront();
    updateCamera(deltaTime);
    gl.useProgram(program);
    gl.uniformMatrix4fv(perspectiveLocation, false, perspective);
    updateLookAt();

    gl.clear(gl.COLOR_BUFFER_BIT);
    if (vertexCount > 0) {
        gl.bindVertexArray(vao);
        gl.drawArrays(gl.LINES, 0, vertexCount);
        gl.bindVertexArray(null);
    }
    requestAnimationFrame(render);
}

requestAnimationFrame(render);