// src/js/me/app.js

// ==========================================================================
// Om Nom 果冻弹性点击引擎
// ==========================================================================
const myPet = document.getElementById("my-pet");

if (myPet) {
  let clickStartTime = 0;
  const MIN_CLICK_DURATION = 100; // 🚀 强制最少放大维持 120 毫秒，确保肉眼捕捉到最大暴弹态
  let releaseTimeout = null;

  // 释放点击状态的统一函数
  const releaseClick = () => {
    const currentTime = Date.now();
    const elapsedTime = currentTime - clickStartTime;

    // 如果用户松开太快，计算还差多少毫秒满 120 毫秒，用定时器补齐
    if (elapsedTime < MIN_CLICK_DURATION) {
      const remainingTime = MIN_CLICK_DURATION - elapsedTime;

      // 防止重复创建定时器
      if (!releaseTimeout) {
        releaseTimeout = setTimeout(() => {
          myPet.classList.remove("is-clicking");
          releaseTimeout = null;
        }, remainingTime);
      }
    } else {
      // 如果按住的时间本来就很长，松开时立刻回弹
      myPet.classList.remove("is-clicking");
    }
  };

  // 1. 鼠标按下：记录起始时间
  myPet.addEventListener("mousedown", () => {
    // 每次按下前，清理掉上一次可能还没跑完的定时器安全锁
    if (releaseTimeout) {
      clearTimeout(releaseTimeout);
      releaseTimeout = null;
    }

    clickStartTime = Date.now();
    myPet.classList.add("is-clicking");
  });

  // 2. 鼠标松开：交由时间锁函数判定回弹时机
  myPet.addEventListener("mouseup", releaseClick);

  // 3. 鼠标移出：交由时间锁函数判定，防止大图卡死
  myPet.addEventListener("mouseleave", releaseClick);
}
