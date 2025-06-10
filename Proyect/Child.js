let scene, camera, renderer, controls, model;
const MODEL_PATH = 'ChildTeethNamed.glb';

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const movedTeeth = new Map(); // Guarda dientes ya movidos
//para el cursor sobre los dientes
const tooltip = document.createElement('div');
tooltip.id = 'tooltip';
document.body.appendChild(tooltip);

const PosicionesD = {
    //Un niño tiene 20 dientes:
    "IncisivoCentralSuperior1": new THREE.Vector3(0, 0, 0.2),
    "IncisivoCentralSuperior2": new THREE.Vector3(0, 0, 0.2),
    "IncisivoCentralInferior1": new THREE.Vector3(0, 0, -0.2),
    "IncisivoCentralInferior2": new THREE.Vector3(0, 0, -0.2),
    "IncisivoLateralInferior1": new THREE.Vector3(0, 0, -0.2),
    "IncisivoLateralInferior2": new THREE.Vector3(0, 0, -0.2),
    "IncisivoLateralSuperior1": new THREE.Vector3(0, 0, 0.2),
    "IncisivoLateralSuperior2": new THREE.Vector3(0, 0, 0.2),
    "CaninoInferior1": new THREE.Vector3(0, 0, -0.2),
    "CaninoInferior2": new THREE.Vector3(0, 0, -0.2),
    "CaninoSuperior1": new THREE.Vector3(0, 0, 0.2),
    "CaninoSuperior2": new THREE.Vector3(0, 0, 0.2),
    "PrimerPremolarInferior1": new THREE.Vector3(0, 0, -0.2),
    "PrimerPremolarInferior2": new THREE.Vector3(0, 0, -0.2),
    "PrimerPremolarSuperior1": new THREE.Vector3(0, 0, 0.2),
    "PrimerPremolarSuperior2": new THREE.Vector3(0, 0, 0.2),
    "SegundoPremolarInferior1": new THREE.Vector3(0, 0, -0.2),
    "SegundoPremolarInferior2": new THREE.Vector3(0, 0, -0.2),
    "SegundoPremolarSuperior1": new THREE.Vector3(0, 0, 0.2),
    "SegundoPremolarSuperior2": new THREE.Vector3(0, 0, 0.2),
}

init();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);
    
    // Añadir environment map
    const envMap = new THREE.CubeTextureLoader()
        .setPath('path/to/your/envmap/')
        .load(['px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg']);
    envMap.encoding = THREE.sRGBEncoding;
    scene.environment = envMap;

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 5); // posicion inicial para que se vea la cuadricula

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    setupLights();
    toggleLightHelpers(true);  //Ocultar helpers de luces al inicio
    cargarModelMain(); // Dentadura completa

    //Cargamos aqui los nuevos modelos
    //cargarAdditionalModel('incisivo_11.glb', new THREE.Vector3(2, 20, 0));
    //cargarAdditionalModel('premolar.glb', new THREE.Vector3(-3, 0, 0));

    document.addEventListener('mousedown', onMouseClick);
    window.addEventListener('resize', onWindowResize);

    animate();
    
}

document.querySelectorAll('.reset').forEach(btn => {
    btn.addEventListener('click', resetTeethPositions);
});

function resetTeethPositions() {
    movedTeeth.forEach((originalPosition, tooth) => {
        tooth.position.copy(originalPosition);
    });
    movedTeeth.clear();
}
renderer.domElement.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return; // Solo clic izquierdo

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(scene.children, true);
});

        
    
