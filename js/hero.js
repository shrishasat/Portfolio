import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";


/* =========================================================
   THREE.JS SETUP
========================================================= */

const canvas = document.getElementById("robotCanvas");

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
  canvas,
  antialias: true,
  alpha: true
});


renderer.setSize(
  window.innerWidth,
  window.innerHeight
);

renderer.setPixelRatio(
  Math.min(window.devicePixelRatio, 2)
);

renderer.outputColorSpace = THREE.SRGBColorSpace;


/* =========================================================
   LIGHTING
========================================================= */

const hemi = new THREE.HemisphereLight(
  0xffffff,
  0x777777,
  2.8
);

scene.add(hemi);


const keyLight = new THREE.DirectionalLight(
  0xffffff,
  4.5
);

keyLight.position.set(
  4,
  7,
  5
);

scene.add(keyLight);


const fillLight = new THREE.DirectionalLight(
  0xffffff,
  2.5
);

fillLight.position.set(
  -5,
  4,
  -4
);

scene.add(fillLight);


/* =========================================================
   ROBOT
========================================================= */

const loader = new GLTFLoader();

let robot = null;

let mixer = null;

let greetingAction = null;

let isGreeting = false;

let greetingTimer = null;


/*
  Large robot on the LEFT.

  Increase/decrease these if you want to move it.
*/
const ROBOT_POSITION = new THREE.Vector3(
  -2.8,
  0.15,
  0
);

const ROBOT_SCALE = 2.35;


/* =========================================================
   ROBOT MATERIAL
========================================================= */

function styleRobot(model) {

  model.traverse((child) => {

    if (!child.isMesh) return;


    child.castShadow = true;
    child.receiveShadow = true;


    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material];


    child.material = materials.map((source) => {

      const material = source.clone();


      if ("metalness" in material) {

        material.metalness = 0.92;
      }


      if ("roughness" in material) {

        material.roughness = 0.16;
      }


      if ("envMapIntensity" in material) {

        material.envMapIntensity = 2;
      }


      const name = (
        `${child.name} ${material.name}`
      ).toLowerCase();


      /*
        Default = shiny black.

        Parts named joint / silver / chrome /
        white / eye etc. become white.
      */

      const lightPart =
        /joint|white|silver|chrome|eye|light|hand|foot|neck/.test(name);


      if ("color" in material) {

        material.color.set(
          lightPart
            ? 0xf2f2f0
            : 0x111111
        );
      }


      return material;

    });

  });
}


/* =========================================================
   LOAD GREETING ROBOT
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


    styleRobot(robot);


    /*
      Prevent feet from being accidentally below
      the visible canvas.
    */

    const box = new THREE.Box3()
      .setFromObject(robot);


    const minY = box.min.y;


    if (minY < -0.8) {

      robot.position.y +=
        Math.abs(minY) + 0.1;
    }


    scene.add(robot);


    mixer = new THREE.AnimationMixer(robot);


    if (gltf.animations.length === 0) {

      console.warn(
        "greetinggreet.glb contains no animation clips."
      );

      return;
    }


    /*
      Use the first animation in the GLB.
    */

    greetingAction =
      mixer.clipAction(
        gltf.animations[0]
      );


    greetingAction.setLoop(
      THREE.LoopOnce,
      1
    );


    greetingAction.clampWhenFinished = true;


    /*
      When greeting finishes:
      wait 30 seconds,
      then greet again.
    */

    mixer.addEventListener(
      "finished",
      () => {

        isGreeting = false;


        clearTimeout(
          greetingTimer
        );


        greetingTimer = setTimeout(
          playGreeting,
          30000
        );

      }
    );


    /*
      First greeting after 1 second.
    */

    setTimeout(
      playGreeting,
      1000
    );

  },

  undefined,

  (error) => {

    console.error(
      "Could not load greetinggreet.glb:",
      error
    );

  }
);


/* =========================================================
   PLAY GREETING
========================================================= */

function playGreeting() {

  if (!greetingAction) return;


  /*
    Don't restart the animation halfway through.
  */

  if (isGreeting) return;


  clearTimeout(
    greetingTimer
  );


  isGreeting = true;


  greetingAction.reset();

  greetingAction.setLoop(
    THREE.LoopOnce,
    1
  );

  greetingAction.clampWhenFinished = true;

  greetingAction.play();
}


/* =========================================================
   RIGHT-SIDE MOUSE TRIGGER
========================================================= */

let pointerWasOnRight = false;


window.addEventListener(
  "pointermove",
  (event) => {

    /*
      Rightmost 28% of the screen.
    */

    const pointerOnRight =
      event.clientX >
      window.innerWidth * 0.72;


    /*
      Trigger only when the cursor ENTERS
      the right-side zone.

      Otherwise it would restart constantly
      while the mouse is moving.
    */

    if (
      pointerOnRight &&
      !pointerWasOnRight
    ) {

      playGreeting();
    }


    pointerWasOnRight =
      pointerOnRight;
  }
);


/* =========================================================
   ROTATING PHRASES
========================================================= */

