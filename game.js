import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const canvas = document.querySelector('#world');
const stage = document.querySelector('.game-stage');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#182545');
scene.fog = new THREE.Fog('#182545', 12, 27);
const camera = new THREE.OrthographicCamera(-9.2, 9.2, 5.175, -5.175, 0.1, 80);
camera.position.set(0, 4.2, 20);
camera.lookAt(0, 1.7, 0);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
scene.add(new THREE.HemisphereLight('#dfe8ff', '#40505b', 2.0));
const moon = new THREE.DirectionalLight('#ffe4b2', 3.4);
moon.position.set(-4, 9, 8);
moon.castShadow = true;
moon.shadow.mapSize.set(1024, 1024);
scene.add(moon);
const goldLight = new THREE.PointLight('#ffd270', 12, 10, 2);
goldLight.position.set(2.8, 2.0, 2.8);
scene.add(goldLight);

const world = new THREE.Group();
scene.add(world);
const props = new THREE.Group();
world.add(props);
const player = new THREE.Group();
scene.add(player);
let lantern = null;
let moth = null;
let keyMesh = null;
let heroTexture = null;
let heroSprite = null;
let running = false;
let level = 1;
let score = [0, 0];
let wrongAnswers = [0, 0];
let keyFound = false;
let finished = false;
let enemyAlive = true;
let x = -5.1;
let y = 0;
let vy = 0;
let waveCooldown = 0;
let toastTimer;
let audioOn = true;
let audioContext;
const held = { left: false, right: false };

const ui = {
  chapter: document.querySelector('#chapter-name'), number: document.querySelector('#chapter-number'),
  tag: document.querySelector('#chapter-tag'), heading: document.querySelector('#scene-heading'),
  score: document.querySelector('#score'), key: document.querySelector('#key-status'),
  objective: document.querySelector('#objective'), tip: document.querySelector('#scene-tip'),
  start: document.querySelector('#start-screen'), loading: document.querySelector('#loading-note'),
  quiz: document.querySelector('#quiz-dialog'), quizMeta: document.querySelector('#quiz-meta'),
  quizTitle: document.querySelector('#quiz-title'), quizDescription: document.querySelector('#quiz-description'),
  answers: document.querySelector('#answers'), feedback: document.querySelector('#feedback'),
  result: document.querySelector('#result-dialog'), resultScores: document.querySelector('#result-scores'),
  progress: document.querySelector('#progress-copy'), toast: document.querySelector('#toast')
};

const mat = (color, roughness = 0.84, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, ...extra });
const mats = {
  path: mat('#334153'), pathEdge: mat('#293b46'), trunk: mat('#203945'), pine: mat('#1f4a50'),
  pineDark: mat('#173940'), stone: mat('#71677c'), gold: mat('#d9a852', 0.38, { metalness: 0.48 }),
  cream: mat('#f1d9a0'), mushroom: mat('#d77878'), stem: mat('#dfd1b7'),
  hero: mat('#eab969'), hood: mat('#d56e60'), skin: mat('#ffe0bb'), shadow: mat('#544d78'), wing: mat('#9b8bc9')
};

function box(parent, name, size, position, material, cast = false) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.name = name; mesh.position.set(...position); mesh.castShadow = cast; mesh.receiveShadow = true;
  parent.add(mesh); return mesh;
}
function sphere(parent, name, radius, position, material, scale = [1, 1, 1], segments = 18) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, segments, 12), material);
  mesh.name = name; mesh.position.set(...position); mesh.scale.set(...scale); mesh.castShadow = true;
  parent.add(mesh); return mesh;
}
function cylinder(parent, name, rTop, rBottom, height, position, material, sides = 12) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, height, sides), material);
  mesh.name = name; mesh.position.set(...position); mesh.castShadow = true; parent.add(mesh); return mesh;
}

