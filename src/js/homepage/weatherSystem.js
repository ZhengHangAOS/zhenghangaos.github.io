// 定义天气大字典
const weatherDict = [
  // 1. 日夜区分
  {
    type: "Sunny",
    name: "晴天",
    tDay: 24,
    tNight: 15,
    imgDay: "clear-day.png",
    imgNight: "clear-night.png",
    effect: "clear",
  },
  {
    type: "Cloudy",
    name: "多云",
    tDay: 22,
    tNight: 18,
    imgDay: "pcloudy-day.png",
    imgNight: "pcloudy-night.png",
    effect: "bottomClouds",
  },
  {
    type: "Fog",
    name: "大雾",
    tDay: 24,
    tNight: 18,
    imgDay: "fog-day.png",
    imgNight: "fog-night.png",
    effect: "fog",
  },
  {
    type: "Hail",
    name: "冰雹",
    tDay: 24,
    tNight: 15,
    imgDay: "hail-day.png",
    imgNight: "hail-night.png",
    effect: "hail",
  },
  {
    type: "Snow",
    name: "大雪",
    tDay: -10,
    tNight: -15,
    imgDay: "snow-day.png",
    imgNight: "snow-night.png",
    effect: "snow",
  },
  {
    type: "ThunderShower",
    name: "雷阵雨",
    tDay: 22,
    tNight: 18,
    imgDay: "tshower-day.png",
    imgNight: "tshower-night.png",
    effect: "rain",
  },
  {
    type: "Shower",
    name: "阵雨",
    tDay: 22,
    tNight: 18,
    imgDay: "showers-day.png",
    imgNight: "showers-night.png",
    effect: "rain",
  },
  // 2. 日夜共用一图
  {
    type: "Overcast",
    name: "阴天",
    tDay: 20,
    tNight: 18,
    img: "mcloudy.png",
    effect: "bottomCloudsGray",
  },
  {
    type: "Thunderstorm",
    name: "雷暴",
    tDay: 20,
    tNight: 15,
    img: "tstorm.png",
    effect: "heavyRain",
  },
  {
    type: "Rain",
    name: "中雨",
    tDay: 22,
    tNight: 18,
    img: "rain.png",
    effect: "heavyRain",
  },
  {
    type: "Sleet",
    name: "雨夹雪",
    tDay: -10,
    tNight: -15,
    img: "sleet-night.png",
    effect: "sleet",
  },
  {
    type: "Wind",
    name: "大风",
    tDay: 18,
    tNight: 10,
    img: "windy-day.png",
    effect: "wind",
  },
];

let weatherInterval;
let weatherAnimationFrameId; // 🔧 修复：独立出 RAF 的控制 ID，防止与 Interval 冲突导致无法销毁
let currentWeather = null;

// ==========================================
// 🚀 性能优化：标签页可见性与窗口焦点锁
// ==========================================
let isWeatherVisible = true;
let isTabVisible = true;
let isWindowFocused = true;
let currentActiveEffectFn = null; // 用于在切回窗口时自动无缝重启动画

function setupVisibilityListeners() {
  // 确保只挂载一次全局监听
  if (window.hasWeatherVisibilityListener) return;
  window.hasWeatherVisibilityListener = true;

  function updateWeatherVisibility() {
    const nextState = isTabVisible && isWindowFocused;
    if (nextState !== isWeatherVisible) {
      isWeatherVisible = nextState;
      if (isWeatherVisible) {
        // 从后台切回：如果当前有正在运行的天气动画，使其重新跑起来
        if (currentActiveEffectFn) currentActiveEffectFn();
      } else {
        // 切到后台/被别的窗口盖住：暂停 requestAnimationFrame 渲染
        if (weatherAnimationFrameId) {
          cancelAnimationFrame(weatherAnimationFrameId);
          weatherAnimationFrameId = null;
        }
      }
    }
  }

  window.addEventListener("visibilitychange", () => {
    isTabVisible = document.visibilityState === "visible";
    updateWeatherVisibility();
  });
  window.addEventListener("blur", () => {
    isWindowFocused = false;
    updateWeatherVisibility();
  });
  window.addEventListener("focus", () => {
    isWindowFocused = true;
    updateWeatherVisibility();
  });
}
// ==========================================

export function initWeatherSystem(isNight) {
  setupVisibilityListeners();

  if (!currentWeather) {
    currentWeather =
      weatherDict[Math.floor(Math.random() * weatherDict.length)];
  }

  // 完美清理：同时注销定时器和帧动画，防内存泄漏
  if (weatherInterval) clearInterval(weatherInterval);
  if (weatherAnimationFrameId) cancelAnimationFrame(weatherAnimationFrameId);
  currentActiveEffectFn = null;

  const ground = document.getElementById("weather-ground");
  ground.innerHTML = "";
  const canvas = document.getElementById("weather-bg-canvas");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const temp = isNight ? currentWeather.tNight : currentWeather.tDay;
  document.getElementById("weather-temp").textContent = `${temp}°`;
  document.getElementById("weather-desc").textContent = currentWeather.name;

  const iconFile =
    currentWeather.img ||
    (isNight ? currentWeather.imgNight : currentWeather.imgDay);
  document.getElementById("weather-icon").innerHTML = `
        <img src="public/images/weather/${iconFile}" class="weather-icon-img" alt="${currentWeather.name}">
    `;

  if (
    ["fog", "rain", "heavyRain", "bottomCloudsGray", "sleet"].includes(
      currentWeather.effect,
    )
  ) {
    document.body.style.setProperty(
      "--dynamic-bg",
      isNight ? "#171d38" : "#f0f0f0",
    );
  } else {
    document.body.style.removeProperty("--dynamic-bg");
  }

  executeEffect(currentWeather.effect, isNight, canvas, ctx);
}

