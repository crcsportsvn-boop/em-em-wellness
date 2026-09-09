/**
 * ATLAS-VIEWER.JS
 * 3D Human Anatomy Engine based on BodyParts3D dataset (ashemag/human-atlas)
 * Delivers exact 1:1 anatomical fidelity matching Figure 1:
 *  - Tone màu trắng tinh khiết chuẩn y khoa phòng khám (nền trắng sạch phẳng)
 *  - Mặc định tư thế thẳng đứng nhìn ngang chính diện (front view) và tự động xoay quanh trục thẳng đứng
 *  - Hệ thống xương gân trắng ngà (hộp sọ, xương đòn, xương chày, bánh chè, linea alba)
 *  - Dải cơ đỏ sinh học chuẩn xác y học, bao gồm các cơ bắp tay và cẳng tay
 *  - Chiều cao mô hình vừa khít 100% cửa sổ canvas
 *  - Rê chuột vào thẻ nhóm cơ là tự động xoay về hướng đó và phát sáng vàng kim rực rỡ
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// Bảng màu y khoa các hệ giải phẫu (Chuẩn xác như Hình 1)
const SYSTEMS_CONFIG = [
  { id: 'skeletal', color: '#EAE5DB', roughness: 0.32, metalness: 0.08 }, // Xương trắng ngà
  { id: 'muscular', color: '#B54D40', roughness: 0.46, metalness: 0.05 }, // Cơ bắp đỏ sinh học
  { id: 'connective', color: '#E2DDD5', roughness: 0.35, metalness: 0.06 }, // Gân và màng cân trắng
  { id: 'cardiac', color: '#B96760', roughness: 0.50, metalness: 0.05 },
  { id: 'arterial', color: '#C05245', roughness: 0.45, metalness: 0.06 },
  { id: 'venous', color: '#527C9F', roughness: 0.45, metalness: 0.06 },
  { id: 'nervous', color: '#D8B565', roughness: 0.40, metalness: 0.06 },
  { id: 'sensory', color: '#B0C8CE', roughness: 0.42, metalness: 0.05 }
];

// Các hệ giải phẫu hiển thị chuẩn Hình 1 (Cơ bắp + Khung xương + Gân màng liên kết)
const VISIBLE_SYSTEMS = new Set(['skeletal', 'muscular', 'connective', 'cardiac', 'sensory']);

// Bộ lọc định danh các nhóm cơ giải phẫu BodyParts3D tương ứng từng dịch vụ spa
const MUSCLE_CONCEPT_FILTERS = {
  // --- THÂN TRÊN (8 NHÓM) ---
  scm: p => {
    const n = p.name.toLowerCase();
    return n.includes('sternocleidomastoid') || n.includes('splenius') || n.includes('scalenus');
  },
  splenius: p => p.name.toLowerCase().includes('splenius') || p.name.toLowerCase().includes('capitis'),
  trapezius: p => p.name.toLowerCase().includes('trapezius') || p.name.toLowerCase().includes('levator scapulae'),
  rhomboids: p => p.name.toLowerCase().includes('rhomboid'),
  deltoids: p => p.name.toLowerCase().includes('deltoid'),
  rotator_cuff: p => {
    const n = p.name.toLowerCase();
    return n.includes('infraspinatus') || n.includes('supraspinatus') || n.includes('subscapularis') || n.includes('teres minor') || n.includes('teres major');
  },
  pectorals: p => p.name.toLowerCase().includes('pectoralis') || p.name.toLowerCase().includes('serratus anterior'),
  arm_biceps_triceps: p => {
    const n = p.name.toLowerCase();
    return n.includes('biceps brachii') || n.includes('triceps brachii') || n.includes('brachialis') || n.includes('coracobrachialis');
  },
  arm_forearm: p => {
    const n = p.name.toLowerCase();
    return n.includes('brachioradialis') || n.includes('pronator') || n.includes('flexor carpi') || n.includes('extensor carpi') || n.includes('supinator');
  },

  // --- THÂN DƯỚI (8 NHÓM: BỔ SUNG ĐẦY ĐỦ BẮP CHUỐI & MU BÀN CHÂN) ---
  quadratus_lumborum: p => {
    const n = p.name.toLowerCase();
    return n.includes('quadratus lumborum') || n.includes('iliocostalis lumborum') || n.includes('psoas');
  },
  erector_spinae: p => {
    const n = p.name.toLowerCase();
    return n.includes('longissimus') || n.includes('iliocostalis') || n.includes('spinalis') || n.includes('multifidus');
  },
  gluteals: p => p.name.toLowerCase().includes('gluteus') || p.name.toLowerCase().includes('tensor fasciae latae'),
  piriformis: p => {
    const n = p.name.toLowerCase();
    return n.includes('piriformis') || n.includes('obturator') || n.includes('gemellus') || n.includes('quadratus femoris');
  },
  quadriceps: p => {
    const n = p.name.toLowerCase();
    return n.includes('rectus femoris') || n.includes('vastus lateralis') || n.includes('vastus medialis') || n.includes('vastus intermedius') || n.includes('sartorius');
  },
  hamstrings_upper: p => {
    const n = p.name.toLowerCase();
    return n.includes('biceps femoris') || n.includes('semitendinosus') || n.includes('semimembranosus') || n.includes('gracilis');
  },
  calves: p => {
    const n = p.name.toLowerCase();
    return n.includes('gastrocnemius') || n.includes('soleus') || n.includes('plantaris') || n.includes('achilles');
  },
  shin_foot: p => {
    const n = p.name.toLowerCase();
    return n.includes('tibialis') || n.includes('fibularis') || n.includes('peroneus') || n.includes('extensor digitorum longus') || n.includes('extensor hallucis') || n.includes('foot') || n.includes('plantar');
  },

  // --- TOÀN THÂN (8 NHÓM TỔNG HỢP TOÀN DIỆN CẢ THÂN TRÊN & THÂN DƯỚI) ---
  full_neck_head: p => {
    const n = p.name.toLowerCase();
    return n.includes('sternocleidomastoid') || n.includes('splenius') || n.includes('trapezius') || n.includes('levator scapulae') || n.includes('capitis');
  },
  full_upper_back_chest: p => {
    const n = p.name.toLowerCase();
    return n.includes('rhomboid') || n.includes('pectoralis') || n.includes('deltoid') || n.includes('latissimus') || n.includes('infraspinatus') || n.includes('supraspinatus') || n.includes('subscapularis') || n.includes('teres') || n.includes('serratus');
  },
  full_arms_hands: p => {
    const n = p.name.toLowerCase();
    return n.includes('biceps brachii') || n.includes('triceps brachii') || n.includes('brachialis') || n.includes('brachioradialis') || n.includes('pronator') || n.includes('flexor carpi') || n.includes('extensor carpi');
  },
  full_lower_back: p => {
    const n = p.name.toLowerCase();
    return n.includes('quadratus lumborum') || n.includes('iliocostalis') || n.includes('longissimus') || n.includes('spinalis') || n.includes('psoas');
  },
  full_glutes_hip: p => {
    const n = p.name.toLowerCase();
    return n.includes('gluteus') || n.includes('piriformis') || n.includes('tensor fasciae');
  },
  full_thighs: p => {
    const n = p.name.toLowerCase();
    return n.includes('rectus femoris') || n.includes('vastus') || n.includes('biceps femoris') || n.includes('semitendinosus') || n.includes('semimembranosus') || n.includes('sartorius');
  },
  full_calves: p => {
    const n = p.name.toLowerCase();
    return n.includes('gastrocnemius') || n.includes('soleus') || n.includes('plantaris') || n.includes('achilles');
  },
  full_feet: p => {
    const n = p.name.toLowerCase();
    return n.includes('tibialis') || n.includes('fibularis') || n.includes('peroneus') || n.includes('extensor digitorum longus') || n.includes('extensor hallucis') || n.includes('foot') || n.includes('plantar');
  }
};

// State toàn cục của Atlas Viewer
let renderer = null;
let scene = null;
let camera = null;
let controls = null;
let startTime = performance.now();
let animId = null;

let atlasCatalog = null;
let isLoaded = false;
let isLoading = false;

// GPU Data Textures điều khiển hiển thị và phát sáng cơ bắp
let textureWidth = 0;
let partVisibilityData = null;
let partSelectedData = null;
let partPackageData = null;
let partVisibilityTexture = null;
let partSelectedTexture = null;
let partPackageTexture = null;

let systemMaterials = new Map();
let activePackageKey = 'upper';
let currentFocusedMuscleId = null;

// Điều khiển xoay mượt mà khi rê chuột vào thẻ cơ
let targetAzimuthAngle = null;

/**
 * Giải nén stream gzip nhị phân trực tiếp bằng Web API
 */
