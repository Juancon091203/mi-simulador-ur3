import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Create scene, camera and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);

// --- AÑADIR LUCES PARA QUE EL UR5 SE VEA ---
// 1. Luz Ambiental: Una luz suave que viene de todas partes para que nada sea 100% negro
const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
scene.add(ambientLight);

// 2. Luz Direccional: Como si fuera el sol, para dar volumen y sombras
const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(5, 10, 7);
scene.add(directionalLight);


// Set camera position and rotation for top-down view
camera.position.set(0, 3, 0); // Adjust the Y value to set the height of the camera
camera.rotation.set(-Math.PI / 2, 0, 0);

const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth - 100, window.innerHeight - 100);
renderer.setClearColor(0x000000, 0);
document.body.appendChild(renderer.domElement);

// Add controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1, 0);

// Get the div element where you want to load the scene
var container = document.getElementById('threejs-container');

// Append the renderer's DOM element to the div
container.appendChild(renderer.domElement);

// --- INICIO MULTIMODELO ---

// Configuración para que cada robot doble la articulación en el eje que toca
const robotConfig = {
    "UR3": {
        // Orden:  [Base, Hombro, Codo, Muñeca 1, Muñeca 2, Muñeca 3]
        axis: ['y', 'y', 'y', 'y', 'y', 'y'],
        dir: [1, 1, 1, 1, 1, 1]
    },
    "UR5": {
        // Orden:  [Base, Hombro, Codo, Muñeca 1, Muñeca 2, Muñeca 3]
        axis: ['y', 'x', 'x', 'x', 'y', 'y'],
        dir: [1, 1, 1, 1, -1, 1]
    },
    "UR10": {
        axis: ['y', 'x', 'x', 'x', 'y', 'z'],
        dir: [1, 1, 1, 1, 1, 1]
    },
    "UR20": {
        axis: ['z', 'y', 'y', 'y', 'z', 'y'],
        dir: [-1, -1, -1, -1, -1, -1]
    },
    "iER15-1430-MI": {
        axis: ['z', 'y', 'y', 'x', 'y', 'x'],
        dir: [-1, -1, -1, -1, -1, 1]
    }
};

let currentRobotName = "UR3";
let currentRobot = null;
let links = [];
let initialQuaternions = []; // <-- VITAL: La "foto" de la postura base de cada pieza
const get_data = new EventSource("http://localhost:5000/digital");

// Escuchar cambios en el menú desplegable de la web
document.getElementById("robotSelector").addEventListener("change", function (e) {
    const selectedRobot = e.target.value;
    loadRobot(selectedRobot);
});

// Función para cargar un modelo de robot dinámicamente
function loadRobot(modelName) {
    currentRobotName = modelName;

    // Si ya hay un robot en pantalla, lo borramos
    if (currentRobot) {
        scene.remove(currentRobot);
        links = [];
        initialQuaternions = [];
    }

    if (modelName === "UR3") {
        // Carga original para el UR3 (formato scene.json)
        const loader = new THREE.ObjectLoader();
        loader.load('/scenes/scene.json', (object) => {
            currentRobot = object;
            scene.add(currentRobot);
            setupLinks(currentRobot.getObjectByName("UR3") || currentRobot);
        }, undefined, (error) => console.log(error));
    } else {
        // Carga para UR5 y UR10 (Formato GLB exportado desde CAD/Blender)
        const loader = new GLTFLoader();
        // Usamos un ?v= aleatorio para saltarnos la caché de Chrome
        loader.load(`/scenes/${modelName.toLowerCase()}.glb?v=${new Date().getTime()}`, (gltf) => {
            currentRobot = gltf.scene;
            scene.add(currentRobot);
            let robotBase = currentRobot.getObjectByName(modelName) || currentRobot;
            setupLinks(robotBase);
        }, undefined, (error) => {
            console.log(`Error cargando ${modelName}:`, error);
        });
    }
}

