import * as THREE from './vendor/three.module.min.js';

export function startJourney(stage, drawChapter) {
    const canvas = stage.querySelector('canvas');
    const phone = matchMedia('(max-width: 680px)').matches;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: !phone, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, phone ? 1.2 : 1.6));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x14100e);
    scene.fog = new THREE.FogExp2(0x1b1410, .044);
    const camera = new THREE.PerspectiveCamera(42, 1, .05, 55);
    const material = (color, roughness = .68, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
    const wood = material(0x442716);
    const iron = material(0x242018, .33, .73);
    const gold = material(0xbd7833, .35, .65);
    const black = material(0x282018, .7, .12);
    const stone = material(0x2c211c, .85);
    const beanMat = material(0x763816, .45);
    const coffee = material(0x39170c, .23);
    const ceramic = material(0x762b16, .25, .08);
    const milk = material(0xc38e5e, .65);
    const band = material(0x15100b, .6);

    function mesh(geo, mat, parent, x, y, z) {
        const model = new THREE.Mesh(geo, mat);
        model.position.set(x, y, z);
        parent.add(model);
        return model;
    }
    function box(parent, mat, x, y, z, w, h, d) {
        return mesh(new THREE.BoxGeometry(w, h, d), mat, parent, x, y, z);
    }
    function cylinder(parent, mat, x, y, z, top, bottom, h) {
        return mesh(new THREE.CylinderGeometry(top, bottom, h, phone ? 24 : 42), mat, parent, x, y, z);
    }
    function torus(parent, mat, x, y, z, radius, body) {
        return mesh(new THREE.TorusGeometry(radius, body, 10, phone ? 28 : 48), mat, parent, x, y, z);
    }
    function placeLight(color, power, x, y, z, range = 13) {
        const light = new THREE.PointLight(color, power, range, 1.65);
        light.position.set(x, y, z);
        scene.add(light);
    }

    scene.add(new THREE.HemisphereLight(0xffdcb7, 0x23160f, 1.55));
    placeLight(0xffb46a, 35, -5, 3.4, 3);
    placeLight(0xffc492, 29, .5, 3.1, 2);
    placeLight(0xfbb36d, 42, 5.1, 3.5, 1);
    placeLight(0xe7baa4, 11, 7, 1.8, 4);
    box(scene, stone, 0, -.13, 0, 23, .25, 17);
    box(scene, wood, 0, 3.4, -4.1, 23, 7, .4);
    box(scene, black, 0, .55, -3.86, 22, 1.08, .3);
    for (let i = 0; i < 15; i++) box(scene, band, i * 1.43 - 10, 3.0, -3.87, .11, 6, .13);
    for (const x of [-4.2, 0, 4.55]) {
        box(scene, wood, x, .38, -.42, 3.8, .76, 2.7);
        box(scene, black, x, .77, -.42, 3.95, .12, 2.8);
        box(scene, gold, x, .68, .99, 3.9, .023, .04);
    }

    // Roaster, turned to face the first camera position.
    box(scene, iron, -4.2, 1.31, -.4, 2.6, 1.0, 1.14);
    const barrel = cylinder(scene, iron, -4.2, 1.88, -.3, .92, .92, 1.15);
    barrel.rotation.x = Math.PI / 2;
    torus(scene, gold, -4.2, 1.88, .31, .86, .065);
    torus(scene, iron, -4.2, 1.88, .36, .65, .045);
    cylinder(scene, gold, -4.2, 2.82, -.61, .44, .19, .57);
    const glow = material(0x55230d);
    glow.emissive.setHex(0x995322);
    glow.emissiveIntensity = .6;
    const inner = new THREE.Group();
    inner.position.set(-4.2, 1.88, .39);
    scene.add(inner);
    const plate = cylinder(inner, glow, 0, 0, -.05, .66, .66, .10);
    plate.rotation.x = Math.PI / 2;
    for (let i = 0; i < 8; i++) {
        const vent = box(inner, gold, 0, 0, .025, .026, 1.15, .026);
        vent.rotation.z = i * Math.PI / 8;
    }

    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 256;
    labelCanvas.height = 256;
    const label = labelCanvas.getContext('2d');
    label.fillStyle = '#1c150e';
    label.fillRect(0, 0, 256, 256);
    label.strokeStyle = '#a87844';
    label.strokeRect(12, 12, 232, 232);
    label.fillStyle = '#e6bb80';
    label.textAlign = 'center';
    label.font = '31px Georgia';
    label.fillText('TERROIR', 128, 127);
    label.font = '12px sans-serif';
    label.fillText('SPECIALTY COFFEE', 128, 156);
    const labelTexture = new THREE.CanvasTexture(labelCanvas);
    labelTexture.colorSpace = THREE.SRGBColorSpace;
    const labelMat = new THREE.MeshStandardMaterial({ map: labelTexture, roughness: .86 });

    function bag(parent, x, y, z, scale) {
        const item = new THREE.Group();
        parent.add(item);
        item.position.set(x, y, z);
        item.scale.setScalar(scale);
        box(item, black, 0, 1.0, 0, 1.39, 1.91, .53);
        box(item, band, 0, 1.99, 0, 1.36, .09, .38);
        box(item, gold, 0, 1.82, .272, 1.31, .025, .017);
        box(item, labelMat, 0, 1.09, .275, .98, .98, .014);
        return item;
    }
    bag(scene, 0, .84, -.05, .91).rotation.y = -.16;
    for (let i = 0; i < 4; i++) {
        box(scene, wood, 5.2, 1.25 + i * .58, -3.25, 3.1, .085, .52);
        for (let j = 0; j < 5; j++) bag(scene, 3.95 + j * .56, 1.30 + i * .58, -3.25, .23);
    }

    // One LatheGeometry gives the cup a real interior, rim and tapered base.
    const profile = [[0, .015], [.32, .015], [.37, .10], [.52, .62], [.53, .67],
        [.49, .68], [.47, .61], [.31, .16], [0, .16]];
    mesh(new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), 44),
        ceramic, scene, 4.55, .90, .25);
    torus(scene, ceramic, 5.10, 1.25, .25, .25, .065);
    cylinder(scene, ceramic, 4.55, .86, .25, .77, .67, .08);
    cylinder(scene, coffee, 4.55, 1.49, .25, .46, .46, .018);
    torus(scene, milk, 4.55, 1.502, .25, .41, .017).rotation.x = Math.PI / 2;

    const beanCount = phone ? 54 : 120;
    const grains = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), beanMat, beanCount);
    grains.frustumCulled = false;
    scene.add(grains);
    const grain = new THREE.Object3D();
    const view = new THREE.CatmullRomCurve3([
        [-6.3, 1.90, 4.9], [-4.5, 2.0, 3.1], [-2.5, 2.72, 3.28],
        [-.4, 2.53, 3.65], [2.4, 2.10, 4.2], [4.97, 2.02, 3.02], [5.32, 1.89, 2.25]
    ].map(point => new THREE.Vector3(...point)));
    const target = new THREE.CatmullRomCurve3([
        [-4.2, 1.72, .18], [-4.1, 1.86, .26], [-1.66, 1.81, .44],
        [0, 1.72, 0], [2.2, 1.70, .18], [4.55, 1.4, .25], [4.55, 1.34, .25]
    ].map(point => new THREE.Vector3(...point)));
    let desired = 0;
    let displayed = 0;
    let frame = 0;
    let chapter = -1;

    function render() {
        frame = 0;
        displayed += (desired - displayed) * .17;
        if (Math.abs(desired - displayed) < .0009) displayed = desired;
        const progress = displayed;
        camera.position.copy(view.getPoint(progress));
        camera.lookAt(target.getPoint(progress));
        inner.rotation.z = progress * -12;
        for (let i = 0; i < beanCount; i++) {
            const age = ((i * .6180339887 + progress * 5) % 1);
            const chute = i % 3;
            const drift = Math.sin(i * 11.7 + progress * 8);
            if (chute === 0) {
                const angle = i * 3.13 + progress * 21;
                const radius = .22 + (i % 5) * .08;
                grain.position.set(-4.2 + Math.sin(angle) * radius, 1.88 + Math.cos(angle) * radius, .51);
            } else {
                grain.position.set(drift * (.2 + age * .22), 3.83 - age * age * 1.69, -.04 + .35 * Math.cos(i * 1.7));
            }
            grain.scale.set(.065, .030, .044);
            grain.rotation.set(i * .73 + progress * 16, i * 1.38, age * 13);
            grain.updateMatrix();
            grains.setMatrixAt(i, grain.matrix);
        }
        grains.instanceMatrix.needsUpdate = true;
        const nextChapter = progress < .32 ? 0 : progress < .68 ? 1 : 2;
        if (chapter !== nextChapter) {
            chapter = nextChapter;
            drawChapter(chapter);
        }
        renderer.render(scene, camera);
        if (desired !== displayed) frame = requestAnimationFrame(render);
    }
    function update() {
        const span = stage.parentElement;
        const rect = span.getBoundingClientRect();
        const top = parseFloat(getComputedStyle(stage).top);
        const travel = span.offsetHeight - stage.offsetHeight;
        if (rect.top > innerHeight || rect.bottom < 0) return;
        desired = THREE.MathUtils.clamp((top - rect.top) / Math.max(travel, 1), 0, 1);
        if (!frame) frame = requestAnimationFrame(render);
    }
    function resize() {
        const rect = stage.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        camera.aspect = rect.width / rect.height;
        camera.fov = camera.aspect < 1 ? 57 : 42;
        camera.updateProjectionMatrix();
        renderer.setSize(rect.width, rect.height, false);
        update();
    }
    const observer = new ResizeObserver(resize);
    observer.observe(stage);
    window.addEventListener('scroll', update, { passive: true });
    resize();
    return () => {
        window.removeEventListener('scroll', update);
        observer.disconnect();
        cancelAnimationFrame(frame);
        scene.traverse(object => object.geometry?.dispose());
        scene.traverse(object => {
            if (object.material) {
                object.material.map?.dispose();
                object.material.dispose();
            }
        });
        renderer.dispose();
    };
}