async function decodeModelPayload(response) {
  if (!response.ok) throw new Error('Không thể tải file dữ liệu giải phẫu');
  const payload = await response.arrayBuffer();
  const signature = new Uint8Array(payload, 0, Math.min(2, payload.byteLength));
  const isGzip = signature[0] === 0x1f && signature[1] === 0x8b;
  if (isGzip && typeof DecompressionStream !== 'undefined') {
    const ds = new DecompressionStream('gzip');
    const stream = new Response(new Blob([payload]).stream().pipeThrough(ds));
    return await stream.arrayBuffer();
  }
  return payload;
}

/**
 * Điều khiển giao diện Spinner Loading cho Mô hình 3D
 */
function updateLoadingUI(percent, text) {
  const overlay = document.getElementById('atlasLoadingOverlay');
  const bar = document.getElementById('atlasLoadingBar');
  const txt = document.getElementById('atlasLoadingText');
  if (overlay && overlay.classList.contains('hidden')) {
    overlay.classList.remove('hidden');
  }
  if (bar) bar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
  if (txt && text) txt.textContent = text;
}

function hideLoadingUI() {
  const overlay = document.getElementById('atlasLoadingOverlay');
  if (overlay) {
    overlay.classList.add('hidden');
  }
}

/**
 * Preload mô hình 3D trong nền
 */