function executeEffect(effect, isNight, canvas, ctx) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ground = document.getElementById("weather-ground");

  if (effect === "clear" && isNight) {
    drawStars(canvas, ctx);
  } else if (effect === "bottomClouds" || effect === "bottomCloudsGray") {
    ground.innerHTML = `<div class="bottom-cloud" style="opacity: ${effect === "bottomCloudsGray" ? 0.8 : 0.4}; background-image: url('public/bottom/bottom_cloud');"></div>`;
  } else if (effect === "rain" || effect === "heavyRain") {
    drawPrecipitation(
      canvas,
      ctx,
      effect === "heavyRain" ? 100 : 80,
      "rain",
      isNight,
    );

    weatherInterval = setInterval(
      () => {
        // 🚀 性能优化：当页面失去焦点或最小化时，阻断 DOM 树节点的生成和 append 开销
        if (!isWeatherVisible) return;

        const splash = document.createElement("div");
        splash.className = "splash-ring";
        splash.style.left = `${Math.random() * 100}vw`;
        ground.appendChild(splash);
        setTimeout(() => splash.remove(), 1000);
      },
      effect === "heavyRain" ? 150 : 400,
    );
  } else if (effect === "snow") {
    ground.innerHTML = `<div class="snow-bank"></div>`;
    drawPrecipitation(canvas, ctx, 80, "snow", isNight);
  } else if (effect === "sleet") {
    ground.innerHTML = `<div class="snow-bank" style="opacity:0.5"></div>`;
    drawPrecipitation(canvas, ctx, 40, "sleet", isNight);
  } else if (effect === "hail") {
    drawPrecipitation(canvas, ctx, 20, "hail", isNight);
  } else if (effect === "wind") {
    weatherInterval = setInterval(() => {
      // 🚀 性能优化：失去焦点时不生成落叶元素
      if (!isWeatherVisible) return;

      const leaf = document.createElement("div");
      leaf.className = "falling-leaf";
      leaf.style.backgroundImage = "url('public/bottom/leaf.png')";
      leaf.style.left = `${Math.random() * 100}vw`;
      leaf.style.animationDuration = `${Math.random() * 2 + 3}s`;
      document.body.appendChild(leaf);
      setTimeout(() => leaf.remove(), 5000);
    }, 500);
  }
}

function drawPrecipitation(canvas, ctx, count, type, isNight) {
  const particles = Array.from({ length: count }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    l: Math.random() * 1 + 1,
    xs: -3 + Math.random() * 2 + 2,
    ys: Math.random() * 5 + 10,
  }));

  function draw() {
    weatherAnimationFrameId = requestAnimationFrame(draw);

    // 🚀 性能优化：状态不满足时跳过当前帧的逻辑与 Canvas 清理绘制
    if (!isWeatherVisible) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      ctx.beginPath();
      if (type === "rain" || (type === "sleet" && Math.random() > 0.5)) {
        ctx.strokeStyle = isNight
          ? "rgba(248,251,252,0.1)"
          : "rgba(176, 196, 209, 0.3)";
        ctx.lineWidth = 1.0;
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.l * p.xs, p.y + p.l * p.ys * 2);
        ctx.stroke();
      } else if (type === "snow" || type === "sleet") {
        ctx.fillStyle = isNight
          ? "rgba(214,223,235,0.3)"
          : "rgba(97,146,211,0.3)";
        ctx.arc(p.x, p.y, p.l * 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (type === "hail") {
        ctx.fillStyle = isNight
          ? "rgba(160, 190, 230, 0.2)"
          : "rgba(97,146,211,0.5)";
        ctx.arc(p.x, p.y, p.l * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      p.x += p.xs;
      p.y += type === "snow" ? p.ys * 0.2 : p.ys;
      if (p.x > canvas.width || p.y > canvas.height) {
        p.x = Math.random() * canvas.width + 3;
        p.y = -20;
      }
    });
  }

  // 缓存当前绘制入口，供页面重新激活时无缝重启
  currentActiveEffectFn = draw;
  draw();
}

// stars
let starParticles = [];

function drawStars(canvas, ctx) {
  if (starParticles.length === 0) {
    const starColors = [
      "rgba(255, 255, 255,",
      "rgba(173, 216, 230,",
      "rgba(255, 223, 186,",
      "rgba(255, 192, 203,,",
    ];

    starParticles = Array.from({ length: 120 }, () => {
      const baseSize = Math.random() * 1.5 + 0.3;
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: baseSize,
        colorBase: starColors[Math.floor(Math.random() * starColors.length)],
        alpha: Math.random(),
        blinkSpeed: 0.01 + Math.random() * 0.02,
        xs: (Math.random() - 0.5) * 0.05,
        ys: (Math.random() - 0.5) * 0.05,
      };
    });
  }

  function animate() {
    weatherAnimationFrameId = requestAnimationFrame(animate);

    // 🚀 性能优化：失去焦点或被遮挡时跳过星星渲染
    if (!isWeatherVisible) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    starParticles.forEach((s) => {
      s.alpha += s.blinkSpeed;
      if (s.alpha > 1 || s.alpha < 0.1) {
        s.blinkSpeed = -s.blinkSpeed;
      }

      s.x += s.xs;
      s.y += s.ys;

      if (s.x < 0) s.x = canvas.width;
      if (s.x > canvas.width) s.x = 0;
      if (s.y < 0) s.y = canvas.height;
      if (s.y > canvas.height) s.y = 0;

      ctx.beginPath();
      ctx.fillStyle = `${s.colorBase}${s.alpha})`;
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  currentActiveEffectFn = animate;
  animate();
}