function buildWorld() {
  for (const child of [...props.children]) { props.remove(child); }
  scene.background.set(level === 1 ? '#182545' : '#19283d');
  scene.fog.color.set(level === 1 ? '#182545' : '#19283d');
  goldLight.color.set(level === 1 ? '#ffd270' : '#93d8ff');
  const ground = box(props, 'Soft forest trail', [17, 0.52, 5], [0, -0.3, 0], mats.path);
  ground.receiveShadow = true;
  box(props, 'Trail edge', [17, 0.16, 5.4], [0, -0.55, 0], mats.pathEdge);
  // Tall trunks and overlapping stylized canopy shapes frame the miniature explorer.
  for (let i = 0; i < 8; i++) {
    const side = i % 2 ? 1 : -1;
    const column = Math.floor(i / 2);
    const px = side * (5.8 + column * 1.55);
    const z = -2.1 - (column % 2) * 0.7;
    box(props, 'Ancient pine trunk', [0.56, 4.4, 0.55], [px, 1.9, z], mats.trunk, true);
    const crown = new THREE.Mesh(new THREE.ConeGeometry(1.65, 3.0, 7), column % 2 ? mats.pine : mats.pineDark);
    crown.position.set(px, 4.0, z - 0.1); crown.rotation.y = Math.PI / 7; crown.castShadow = true; props.add(crown);
    const crown2 = new THREE.Mesh(new THREE.ConeGeometry(1.25, 2.3, 7), mats.pine);
    crown2.position.set(px, 5.15, z - 0.1); crown2.castShadow = true; props.add(crown2);
  }
  for (let i = 0; i < 12; i++) {
    const px = -7.2 + i * 1.3;
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.075 + (i % 3) * 0.018, 10, 8), new THREE.MeshBasicMaterial({ color: i % 3 ? '#ffdfa0' : '#a9e8e0' }));
    glow.position.set(px, 2.7 + Math.sin(i * 2.1) * 1.3, -3.2); props.add(glow);
  }
  // Mushroom families make the scene feel storybook-sized.
  for (let i = 0; i < 7; i++) {
    const px = -6.7 + i * 2.15;
    cylinder(props, 'Mushroom stem', 0.11, 0.14, 0.42, [px, 0.0, 1.1], mats.stem, 9);
    sphere(props, 'Mushroom cap', 0.26, [px, 0.22, 1.1], mats.mushroom, [1.35, 0.53, 1], 12);
  }
  if (level === 1) {
    // Moonlight Market stalls in the far lane give the first chapter its own identity.
    for (const [px, tint] of [[-2.7, '#c87973'], [4.25, '#d2a45e']]) {
      box(props, 'Market stall table', [1.35, 0.2, 0.72], [px, 0.45, -2.45], mat('#896c60'), true);
      for (const leg of [-0.5, 0.5]) box(props, 'Market stall leg', [0.12, 0.78, 0.12], [px + leg, 0.0, -2.45], mat('#775d57'));
      const awning = new THREE.Mesh(new THREE.ConeGeometry(0.93, 1.15, 4), mat(tint));
      awning.position.set(px, 1.45, -2.5); awning.rotation.y = Math.PI / 4; awning.scale.z = 0.62; awning.castShadow = true; props.add(awning);
      sphere(props, 'Starfruit basket', 0.2, [px - 0.3, 0.7, -2.0], mat('#e6be70'), [1.15, 0.72, 0.78]);
    }
  } else {
    // A high treehouse silhouette, hanging star lanterns, and a short walkway
    // distinguish the second chapter while keeping the same readable route.
    cylinder(props, 'Treehouse trunk', 0.62, 0.95, 6.5, [0.3, 2.65, -3.0], mats.trunk, 8);
    box(props, 'Treehouse balcony', [3.4, 0.3, 1.0], [0.3, 3.55, -2.2], mat('#496c70'), true);
    box(props, 'Treehouse cabin', [2.15, 1.65, 1.65], [0.3, 4.45, -3.1], mat('#76677b'), true);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.65, 1.35, 5), mat('#77a9ab'));
    roof.position.set(0.3, 5.85, -3.1); roof.rotation.y = Math.PI / 5; roof.castShadow = true; props.add(roof);
    for (let i = 0; i < 5; i++) {
      const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.13 + (i % 2) * 0.05), new THREE.MeshBasicMaterial({ color: i % 2 ? '#b4ddff' : '#ffe2a0' }));
      star.position.set(-5.5 + i * 2.65, 3.6 + (i % 2) * 1.0, -2.5); props.add(star);
    }
  }
  // Tutorial sign, question shrine, and star gate.
  box(props, 'Sign post', [0.17, 1.3, 0.17], [-4.45, 0.35, -0.15], mats.trunk, true);
  box(props, 'Welcome board', [1.45, 0.76, 0.17], [-4.45, 1.0, -0.17], mat('#49717a'), true);
  box(props, 'Knowledge stone base', [1.15, 0.72, 0.8], [2.8, 0.15, -0.15], mats.stone, true);
  const gem = sphere(props, 'Glowing knowledge star', 0.33, [2.8, 0.9, -0.2], mat('#ffdc8e', 0.25, { emissive: '#e8a942', emissiveIntensity: 1.8 }), [1, 1.15, 0.75]);
  gem.userData.pulse = true;
  box(props, 'Gate post left', [0.3, 2.75, 0.38], [6.1, 1.0, -0.1], mats.trunk, true);
  box(props, 'Gate post right', [0.3, 2.75, 0.38], [7.85, 1.0, -0.1], mats.trunk, true);
  box(props, 'Gate lintel', [2.05, 0.32, 0.42], [6.98, 2.2, -0.1], mats.gold, true);
  for (let i = 0; i < 4; i++) box(props, 'Gate star bars', [0.09, 1.55, 0.13], [6.38 + i * 0.4, 0.95, 0.12], mat('#8199a2'));
  if (!lantern) {
    new GLTFLoader().load('./assets/starlight_lantern.glb', (gltf) => {
      lantern = gltf.scene; lantern.name = 'Blender Starlight Lantern';
      lantern.scale.setScalar(0.75); lantern.position.set(0.1, 0.01, -1.55);
      lantern.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      world.add(lantern); ui.loading.textContent = '霧林已點亮';
      setTimeout(() => { ui.loading.hidden = true; }, 1600);
    }, undefined, () => { ui.loading.textContent = '使用場景內的星光燈籠'; setTimeout(() => { ui.loading.hidden = true; }, 2500); });
  } else world.add(lantern);
  if (enemyAlive) buildMoth();
  buildHero();
}