// Función auxiliar para buscar las 6 articulaciones en el archivo
function setupLinks(robotObject) {
    if (!robotObject) return;

    links = [];
    initialQuaternions = [];

    const jointsMap = {};
    robotObject.traverse((child) => {
        if (child.name) {
            for (let i = 1; i <= 6; i++) {
                const regex = new RegExp(`joint_${i}(\\D|$)`, 'i');
                if (regex.test(child.name) && !jointsMap[i]) {
                    jointsMap[i] = child;
                }
            }
        }
    });

    for (let i = 1; i <= 6; i++) {
        const joint = jointsMap[i];
        if (joint) {
            links.push(joint);
            initialQuaternions.push(joint.quaternion.clone());

            // --- ESTO ES UNA AYUDA VISUAL PARA SABER LA ORIENTACIÓN DE CADA EJE ---
            // Añade flechas: ROJO = X, VERDE = Y, AZUL = Z
            const axesHelper = new THREE.AxesHelper(0.5);
            joint.add(axesHelper);

            console.log(`Joint_${i} cargado ("${joint.name}"). Ejes visuales añadidos.`);
        }
    }

    // Si está en modo manual, aplicar la posición actual de los sliders
    if (manualMode) {
        updateManualJoints();
    }
}



// Bucle de animación (se llama 60 veces por segundo)
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// Función común para actualizar las articulaciones del robot
function updateRobotJoints(jointPositions) {
    if (links.length !== 6 || initialQuaternions.length !== 6) return;

    const config = robotConfig[currentRobotName] || robotConfig["UR3"];

    for (let i = 0; i < links.length; i++) {
        // Multiplicamos el ángulo por dir (1 o -1) para invertirlo si hace falta
        const finalAngle = jointPositions[i] * config.dir[i];
        const axis = config.axis[i];

        // 1. Restaurar la "foto" base para no destrozar la postura original (protege al UR3)
        links[i].quaternion.copy(initialQuaternions[i]);

        // 2. Aplicar el ángulo en el eje configurado
        if (axis === 'x') links[i].rotateX(finalAngle);
        else if (axis === 'y') links[i].rotateY(finalAngle);
        else if (axis === 'z') links[i].rotateZ(finalAngle);

        // 3. Actualizar los números del panel "Robot info"
        const textElement = document.getElementById("j" + String(i));
        if (textElement) {
            textElement.innerHTML = String(Math.floor(jointPositions[i] * (180 / Math.PI))) + "°";
        }
    }
}

// --- LOGICA DE CONTROL MANUAL (TEST OFFLINE) ---
let manualMode = false;
let manualJoints = [0, 0, 0, 0, 0, 0];

const manualOverrideCheck = document.getElementById('manualOverrideCheck');
const manualSlidersContainer = document.getElementById('manualSliders');

if (manualOverrideCheck) {
    manualOverrideCheck.addEventListener('change', (e) => {
        manualMode = e.target.checked;
        if (manualMode) {
            if (manualSlidersContainer) {
                manualSlidersContainer.style.opacity = '1';
                manualSlidersContainer.style.pointerEvents = 'auto';
            }
            updateManualJoints();
        } else {
            if (manualSlidersContainer) {
                manualSlidersContainer.style.opacity = '0.5';
                manualSlidersContainer.style.pointerEvents = 'none';
            }
        }
    });
}

function updateManualJoints() {
    const radAngles = manualJoints.map(deg => deg * Math.PI / 180);
    updateRobotJoints(radAngles);
}

// Configurar los 6 sliders manuales
for (let i = 0; i < 6; i++) {
    const slider = document.getElementById(`slider-j${i}`);
    const valText = document.getElementById(`val-j${i}`);
    if (slider) {
        slider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            manualJoints[i] = val;
            if (valText) {
                valText.innerText = `${val.toFixed(0)}°`;
            }
            updateManualJoints();
        });
    }
}

// Restablecer los sliders a 0 cuando cambia el robot
document.getElementById("robotSelector").addEventListener("change", function () {
    if (manualOverrideCheck) {
        manualJoints = [0, 0, 0, 0, 0, 0];
        for (let i = 0; i < 6; i++) {
            const slider = document.getElementById(`slider-j${i}`);
            const valText = document.getElementById(`val-j${i}`);
            if (slider) slider.value = 0;
            if (valText) valText.innerText = '0°';
        }
    }
});

// Evento que se dispara cada vez que el simulador envía un dato de posición
get_data.onmessage = function (event) {
    // Si está activado el modo manual, ignoramos los datos recibidos
    if (manualMode) return;

    // Si todavía se está cargando el archivo, no hacemos nada
    if (links.length !== 6 || initialQuaternions.length !== 6) return;

    const jointPositions = JSON.parse(event.data);
    updateRobotJoints(jointPositions);
};

// Arrancar por defecto con el UR3
loadRobot("UR3");
animate();