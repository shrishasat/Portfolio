import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";





export function createCornerRobot(canvasSelector, modelPath) {

    const canvas = document.querySelector(canvasSelector);


    // --------------------------------------------------
    // SCENE
    // --------------------------------------------------

    const scene = new THREE.Scene();


    // --------------------------------------------------
    // CAMERA
    // --------------------------------------------------

    const camera = new THREE.PerspectiveCamera(
        35,
        canvas.clientWidth / canvas.clientHeight,
        0.1,
        100
    );

    camera.position.set(
        0,
        1.4,
        5
    );


    // --------------------------------------------------
    // RENDERER
    // --------------------------------------------------

    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true
    });

    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, 2)
    );

    renderer.setSize(
        canvas.clientWidth,
        canvas.clientHeight
    );

    renderer.outputColorSpace =
        THREE.SRGBColorSpace;


    // --------------------------------------------------
    // LIGHTING
    // --------------------------------------------------

    const ambient =
        new THREE.HemisphereLight(
            0xffffff,
            0x222222,
            2.2
        );

    scene.add(ambient);


    const keyLight =
        new THREE.DirectionalLight(
            0xffffff,
            4
        );

    keyLight.position.set(
        3,
        6,
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
        4,
        -4
    );

    scene.add(rimLight);


    // --------------------------------------------------
    // LOAD ROBOT
    // --------------------------------------------------

    const loader = new GLTFLoader();

    let mixer = null;


    loader.load(

        modelPath,

        (gltf) => {

            const robot = gltf.scene;


            // Small elegant robot
            robot.scale.setScalar(1.5);


            // Position inside canvas
            robot.position.set(
                0,
                -1.2,
                0
            );


            robot.traverse((child) => {

                if (child.isMesh) {

                    child.castShadow = true;
                    child.receiveShadow = true;

                    if (child.material) {

                        child.material =
                            child.material.clone();

                        child.material.metalness = 0.85;
                        child.material.roughness = 0.2;

                    }

                }

            });


            scene.add(robot);


            // --------------------------------------------------
            // ANIMATION
            // --------------------------------------------------

            mixer =
                new THREE.AnimationMixer(robot);


            if (gltf.animations.length > 0) {

                const action =
                    mixer.clipAction(
                        gltf.animations[0]
                    );


                // Repeat forever
                action.setLoop(
                    THREE.LoopRepeat,
                    Infinity
                );


                action.clampWhenFinished = false;

                action.play();

            }

        },

        undefined,

        (error) => {

            console.error(
                "Could not load robot:",
                modelPath,
                error
            );

        }

    );


    // --------------------------------------------------
    // ANIMATION LOOP
    // --------------------------------------------------

    const clock =
        new THREE.Clock();


    function animate() {

        requestAnimationFrame(animate);


        const delta =
            clock.getDelta();


        if (mixer) {

            mixer.update(delta);

        }


        renderer.render(
            scene,
            camera
        );

    }


    animate();


    // --------------------------------------------------
    // RESIZE
    // --------------------------------------------------

    function resize() {

        const width =
            canvas.clientWidth;

        const height =
            canvas.clientHeight;


        if (width === 0 || height === 0) {
            return;
        }


        camera.aspect =
            width / height;

        camera.updateProjectionMatrix();


        renderer.setSize(
            width,
            height,
            false
        );

    }


    window.addEventListener(
        "resize",
        resize
    );

    resize();

}





const loader = new GLTFLoader();

function buildScene(canvas) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
  camera.position.set(0, 1.3, 5);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene.add(new THREE.HemisphereLight(0xffffff, 0x222222, 2.2));
  const key = new THREE.DirectionalLight(0xffffff, 3);
  key.position.set(3, 5, 4);
  scene.add(key);

  function resize() {
    const w = canvas.clientWidth || 130;
    const h = canvas.clientHeight || 130;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);
  resize();

  return { scene, camera, renderer, resize };
}

/**
 * A small robot that idles in a corner of the page, looping its
 * first animation clip continuously. Purely decorative, non-interactive.
 */
export function createCornerRobot(canvasSelector, modelPath, { scale = 2.0, y = -1.1 } = {}) {
  const canvas = document.querySelector(canvasSelector);
  if (!canvas) return;

  const { scene, camera, renderer } = buildScene(canvas);
  let mixer = null;
  const clock = new THREE.Clock();

  loader.load(
    modelPath,
    (gltf) => {
      const model = gltf.scene;
      model.position.set(0, y, 0);
      model.scale.setScalar(scale);
      model.traverse((c) => { if (c.isMesh) { c.castShadow = false; c.receiveShadow = false; } });
      scene.add(model);

      if (gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(model);
        const action = mixer.clipAction(gltf.animations[0]);
        action.setLoop(THREE.LoopRepeat, Infinity);
        action.play();
      }
    },
    undefined,
    (err) => console.error(`Could not load ${modelPath}:`, err)
  );

  (function tick() {
    requestAnimationFrame(tick);
    if (mixer) mixer.update(clock.getDelta());
    renderer.render(scene, camera);
  })();
}

/**
 * A robot that walks only while the page is being scrolled, and
 * halts shortly after scrolling stops. It also drifts horizontally
 * across the strip in step with scroll position, to read as
 * "walking along" the bottom of the page.
 */
export function createScrollWalkRobot(canvasSelector, containerSelector, modelPath, { scale = 2.0, y = -1.1 } = {}) {
  const canvas = document.querySelector(canvasSelector);
  const container = document.querySelector(containerSelector);
  if (!canvas || !container) return;

  const { scene, camera, renderer } = buildScene(canvas);
  let mixer = null;
  let walkAction = null;
  const clock = new THREE.Clock();

  loader.load(
    modelPath,
    (gltf) => {
      const model = gltf.scene;
      model.position.set(0, y, 0);
      model.scale.setScalar(scale);
      scene.add(model);

      if (gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(model);
        walkAction = mixer.clipAction(gltf.animations[0]);
        walkAction.setLoop(THREE.LoopRepeat, Infinity);
      }
    },
    undefined,
    (err) => console.error(`Could not load ${modelPath}:`, err)
  );

  let stopTimer = null;
  let isWalking = false;

  function startWalking() {
    if (!walkAction || isWalking) return;
    isWalking = true;
    walkAction.paused = false;
    walkAction.play();
  }
  function stopWalking() {
    if (!walkAction) return;
    isWalking = false;
    walkAction.paused = true;
  }

  function onScroll() {
    startWalking();

    // Drift the container horizontally in step with scroll progress.
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    const pct = max > 0 ? window.scrollY / max : 0;
    const travel = container.parentElement.clientWidth - container.clientWidth - 24;
    container.style.left = `${12 + pct * Math.max(travel, 0)}px`;

    clearTimeout(stopTimer);
    stopTimer = setTimeout(stopWalking, 300);
  }

  window.addEventListener("scroll", onScroll, { passive: true });

  (function tick() {
    requestAnimationFrame(tick);
    if (mixer && isWalking) mixer.update(clock.getDelta());
    renderer.render(scene, camera);
  })();
}