function buildHero() {
  for (const child of [...player.children]) player.remove(child);
  if (!heroTexture) heroTexture = createElfSpriteTexture();
  const spriteMaterial = new THREE.SpriteMaterial({ map: heroTexture, transparent: true, alphaTest: 0.08, depthWrite: false });
  heroSprite = new THREE.Sprite(spriteMaterial);
  heroSprite.name = 'Pixel Elf Explorer';
  heroSprite.scale.set(1.55, 1.94, 1);
  heroSprite.position.y = 0.98;
  player.add(heroSprite);
  player.position.set(x, y, 0.5);
}

function createElfSpriteTexture() {
  // Two crisp 16×20 pixel frames: a silver-haired forest elf in green travel clothes.
  const canvas = document.createElement('canvas');
  canvas.width = 64; canvas.height = 40;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const C = {
    outline: '#263a3d', hairShadow: '#81939b', hair: '#d5dedb', hairLight: '#f5f2e8',
    skinShadow: '#d69891', skin: '#f3c0aa', skinLight: '#ffd8c1', eye: '#357d59', eyeLight: '#b9e89f',
    leafDark: '#276344', leaf: '#438c58', leafLight: '#8cc878', clothDark: '#29553e',
    cloth: '#3f8251', clothLight: '#85b96a', belt: '#dbc28c', beltDark: '#8c694a',
    scarf: '#c65b4e', boot: '#705342', bootLight: '#aa7952', gold: '#f0ce76'
  };
  const px = (frame, x, y, w, h, color) => { ctx.fillStyle = color; ctx.fillRect(frame * 32 + x * 2, y * 2, w * 2, h * 2); };
  for (let f = 0; f < 2; f++) {
    // Leaf cape and long side locks frame the little face.
    px(f, 2, 10, 3, 7, C.outline); px(f, 2, 11, 2, 5, C.leafDark); px(f, 3, 11, 2, 4, C.leaf);
    px(f, 3, 13, 2, 1, C.leafLight); px(f, 3, 15, 2, 1, C.leafDark);
    // Pointed elf ears, outlined with soft peach inner pixels.
    px(f, 1, 7, 4, 2, C.outline); px(f, 0, 7, 3, 1, C.skinShadow); px(f, 2, 7, 2, 1, C.skinLight);
    px(f, 12, 7, 4, 2, C.outline); px(f, 13, 7, 3, 1, C.skinShadow); px(f, 13, 7, 2, 1, C.skinLight);
    // Face silhouette, cheeks and bright green eyes.
    px(f, 4, 5, 9, 9, C.outline); px(f, 5, 6, 7, 7, C.skin); px(f, 6, 7, 6, 5, C.skinLight);
    px(f, 5, 11, 2, 1, C.skinShadow); px(f, 10, 11, 2, 1, C.skinShadow);
    px(f, 6, 9, 2, 2, C.outline); px(f, 10, 9, 2, 2, C.outline);
    px(f, 6, 9, 1, 2, C.eye); px(f, 10, 9, 1, 2, C.eye);
    px(f, 6, 9, 1, 1, C.eyeLight); px(f, 10, 9, 1, 1, C.eyeLight);
    px(f, 8, 12, 2, 1, C.skinShadow);
    // Flowing silver hair, long side pieces, and a swept fringe.
    px(f, 4, 2, 8, 4, C.outline); px(f, 5, 1, 7, 4, C.hairShadow);
    px(f, 5, 1, 6, 3, C.hair); px(f, 7, 1, 3, 1, C.hairLight);
    px(f, 4, 4, 3, 5, C.hairShadow); px(f, 4, 5, 2, 8, C.outline);
    px(f, 5, 5, 2, 7, C.hair); px(f, 5, 6, 1, 5, C.hairLight);
    px(f, 11, 4, 3, 6, C.hairShadow); px(f, 12, 6, 2, 9, C.outline);
    px(f, 12, 7, 2, 6, C.hair); px(f, 13, 8, 1, 4, C.hairLight);
    px(f, 7, 4, 5, 2, C.hair); px(f, 8, 4, 3, 1, C.hairLight);
    px(f, 9, 5, 3, 2, C.hair); px(f, 10, 6, 2, 1, C.hairLight);
    // Forest tunic, tiny red scarf, belt and leaf-shaped shoulder bow.
    px(f, 5, 13, 8, 6, C.outline); px(f, 6, 14, 6, 4, C.clothDark);
    px(f, 7, 14, 4, 4, C.cloth); px(f, 8, 14, 2, 2, C.clothLight);
    px(f, 6, 13, 6, 2, C.scarf); px(f, 10, 13, 3, 1, C.scarf);
    px(f, 7, 17, 5, 1, C.beltDark); px(f, 8, 17, 3, 1, C.belt); px(f, 9, 17, 1, 1, C.gold);
    px(f, 4, 14, 2, 3, C.skinShadow); px(f, 4, 14, 1, 2, C.skinLight);
    px(f, 12, 14, 2, 3, C.skinShadow); px(f, 12, 14, 1, 2, C.skinLight);
    px(f, 3, 13, 2, 2, C.leafDark); px(f, 3, 12, 2, 2, C.leaf); px(f, 4, 12, 1, 1, C.leafLight);
    // Small star wand for the gentle light-wave action.
    px(f, 14, 13, 1, 4, C.beltDark); px(f, 14, 12, 1, 1, C.gold); px(f, 13, 12, 1, 1, C.gold);
    // Alternate feet make the sprite feel alive while moving.
    if (f === 0) {
      px(f, 6, 18, 3, 1, C.outline); px(f, 6, 19, 3, 1, C.boot); px(f, 6, 19, 2, 1, C.bootLight);
      px(f, 10, 18, 3, 1, C.outline); px(f, 10, 19, 3, 1, C.boot); px(f, 11, 19, 2, 1, C.bootLight);
    } else {
      px(f, 6, 18, 3, 1, C.outline); px(f, 5, 19, 3, 1, C.boot); px(f, 5, 19, 2, 1, C.bootLight);
      px(f, 10, 18, 3, 1, C.outline); px(f, 11, 19, 3, 1, C.boot); px(f, 12, 19, 2, 1, C.bootLight);
      px(f, 3, 14, 2, 1, C.leafLight);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter; texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false; texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.repeat.set(0.5, 1); texture.offset.set(0, 0);
  return texture;
}
function buildMoth() {
  moth = new THREE.Group(); moth.name = 'Gentle shadow moth'; moth.position.set(0.4, 0.85, 0.35);
  sphere(moth, 'Moth body', 0.29, [0, 0, 0], mats.shadow, [0.85, 0.78, 0.6]);
  sphere(moth, 'Moth wing', 0.24, [-0.31, 0.16, -0.02], mats.wing, [1.2, 0.66, 0.24]);
  sphere(moth, 'Moth wing', 0.24, [0.31, 0.16, -0.02], mats.wing, [1.2, 0.66, 0.24]);
  sphere(moth, 'Moth eye', 0.036, [0.08, 0.02, 0.25], mats.cream);
  scene.add(moth);
}

function setProgress() {
  const title = level === 1 ? '月光市集' : '星光樹屋';
  ui.chapter.textContent = `${level === 1 ? '序章' : '第二章'}・${title}`;
  ui.number.textContent = `0${level}`;
  ui.tag.textContent = level === 1 ? '生活理財・第一課' : '生活理財・第二課';
  ui.heading.textContent = title;
  ui.score.textContent = String(score[level - 1]).padStart(3, '0');
  ui.key.textContent = keyFound ? '✦ 星鑰匙已取得' : '✧ 星鑰匙待尋';
  ui.key.classList.toggle('has-key', keyFound);
  ui.objective.textContent = keyFound ? (level === 1 ? '帶著星鑰匙走到林間拱門' : '太好了！兩關都已完成') : (level === 1 ? '探索霧林，找到預算知識石碑' : '找到星光石碑，回答風險小問題');
  ui.tip.querySelector('span:last-child').textContent = level === 1 ? '尋找發光石碑；靠近後按 E 互動' : '把星星幣分散放進不同的投資籃子';
}
function showToast(message) {
  ui.toast.textContent = message; ui.toast.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => ui.toast.classList.remove('show'), 2100);
}
function playTone(freq = 700, length = 0.12) {
  if (!audioOn) return;
  try {
    audioContext ??= new AudioContext();
    const osc = audioContext.createOscillator(); const gain = audioContext.createGain();
    osc.type = 'sine'; osc.frequency.value = freq; gain.gain.setValueAtTime(0.06, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + length);
    osc.connect(gain).connect(audioContext.destination); osc.start(); osc.stop(audioContext.currentTime + length);
  } catch { /* Sound is optional; the game remains fully playable without it. */ }
}

const questions = {
  1: {
    meta: '月光市集・理財小任務', title: '先分配零用錢，再決定想買什麼',
    description: '你有 100 枚星星幣。先存下 30 枚，必需品花 45 枚，剩下最多能花多少買想要的東西？',
    options: ['25 枚：先存下來，再付必需品', '30 枚：把存款也算成可花的錢', '35 枚：忘記把必需品算進去'],
    hint: '試著算算看：100 − 30 − 45。先安排儲蓄與必需品，最後才是想要的東西。',
    correct: '答對了！100 − 30 − 45 = 25 枚。先存錢再消費，星鑰匙是你的！'
  },
  2: {
    meta: '星光樹屋・投資小任務', title: '把星星分放在不同的籃子裡',
    description: '如果把模擬投資星星幣分散在不同類型的籃子裡，最可能有什麼好處？',
    options: ['分散風險：單一籃子下跌時，不會影響全部', '保證賺錢：投資一定會上漲', '完全沒風險：永遠不會虧損'],
    hint: '想想看：如果其中一個籃子遇到變化，其他籃子能不能分擔一部分影響？',
    correct: '答對了！分散投資能降低單一標的帶來的影響，但投資仍有風險。星鑰匙到手！'
  }
};

function openQuiz() {
  const q = questions[level];
  ui.quizMeta.textContent = q.meta; ui.quizTitle.textContent = q.title; ui.quizDescription.textContent = q.description;
  ui.feedback.textContent = ''; ui.feedback.classList.remove('error'); ui.answers.replaceChildren();
  q.options.forEach((caption, index) => {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'answer-button';
    button.innerHTML = `<span class="choice-mark">${String.fromCharCode(65 + index)}</span><span></span>`;
    button.querySelector('span:last-child').textContent = caption;
    button.addEventListener('click', () => answer(index)); ui.answers.append(button);
  });
  ui.quiz.showModal();
}
function answer(choice) {
  const q = questions[level];
  if (choice === 0) {
    ui.feedback.textContent = q.correct; ui.feedback.classList.remove('error');
    score[level - 1] += Math.max(60, 100 - wrongAnswers[level - 1] * 10);
    keyFound = true; setProgress(); playTone(880, 0.18);
    ui.answers.querySelectorAll('button').forEach((b) => { b.disabled = true; });
    keyMesh = new THREE.Group(); keyMesh.position.set(2.8, 1.7, -0.2);
    const stem = cylinder(keyMesh, 'Key stem', 0.045, 0.045, 0.48, [0.1, 0, 0], mats.gold, 8); stem.rotation.z = Math.PI / 2;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.045, 8, 18), mats.gold); ring.position.set(-0.2, 0, 0); keyMesh.add(ring);
    const tooth = box(keyMesh, 'Key tooth', [0.11, 0.13, 0.1], [0.22, -0.13, 0], mats.gold); tooth.rotation.z = -0.3;
    scene.add(keyMesh); showToast('星鑰匙已取得！本關得分 +' + Math.max(60, 100 - wrongAnswers[level - 1] * 10));
    setTimeout(() => {
      ui.quiz.close();
      if (level === 2) finishGame();
    }, 1400);
  } else {
    wrongAnswers[level - 1] += 1; ui.feedback.textContent = q.hint; ui.feedback.classList.add('error'); playTone(260, 0.1);
  }
}