export function preloadAtlasViewer() {
  if (!isLoaded && !isLoading) {
    initAtlasViewer();
  }
}

/**
 * Khởi tạo Viewer 3D Human Atlas
 */
export async function initAtlasViewer() {
  const container = document.getElementById('atlasCanvasContainer');
  const canvas = document.getElementById('atlasCanvas');
  if (!container || !canvas) return;

  if (renderer) {
    if (isLoaded) {
      hideLoadingUI();
    }
    fitCameraToWindow(true);
    return;
  }

  startTime = performance.now();
  scene = new THREE.Scene();

  const width = container.clientWidth || 450;
  const height = container.clientHeight || 650;

  // Camera FOV 32 độ giúp tỷ lệ cơ thể người chuẩn xác giải phẫu y học
  camera = new THREE.PerspectiveCamera(32, width / height, 0.05, 50);

  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance'
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0xFFFFFF, 1.0); // Tone màu trắng tinh khiết chuẩn phòng khám y khoa
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  // Ánh sáng môi trường mềm mại
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const env = pmrem.fromScene(room, 0.04);
  scene.environment = env.texture;
  room.dispose();
  pmrem.dispose();

  scene.add(new THREE.HemisphereLight(0xFFFFFF, 0xA8ACB2, 1.1));

  // Ánh sáng chiếu chính (Key light) tạo khối cơ bắp
  const keyLight = new THREE.DirectionalLight(0xFFFAF2, 2.2);
  keyLight.position.set(2.5, 4.0, 3.5);
  scene.add(keyLight);

  // Ánh sáng ngược (Rim light) làm nổi thớ cơ và đường viền giải phẫu
  const rimLight = new THREE.DirectionalLight(0xEAF2FF, 1.6);
  rimLight.position.set(-2.5, 3.0, -3.5);
  scene.add(rimLight);

  // Ánh sáng nền mặt trước
  const frontFill = new THREE.DirectionalLight(0xFFFFFF, 0.9);
  frontFill.position.set(0, 0.865, 4.0);
  scene.add(frontFill);

  // Bộ điều khiển xoay 360°, kéo và cuộn
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.865, 0); // Tâm cơ thể người ngang tầm ngực/bụng
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 1.0;
  controls.maxDistance = 5.5;
  controls.maxPolarAngle = Math.PI * 0.90;
  controls.minPolarAngle = Math.PI * 0.10;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.6; // Tăng tốc độ tự động xoay 360° nhanh hơn và sống động hơn

  controls.addEventListener('start', () => {
    targetAzimuthAngle = null;
  });
  // Khi thả tay/thả chuột sau khi xoay hoặc zoom in-out, mô hình vẫn tiếp tục tự xoay từ vị trí đó
  controls.addEventListener('end', () => {
    controls.autoRotate = true;
  });

  // MẶC ĐỊNH ĐẶT CAMERA Ở GÓC NHÌN CHÍNH DIỆN NGANG TẦM MẮT (FRONT & STRAIGHT)
  fitCameraToWindow(true);

  // Khởi tạo vòng lặp Animation
  startAnimationLoop();

  // Tải dữ liệu giải phẫu BodyParts3D từ thư mục local public/models
  await loadBodyParts3DData();

  // Quan sát thay đổi kích thước container để luôn vừa khít
  const ro = new ResizeObserver(() => {
    fitCameraToWindow(false);
  });
  ro.observe(container);
}

