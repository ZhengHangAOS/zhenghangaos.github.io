document.addEventListener("DOMContentLoaded", () => {
  const exploreBtn = document.getElementById("btn-explore");
  const modal = document.getElementById("explore-modal");
  const closeBtn = document.getElementById("close-explore-modal");
  const mdContent = document.getElementById("md-content");
  const body = document.body;

  exploreBtn.addEventListener("click", async () => {
    const currentPlanet = window.ExploreApp?.currentPlanet;
    if (!currentPlanet) return;

    body.classList.add("is-exploring");
    modal.classList.add("show");

    const mdPath = currentPlanet.mdFile || `${currentPlanet.markdown}`;

    try {
      const res = await fetch(mdPath);
      if (!res.ok) throw new Error("文稿尚未归档");
      let text = await res.text();

      /* =======================================
         🎯 改进 1：提取并居中 YAML 头部 Title
         ======================================= */
      let titleHtml = "";
      const yamlMatch = text.match(/^---([\s\S]*?)---/);
      if (yamlMatch) {
        const yamlContent = yamlMatch[1];
        // 匹配 title: 后面的内容，并去掉可能存在的引号
        const titleMatch = yamlContent.match(
          /title:\s*["']?([\s\S]*?)["']?(?:\r?\n|$)/,
        );
        if (titleMatch && titleMatch[1]) {
          titleHtml = `<h1 class="md-article-title">${titleMatch[1].trim()}</h1>`;
        }
        // 清除整个 YAML 头部
        text = text.replace(/^---[\s\S]*?---\n*/, "");
      }

      // 将提取出的标题与 marked 解析后的主体拼接
      mdContent.innerHTML = titleHtml + marked.parse(text);

      /* ==========================================================================
        新增改进 1.5：自动化清洗图片并注入图题（智能识别小图：支持后缀与 HTML 属性）
        ========================================================================== */
      let imgCounter = 1;

      mdContent.querySelectorAll("img").forEach((img) => {
        if (img.alt && img.alt.trim() !== "") {
          const nextEl = img.nextElementSibling;
          if (!nextEl || !nextEl.classList.contains("md-img-caption")) {
            const caption = document.createElement("span");
            caption.className = "md-img-caption";
            caption.innerText = `图 ${imgCounter}：${img.alt.trim()}`;
            imgCounter++;

            // 1. 获取可能用于判断小图的各种线索
            const imgSrc = img.getAttribute("src") || "";
            const imgWidthAttr = img.getAttribute("width") || ""; // 抓取 HTML 里的 width="48%"
            const imgStyle = img.getAttribute("style") || "";

            // 2. 只要满足以下任意一个条件，就认定它是小图，触发左右并排布局
            let isSmallImage = false;

            // 条件 A：URL 后缀带有 #w30 或 #w50
            if (imgSrc.includes("#w30") || imgSrc.includes("#w50")) {
              isSmallImage = true;
            }

            // 条件 B：HTML 属性写了 width，且数值小于等于 50 (例如 width="48%" 或 width="48")
            if (imgWidthAttr) {
              const widthValue = parseInt(imgWidthAttr, 10);
              if (!isNaN(widthValue) && widthValue <= 50) {
                isSmallImage = true;
              }
            }

            // 条件 C：在 style 里写了 width: 50% 等
            if (
              imgStyle.includes("width") &&
              (imgStyle.includes("30%") ||
                imgStyle.includes("40%") ||
                imgStyle.includes("50%"))
            ) {
              isSmallImage = true;
            }

            // 3. 根据诊断结果进行 DOM 编排
            if (isSmallImage) {
              // 🎯 触发弹性并排布局
              const wrapper = document.createElement("div");
              wrapper.className = "md-img-flex-container";

              img.parentNode.insertBefore(wrapper, img);
              wrapper.appendChild(img);
              wrapper.appendChild(caption);

              caption.classList.add("layout-side");
            } else {
              // 正常大图布局
              img.parentNode.insertBefore(caption, img.nextSibling);
            }
          }
        }
      });

      /* =======================================
         🎯 改进 2：触发 LaTeX 公式渲染 (以 KaTeX 为例)
         ======================================= */
      if (typeof renderMathInElement === "function") {
        renderMathInElement(mdContent, {
          delimiters: [
            { left: "$$", right: "$$", display: true }, // 块级公式
            { left: "$", right: "$", display: false }, // 行内公式
            { left: "\\(", right: "\\)", display: false },
            { left: "\\[", right: "\\]", display: true },
          ],
          throwOnError: false,
        });
      } else if (window.MathJax) {
        // 如果你使用的是 MathJax 3.x
        window.MathJax.typesetPromise([mdContent]);
      }
    } catch (err) {
      mdContent.innerHTML = `<h3 style="text-align:center; margin-top:50px;">📡 <br> 传输失败<br><span style="font-size:1rem; color:#888;">${err.message}</span></h3>`;
    }
  });

  /* ==========================================================================
     🎯 优化版关闭事件：轻装上阵，彻底解决回弹卡顿（在此处替换完成）
     ========================================================================== */
  closeBtn.addEventListener("click", () => {
    window.isTransitioning = true;

    body.classList.remove("is-exploring");
    modal.classList.remove("show");

    setTimeout(() => {
      mdContent.innerHTML = "";
    }, 600);
    setTimeout(() => {
      window.isTransitioning = false;
    }, 1000);
  });
});
