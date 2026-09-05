import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

/* ==================================================================
   SCENE / CAMERA / RENDERER
   ================================================================== */

const nav = document.getElementById("nav");
const REVEAL_AT = () => window.innerHeight * 0.12;

function updateNav() {
  nav.classList.toggle("nav--visible", window.scrollY > REVEAL_AT());
}
window.addEventListener("scroll", updateNav, { passive: true });
updateNav();

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

scene.add(new THREE.HemisphereLight(0xffffff, 0x222222, 2.5));

const keyLight = new THREE.DirectionalLight(0xffffff, 4);
keyLight.position.set(4, 7, 5);
keyLight.castShadow = true;
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0xffffff, 2);
rimLight.position.set(-4, 5, -4);
scene.add(rimLight);

/* ==================================================================
   ROBOT — loaded once, reacts to cursor proximity instead of a timer
   ================================================================== */

const loader = new GLTFLoader();

let robot = null;
let mixer = null;
let greetingAction = null;
let isGreeting = false;
let cooldownUntil = 0;

// World-space anchor for the robot, used to test cursor proximity.
const ROBOT_POSITION = new THREE.Vector3(-2.7, -0.35, 0); // raised so feet clear the frame
const PROXIMITY_RADIUS_PX = 220;   // how close (in screen pixels) the cursor must get
const GREETING_COOLDOWN_MS = 4000; // minimum gap between greetings

loader.load(
  "models/greetinggreet.glb",
  (gltf) => {
    robot = gltf.scene;
    robot.position.copy(ROBOT_POSITION);
    robot.scale.setScalar(2.0);

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
      greetingAction.clampWhenFinished = true;

      mixer.addEventListener("finished", () => {
        isGreeting = false;
        cooldownUntil = performance.now() + GREETING_COOLDOWN_MS;
      });
    } else {
      console.warn("No animation found inside greetinggreet.glb");
    }
  },
  undefined,
  (error) => console.error("Could not load greetinggreet.glb:", error)
);

function playGreeting() {
  if (!greetingAction || isGreeting) return;
  isGreeting = true;
  greetingAction.reset();
  greetingAction.play();
}

/* ==================================================================
   CURSOR PROXIMITY — turns real mouse position into a screen-space
   distance from the robot, so it "notices" you approaching it.
   ================================================================== */

const pointer = { x: -9999, y: -9999 };

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

  const dx = pointer.x - screenX;
  const dy = pointer.y - screenY;
  const dist = Math.hypot(dx, dy);

  if (dist < PROXIMITY_RADIUS_PX && performance.now() > cooldownUntil) {
    playGreeting();
  }
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
   NAV — stays hidden until the user scrolls, then docks as a header
   ================================================================== */

const nav = document.getElementById("nav");
const REVEAL_AT = () => window.innerHeight * 0.12;

function updateNav() {
  nav.classList.toggle("nav--visible", window.scrollY > REVEAL_AT());
}
window.addEventListener("scroll", updateNav, { passive: true });
updateNav();

/* ==================================================================
   ROTATING "CATCHY PHRASE" — fades white -> black near the robot
   ================================================================== */

const PHRASES = [
  "Trained on curiosity, fine-tuned on caffeine.",
  "Somewhere between a neuron and a neural net.",
  "I build interfaces for minds, not just machines.",
  "Still debugging the wetware.",
  "Signals in, stories out.",
  "Half scientist, half sceptic, fully curious."
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
   TELEMETRY — clocks + a few slowly-drifting cosmic numbers.
   These distance readouts are computed client-side approximations
   (orbital mechanics constants), not a live satellite feed.
   ================================================================== */

const ZONES = [
  { label: "IST · INDIA",   tz: "Asia/Kolkata" },
  { label: "GMT · UK",      tz: "Europe/London" },
  { label: "EST · USA",     tz: "America/New_York" },
  { label: "JST · JAPAN",   tz: "Asia/Tokyo" },
  { label: "UTC",           tz: "UTC" }
];

const teleEl = document.getElementById("telemetry");

const AU_KM = 149_597_870;             // 1 astronomical unit
const EARTH_ORBIT_SPEED_KMS = 29.78;   // average orbital velocity
const ANDROMEDA_LY = 2_537_000;        // distance to Andromeda, light-years

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit", month: "short", year: "numeric"
});

function renderTelemetry() {
  const now = new Date();
  const secondsToday =
    now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const traveledToday = (EARTH_ORBIT_SPEED_KMS * secondsToday).toLocaleString(
    "en-US", { maximumFractionDigits: 0 }
  );
  const sunWobble = (Math.sin(now.getTime() / 90000) * 25000).toFixed(0);
  const sunDistance = (AU_KM + Number(sunWobble)).toLocaleString("en-US");

  const rows = ZONES.map(z => {
    const time = new Intl.DateTimeFormat("en-GB", {
      timeZone: z.tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
    }).format(now);
    return `<div class="tele-row"><span class="tele-zone">${z.label}</span><span class="tele-time">${time}</span></div>`;
  }).join("");

  teleEl.innerHTML = `
    ${rows}
    <hr />
    <div class="tele-row"><span class="tele-zone">EARTH</span><span class="tele-time">${dateFmt.format(now)}</span></div>
    <hr />
    <div class="tele-row"><span class="tele-metric">Dist. from Sun</span><span class="tele-value">${sunDistance} km</span></div>
    <div class="tele-row"><span class="tele-metric">Orbit today</span><span class="tele-value">${traveledToday} km</span></div>
    <div class="tele-row"><span class="tele-metric">Dist. to Andromeda</span><span class="tele-value">${ANDROMEDA_LY.toLocaleString("en-US")} ly</span></div>
    <div class="tele-note">simulated live estimate</div>
  `;
}

renderTelemetry();
setInterval(renderTelemetry, 1000);