/**
 * Căn chỉnh camera sao cho toàn bộ chiều cao của mô hình (từ đỉnh đầu đến gót chân)
 * bằng vừa đúng chiều cao của cửa sổ canvas, góc nhìn thẳng chính diện ngang tầm mắt (Front view)
 */
export function fitCameraToWindow(forceResetFront = false) {
  const container = document.getElementById('atlasCanvasContainer');
  if (!container || !renderer || !camera || !controls) return;

  const w = container.clientWidth;
  const h = container.clientHeight;
  if (w === 0 || h === 0) return;

  const aspect = w / h;
  camera.aspect = aspect;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);

  // Chiều cao mô hình BodyParts3D là 1.73m (từ y=0.00 đến y=1.730, tâm y=0.865)
  const targetY = 0.865;
  controls.target.set(0, targetY, 0);

  // Tính khoảng cách camera để toàn bộ cơ thể người từ đỉnh đầu đến chân vừa đúng chiều cao khung nhìn
  const halfFovRad = THREE.MathUtils.degToRad(camera.fov / 2);
  const verticalFitDist = (1.73 / 2) / Math.tan(halfFovRad) * 1.05;
  const horizontalFitDist = (0.68 / 2) / (aspect * Math.tan(halfFovRad)) * 1.05;
  const fitDist = Math.max(verticalFitDist, horizontalFitDist);

  if (forceResetFront) {
    // MẶC ĐỊNH CHÍNH DIỆN THẲNG NGANG (FRONT VIEW, CAMERA Y BẰNG TARGET Y)
    camera.position.set(0, targetY, fitDist);
    targetAzimuthAngle = null;
    controls.autoRotate = true;
  } else {
    // Giữ nguyên góc xoay hiện tại nhưng khóa camera.y ở mặt phẳng ngang thẳng đứng
    const currentAzimuth = controls.getAzimuthalAngle();
    camera.position.x = Math.sin(currentAzimuth) * fitDist;
    camera.position.y = targetY; // Giữ thăng bằng ngang tầm ngực, không bị chúc từ dưới lên
    camera.position.z = Math.cos(currentAzimuth) * fitDist;
  }

  camera.lookAt(controls.target);
  controls.update();
}

/**
 * Tải và lắp ráp dữ liệu giải phẫu BodyParts3D
 */
