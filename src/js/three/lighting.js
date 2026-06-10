// 全局环境光（背景基础亮度）
export const ambientLight = new THREE.AmbientLight(0x112233, 0.5);

// 主光源（太阳）
export const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight.position.set(5, 4, 5);

// ✨开启主光源的阴影投射
directionalLight.castShadow = true;

// ✨配置阴影相机的范围（行星半径4，轨道是11，所以范围要包住整个系统）
directionalLight.shadow.camera.top = 15;
directionalLight.shadow.camera.bottom = -15;
directionalLight.shadow.camera.left = -15;
directionalLight.shadow.camera.right = 15;
directionalLight.shadow.camera.near = 0.1;
directionalLight.shadow.camera.far = 40;

// ✨阴影分辨率（数字越大边缘越细腻）
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;

// 反光
export const backLight = new THREE.DirectionalLight(0xfef5e2, 0.4);
backLight.position.set(-5, -4, -5);
