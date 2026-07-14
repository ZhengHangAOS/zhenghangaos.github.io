const starsGeo = new THREE.BufferGeometry();
const starsCount = 3500; // 星星数量
const posArray = new Float32Array(starsCount * 3);

// 新增一个颜色数组，跟位置一一对应 (RGB)
const colorsArray = new Float32Array(starsCount * 3);

// 让星星分布在非常遥远的空间（不喧宾夺主）
// 让星星分布在遥远的空心球壳上，彻底避开行星和相机之间
for (let i = 0; i < starsCount; i++) {
  // 1. 随机一个方向（球面上的一点）
  const u = Math.random();
  const v = Math.random();
  const theta = u * 2.0 * Math.PI;
  const phi = Math.acos(2.0 * v - 1.0);

  // 2. 🛠️ 控制星星的物理范围：只出现在距离球心 25 到 100 的遥远外壳（行星半径才4，安全区极大）
  const minRadius = 25;
  const maxRadius = 100;
  const radius = minRadius + Math.random() * (maxRadius - minRadius);

  // 3. 将球面坐标转化为 3D 的 XYZ 坐标
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi) * Math.sin(theta);
  const z = radius * Math.cos(phi);

  // 填入位置数组
  posArray[i * 3] = x;
  posArray[i * 3 + 1] = y;
  posArray[i * 3 + 2] = z;

  // 1. 星星色调比例
  const r = 0.8 + Math.random() * 0.1;
  const g = 0.8 + Math.random() * 0.2;
  const b = 0.9 + Math.random() * 0.2;

  // 2. ✨【生成一个 0.2 到 1.0 之间的随机亮度系数
  const brightness = 0.2 + Math.random() * 0.8;

  // 3. 将亮度系数完美融入 RGB，直接改变星点的基础明暗
  colorsArray[i * 3] = r * brightness; // 乘以亮度
  colorsArray[i * 3 + 1] = g * brightness;
  colorsArray[i * 3 + 2] = b * brightness;
}

starsGeo.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
starsGeo.setAttribute("color", new THREE.BufferAttribute(colorsArray, 3)); // ✨ 把颜色存入

const starsMat = new THREE.PointsMaterial({
  size: 0.18,
  vertexColors: true,
  transparent: true,
  opacity: 0.8,
  sizeAttenuation: true, // 开启透视大小衰减
});

// 导出背景星星
export const particlesMesh = new THREE.Points(starsGeo, starsMat);