async function loadBodyParts3DData() {
  if (isLoaded || isLoading) return;
  isLoading = true;

  updateLoadingUI(5, 'Đang chuẩn bị mô hình 3D...');

  try {
    const catalogRes = await fetch('/models/atlas.json');
    if (!catalogRes.ok) throw new Error('Không thể tải danh mục atlas.json');
    atlasCatalog = await catalogRes.json();

    const partsCount = atlasCatalog.parts.length;
    textureWidth = THREE.MathUtils.ceilPowerOfTwo(partsCount);

    // Chuẩn bị các Data Texture điều khiển shader
    partVisibilityData = new Float32Array(textureWidth * 4);
    partSelectedData = new Uint8Array(textureWidth * 4);
    partPackageData = new Uint8Array(textureWidth * 4);

    partVisibilityTexture = new THREE.DataTexture(partVisibilityData, textureWidth, 1, THREE.RGBAFormat, THREE.FloatType);
    partSelectedTexture = new THREE.DataTexture(partSelectedData, textureWidth, 1);
    partPackageTexture = new THREE.DataTexture(partPackageData, textureWidth, 1);

    partVisibilityTexture.minFilter = THREE.NearestFilter;
    partVisibilityTexture.magFilter = THREE.NearestFilter;
    partSelectedTexture.minFilter = THREE.NearestFilter;
    partSelectedTexture.magFilter = THREE.NearestFilter;
    partPackageTexture.minFilter = THREE.NearestFilter;
    partPackageTexture.magFilter = THREE.NearestFilter;

    partVisibilityTexture.needsUpdate = true;
    partSelectedTexture.needsUpdate = true;
    partPackageTexture.needsUpdate = true;

    // Khởi tạo vật liệu shader chuyên dụng cho từng hệ giải phẫu
    SYSTEMS_CONFIG.forEach(sys => {
      systemMaterials.set(sys.id, createSystemMaterial(sys));
    });

    updateLoadingUI(15, 'Đang nạp dữ liệu giải phẫu...');

    // Tải song song các phân đoạn nhị phân .bin.gz từ local
    let cursor = 0;
    let completedChunks = 0;
    const totalChunks = atlasCatalog.chunks.length;
    const workerCount = 4;
    await Promise.all(
      Array.from({ length: workerCount }, async () => {
        while (cursor < atlasCatalog.chunks.length) {
          const chunkIdx = cursor++;
          await loadChunkGeometry(chunkIdx);
          completedChunks++;
          const percent = Math.min(95, 15 + Math.round((completedChunks / totalChunks) * 80));
          updateLoadingUI(percent, `Đang tải mô hình 3D... ${percent}%`);
        }
      })
    );

    isLoaded = true;
    isLoading = false;

    // Cập nhật trạng thái hiển thị của gói hiện tại & căn chỉnh camera
    updateActivePackageHighlight(activePackageKey);
    fitCameraToWindow(true);

    updateLoadingUI(100, 'Hoàn tất mô hình 3D');
    setTimeout(() => {
      hideLoadingUI();
    }, 280);
  } catch (err) {
    console.error('Lỗi khi tải dữ liệu giải phẫu BodyParts3D:', err);
    isLoading = false;
    hideLoadingUI();
  }
}

/**
 * Tạo vật liệu PBR shader thông minh bảo tồn ánh sáng và hỗ trợ phát sáng dải cơ
 */
