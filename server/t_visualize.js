import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// Create scene, camera and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);

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




// // Configuración de calibración para cada robot
// const robotConfig = {
//     "UR3": {
//         // El UR3 original venía perfecto, sin offsets y girando en Y.
//         axis: ['y', 'y', 'y', 'y', 'y', 'y'],
//         offsets: [0, 0, 0, 0, 0, 0]
//     },
//     "UR5": {
//         // Ejes de rotación en tu Blender. Si alguno gira mal, cambia 'y' por 'x' o 'z'.
//         axis: ['y', 'y', 'y', 'y', 'y', 'y'],
//         // Offsets en radianes. Sumamos 90º (Math.PI/2) o restamos para cuadrar la postura.
//         offsets: [0, Math.PI / 2, 0, Math.PI / 2, 0, 0]
//     },
//     "UR10": {
//         axis: ['y', 'y', 'y', 'y', 'y', 'y'],
//         offsets: [0, 0, 0, 0, 0, 0]
//     }
// };

let currentRobotName = "UR3";
let currentRobot = null;
let links = [];
const get_data = new EventSource("http://localhost:5000/digital");

// Función para cargar un modelo de robot dinámicamente
function loadRobot(modelName) {
    currentRobotName = modelName;
    // Si ya hay un robot cargado, lo quitamos de la escena
    if (currentRobot) {
        scene.remove(currentRobot);
        links = [];
    }

    if (modelName === "UR3") {
        // Carga legacy para el UR3 (formato JSON de Three.js)
        const loader = new THREE.ObjectLoader();
        loader.load('/scenes/scene.json', (object) => {
            currentRobot = object;
            scene.add(currentRobot);
            setupLinks(currentRobot.getObjectByName("UR3") || currentRobot);
        }, undefined, (error) => console.log(error));
    } else {
        // Carga para UR5 y UR10 (Formato GLB exportado desde CAD/Blender)
        const loader = new GLTFLoader();
        loader.load(`/scenes/${modelName.toLowerCase()}.glb`, (gltf) => {
            currentRobot = gltf.scene;
            scene.add(currentRobot);
            // Si has agrupado los joints bajo un padre llamado "UR5" o "UR10", lo busca. Si no, usa la escena base.
            let robotBase = currentRobot.getObjectByName(modelName) || currentRobot;
            setupLinks(robotBase);
        }, undefined, (error) => {
            console.log(`Error cargando ${modelName}:`, error);
            alert(`No se ha encontrado el archivo /scenes/${modelName.toLowerCase()}.glb. ¡Asegúrate de haber exportado tu STEP a GLB con ese nombre exacto!`);
        });
    }
}

// Función auxiliar para mapear los 6 motores
function setupLinks(robotObject) {
    if (!robotObject) return;

    const joint1 = robotObject.getObjectByName("Joint_1");
    const joint2 = robotObject.getObjectByName("Joint_2");
    const joint3 = robotObject.getObjectByName("Joint_3");
    const joint4 = robotObject.getObjectByName("Joint_4");
    const joint5 = robotObject.getObjectByName("Joint_5");
    const joint6 = robotObject.getObjectByName("Joint_6");

    if (joint1 && joint2 && joint3 && joint4 && joint5 && joint6) {
        links = [joint1, joint2, joint3, joint4, joint5, joint6];
        console.log("Articulaciones (Joints) mapeadas correctamente.");
    } else {
        console.warn("No se encontraron los objetos Joint_1 a Joint_6. Revisa los nombres en FreeCAD/Blender.");
    }
}

// Evento para recibir datos de rotación en vivo
get_data.onmessage = function (event) {
    if (links.length !== 6) return; // Esperar a que el robot esté cargado y mapeado

    const jointPositions = JSON.parse(event.data);
    const config = robotConfig[currentRobotName] || robotConfig["UR3"];

    for (let i = 0; i < links.length; i++) {
        // Ángulo recibido del simulador + el offset de compensación de Blender
        const finalAngle = jointPositions[i] + config.offsets[i];

        // Aplicar la rotación en el eje que toque (x, y o z)
        const axis = config.axis[i];

        // Ponemos los demás ejes a 0 para que no arrastre rotaciones raras, y asignamos el finalAngle al eje correcto
        links[i].rotation.set(0, 0, 0);
        links[i].rotation[axis] = finalAngle;
        // Actualizar los textos del modal
        const textElement = document.getElementById("j" + String(i));
        if (textElement) {
            textElement.innerHTML = String(Math.floor(jointPositions[i] * (180 / Math.PI))) + "°";
        }
    }
};

// Bucle de animación principal
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// Cargar el robot por defecto (UR3) al iniciar
loadRobot("UR3");
animate();

// Escuchar cambios en el menú desplegable (Selector)
document.getElementById("robotSelector").addEventListener("change", function (e) {
    const selectedRobot = e.target.value;
    loadRobot(selectedRobot);
});