function interact() {
  if (!running || finished || ui.quiz.open) return;
  if (!keyFound && Math.abs(x - 2.8) < 2.05) { openQuiz(); return; }
  if (keyFound && level === 1 && x > 4.45) { startSecondLevel(); }
}
function startSecondLevel() {
  level = 2; keyFound = false; enemyAlive = true; x = -5.1; y = 0; vy = 0;
  if (keyMesh) { scene.remove(keyMesh); keyMesh = null; }
  if (moth) { scene.remove(moth); moth = null; }
  lantern = world.getObjectByName('Blender Starlight Lantern') ?? lantern;
  if (lantern?.parent) lantern.parent.remove(lantern);
  buildWorld(); setProgress(); showToast('月光市集完成！前往星光樹屋'); playTone(620, 0.14);
}
function attack() {
  if (!running || finished || waveCooldown > 0) return;
  waveCooldown = 0.38;
  if (enemyAlive && Math.abs(x - 0.4) < 2.0) {
    enemyAlive = false; if (moth) scene.remove(moth); moth = null;
    score[level - 1] += 20; ui.score.textContent = String(score[level - 1]).padStart(3, '0');
    showToast('星光驅散了影子飛蛾！勇氣 +20'); playTone(760, 0.16);
  } else showToast('星光圈在夜色中閃了一下');
}

