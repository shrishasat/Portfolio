import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

/* --------------------------------------------------
   SCENE
-------------------------------------------------- */

const scene = new THREE.Scene();

/* Transparent background */
scene.background = null;


/* --------------------------------------------------
   CAMERA
-------------------------------------------------- */

const camera = new THREE.PerspectiveCamera(
    35,
    window.innerWidth / window.innerHeight,
    0.1,
    100
);

camera.position.set(0, 1.8, 9);


/* --------------------------------------------------
   RENDERER
-------------------------------------------------- */



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


/* --------------------------------------------------
   LIGHTING
-------------------------------------------------- */

const ambient = new THREE.HemisphereLight(
    0xffffff,
    0x222222,
    2.2
);

scene.add(ambient);


const keyLight = new THREE.DirectionalLight(
    0xffffff,
    4
);

keyLight.position.set(3, 7, 5);
keyLight.castShadow = true;

keyLight.shadow.mapSize.width = 2048;
keyLight.shadow.mapSize.height = 2048;

scene.add(keyLight);


const rimLight = new THREE.DirectionalLight(
    0xffffff,
    2
);

rimLight.position.set(-5, 4, -4);

scene.add(rimLight);


/* --------------------------------------------------
   ROBOT GROUP
-------------------------------------------------- */

const robotWorld = new THREE.Group();

scene.add(robotWorld);


/* --------------------------------------------------
   LOADER
-------------------------------------------------- */

const loader = new GLTFLoader();


/* --------------------------------------------------
   ROBOT DATA
-------------------------------------------------- */

const robotData = [
    {
        file: "demo/models/greet.glb",
        position: [-3.0, 0, 0],
        scale: 1.0
    },

    {
        file: "demo/models/jump.glb",
        position: [-1.0, 0, -0.3],
        scale: 0.9
    },

    {
        file: "demo/models/taunt.glb",
        position: [1.1, 0, -0.2],
        scale: 1.0
    },

    {
        file: "demo/models/walking.glb",
        position: [3.0, 0, 0],
        scale: 1.0
    }
];


const robots = [];


/* --------------------------------------------------
   LOAD ROBOTS
-------------------------------------------------- */

robotData.forEach((data, index) => {

    loader.load(
        data.file,

        (gltf) => {

            const robot = gltf.scene;

            robot.position.set(
                data.position[0],
                data.position[1],
                data.position[2]
            );

            robot.scale.setScalar(data.scale);

            robot.traverse((child) => {

                if (child.isMesh) {

                    child.castShadow = true;
                    child.receiveShadow = true;

                    /*
                     * Metallic black / white appearance
                     */

                    if (child.material) {

                        child.material = child.material.clone();

                        child.material.color.setRGB(
                            0.015,
                            0.015,
                            0.015
                        );

                        child.material.metalness = 0.85;
                        child.material.roughness = 0.18;
                    }
                }

            });


            robotWorld.add(robot);


            /* Animation */

            const mixer = new THREE.AnimationMixer(robot);

            if (gltf.animations.length > 0) {

                const action =
                    mixer.clipAction(gltf.animations[0]);

                action.reset();
                action.setLoop(
                    THREE.LoopRepeat,
                    Infinity
                );

                action.play();
            }


            robots.push({
                object: robot,
                mixer: mixer,
                baseX: data.position[0],
                baseY: data.position[1],
                baseZ: data.position[2],

                phase: index * 0.8
            });

        },

        undefined,

        (error) => {
            console.error(
                "Could not load:",
                data.file,
                error
            );
        }
    );

});


/* --------------------------------------------------
   CLOCK
-------------------------------------------------- */

function updateClock() {

    const now = new Date();

    const hours =
        String(now.getHours()).padStart(2, "0");

    const minutes =
        String(now.getMinutes()).padStart(2, "0");

    const seconds =
        String(now.getSeconds()).padStart(2, "0");

    document.getElementById("clock").textContent =
        `${hours}:${minutes}:${seconds}`;
}

setInterval(updateClock, 1000);
updateClock();


/* --------------------------------------------------
   SCROLL
-------------------------------------------------- */

let scrollProgress = 0;

window.addEventListener(
    "scroll",
    () => {

        const maxScroll =
            document.documentElement.scrollHeight -
            window.innerHeight;

        scrollProgress =
            window.scrollY / maxScroll;

        scrollProgress =
            THREE.MathUtils.clamp(
                scrollProgress,
                0,
                1
            );


        const nav =
            document.getElementById("nav");


        if (window.scrollY > 80) {

            nav.classList.add("visible");

        } else {

            nav.classList.remove("visible");

        }


        /*
         * Robots slowly move downward
         * as the page scrolls.
         */

        robotWorld.position.y =
            -scrollProgress * 1.2;

        /*
         * Slight cinematic rotation.
         */

        robotWorld.rotation.y =
            scrollProgress * 0.12;

    }
);


/* --------------------------------------------------
   ANIMATION LOOP
-------------------------------------------------- */

const clock = new THREE.Clock();

function animate() {

    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    robots.forEach((robot, index) => {

        robot.mixer.update(delta);

        /*
         * Tiny independent movement.
         * Makes the scene feel alive.
         */

        robot.object.position.y =
            robot.baseY +
            Math.sin(
                performance.now() * 0.001 +
                robot.phase
            ) * 0.015;

    });


    renderer.render(
        scene,
        camera
    );
}

animate();


/* --------------------------------------------------
   RESIZE
-------------------------------------------------- */

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
