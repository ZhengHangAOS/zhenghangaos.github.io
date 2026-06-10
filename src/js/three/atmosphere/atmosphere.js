const atmosphereGeo = new THREE.SphereGeometry(4.6, 60, 60);
const atmosphereMat = new THREE.ShaderMaterial({
  vertexShader: `
        varying vec3 vNormal;
        void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
  fragmentShader: `
        varying vec3 vNormal;
        void main() {
            // 恢复为最初的光环衰减算法
            float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 3.5);
            gl_FragColor = vec4(0.5, 0.5, 0.5, 0.8) * intensity;
        }
    `,
  blending: THREE.AdditiveBlending,
  side: THREE.BackSide,
  transparent: true,
  depthWrite: false,
});

export const atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat);
