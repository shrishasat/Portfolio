import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";


/* =====================================================
   BASIC THREE.JS SETUP
===================================================== */

const canvas =
  document.getElementById("robotCanvas");


const scene =
  new THREE.Scene();


scene.background = null;


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


/* =====================================================
   RENDERER
===================================================== */

const renderer =
  new THREE.WebGLRenderer({

    canvas: canvas,

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


renderer.outputColorSpace =
  THREE.SRGBColorSpace;


/* =====================================================
   LIGHTING
===================================================== */

const hemisphere =
  new THREE.HemisphereLight(
    0xffffff,
    0x555555,
    2.5
  );


scene.add(hemisphere);


const keyLight =
  new THREE.DirectionalLight(
    0xffffff,
    4
  );


keyLight.position.set(
  4,
  7,
  5
);


scene.add(keyLight);


const rimLight =
  new THREE.DirectionalLight(
    0xffffff,
    2
  );


rimLight.position.set(
  -4,
  5,
  -4
);


scene.add(rimLight);


/* =====================================================
   ROBOT SETTINGS
===================================================== */

/*
  IMPORTANT:
  This is the model you said was working before.
*/

const MODEL_PATH =
  "models/greetinggreet.glb";


/*
  Large robot on left.
*/

const ROBOT_POSITION =
  new THREE.Vector3(
    -3.3,
    -0.15,
    0
  );


const ROBOT_SCALE = 2.25;


let robot = null;

let mixer = null;

let greetingAction = null;

let isGreeting = false;

let greetingTimer = null;


/* =====================================================
   ROBOT MATERIAL
===================================================== */

function styleRobot(model){

  model.traverse((child) => {

    if (!child.isMesh) return;


    child.castShadow = true;

    child.receiveShadow = true;


    const material =
      child.material.clone();


    /*
      Shiny black robot.
    */

    if ("color" in material){

      material.color.set(
        0x111111
      );
    }


    if ("metalness" in material){

      material.metalness =
        0.88;
    }


    if ("roughness" in material){

      material.roughness =
        0.16;
    }


    if ("envMapIntensity" in material){

      material.envMapIntensity =
        1.8;
    }


    child.material =
      material;

  });
}


/* =====================================================
   LOAD ROBOT
===================================================== */

const loader =
  new GLTFLoader();


loader.load(

  MODEL_PATH,

  (gltf) => {

    console.log(
      "Robot loaded:",
      MODEL_PATH
    );


    robot =
      gltf.scene;


    robot.position.copy(
      ROBOT_POSITION
    );


    robot.scale.setScalar(
      ROBOT_SCALE
    );


    styleRobot(
      robot
    );


    /*
      Check bounding box so that
      the feet are not below the viewport.
    */

    const box =
      new THREE.Box3()
        .setFromObject(robot);


    const minY =
      box.min.y;


    if (minY < -0.4){

      robot.position.y +=
        Math.abs(minY) + 0.15;
    }


    scene.add(
      robot
    );


    /* -----------------------------------------------
       ANIMATION
    ------------------------------------------------ */

    mixer =
      new THREE.AnimationMixer(
        robot
      );


    if (
      !gltf.animations ||
      gltf.animations.length === 0
    ){

      console.warn(
        "Robot loaded, but no animation was found."
      );

      return;
    }


    console.log(
      "Animations found:",
      gltf.animations.map(
        animation => animation.name
      )
    );


    /*
      Use the first animation.
    */

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


    /*
      When greeting finishes:
      wait exactly 30 seconds.
    */

    mixer.addEventListener(
      "finished",
      () => {

        console.log(
          "Greeting finished. Waiting 30 seconds."
        );


        isGreeting =
          false;


        clearTimeout(
          greetingTimer
        );


        greetingTimer =
          setTimeout(
            playGreeting,
            30000
          );
      }
    );


    /*
      First greeting.
    */

    setTimeout(
      playGreeting,
      1000
    );

  },


  undefined,


  (error) => {

    console.error(
      "ROBOT LOAD ERROR:",
      MODEL_PATH,
      error
    );

  }

);


/* =====================================================
   GREETING FUNCTION
===================================================== */

function playGreeting(){

  if (
    !greetingAction ||
    isGreeting
  ){

    return;
  }


  /*
    Cancel an existing 30-second timer.
  */

  clearTimeout(
    greetingTimer
  );


  isGreeting =
    true;


  greetingAction.reset();


  greetingAction.setLoop(
    THREE.LoopOnce,
    1
  );


  greetingAction.clampWhenFinished =
    true;


  greetingAction.play();


  console.log(
    "Robot greeting."
  );
}


/* =====================================================
   RIGHT-SIDE CURSOR TRIGGER
===================================================== */

let pointerWasRight =
  false;


window.addEventListener(
  "pointermove",
  (event) => {

    /*
      Rightmost 25% of the screen.
    */

    const pointerIsRight =
      event.clientX >
      window.innerWidth * 0.75;


    /*
      Trigger when entering the zone.
    */

    if (
      pointerIsRight &&
      !pointerWasRight
    ){

      playGreeting();
    }


    pointerWasRight =
      pointerIsRight;
  }
);


/* =====================================================
   ROTATING PHRASES
===================================================== */

const PHRASES = [

  "half scientist, half skeptic.",

  "building models, doubting models.",

  "The brain doesn't explain itself. I'm trying to get it to.",

  "somewhere between brains and machines.",

  "less interested in answers than better questions.",

  "trying to understand what the brain leaves unsaid.",

  "Every accuracy number hides a decision nobody wrote down.",

  "always one experiment away from changing my mind."

];


const phrase =
  document.getElementById(
    "phrase"
  );


/*
  Your restored index.html no longer contains
  #phrase.

  So we create it automatically instead of
  making you change the HTML again.
*/

let phraseElement =
  phrase;


if (!phraseElement){

  phraseElement =
    document.createElement(
      "div"
    );


  phraseElement.id =
    "phrase";


  document.querySelector(
    ".hero"
  ).appendChild(
    phraseElement
  );

}


let phraseIndex = 0;


function showPhrase(){

  phraseElement.classList.remove(
    "run"
  );


  /*
    Force animation restart.
  */

  void phraseElement.offsetWidth;


  phraseElement.textContent =
    PHRASES[phraseIndex];


  phraseElement.classList.add(
    "run"
  );


  phraseIndex =
    (phraseIndex + 1) %
    PHRASES.length;
}


setTimeout(
  showPhrase,
  1800
);


setInterval(
  showPhrase,
  7000
);


/* =====================================================
   PHRASE CSS
===================================================== */

const phraseStyle =
  document.createElement(
    "style"
  );


phraseStyle.textContent = `

#phrase{

  position:absolute;

  left:50%;

  bottom:2vh;

  transform:translateX(-50%);

  width:90vw;

  text-align:center;

  z-index:10;

  font-family:var(--font-display);

  font-weight:300;

  font-size:clamp(1.2rem,5.8vw,6.5rem);

  line-height:0.95;

  letter-spacing:-0.045em;

  color:#080808;

  opacity:0;

  white-space:nowrap;

  pointer-events:none;
}


#phrase.run{

  animation:
    phraseAppear 5.8s ease-in-out;
}


@keyframes phraseAppear{

  0%{

    opacity:0;

    transform:
      translateX(-50%)
      translateY(12px);
  }

  15%{

    opacity:1;

    transform:
      translateX(-50%)
      translateY(0);
  }

  72%{

    opacity:1;

    transform:
      translateX(-50%)
      translateY(0);
  }

  100%{

    opacity:0;

    transform:
      translateX(-50%)
      translateY(-8px);
  }
}

`;


document.head.appendChild(
  phraseStyle
);


/* =====================================================
   TELEMETRY
===================================================== */

const telemetry =
  document.getElementById(
    "telemetry"
  );


function updateTelemetry(){

  if (!telemetry) return;


  const now =
    new Date();


  const time =
    now.toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      }
    );


  /*
    Approximate distance travelled
    by Earth around the Sun in one day.
  */

  const earthOrbitRadius =
    149600000;


  const circumference =
    2 *
    Math.PI *
    earthOrbitRadius;


  const dailyOrbit =
    circumference /
    365.2425;


  telemetry.innerHTML = `

    <div class="tele-row">

      <span class="tele-label">
        LOCAL
      </span>

      <span class="tele-value">
        ${time}
      </span>

    </div>


    <div class="tele-row">

      <span class="tele-label">
        EARTH → SUN
      </span>

      <span class="tele-value">
        ~149.6M KM
      </span>

    </div>


    <div class="tele-row">

      <span class="tele-label">
        ANDROMEDA
      </span>

      <span class="tele-value">
        ~2.54M LY
      </span>

    </div>


    <div class="tele-row">

      <span class="tele-label">
        EARTH ORBIT / TODAY
      </span>

      <span class="tele-value">
        ${Math.round(dailyOrbit).toLocaleString()} KM
      </span>

    </div>


    <div class="tele-row">

      <span class="tele-label">
        ROBOT
      </span>

      <span class="tele-value">
        ONLINE
      </span>

    </div>

  `;
}


updateTelemetry();


setInterval(
  updateTelemetry,
  1000
);


/* =====================================================
   ANIMATION LOOP
===================================================== */

const clock =
  new THREE.Clock();


function animate(){

  requestAnimationFrame(
    animate
  );


  const delta =
    clock.getDelta();


  if (mixer){

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


/* =====================================================
   RESIZE
===================================================== */

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


/* =====================================================
   NAVIGATION REVEAL
===================================================== */

const nav =
  document.getElementById(
    "nav"
  );


function updateNav(){

  if (!nav) return;


  /*
    Just a tiny amount of scrolling
    reveals the navigation.
  */

  if (window.scrollY > 30){

    nav.classList.add(
      "nav--visible"
    );

  } else {

    nav.classList.remove(
      "nav--visible"
    );
  }
}


window.addEventListener(
  "scroll",
  updateNav,
  {
    passive: true
  }
);


updateNav();
