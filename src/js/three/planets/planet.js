// ==========================================================================
// 1. 骨架与空间层级定义 (Layering Architecture)
// ==========================================================================

// 负责整体地轴倾斜的基座组 (21.5° 倾斜)
export const tiltGroup = new THREE.Group();
tiltGroup.rotation.z = (21.5 * Math.PI) / 180;

// 【核心交互层】鼠标拖拽转动的组。
// 因为卫星和星球系统都在它里面，所以鼠标转动星球时，卫星会优雅地同步公转！
export const interactionGroup = new THREE.Group();
tiltGroup.add(interactionGroup);

// 【星球自转层】专门用来负责基础自转和 Landing 狂飙。
// 把它和鼠标拖拽隔离，防止 Landing 动画乱滚，且独立自转不会拉着卫星一起转！
export const planetSystem = new THREE.Group();
interactionGroup.add(planetSystem);

// ==========================================================================
// 2. 主行星系统 (Main Planet)
// ==========================================================================

// --- 星球核心 ---
const coreGeo = new THREE.SphereGeometry(4, 64, 64);
const textureLoader = new THREE.TextureLoader();
// 💡 天王星贴图路径
const planetTexture = textureLoader.load(
  "public/textures/hero/hat_p_12b_01.jpeg",
);

const coreMat = new THREE.MeshStandardMaterial({
  map: planetTexture,
  roughness: 0.8,
  metalness: 0.1,
});

export const planetCore = new THREE.Mesh(coreGeo, coreMat);
planetSystem.add(planetCore); // 放入纯净的 planetSystem

// 行星阴影
// ✨行星产生阴影
planetCore.castShadow = true;
// 行星也接收卫星的阴影，不过卫星很小可以不加
planetCore.receiveShadow = true;
planetSystem.add(planetCore);

// ==========================================
// 2.5 星环 (Textured Ring System)
// ==========================================

// 1. 创建星环几何体（内径 6.5，外径 7.5）
const ringGeo = new THREE.RingGeometry(6.5, 7.5, 64);

// 2. 加载星环条纹贴图
const ringTexture = textureLoader.load("public/textures/hero/ring02.png");

// 3. 映射优化：将直线丝带图拉伸扭曲为完美同心圆
const pos = ringGeo.attributes.position;
const v3 = new THREE.Vector3();
for (let i = 0; i < pos.count; i++) {
  v3.fromBufferAttribute(pos, i);
  const radius = v3.length();
  const u = (radius - 6.5) / (7.5 - 6.5); // 修正错位，完美对齐 6.5 内径
  ringGeo.attributes.uv.setXY(i, u, 0);
}

// 4. 配置高质感材质
const ringMat = new THREE.MeshStandardMaterial({
  color: 0xf0ffff, // 材质基础反射暗色
  emissive: 0xd4f2e7, // ✨ 自发光颜色
  emissiveIntensity: 0.2, // 🛠️ 亮度开关：觉得淡可调高至 1.5，刺眼可调低

  alphaMap: ringTexture, // ✨ 仅让贴图控制条纹的镂空与疏密
  transparent: true, // 开启透明支持
  opacity: 1.0, // 整体不透明度上限

  side: THREE.DoubleSide, // 双面渲染
  shadowSide: THREE.DoubleSide, // 保证实时阴影也带有精致的条纹镂空
  roughness: 0.4,
  metalness: 0.1,
});

const ring = new THREE.Mesh(ringGeo, ringMat);
ring.rotation.x = Math.PI / 2; // 星环躺平匹配赤道
ring.castShadow = true; // 将星环自身的条纹影子投在行星表面
ring.receiveShadow = true; // 接收行星投过来的巨大黑影

planetSystem.add(ring); // 塞入内层自转加速组

// ==========================================================================
// 3. 卫星系统 (Satellite System)
// ==========================================================================

export const satelliteSystem = new THREE.Group();
// 【参数】轨道平面倾角：卫星轨道和星球赤道的上下夹角
satelliteSystem.rotation.x = (15 * Math.PI) / 180;
// 【参数】轨道偏航角：改变椭圆轨道的长轴朝向
satelliteSystem.rotation.y = (-20 * Math.PI) / 180;
interactionGroup.add(satelliteSystem); // ✨ 重点：放入交互层，共享鼠标搓拽，但不参与星球自转

// --- 卫星轨道线 (细椭圆) ---
const orbitA = 6.0; // 长半轴
const orbitB = 6.0; // 短半轴

export const orbitCurve = new THREE.EllipseCurve(
  0,
  0,
  orbitA,
  orbitB,
  0,
  2 * Math.PI,
  false,
  0,
);
const orbitPoints = orbitCurve.getPoints(120);
const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
const orbitMat = new THREE.LineBasicMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.3,
});
const orbitLine = new THREE.Line(orbitGeo, orbitMat);
orbitLine.rotation.x = Math.PI / 2; // 将椭圆平放
satelliteSystem.add(orbitLine);

// --- 卫星实体 ---
const satGeo = new THREE.SphereGeometry(0.3, 32, 32);
const satTex = textureLoader.load("public/textures/hero/ice_planet.jpeg");
const satMat = new THREE.MeshStandardMaterial({
  map: satTex,
  roughness: 0.9,
  metalness: 0.1,
});
export const satelliteMesh = new THREE.Mesh(satGeo, satMat);
satelliteSystem.add(satelliteMesh);

// 卫星阴影
// ✨卫星接收阴影
satelliteMesh.receiveShadow = true;
// ✨卫星产生阴影
satelliteMesh.castShadow = true;
satelliteSystem.add(satelliteMesh);