function finishGame() {
  running = false; finished = true; keyFound = true; setProgress();
  const names = ['月光市集・預算分配', '星光樹屋・分散風險'];
  ui.resultScores.innerHTML = '';
  for (let i = 0; i < 2; i++) {
    const row = document.createElement('div'); row.className = 'result-row';
    const concept = i === 0 ? '先存、再花' : '分散風險';
    const grade = wrongAnswers[i] === 0 ? '一次答對' : '持續練習';
    row.innerHTML = `<span>${names[i]} · ${concept}（${grade}）</span><strong>${score[i]} 分</strong>`;
    ui.resultScores.append(row);
  }
  const totalRow = document.createElement('div'); totalRow.className = 'result-row';
  totalRow.innerHTML = `<span>兩關總得分</span><strong>${score[0] + score[1]} / 240 分</strong>`;
  ui.resultScores.append(totalRow);
  ui.progress.textContent = '你已經會先分配收入、分清必需與想要，也知道把投資分散能降低單一標的的影響。這兩個理財習慣會陪你做出更仔細的選擇。';
  ui.result.showModal(); playTone(988, 0.35);
}
function restart() {
  score = [0, 0]; wrongAnswers = [0, 0]; level = 1; keyFound = false; enemyAlive = true;
  finished = false; running = true; x = -5.1; y = 0; vy = 0;
  if (keyMesh) { scene.remove(keyMesh); keyMesh = null; }
  if (lantern?.parent) lantern.parent.remove(lantern);
  lantern = null; if (moth) scene.remove(moth); moth = null;
  buildWorld(); setProgress(); ui.result.close();
}

