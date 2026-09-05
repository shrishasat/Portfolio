import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";


/* =========================================================
   SCENE
========================================================= */

const canvas =
  document.getElementById("robotCanvas");

const scene =
  new THREE.Scene();


/* =========================================================
   CAMERA
========================================================= */

const camera =
  new THREE.PerspectiveCamera(
    35,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );


camera.position.set(
  0,
  1.6,
  8
);


/* =========================================================
   RENDERER
========================================================= */

const renderer =
  new THREE.WebGLRenderer({

    canvas,

    antialias: true,

    alpha: true

  });


renderer.setPixelRatio(
  Math.min(window.devicePixelRatio, 2)
);

renderer.setSize(
  window.innerWidth,
  window.innerHeight
);

renderer.outputColorSpace =
  THREE.SRGBColorSpace;


/* =========================================================
   LIGHTING
========================================================= */

scene.add(
  new THREE.HemisphereLight(
    0xffffff,
    0x555555,
    2.6
  )
);


const keyLight =
  new THREE.DirectionalLight(
    0xffffff,
    4.5
  );

keyLight.position.set(
  4,
  7,
  5
);

scene.add(keyLight);


const fillLight =
  new THREE.DirectionalLight(
    0xffffff,
    2
  );

fillLight.position.set(
  -4,
  4,
  -3
);

scene.add(fillLight);


/* =========================================================
   ROBOT
========================================================= */

const loader =
  new GLTFLoader();

let robot = null;

let mixer = null;

let greetingAction = null;

let isGreeting = false;

let lastGreeting = 0;


/*
  Position robot on right side.
*/

const ROBOT_POSITION =
  new THREE.Vector3(
    2.9,
    -0.45,
    0
  );


const ROBOT_SCALE = 2.15;


/* =========================================================
   LOAD
========================================================= */

loader.load(

  "models/greetinggreet.glb",

  (gltf) => {

    robot = gltf.scene;

    robot.position.copy(
      ROBOT_POSITION
    );

    robot.scale.setScalar(
      ROBOT_SCALE
    );


    robot.traverse((child) => {

      if (!child.isMesh) return;

      child.castShadow = true;

      child.receiveShadow = true;


      if (child.material) {

        child.material =
          child.material.clone();

        /*
          Shiny black chrome.
        */

        child.material.color.setRGB(
          0.025,
          0.025,
          0.025
        );

        child.material.metalness =
          0.88;

        child.material.roughness =
          0.16;

      }

    });


    scene.add(robot);


    /* =====================================================
       ANIMATION
    ===================================================== */

    mixer =
      new THREE.AnimationMixer(
        robot
      );


    if (
      gltf.animations.length > 0
    ) {

      greetingAction =
        mixer.clipAction(
          gltf.animations[0]
        );

      greetingAction.setLoop(
        THREE.LoopOnce,
        1
      );

      greetingAction.clampWhenFinished =
        true;


      mixer.addEventListener(
        "finished",
        () => {

          isGreeting = false;

        }
      );


      /*
        First greeting after entering.
      */

      setTimeout(
        playGreeting,
        1200
      );

    }

  },

  undefined,

  (error) => {

    console.error(
      "Could not load models/greetinggreet.glb:",
      error
    );

  }

);


/* =========================================================
   GREETING
========================================================= */

function playGreeting() {

  if (
    !greetingAction ||
    isGreeting
  ) {
    return;
  }


  const now =
    performance.now();


  /*
    Prevent frantic restarting.
  */

  if (
    now - lastGreeting <
    3000
  ) {
    return;
  }


  lastGreeting = now;

  isGreeting = true;


  greetingAction.reset();

  greetingAction.play();
}


/* =========================================================
   CURSOR
========================================================= */

const pointer = {

  x: -9999,

  y: -9999

};


window.addEventListener(
  "pointermove",
  (event) => {

    pointer.x =
      event.clientX;

    pointer.y =
      event.clientY;

  }
);


/*
  Instead of checking distance from the
  robot's 3D position, create a simple
  "robot area" on the right side.
*/

let cursorInsideRobotZone =
  false;


function checkCursor() {

  const zoneStart =
    window.innerWidth * 0.68;


  const inside =
    pointer.x > zoneStart;


  /*
    Only trigger when cursor enters.
  */

  if (
    inside &&
    !cursorInsideRobotZone
  ) {

    playGreeting();

  }


  cursorInsideRobotZone =
    inside;
}


/* =========================================================
   ANIMATION
========================================================= */

const clock =
  new THREE.Clock();


function animate() {

  requestAnimationFrame(
    animate
  );


  const delta =
    clock.getDelta();


  if (mixer) {

    mixer.update(delta);

  }


  checkCursor();


  renderer.render(
    scene,
    camera
  );

}


animate();


/* =========================================================
   RESIZE
========================================================= */

window.addEventListener(
  "resize",
  () => {

    camera.aspect =
      window.innerWidth /
      window.innerHeight;

    camera.updateProjectionMatrix();


    renderer.setSize(
      window.innerWidth,
      window.innerHeight
    );

  }
);


/* =========================================================
   NAVIGATION
========================================================= */

const nav =
  document.getElementById("nav");


function updateNav() {

  /*
    Very small amount of scroll.
    The page itself does not move because
    the home page is locked to 100vh.
  */

  const visible =
    window.scrollY > 20;


  nav.classList.toggle(
    "nav--visible",
    visible
  );

}


window.addEventListener(
  "scroll",
  updateNav,
  {
    passive: true
  }
);

updateNav();


/* =========================================================
   TELEMETRY
========================================================= */

const telemetry =
  document.getElementById(
    "telemetry"
  );


const AU_KM =
  149597870;


const EARTH_ORBIT_SPEED =
  29.78;


const ANDROMEDA_LY =
  2537000;


function renderTelemetry() {

  const now =
    new Date();


  const seconds =
    now.getHours() * 3600 +
    now.getMinutes() * 60 +
    now.getSeconds();


  const orbitToday =
    EARTH_ORBIT_SPEED *
    seconds;


  const sunDistance =
    AU_KM +
    Math.sin(
      now.getTime() / 90000
    ) * 25000;


  const time =
    new Intl.DateTimeFormat(
      "en-GB",
      {
        timeZone:
          "Asia/Kolkata",

        hour:
          "2-digit",

        minute:
          "2-digit",

        second:
          "2-digit",

        hour12:
          false
      }
    ).format(now);


  telemetry.innerHTML = `

    <div class="tele-row">
      <span class="tele-zone">
        IST
      </span>

      <span class="tele-time">
        ${time}
      </span>
    </div>

    <hr>

    <div class="tele-row">
      <span class="tele-metric">
        SUN
      </span>

      <span class="tele-value">
        ${sunDistance.toLocaleString(
          "en-US",
          {
            maximumFractionDigits: 0
          }
        )} KM
      </span>
    </div>

    <div class="tele-row">
      <span class="tele-metric">
        ORBIT
      </span>

      <span class="tele-value">
        ${orbitToday.toLocaleString(
          "en-US",
          {
            maximumFractionDigits: 0
          }
        )} KM
      </span>
    </div>

    <div class="tele-row">
      <span class="tele-metric">
        ANDROMEDA
      </span>

      <span class="tele-value">
        ${ANDROMEDA_LY.toLocaleString(
          "en-US"
        )} LY
      </span>
    </div>

    <div class="tele-note">
      LIVE ESTIMATE
    </div>

  `;

}


renderTelemetry();

setInterval(
  renderTelemetry,
  1000
);
