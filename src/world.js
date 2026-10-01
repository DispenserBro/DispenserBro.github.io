import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export function createWorld() {
  const host = document.querySelector('#canvas-host');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.65;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 40);
  const startPosition = new THREE.Vector3(4.1, 2.6, 6.7);
  camera.position.copy(startPosition);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.1, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.075;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.minPolarAngle = Math.PI * 0.3;
  controls.maxPolarAngle = Math.PI * 0.55;
  controls.minAzimuthAngle = -Math.PI * 0.6;
  controls.maxAzimuthAngle = Math.PI * 0.6;
  controls.update();

  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = new RoomEnvironment();
  const environmentTarget = pmrem.fromScene(environment, 0.04);
  scene.environment = environmentTarget.texture;
  environment.dispose();
  pmrem.dispose();
  scene.add(new THREE.AmbientLight(0x7da5aa, 1.2));
  const key = new THREE.DirectionalLight(0xf0f9ff, 3.6);
  key.position.set(2, 5, 4);
  scene.add(key);
  const edge = new THREE.PointLight(0x68ebcc, 12, 9);
  edge.position.set(-2, 0.7, 1.6);
  scene.add(edge);
  const blue = new THREE.PointLight(0x74a1fc, 12, 10);
  blue.position.set(2, 2, -2);
  scene.add(blue);

  const metal = new THREE.MeshPhysicalMaterial({ color: 0x1b2d36, metalness: 0.8, roughness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.2 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x080e14, metalness: 0.6, roughness: 0.46 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0x7eabb3, metalness: 1, roughness: 0.27 });
  const glow = new THREE.MeshStandardMaterial({ color: 0x72f5d4, emissive: 0x54d9b1, emissiveIntensity: 0.55, roughness: 0.4 });
  const blueGlow = new THREE.MeshStandardMaterial({ color: 0x839bff, emissive: 0x546eca, emissiveIntensity: 0.55 });
  const cabinet = new THREE.Group();
  scene.add(cabinet);

  function rounded(width, height, depth, material, x, y, z, radius = 0.06) {
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(width, height, depth, 3, radius), material);
    mesh.position.set(x, y, z);
    cabinet.add(mesh);
    return mesh;
  }
  rounded(1.65, 2.78, 1.07, metal, 0, 0, 0, 0.1);
  rounded(1.71, 0.43, 1.15, dark, 0, 1.26, 0.07);
  rounded(1.35, 1.37, 0.11, chrome, 0, 0.42, 0.59, 0.07);
  rounded(1.24, 1.26, 0.12, dark, 0, 0.42, 0.65, 0.05);
  const deck = rounded(1.78, 0.18, 0.67, metal, 0, -0.41, 0.7, 0.055);
  deck.rotation.x = -0.22;
  rounded(1.42, 0.65, 0.06, dark, 0, -0.97, 0.58, 0.04);
  rounded(0.53, 0.19, 0.08, chrome, 0.18, -0.92, 0.62, 0.02);
  rounded(0.28, 0.04, 0.04, dark, 0.18, -0.9, 0.67, 0.01);
  rounded(0.22, 0.11, 0.05, dark, 0.18, -1.02, 0.68, 0.01);
  for (const x of [-0.69, 0.69]) {
    rounded(0.033, 2.21, 0.035, glow, x, 0, 0.56, 0.012);
    rounded(0.036, 0.39, 0.03, glow, x, 1.26, 0.65, 0.01);
  }
  for (const x of [-0.69, 0.69]) rounded(0.18, 0.16, 0.87, dark, x, -1.45, 0.02, 0.03);

  // Physical controls give the model a clear silhouette at small viewport sizes.
  const joystickBase = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.19, 0.035, 28), chrome);
  joystickBase.position.set(-0.37, -0.24, 0.73);
  cabinet.add(joystickBase);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.22, 16), chrome);
  shaft.position.set(-0.37, -0.11, 0.73);
  cabinet.add(shaft);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.105, 24, 18), glow);
  ball.position.set(-0.37, 0.03, 0.73);
  cabinet.add(ball);
  for (let index = 0; index < 3; index++) {
    const button = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.045, 24), index === 1 ? blueGlow : glow);
    button.position.set(0.1 + index * 0.2, -0.26, 0.86 - (index % 2) * 0.12);
    cabinet.add(button);
  }
  for (let index = 0; index < 5; index++) rounded(0.23, 0.014, 0.025, chrome, -0.31, -1.15 + index * 0.045, 0.625, 0.005);

  const screenCanvas = document.createElement('canvas');
  screenCanvas.width = 512;
  screenCanvas.height = 512;
  const ctx = screenCanvas.getContext('2d');
  const screenTexture = new THREE.CanvasTexture(screenCanvas);
  screenTexture.colorSpace = THREE.SRGBColorSpace;
  screenTexture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);
  const screenMaterial = new THREE.MeshBasicMaterial({ map: screenTexture, toneMapped: false });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.135, 1.155), screenMaterial);
  screen.position.set(0, 0.43, 0.721);
  cabinet.add(screen);

  function canvasLabel(text, subtitle) {
    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = 180;
    const c = canvas.getContext('2d');
    c.fillStyle = '#0a1319';
    c.fillRect(0, 0, 768, 180);
    c.fillStyle = '#aaf8e7';
    c.font = 'bold 75px monospace';
    c.textAlign = 'center';
    c.fillText(text, 384, 90);
    c.fillStyle = '#6c9ca4';
    c.font = '22px monospace';
    c.fillText(subtitle, 384, 137);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }
  const marqueeTexture = canvasLabel('DANRO', 'ИГРА / УПРАВЛЕНИЕ');
  const marquee = new THREE.Mesh(new THREE.PlaneGeometry(1.28, 0.295), new THREE.MeshBasicMaterial({ map: marqueeTexture, toneMapped: false }));
  marquee.position.set(0, 1.26, 0.651);
  cabinet.add(marquee);

  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.43, 1.43, 0.11, 80), dark);
  pedestal.position.y = -1.59;
  scene.add(pedestal);
  const orbit = new THREE.Mesh(new THREE.TorusGeometry(1.47, 0.007, 6, 120), new THREE.MeshBasicMaterial({ color: 0x466c75, transparent: true, opacity: 0.6 }));
  orbit.rotation.x = Math.PI / 2;
  orbit.position.y = -1.55;
  scene.add(orbit);

  const particles = new THREE.BufferGeometry();
  const coordinates = new Float32Array(38 * 3);
  for (let index = 0; index < 38; index++) {
    const angle = index * 2.399963;
    coordinates[index * 3] = Math.sin(angle) * (1.9 + (index % 3) * 0.25);
    coordinates[index * 3 + 1] = ((index % 11) / 10) * 3.8 - 1.7;
    coordinates[index * 3 + 2] = Math.cos(angle) * (1.4 + (index % 3) * 0.15);
  }
  particles.setAttribute('position', new THREE.BufferAttribute(coordinates, 3));
  const points = new THREE.Points(particles, new THREE.PointsMaterial({ color: 0x83b8b9, size: 0.022, transparent: true, opacity: 0.6, sizeAttenuation: true }));
  scene.add(points);

  const gameImage = new Image();
  let mode = 'arcade';
  gameImage.onload = () => drawScreen(performance.now());
  gameImage.src = './assets/danro-jump.webp';

  function drawScreen(time = 0) {
    ctx.fillStyle = '#07151e';
    ctx.fillRect(0, 0, 512, 512);
    if (mode === 'arcade' && gameImage.complete && gameImage.naturalWidth) {
      const height = 512;
      const width = gameImage.width / gameImage.height * height;
      ctx.drawImage(gameImage, (512 - width) / 2, 0, width, height);
      ctx.fillStyle = '#0c2231b5';
      ctx.fillRect(0, 463, 512, 49);
      ctx.font = 'bold 21px monospace';
      ctx.fillStyle = '#e3ffeb';
      ctx.textAlign = 'center';
      ctx.fillText('DANRO JUMP / UNITY', 256, 495);
    } else if (mode === 'system') {
      ctx.textAlign = 'left';
      ctx.fillStyle = '#6bd8cd';
      ctx.font = '20px monospace';
      ctx.fillText('КОНТРОЛЛЕР / COM', 40, 62);
      ctx.font = 'bold 75px monospace';
      ctx.fillStyle = '#d7ffed';
      ctx.fillText('READY!', 40, 166);
      ctx.fillStyle = '#72989d';
      ctx.font = '22px monospace';
      ['АВТОРИЗАЦИЯ ПРОЙДЕНА', 'ВХОДЫ  ▪  ВЫХОДЫ', 'СОСТОЯНИЯ  ▪  СОБЫТИЯ', 'КОНТРОЛЛЕР НА СВЯЗИ'].forEach((text, index) => ctx.fillText(text, 42, 238 + index * 48));
      ctx.fillStyle = '#69e6b9';
      for (let i = 0; i < 8; i++) ctx.fillRect(42 + i * 54, 452, 34, 12);
    } else {
      ctx.textAlign = 'left';
      ctx.font = '20px monospace';
      ctx.fillStyle = '#839db7';
      ctx.fillText('ИГРОВОЙ СЕРВИС / C#', 35, 58);
      const lines = ['class GameService', '{', '  public void Start()', '  {', '    state.Enter();', '    input.Connect();', '    world.Run();', '  }', '}'];
      ctx.font = '23px monospace';
      lines.forEach((line, index) => {
        ctx.fillStyle = index === 0 || line.includes('public') ? '#abbcff' : line.includes('world') ? '#83e6bd' : '#a7c0d1';
        ctx.fillText(line, 34, 120 + index * 38);
      });
    }
    // Subtle scanlines belong to the 3D screen, not the page text.
    ctx.fillStyle = '#00000014';
    for (let y = 0; y < 512; y += 4) ctx.fillRect(0, y, 512, 1);
    screenTexture.needsUpdate = true;
  }
  drawScreen();

  function setMode(nextMode) {
    mode = nextMode;
    const color = mode === 'code' ? 0x8da4ff : mode === 'system' ? 0x6bdded : 0x68ebcc;
    glow.color.setHex(color);
    glow.emissive.setHex(color);
    edge.color.setHex(color);
    drawScreen();
    document.querySelectorAll('[data-scene]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.scene === mode)));
    document.querySelector('#scene-status').textContent = mode === 'arcade' ? 'Danro Jump' : mode === 'system' ? 'COM / Serial' : 'C# / Сервисы';
  }
  document.querySelectorAll('[data-scene]').forEach((button) => button.addEventListener('click', () => setMode(button.dataset.scene)));
  document.querySelector('#scene-reset').addEventListener('click', () => {
    camera.position.copy(startPosition);
    controls.target.set(0, 0.1, 0);
    controls.update();
  });
  document.querySelector('#scene-status').textContent = 'Danro Jump';
  document.querySelector('#world-hint').textContent = 'Перетащи и поверни';
  host.dataset.ready = 'true';

  function resize() {
    const width = host.clientWidth;
    const height = host.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  resize();
  let inViewport = true;
  let frame;
  let start = performance.now();
  function render(now) {
    frame = requestAnimationFrame(render);
    if (!inViewport || document.hidden) return;
    const elapsed = (now - start) / 1000;
    if (!reducedMotion.matches) {
      cabinet.position.y = Math.sin(elapsed * 0.9) * 0.025;
      points.rotation.y = elapsed * 0.016;
    }
    controls.update();
    renderer.render(scene, camera);
  }
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    inViewport = entry.isIntersecting;
  });
  visibilityObserver.observe(host);
  frame = requestAnimationFrame(render);

  renderer.domElement.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    cancelAnimationFrame(frame);
    document.querySelector('#world-fallback').classList.add('visible');
    document.querySelector('#world-hint').textContent = 'Скриншот Danro Jump';
    document.querySelector('.world-bottom p').textContent = 'Игровой экран Danro Jump';
    document.querySelector('.scene-controls').hidden = true;
    document.querySelector('#scene-reset').hidden = true;
  });
  window.addEventListener('pagehide', () => {
    cancelAnimationFrame(frame);
    resizeObserver.disconnect();
    visibilityObserver.disconnect();
    controls.dispose();
    scene.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) for (const material of Array.isArray(object.material) ? object.material : [object.material]) material.dispose();
    });
    screenTexture.dispose();
    marqueeTexture.dispose();
    environmentTarget.dispose();
    renderer.dispose();
  }, { once: true });
}