function createSystemMaterial(sysConfig) {
  const mat = new THREE.MeshStandardMaterial({
    color: sysConfig.color,
    roughness: sysConfig.roughness,
    metalness: sysConfig.metalness,
    side: THREE.DoubleSide
  });

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.partState = { value: partVisibilityTexture };
    shader.uniforms.selectionState = { value: partSelectedTexture };
    shader.uniforms.packageState = { value: partPackageTexture };
    shader.uniforms.stateWidth = { value: textureWidth };
    shader.uniforms.uTime = { value: 0 };

    shader.vertexShader = `
      attribute float partIndex;
      uniform sampler2D partState;
      uniform sampler2D selectionState;
      uniform sampler2D packageState;
      uniform float stateWidth;
      varying float vPartVisible;
      varying float vPartSelected;
      varying float vPartInPackage;
      ${shader.vertexShader}
    `;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      vec2 stateUv = vec2((partIndex + 0.5) / stateWidth, 0.5);
      vec4 state = texture2D(partState, stateUv);
      vPartVisible = state.w;
      vPartSelected = texture2D(selectionState, stateUv).r;
      vPartInPackage = texture2D(packageState, stateUv).r;
      `
    );

    shader.fragmentShader = `
      uniform float uTime;
      varying float vPartVisible;
      varying float vPartSelected;
      varying float vPartInPackage;
      ${shader.fragmentShader}
    `;

    // Ẩn các bộ phận không thuộc hệ hiển thị
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <clipping_planes_fragment>',
      `
      #include <clipping_planes_fragment>
      if (vPartVisible < 0.5) discard;
      `
    );

    // Tô màu sắc tố cho nhóm cơ gói (Vàng Kim) và nhóm cơ hover (Xanh Neon Ngọc Lam)
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `
      #include <color_fragment>
      if (vPartSelected > 0.5) {
        // Xanh ngọc lam neon (Electric Cyan) rực sáng nổi bật hơn hẳn màu vàng
        float pulse = 0.85 + 0.25 * sin(uTime * 6.5);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.0, 0.94, 1.0) * pulse, 0.96);
      } else if (vPartInPackage > 0.5) {
        // Màu vàng kim (Golden Yellow) chuẩn xác cho các nhóm cơ của gói đang xem
        float pulse = 0.92 + 0.12 * sin(uTime * 3.0);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.98, 0.78, 0.18) * pulse, 0.88);
      }
      `
    );

    // Hiệu ứng phát quang dải cơ (Emissive Radiance) tăng tối đa độ tương phản
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      `
      #include <emissivemap_fragment>
      if (vPartSelected > 0.5) {
        float pulse = 0.85 + 0.25 * sin(uTime * 6.5);
        totalEmissiveRadiance += vec3(0.0, 0.88, 1.0) * 1.5 * pulse;
      } else if (vPartInPackage > 0.5) {
        totalEmissiveRadiance += vec3(0.85, 0.65, 0.10) * 0.35;
      }
      `
    );

    mat.userData.shader = shader;
  };

  return mat;
}

/**
 * Tải 1 chunk nhị phân và lắp ghép BufferGeometry
 */
async function loadChunkGeometry(chunkIdx) {
  const chunk = atlasCatalog.chunks[chunkIdx];
  const response = await fetch(chunk.gzip || chunk.url);
  const buffer = await decodeModelPayload(response);

  const groupsBySystem = new Map();

  atlasCatalog.parts.forEach((part, partIdx) => {
    if (part.chunk !== chunkIdx) return;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(buffer, part.positions, part.vertexCount * 3), 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(new Int16Array(buffer, part.normals, part.vertexCount * 3), 3, true));
    geo.setIndex(new THREE.BufferAttribute(new Uint32Array(buffer, part.indices, part.indexCount), 1));
    geo.setAttribute('partIndex', new THREE.BufferAttribute(new Float32Array(part.vertexCount).fill(partIdx), 1));

    const list = groupsBySystem.get(part.system) || [];
    list.push(geo);
    groupsBySystem.set(part.system, list);
  });

  groupsBySystem.forEach((geos, systemId) => {
    const merged = mergeGeometries(geos, false);
    if (!merged) return;

    const mat = systemMaterials.get(systemId) || systemMaterials.get('muscular');
    const mesh = new THREE.Mesh(merged, mat);
    mesh.frustumCulled = false;
    scene.add(mesh);
  });
}

/**
 * Vòng lặp Render & Tự động xoay 360° theo trục thẳng đứng
 */
function startAnimationLoop() {
  if (animId) return;

  function render() {
    animId = requestAnimationFrame(render);
    if (!renderer || !scene || !camera || !controls) return;

    const time = (performance.now() - startTime) * 0.001;

    // Cập nhật uniform thời gian cho hiệu ứng nhịp thở phát sáng
    systemMaterials.forEach(mat => {
      if (mat.userData.shader) {
        mat.userData.shader.uniforms.uTime.value = time;
      }
    });

    // Tự động xoay 360° liên tục không ngừng nghỉ
    controls.update();

    renderer.render(scene, camera);
  }

  render();
}

/**
 * Kích hoạt highlight nhóm cơ theo gói trị liệu được chọn
 */
export function updateActivePackageHighlight(pkgKey) {
  activePackageKey = pkgKey;
  if (!atlasCatalog || !partVisibilityData) return;

  // Lấy danh sách các nhóm cơ của gói
  const activeMuscleIds = getActiveMuscleIdsForPackage(pkgKey);

  // Đánh dấu các bộ phận hiển thị và thuộc gói
  atlasCatalog.parts.forEach((p, idx) => {
    const isVisible = VISIBLE_SYSTEMS.has(p.system);
    partVisibilityData[idx * 4 + 3] = isVisible ? 1.0 : 0.0;

    // Kiểm tra xem bộ phận có thuộc dải cơ của gói không
    let inPackage = false;
    for (const mId of activeMuscleIds) {
      const filter = MUSCLE_CONCEPT_FILTERS[mId];
      if (filter && filter(p)) {
        inPackage = true;
        break;
      }
    }

    partPackageData[idx * 4] = inPackage ? 255 : 0;
    partSelectedData[idx * 4] = 0; // Xóa hover cũ
  });

  partVisibilityTexture.needsUpdate = true;
  partPackageTexture.needsUpdate = true;
  partSelectedTexture.needsUpdate = true;

  // Trả về tự động xoay nhẹ nhàng
  if (controls) {
    controls.autoRotate = true;
  }
}

/**
 * Chiếu sáng xanh neon 1 nhóm cơ cụ thể khi rê chuột vào thẻ cơ, mô hình vẫn tiếp tục xoay 360°
 */
export function highlightMuscleOnHover(muscleId) {
  currentFocusedMuscleId = muscleId;
  if (!atlasCatalog || !partSelectedData) return;

  const filter = MUSCLE_CONCEPT_FILTERS[muscleId];

  atlasCatalog.parts.forEach((p, idx) => {
    const isMatched = filter ? filter(p) : false;
    partSelectedData[idx * 4] = isMatched ? 255 : 0;
  });

  partSelectedTexture.needsUpdate = true;

  // Mô hình vẫn xoay tiếp không ngừng lại khi rê chuột
  if (controls) {
    controls.autoRotate = true;
  }
}

/**
 * Xóa trạng thái hover, trở về màu của gói, tiếp tục xoay
 */
export function resetMuscleHover() {
  currentFocusedMuscleId = null;
  if (!atlasCatalog || !partSelectedData) return;

  atlasCatalog.parts.forEach((p, idx) => {
    partSelectedData[idx * 4] = 0;
  });

  partSelectedTexture.needsUpdate = true;

  if (controls) {
    controls.autoRotate = true;
  }
}

function getActiveMuscleIdsForPackage(pkgKey) {
  if (pkgKey === 'upper') {
    return ['scm', 'splenius', 'trapezius', 'rhomboids', 'rotator_cuff', 'deltoids', 'pectorals', 'arm_biceps_triceps', 'arm_forearm'];
  } else if (pkgKey === 'lower') {
    return ['quadratus_lumborum', 'erector_spinae', 'gluteals', 'piriformis', 'quadriceps', 'hamstrings_upper', 'calves', 'shin_foot'];
  } else {
    // Toàn thân (90p): Highlight đồng thời cả Thân Trên và Thân Dưới (bao phủ 100% toàn bộ cơ thể)
    return [
      'full_neck_head', 'full_upper_back_chest', 'full_arms_hands',
      'full_lower_back', 'full_glutes_hip', 'full_thighs', 'full_calves', 'full_feet',
      'scm', 'splenius', 'trapezius', 'rhomboids', 'rotator_cuff', 'deltoids', 'pectorals', 'arm_biceps_triceps', 'arm_forearm',
      'quadratus_lumborum', 'erector_spinae', 'gluteals', 'piriformis', 'quadriceps', 'hamstrings_upper', 'calves', 'shin_foot'
    ];
  }
}
