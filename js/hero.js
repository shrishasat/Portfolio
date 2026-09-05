import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

/* ==================================================================
   SCENE / CAMERA / RENDERER
   ================================================================== */

const scene = new THREE.Scene();
scene.background = null;

const camera = new THREE.PerspectiveCamera(
  35,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 1.6, 8);

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("robotCanvas"),
  antialias: true,
  alpha: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

/* ==================================================================
   LIGHTING
   ================================================================== */

scene.add(new THREE.HemisphereLight(0xffffff, 0x666666, 2.5));

const keyLight = new THREE.DirectionalLight(0xffffff, 4);
keyLight.position.set(4, 7, 5);
keyLight.castShadow = true;
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0xffffff, 2);
rimLight.position.set(-4, 5, -4);
scene.add(rimLight);

/* ==================================================================
   ROBOT
   - plays its greeting once, ~1s after load, then holds ("sleeps")
   - replays every time the cursor newly enters its proximity radius
   ================================================================== */

const loader = new GLTFLoader();

let robot = null;
let mixer = null;
let greetingAction = null;
let isGreeting = false;

// Moved further left and scaled down; raise/lower `y` if feet still clip.
const ROBOT_POSITION = new THREE.Vector3(-2.9, -0.35, 0);
const ROBOT_SCALE = 2.0;
const PROXIMITY_RADIUS_PX = 220; // how close the cursor must get, in screen pixels

loader.load(
  "models/greetinggreet.glb",
  (gltf) => {
    robot = gltf.scene;
    robot.position.copy(ROBOT_POSITION);
    robot.scale.setScalar(ROBOT_SCALE);

    robot.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material = child.material.clone();
          child.material.color.setRGB(0.03, 0.03, 0.03);
          child.material.metalness = 0.85;
          child.material.roughness = 0.18;
        }
      }
    });

    scene.add(robot);

    mixer = new THREE.AnimationMixer(robot);

    if (gltf.animations.length > 0) {
      greetingAction = mixer.clipAction(gltf.animations[0]);
      greetingAction.setLoop(THREE.LoopOnce, 1);
      greetingAction.clampWhenFinished = true; // holds the final pose = "sleeps"

      mixer.addEventListener("finished", () => { isGreeting = false; });

      // Play once automatically, ~1 second after the model is ready.
      setTimeout(playGreeting, 1000);
    } else {
      console.warn("No animation clips found inside greetinggreet.glb");
    }
  },
  undefined,
  (error) => console.error("Could not load models/greetinggreet.glb:", error)
);

function playGreeting() {
  if (!greetingAction || isGreeting) return;
  isGreeting = true;
  greetingAction.reset();
  greetingAction.play();
}

/* ==================================================================
   CURSOR PROXIMITY — edge-triggered: fires only the moment the
   cursor crosses INTO the radius, not continuously while it's inside.
   ================================================================== */

const pointer = { x: -9999, y: -9999 };
let wasNear = false;

window.addEventListener("pointermove", (e) => {
  pointer.x = e.clientX;
  pointer.y = e.clientY;
});

const projected = new THREE.Vector3();

function checkProximity() {
  if (!robot) return;

  projected.copy(ROBOT_POSITION).project(camera);
  const screenX = (projected.x * 0.5 + 0.5) * window.innerWidth;
  const screenY = (-projected.y * 0.5 + 0.5) * window.innerHeight;

  const dist = Math.hypot(pointer.x - screenX, pointer.y - screenY);
  const isNear = dist < PROXIMITY_RADIUS_PX;

  if (isNear && !wasNear) playGreeting(); // just crossed into range
  wasNear = isNear;
}

/* ==================================================================
   ANIMATION LOOP
   ================================================================== */

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  if (mixer) mixer.update(delta);
  checkProximity();
  renderer.render(scene, camera);
}
animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ==================================================================
   NAV — docks in as a header once you scroll
   ================================================================== */

const nav = document.getElementById("nav");
const REVEAL_AT = () => window.innerHeight * 0.08;

function updateNav() {
  nav.classList.toggle("nav--visible", window.scrollY > REVEAL_AT());
}
window.addEventListener("scroll", updateNav, { passive: true });
updateNav();

/* ==================================================================
   ROTATING CATCHY PHRASE
   ================================================================== */

const PHRASES = [
  "Half scientist, half sceptic, fully curious.",
  "Trained on curiosity, fine-tuned on caffeine.",
  "Somewhere between a neuron and a neural net.",
  "I build interfaces for minds, not just machines.",
  "Signals in, stories out."
];

const phraseEl = document.getElementById("phrase");
let phraseIndex = 0;

function cyclePhrase() {
  phraseEl.textContent = PHRASES[phraseIndex % PHRASES.length];
  phraseIndex++;
  phraseEl.classList.remove("run");
  void phraseEl.offsetWidth; // force reflow so the animation restarts
  phraseEl.classList.add("run");
}
cyclePhrase();
setInterval(cyclePhrase, 7000);

/* ==================================================================
   TELEMETRY — per-zone time + date (since date rolls over between
   zones), plus a few slowly-drifting numbers. Distances/age are
   computed client-side from known constants, not a live feed.
   ================================================================== */

const ZONES = [
  { label: "INDIA",  tz: "Asia/Kolkata" },
  { label: "UK",     tz: "Europe/London" },
  { label: "USA",    tz: "America/New_York" },
  { label: "JAPAN",  tz: "Asia/Tokyo" },
  { label: "UTC",    tz: "UTC" }
];

const teleEl = document.getElementById("telemetry");

const AU_KM = 149_597_870;
const EARTH_ORBIT_SPEED_KMS = 29.78;
const ANDROMEDA_LY = 2_537_000;
const EARTH_AGE_YEARS = 4_540_000_000;

function renderTelemetry() {
  const now = new Date();
  const secondsToday = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const traveledToday = (EARTH_ORBIT_SPEED_KMS * secondsToday).toLocaleString("en-US", { maximumFractionDigits: 0 });
  const sunDistance = (AU_KM + Math.sin(now.getTime() / 90000) * 25000).toLocaleString("en-US", { maximumFractionDigits: 0 });

  const rows = ZONES.map(z => {
    const time = new Intl.DateTimeFormat("en-GB", {
      timeZone: z.tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
    }).format(now);
    const date = new Intl.DateTimeFormat("en-GB", {
      timeZone: z.tz, day: "2-digit", month: "short"
    }).format(now);
    return `<div class="tele-row"><span class="tele-zone">${z.label}</span><span class="tele-time">${time}, ${date}</span></div>`;
  }).join("");

  teleEl.innerHTML = `
    ${rows}
    <hr />
    <div class="tele-row"><span class="tele-metric">EARTH AGE</span><span class="tele-value">${(EARTH_AGE_YEARS / 1e9).toFixed(2)}B YRS</span></div>
    <div class="tele-row"><span class="tele-metric">SUN DIST.</span><span class="tele-value">${sunDistance} KM</span></div>
    <div class="tele-row"><span class="tele-metric">ORBIT TODAY</span><span class="tele-value">${traveledToday} KM</span></div>
    <div class="tele-row"><span class="tele-metric">ANDROMEDA</span><span class="tele-value">${ANDROMEDA_LY.toLocaleString("en-US")} LY</span></div>
    <div class="tele-note">simulated live estimate</div>
  `;
}
renderTelemetry();
setInterval(renderTelemetry, 1000);
