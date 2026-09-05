import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// --------------------------------------------------
// SCENE
// --------------------------------------------------

const scene = new THREE.Scene();
scene.background = null;


// --------------------------------------------------
// CAMERA
// --------------------------------------------------

const camera = new THREE.PerspectiveCamera(
    35,
    window.innerWidth / window.innerHeight,
    0.1,
    100
);

camera.position.set(0, 1.6, 8);


// --------------------------------------------------
// RENDERER
// --------------------------------------------------

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


// --------------------------------------------------
// LIGHTING
// --------------------------------------------------

const ambient = new THREE.HemisphereLight(
    0xffffff,
    0x222222,
    2.5
);

scene.add(ambient);


const keyLight = new THREE.DirectionalLight(
    0xffffff,
    4
);

keyLight.position.set(4, 7, 5);
keyLight.castShadow = true;

scene.add(keyLight);


const rimLight = new THREE.DirectionalLight(
    0xffffff,
    2
);

rimLight.position.set(-4, 5, -4);

scene.add(rimLight);


// --------------------------------------------------
// ROBOT
// --------------------------------------------------

const loader = new GLTFLoader();

let robot = null;
let mixer = null;
let greetingAction = null;

loader.load(

    "models/greetinggreet.glb",

    (gltf) => {

        robot = gltf.scene;

        // Position on LEFT
        robot.position.set(-2.2, -1.1, 0);

        // LARGE
        robot.scale.setScalar(2.5);

        robot.traverse((child) => {

            if (child.isMesh) {

                child.castShadow = true;
                child.receiveShadow = true;

                if (child.material) {

                    child.material = child.material.clone();

                    // Shiny dark metallic appearance
                    child.material.color.setRGB(
                        0.03,
                        0.03,
                        0.03
                    );

                    child.material.metalness = 0.85;
                    child.material.roughness = 0.18;
                }
            }
        });

        scene.add(robot);


        // --------------------------------------------------
        // ANIMATION
        // --------------------------------------------------

        mixer = new THREE.AnimationMixer(robot);

        if (gltf.animations.length > 0) {

            greetingAction =
                mixer.clipAction(gltf.animations[0]);

            greetingAction.setLoop(
                THREE.LoopOnce,
                1
            );

            greetingAction.clampWhenFinished = true;

            greetingAction.play();

            console.log(
                "Greeting animation started"
            );

            // Wait until animation finishes
            mixer.addEventListener(
                "finished",
                waitBeforeNextGreeting
            );

        } else {

            console.warn(
                "No animation found inside greetinggreet.glb"
            );

        }

    },

    undefined,

    (error) => {

        console.error(
            "Could not load greetinggreet.glb:",
            error
        );

    }
);


// --------------------------------------------------
// WAIT 30 SECONDS
// --------------------------------------------------

function waitBeforeNextGreeting() {

    console.log(
        "Greeting finished. Waiting 30 seconds..."
    );

    setTimeout(() => {

        playGreeting();

    }, 30000);

}


// --------------------------------------------------
// PLAY GREETING
// --------------------------------------------------

function playGreeting() {

    if (!greetingAction) return;

    console.log(
        "Robot says hi!"
    );

    greetingAction.reset();

    greetingAction.setLoop(
        THREE.LoopOnce,
        1
    );

    greetingAction.clampWhenFinished = true;

    greetingAction.play();
}


// --------------------------------------------------
// ANIMATION LOOP
// --------------------------------------------------

const clock = new THREE.Clock();

function animate() {

    requestAnimationFrame(animate);

    const delta = clock.getDelta();

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