document.querySelector('#start-button').addEventListener('click', () => { running = true; ui.start.classList.add('hidden'); showToast('找到知識石碑，答對問題就能拿到鑰匙'); });
document.querySelector('#replay-button').addEventListener('click', restart);
document.querySelector('#sound-toggle').addEventListener('click', (event) => { audioOn = !audioOn; event.currentTarget.classList.toggle('active', audioOn); event.currentTarget.setAttribute('aria-label', audioOn ? '音效開啟' : '音效關閉'); if (audioOn) playTone(660); });
window.addEventListener('keydown', (event) => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', ' '].includes(event.key)) event.preventDefault();
  if (event.repeat) return;
  if (event.key === 'a' || event.key === 'A' || event.key === 'ArrowLeft') held.left = true;
  if (event.key === 'd' || event.key === 'D' || event.key === 'ArrowRight') held.right = true;
  if ((event.key === ' ' || event.key === 'w' || event.key === 'W' || event.key === 'ArrowUp') && running && y <= 0.001) { vy = 7.8; playTone(420, 0.08); }
  if (event.key === 'e' || event.key === 'E' || event.key === 'Enter') interact();
  if (event.key === 'f' || event.key === 'F') attack();
});
window.addEventListener('keyup', (event) => {
  if (event.key === 'a' || event.key === 'A' || event.key === 'ArrowLeft') held.left = false;
  if (event.key === 'd' || event.key === 'D' || event.key === 'ArrowRight') held.right = false;
});
window.addEventListener('blur', () => { held.left = false; held.right = false; });
document.querySelectorAll('[data-hold]').forEach((button) => {
  const direction = button.dataset.hold;
  button.addEventListener('pointerdown', (e) => { e.preventDefault(); held[direction] = true; button.setPointerCapture(e.pointerId); });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(type, () => { held[direction] = false; });
});
document.querySelectorAll('[data-action]').forEach((button) => button.addEventListener('pointerdown', (e) => {
  e.preventDefault(); if (button.dataset.action === 'jump' && running && y <= 0.001) vy = 7.8;
  if (button.dataset.action === 'interact') interact(); if (button.dataset.action === 'wave') attack();
}));

