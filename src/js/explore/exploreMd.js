document.addEventListener("DOMContentLoaded", () => {
  const exploreBtn = document.getElementById("btn-explore");
  const modal = document.getElementById("explore-modal");
  const closeBtn = document.getElementById("close-explore-modal");
  const mdContent = document.getElementById("md-content");

  // 打开 Markdown 面板
  exploreBtn.addEventListener("click", async () => {
    const currentPlanet = window.ExploreApp?.currentPlanet;
    if (!currentPlanet) return;

    // 添加模糊滤镜背景特效
    document.getElementById("planet-canvas-container").style.filter =
      "blur(10px)";
    modal.classList.add("show");

    // 构造对应的 md 路径 (例如根据 planet id)
    // 你可以在 json 里指定 "mdFile": "planets/S/markdown/s01.md"
    const mdPath =
      currentPlanet.mdFile ||
      `../planets/${currentPlanet.galaxySystem}/markdown/${currentPlanet.id}.md`;

    try {
      const res = await fetch(mdPath);
      if (!res.ok) throw new Error("文稿尚未归档");
      const text = await res.text();

      // 简单的 markdown 渲染 (去除 YAML 头部)
      const cleanText = text.replace(/^---[\s\S]*?---\n/, "");
      mdContent.innerHTML = marked.parse(cleanText);
    } catch (err) {
      mdContent.innerHTML = `<h3 style="text-align:center; margin-top:50px;">📡 <br> 传输失败<br><span style="font-size:1rem; color:#888;">${err.message}</span></h3>`;
    }
  });

  // 关闭 面板
  closeBtn.addEventListener("click", () => {
    modal.classList.remove("show");
    document.getElementById("planet-canvas-container").style.filter = "none";
  });
});
