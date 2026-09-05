import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";


const loader =
  new GLTFLoader();


/* =========================================================
   MATERIAL
========================================================= */

function styleRobot(model) {

  model.traverse((child) => {

    if (!child.isMesh) {
      return;
    }


    child.castShadow = true;

    child.receiveShadow = true;


    if (!child.material) {
      return;
    }


    const materials =
      Array.isArray(child.material)
        ? child.material
        : [child.material];


    materials.forEach((material) => {

      const m =
        material.clone();


      /*
        Black / white chrome appearance.

        We deliberately keep it close to black.
        White lighting creates the highlights.
      */

      m.color.setRGB(
        0.025,
        0.025,
        0.025
      );


      m.metalness =
        0.9;


      m.roughness =
        0.15;


      child.material =
        Array.isArray(child.material)
          ? materials
          : m;

    });

  });

}


/* =========================================================
   BUILD THREE SCENE
========================================================= */

function buildScene(
  canvas,
  options = {}
) {

  const width =
    canvas.clientWidth || 300;


  const height =
    canvas.clientHeight || 300;


  const scene =
    new THREE.Scene();


  const camera =
    new THREE.PerspectiveCamera(
      35,
      width / height,
      0.1,
      100
    );


  camera.position.set(

    0,

    options.cameraY ?? 1.45,

    options.cameraZ ?? 5.2

  );


  const renderer =
    new THREE.WebGLRenderer({

      canvas,

      antialias: true,

      alpha: true

    });


  renderer.setPixelRatio(
    Math.min(
      window.devicePixelRatio,
      2
    )
  );


  renderer.setSize(
    width,
    height,
    false
  );


  renderer.outputColorSpace =
    THREE.SRGBColorSpace;


  renderer.shadowMap.enabled =
    true;


  renderer.shadowMap.type =
    THREE.PCFSoftShadowMap;


  /* =====================================================
     LIGHTING
  ===================================================== */

  const hemisphere =
    new THREE.HemisphereLight(
      0xffffff,
      0x333333,
      2.8
    );


  scene.add(
    hemisphere
  );


  const key =
    new THREE.DirectionalLight(
      0xffffff,
      4.5
    );


  key.position.set(
    3,
    6,
    5
  );


  key.castShadow =
    true;


  scene.add(
    key
  );


  const fill =
    new THREE.DirectionalLight(
      0xffffff,
      2
    );


  fill.position.set(
    -4,
    4,
    -4
  );


  scene.add(
    fill
  );


  const rim =
    new THREE.DirectionalLight(
      0xffffff,
      2
    );


  rim.position.set(
    3,
    4,
    -5
  );


  scene.add(
    rim
  );


  function resize() {

    const w =
      canvas.clientWidth || 300;


    const h =
      canvas.clientHeight || 300;


    camera.aspect =
      w / h;


    camera.updateProjectionMatrix();


    renderer.setSize(
      w,
      h,
      false
    );

  }


  window.addEventListener(
    "resize",
    resize
  );


  resize();


  return {
    scene,
    camera,
    renderer
  };

}


/* =========================================================
   CONTINUOUS ROBOT
========================================================= */

export function createCornerRobot(
  canvasSelector,
  modelPath,
  options = {}
) {

  const canvas =
    document.querySelector(
      canvasSelector
    );


  if (!canvas) {

    console.warn(
      `Canvas ${canvasSelector} not found`
    );

    return;

  }


  const {

    scale = 2.0,

    y = -0.65,

    cameraY = 1.45,

    cameraZ = 5.2

  } = options;


  const {
    scene,
    camera,
    renderer
  } =
    buildScene(
      canvas,
      {
        cameraY,
        cameraZ
      }
    );


  let mixer =
    null;


  const clock =
    new THREE.Clock();


  loader.load(

    modelPath,

    (gltf) => {

      const model =
        gltf.scene;


      model.scale.setScalar(
        scale
      );


      /*
        Raised slightly so the feet
        don't disappear below the canvas.
      */

      model.position.set(
        0,
        y,
        0
      );


      styleRobot(
        model
      );


      scene.add(
        model
      );


      /* ===================================================
         LOOP ANIMATION FOREVER
      =================================================== */

      if (
        gltf.animations &&
        gltf.animations.length > 0
      ) {

        mixer =
          new THREE.AnimationMixer(
            model
          );


        const action =
          mixer.clipAction(
            gltf.animations[0]
          );


        action.setLoop(
          THREE.LoopRepeat,
          Infinity
        );


        action.clampWhenFinished =
          false;


        action.play();

      }
      else {

        console.warn(
          `No animation found in ${modelPath}`
        );

      }

    },

    undefined,

    (error) => {

      console.error(
        `Could not load ${modelPath}:`,
        error
      );

    }

  );


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

}


/* =========================================================
   BLOG ROBOT
   Plays ONLY while scrolling.
========================================================= */

export function createScrollRobot(
  canvasSelector,
  modelPath,
  options = {}
) {

  const canvas =
    document.querySelector(
      canvasSelector
    );


  if (!canvas) {
    return;
  }


  const {

    scale = 2.0,

    y = -0.65,

    cameraY = 1.45,

    cameraZ = 5.2

  } = options;


  const {
    scene,
    camera,
    renderer
  } =
    buildScene(
      canvas,
      {
        cameraY,
        cameraZ
      }
    );


  let mixer =
    null;


  let action =
    null;


  let isScrolling =
    false;


  let stopTimer =
    null;


  const clock =
    new THREE.Clock();


  loader.load(

    modelPath,

    (gltf) => {

      const model =
        gltf.scene;


      model.scale.setScalar(
        scale
      );


      model.position.set(
        0,
        y,
        0
      );


      styleRobot(
        model
      );


      scene.add(
        model
      );


      if (
        gltf.animations &&
        gltf.animations.length > 0
      ) {

        mixer =
          new THREE.AnimationMixer(
            model
          );


        action =
          mixer.clipAction(
            gltf.animations[0]
          );


        action.setLoop(
          THREE.LoopRepeat,
          Infinity
        );


        /*
          Start paused.
        */

        action.play();

        action.paused =
          true;

      }

    },

    undefined,

    (error) => {

      console.error(
        `Could not load ${modelPath}:`,
        error
      );

    }

  );


  /* =====================================================
     SCROLL START
  ===================================================== */

  function startAnimation() {

    if (!action) {
      return;
    }


    if (!isScrolling) {

      isScrolling =
        true;

      action.paused =
        false;

    }


    clearTimeout(
      stopTimer
    );


    stopTimer =
      setTimeout(
        stopAnimation,
        180
      );

  }


  /* =====================================================
     SCROLL STOP
  ===================================================== */

  function stopAnimation() {

    isScrolling =
      false;


    if (action) {

      action.paused =
        true;

    }

  }


  window.addEventListener(
    "scroll",
    startAnimation,
    {
      passive: true
    }
  );


  /* =====================================================
     RENDER
  ===================================================== */

  function animate() {

    requestAnimationFrame(
      animate
    );


    const delta =
      clock.getDelta();


    if (
      mixer &&
      isScrolling
    ) {

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

}