function resize() {
  const width = stage.clientWidth, height = stage.clientHeight, aspect = width / height, viewHeight = 10.35;
  camera.left = -viewHeight * aspect / 2; camera.right = viewHeight * aspect / 2;
  camera.top = viewHeight / 2; camera.bottom = -viewHeight / 2; camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}
new ResizeObserver(resize).observe(stage); resize();
buildWorld(); setProgress();

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.04);
  if (running && !finished && !ui.quiz.open) {
    const direction = Number(held.right) - Number(held.left);
    x = THREE.MathUtils.clamp(x + direction * 4.5 * dt, -7.7, 7.5);
    if (heroTexture && heroSprite) heroTexture.offset.x = direction ? Math.floor(clock.elapsedTime * 7) % 2 * 0.5 : 0;
    vy -= 19 * dt; y = Math.max(0, y + vy * dt); if (y === 0) vy = 0;
    player.position.set(x, y, 0.5);
    if (waveCooldown > 0) waveCooldown -= dt;
    const cameraTargetX = THREE.MathUtils.clamp(x, -5.0, 5.0);
    camera.position.x += (cameraTargetX - camera.position.x) * Math.min(1, dt * 2.5);
    camera.lookAt(camera.position.x, 1.7, 0);
    if (moth) moth.position.y = 0.85 + Math.sin(clock.elapsedTime * 2.5) * 0.12;
    if (keyMesh) { keyMesh.rotation.y += dt * 0.8; keyMesh.position.y = 1.7 + Math.sin(clock.elapsedTime * 2) * 0.08; }
    for (const obj of props.children) if (obj.userData.pulse) obj.scale.setScalar(1 + Math.sin(clock.elapsedTime * 2.6) * 0.06);
    const nearQuiz = !keyFound && Math.abs(x - 2.8) < 2.05;
    const nearMoth = enemyAlive && Math.abs(x - 0.4) < 1.8;
    const nearGate = keyFound && level === 1 && x > 4.45;
    if (nearMoth) ui.objective.textContent = 'F 揮出星光，替自己開路；E 靠近石碑答題';
    else if (nearQuiz) ui.objective.textContent = '按 E 回答問題，答對取得星鑰匙';
    else if (nearGate) ui.objective.textContent = '按 E 穿過拱門，前往第二關';
    else ui.objective.textContent = keyFound ? '帶著星鑰匙走到林間拱門' : (level === 1 ? '探索霧林，找到預算知識石碑' : '找到星光石碑，回答風險小問題');
  }
  renderer.render(scene, camera);
}
animate();