function setupLights() {
    // Limpiar luces y helpers existentes
    scene.children.filter(child => child.isLight || child instanceof THREE.DirectionalLightHelper).forEach(obj => {
        scene.remove(obj);
    });

    const modelCenter = new THREE.Vector3(0, -4.5, 0);
    const lightDistance = 6;
    const mainIntensity = 0.4;

    // Array para almacenar las luces y poder actualizarlas
    const lights = [];

    // 1. Luces principales (6 ejes)
    const mainLightPositions = [
        { pos: new THREE.Vector3(1, 0.2, 0), color: 0xffffff, name: "Derecha" },
        { pos: new THREE.Vector3(-1, 0.2, 0), color: 0xffffff, name: "Izquierda" },
        { pos: new THREE.Vector3(0, 0.2, 1), color: 0xfffff, name: "Frente" },
        { pos: new THREE.Vector3(0, 0.2, -1), color: 0xffffff, name: "Atrás" },
        { pos: new THREE.Vector3(0, 1, 0.2), color: 0xffffff, name: "Arriba" },
        { pos: new THREE.Vector3(0, -0.5, 0), color: 0xffffff, name: "Abajo" }
    ];

    mainLightPositions.forEach((config, i) => {
        const light = new THREE.DirectionalLight(config.color, i === 4 ? mainIntensity * 1.2 : mainIntensity);
        light.position.copy(config.pos).multiplyScalar(lightDistance).add(modelCenter);
        light.name = config.name;
        
        if (i === 4) { // Luz principal superior
            light.castShadow = true;
            light.shadow.mapSize.width = 1024;
            light.shadow.mapSize.height = 1024;
        }

        scene.add(light);
        lights.push(light);

        // Helper para esta luz
        const helper = new THREE.DirectionalLightHelper(light, 1, 0xffffff);
        helper.name = `${config.name} Helper`;
        scene.add(helper);

        // Añadir etiqueta de texto
        addLightLabel(light, config.name);
    });

    // 2. Luz de cámara
    const cameraLight = new THREE.DirectionalLight(0xffffff, 0.6);
    cameraLight.position.copy(camera.position);
    cameraLight.name = "Camera Light";
    scene.add(cameraLight);
    lights.push(cameraLight);

    // Helper para luz de cámara
    const cameraLightHelper = new THREE.DirectionalLightHelper(cameraLight, 0.5);
    scene.add(cameraLightHelper);
    addLightLabel(cameraLight, "Cámara");

    // Actualizar luz de cámara y helpers cuando se mueve
    controls.addEventListener('change', () => {
        cameraLight.position.copy(camera.position);
        cameraLightHelper.update();
        updateLightLabels();
    });

    // Función para añadir etiquetas de texto a las luces
    function addLightLabel(light, text) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 64;
        const context = canvas.getContext('2d');
        context.fillStyle = 'rgba(0,0,0,0.7)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.font = 'Bold 14px Arial';
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.fillText(text, canvas.width/2, canvas.height/2 + 6);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(0.5, 0.25, 1);
        sprite.name = `${light.name} Label`;
        light.userData.label = sprite;
        sprite.position.copy(light.position);
        scene.add(sprite);
    }

    // Función para actualizar posición de etiquetas
    function updateLightLabels() {
        lights.forEach(light => {
            if (light.userData.label) {
                light.userData.label.position.copy(light.position);
            }
        });
    }
}

// Para mostrar/ocultar todos los helpers
    function toggleLightHelpers(visible) {
        scene.children.forEach(child => {
         if (child instanceof THREE.DirectionalLightHelper || 
               (child.name && child.name.includes('Label'))) {
              child.visible = visible;
             }
     });
    }

//funcion de eventos para los dientes
function onMouseClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    if (!model) return;

    const intersectables = [];
    scene.traverse((child) => {
        if (child.isMesh) {
            intersectables.push(child);
        }
    });

    const intersects = raycaster.intersectObjects(intersectables, true);

    if (intersects.length > 0) {
        const selected = intersects[0].object;
        const dienteName = selected.name;

        //  Verifica si el diente esta 
        if (PosicionesD[dienteName]) {
            if (!movedTeeth.has(selected)) {
                movedTeeth.set(selected, selected.position.clone());
                // Mueve el diente a la posicion deseada (relativa)
                selected.position.add(PosicionesD[dienteName]);
            } else {
                // Devuelve el diente a su posicion original
                selected.position.copy(movedTeeth.get(selected));
                movedTeeth.delete(selected);
            }
        }
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

renderer.domElement.addEventListener('pointermove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersectables = [];
    scene.traverse(child => {
        if (child.isMesh && child.name && child.name !== '') {
            intersectables.push(child);
        }
    });

    const intersects = raycaster.intersectObjects(intersectables, true);

    if (intersects.length > 0) {
        const hovered = intersects[0].object;
        if (hovered.name && hovered.name !== '') {
            tooltip.style.display = 'block';
            tooltip.style.left = `${event.clientX + 15}px`;
            tooltip.style.top = `${event.clientY + 15}px`;
            
            // Puedes personalizar los nombres que se muestran aquí
            const displayName = hovered.name.replace(/([A-Z])/g, ' $1').trim();
            tooltip.textContent = displayName;
        }
    } else {
        tooltip.style.display = 'none';
    }
});

renderer.domElement.addEventListener('pointerout', () => {
    tooltip.style.display = 'none';
});

function cargarModelMain() {
    const loader = new THREE.GLTFLoader();
    loader.load(
        MODEL_PATH,
        function(gltf) {
            model = gltf.scene;
            
            // Asegurarse que los materiales respondan bien a la luz
            model.traverse((child) => {
                if (child.isMesh) {
                    child.material.envMapIntensity = 0.5;
                    child.material.needsUpdate = true;
                    
                    // Si quieres hacer los materiales más reflectivos
                    child.material.metalness = 0.1;
                    child.material.roughness = 0.5;
                }
            });
            
            model.position.set(3.5, -5, -1);
            scene.add(model);
            console.log("Modelo principal cargado");
            document.getElementById('loading').style.display = 'none';
        },
        undefined,
        function(error) {
            console.error("Error cargando el modelo:", error);
        }
    );
}