const PHRASES = [

  "half scientist, half skeptic.",

  "curious enough to question the model.",

  "I like evidence. I also like asking why.",

  "somewhere between brains and machines.",

  "building models, doubting models.",

  "less interested in answers than better questions.",

  "part researcher, part builder.",

  "trying to understand what the brain leaves unsaid.",

  "neuroscience, but make it computational.",

  "I trust the data. I inspect the assumptions.",

  "always one experiment away from changing my mind."

];


const phraseEl =
  document.getElementById("phrase");


let phraseIndex = 0;


function showNextPhrase() {

  if (!phraseEl) return;


  phraseEl.classList.remove("run");


  /*
    Force browser to restart animation.
  */

  void phraseEl.offsetWidth;


  phraseEl.textContent =
    PHRASES[phraseIndex];


  phraseEl.classList.add("run");


  phraseIndex =
    (phraseIndex + 1) %
    PHRASES.length;
}


/*
  First phrase after a short delay.
*/

setTimeout(
  showNextPhrase,
  1800
);


/*
  Change phrase every ~7 seconds.
*/

setInterval(
  showNextPhrase,
  7000
);


/* =========================================================
   LIVE TIME
========================================================= */

const localTimeEl =
  document.getElementById("localTime");


function updateClock() {

  if (!localTimeEl) return;


  const now =
    new Date();


  localTimeEl.textContent =
    now.toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      }
    );
}


updateClock();


setInterval(
  updateClock,
  1000
);


/* =========================================================
   EARTH ORBIT
========================================================= */

/*
  Approximate distance Earth travels around the Sun
  during the current calendar day.

  Circumference ≈ 2π × 149.6 million km
  / 365.2425 days.
*/

const orbitTodayEl =
  document.getElementById("orbitToday");


function updateOrbit() {

  if (!orbitTodayEl) return;


  const earthOrbitRadius =
    149600000;


  const circumference =
    2 * Math.PI *
    earthOrbitRadius;


  const dailyDistance =
    circumference /
    365.2425;


  orbitTodayEl.textContent =
    `${Math.round(dailyDistance).toLocaleString()} KM`;
}


updateOrbit();


/* =========================================================
   CLOSEST UPCOMING ASTEROID
========================================================= */

const asteroidEl =
  document.getElementById(
    "asteroidDistance"
  );


/*
  NASA/JPL CNEOS CAD API.

  We request close approaches from today
  through the next 7 days.

  sort=dist gives the closest object first.
*/

async function updateAsteroid() {

  if (!asteroidEl) return;


  try {

    const now =
      new Date();


    const start =
      now.toISOString()
        .slice(0, 10);


    const future =
      new Date(
        now.getTime() +
        7 * 24 * 60 * 60 * 1000
      );


    const end =
      future.toISOString()
        .slice(0, 10);


    const url =
      "https://ssd-api.jpl.nasa.gov/cad.api" +
      `?body=Earth` +
      `&date-min=${start}` +
      `&date-max=${end}` +
      `&dist-max=0.1` +
      `&sort=dist`;


    const response =
      await fetch(url);


    if (!response.ok) {

      throw new Error(
        `NASA API returned ${response.status}`
      );
    }


    const data =
      await response.json();


    /*
      NASA's CAD API returns:
      data = array of close approaches

      dist is in AU.
    */

    if (
      !data.data ||
      data.data.length === 0
    ) {

      asteroidEl.textContent =
        "NO OBJECTS";

      return;
    }


    const closest =
      data.data[0];


    /*
      According to the CNEOS API structure,
      the distance column is returned in AU.
    */

    const distanceAU =
      parseFloat(
        closest[
          data.fields.indexOf("dist")
        ]
      );


    if (
      Number.isNaN(distanceAU)
    ) {

      asteroidEl.textContent =
        "DATA UNAVAILABLE";

      return;
    }


    /*
      1 AU ≈ 92,955,807 miles.
    */

    const distanceMiles =
      distanceAU *
      92955807;


    const roundedMiles =
      Math.round(
        distanceMiles
      );


    asteroidEl.textContent =
      `${roundedMiles.toLocaleString()} MI`;

  }

  catch (error) {

    console.warn(
      "Asteroid data unavailable:",
      error
    );


    asteroidEl.textContent =
      "SCAN UNAVAILABLE";
  }
}


/*
  Run immediately.
*/

updateAsteroid();


/*
  Re-check every 10 minutes.

  The actual distance will also change as
  NASA/JPL updates the orbital solution.
*/

setInterval(
  updateAsteroid,
  10 * 60 * 1000
);


/* =========================================================
   ANIMATION LOOP
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

    mixer.update(
      delta
    );
  }


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
   NAVIGATION REVEAL
========================================================= */

const nav =
  document.getElementById(
    "nav"
  );


function updateNav() {

  if (!nav) return;


  /*
    Only a small scroll is necessary.
    Previously the threshold was too large
    relative to the available page height.
  */

  const shouldShow =
    window.scrollY > 35;


  nav.classList.toggle(
    "nav--visible",
    shouldShow
  );
}


window.addEventListener(
  "scroll",
  updateNav,
  {
    passive: true
  }
);


/*
  Run once on page load.
*/

updateNav();
