document.addEventListener("DOMContentLoaded", async () => {
  /* ==========================================================================
     2. 交互动效与动态资源加载
     ========================================================================== */

  // ---------------------------- 2.2 随机横幅渲染 ----------------------------
  const bannerNode = document.getElementById("banner");
  if (bannerNode) {
    fetch("/public/banner/banner.json")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((banners) => {
        if (banners?.length > 0) {
          const randomBanner =
            banners[Math.floor(Math.random() * banners.length)];
          bannerNode.style.backgroundImage = `url('${randomBanner}')`;
        }
      })
      .catch(() => {
        bannerNode.style.backgroundImage = "url('/public/banner/p02.jpg')";
      });
  }

  /* ==========================================================================
     3. 核心 MARKDOWN 解析引擎与页面编排
     ========================================================================== */

  // ---------------------------- 3.1 路由骨架校验 ----------------------------
  const path = new URLSearchParams(window.location.search).get("path");
  const mdContainer = document.getElementById("md-content");
  const postNavContainer = document.getElementById("post-nav");

  const isValidMd = path && path.toLowerCase().endsWith(".md");

  if (!isValidMd) {
    if (postNavContainer)
      postNavContainer.style.setProperty("display", "none", "important");
    if (mdContainer) {
      const errorDetail = !path
        ? "未提供有效的文章访问路径 (Missing Article Path)"
        : `请求的资源格式错误，系统无法解析非 Markdown 文件: <code>${path.split("/").pop()}</code>`;

      mdContainer.innerHTML = `
        <div class="error-card">
          <i class="fa-solid fa-file-circle-xmark error-icon"></i>
          <h2 class="error-title">无法加载该资源</h2>
          <p class="error-msg">${errorDetail}</p>
        </div>
      `;
    }
    return;
  }

  // ---------------------------- 3.2 异步解析流 ----------------------------
  try {
    const response = await fetch(path);
    if (!response.ok) {
      if (postNavContainer)
        postNavContainer.style.setProperty("display", "none", "important");
      throw new Error(`无法读取文件: ${response.statusText}`);
    }
    const rawText = await response.text();

    const match = rawText.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    let meta = { title: "无标题", author: "作者", date: "时间" };
    let mdContent = rawText;

    if (match) {
      mdContent = match[2];
      match[1].split("\n").forEach((line) => {
        const parts = line.split(":");
        if (parts.length >= 2)
          meta[parts[0].trim()] = parts.slice(1).join(":").trim();
      });
    }

    const wordCount = mdContent
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, "").length;
    const readTime = Math.max(1, Math.ceil(wordCount / 400));

    const safeSetText = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val.replace(/['"]/g, "");
    };
    safeSetText("meta-title", meta.title);
    safeSetText("meta-author", meta.author);
    safeSetText("meta-date", meta.date);
    safeSetText("meta-words", String(wordCount));
    safeSetText("meta-time", String(readTime));
    document.title = `${meta.title.replace(/['"]/g, "")}`;

    marked.setOptions({
      highlight: (code, lang) =>
        hljs.highlight(code, {
          language: hljs.getLanguage(lang) ? lang : "plaintext",
        }).value,
    });

    if (mdContainer) {
      const navContainer = document.getElementById("post-nav");
      if (navContainer) {
        Array.from(mdContainer.childNodes).forEach((node) => {
          if (node !== navContainer) node.remove();
        });
        navContainer.insertAdjacentHTML("beforebegin", marked.parse(mdContent));
      } else {
        mdContainer.innerHTML = marked.parse(mdContent);
      }

      const basePath = path.substring(0, path.lastIndexOf("/") + 1);
      mdContainer.querySelectorAll("img").forEach((img) => {
        const src = img.getAttribute("src");
        if (src && !src.startsWith("http") && !src.startsWith("/")) {
          img.src = basePath + src.replace(/^\.\//, "");
        }
      });

      // =========================================================================
      // 🎯 2. 核心新增：自动补全 Markdown 中嵌入的 PDF (<object> & <iframe>) 相对路径
      // =========================================================================
      // 处理 <object> 标签的 data 属性
      mdContainer.querySelectorAll("object").forEach((obj) => {
        const dataAttr = obj.getAttribute("data");
        // 只有当路径存在，且不是以 http, / 开头，并且确实是 pdf 文件时才拦截
        if (
          dataAttr &&
          !dataAttr.startsWith("http") &&
          !dataAttr.startsWith("/")
        ) {
          obj.data = basePath + dataAttr.replace(/^\.\//, "");
          console.log(
            `📑 [PDF智能路由] 已自动修复 <object> 相对路径: ${obj.data}`,
          );
        }
      });

      // 处理 <iframe> 标签的 src 属性 (双保险兜底)
      mdContainer.querySelectorAll("iframe").forEach((iframe) => {
        const srcAttr = iframe.getAttribute("src");
        if (
          srcAttr &&
          !srcAttr.startsWith("http") &&
          !srcAttr.startsWith("/")
        ) {
          iframe.src = basePath + srcAttr.replace(/^\.\//, "");
          console.log(
            `📑 [PDF智能路由] 已自动修复 <iframe> 相对路径: ${iframe.src}`,
          );
        }
      });

      if (typeof renderMathInElement === "function") {
        renderMathInElement(mdContainer, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false },
          ],
          throwOnError: false,
        });
      }

      // ---------------------------- 3.3 右侧大纲渲染与联动 ----------------------------
      const headings = mdContainer.querySelectorAll("h2, h3, h4");
      const outlineList = document.getElementById("article-outline");
      if (outlineList) {
        outlineList.innerHTML = "";
        headings.forEach((h, i) => {
          h.id = `heading-${i}`;
          const li = document.createElement("li");
          li.className = `outline-item level-${h.tagName.toLowerCase()}`;
          li.innerHTML = `<a href="#${h.id}">${h.innerText}</a>`;
          outlineList.appendChild(li);
        });
      }

      function scrollActiveOutlineIntoView() {
        const activeLink = document.querySelector(
          "#article-outline .active, .outline-list .active",
        );
        if (activeLink) {
          (activeLink.closest("li") || activeLink).scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
        }
      }

      let scrollTimer;
      let lastActiveId = "";

      window.addEventListener("scroll", () => {
        if (scrollTimer) cancelAnimationFrame(scrollTimer);
        scrollTimer = requestAnimationFrame(() => {
          let currentId = "";
          headings.forEach((h) => {
            if (h.getBoundingClientRect().top <= 140) currentId = h.id;
          });

          if (currentId !== lastActiveId) {
            lastActiveId = currentId;
            document
              .querySelectorAll(".outline-list a, #article-outline a")
              .forEach((a) => {
                a.classList.toggle(
                  "active",
                  a.getAttribute("href") === `#${currentId}`,
                );
              });
            scrollActiveOutlineIntoView();
          }
        });
      });

      setTimeout(scrollActiveOutlineIntoView, 100);
    }

    // ---------------------------- 3.4 左侧目录联动与翻页组件 ----------------------------
    let tocLoadedSuccessfully = false;

    // 🚀 极致精简：直接切出 /docs/ 后的第一个大分类作为笔记本目录
    // 不管嵌多深，直接精准定位到笔记本目录下的 index.json
    let nbPath = "";
    const docsIdx = path.indexOf("/docs/");
    if (docsIdx !== -1) {
      const remainingPath = path.substring(docsIdx + 6); // 抹去 "/docs/"
      const nextSlashIdx = remainingPath.indexOf("/");
      if (nextSlashIdx !== -1) {
        nbPath = `/docs/${remainingPath.substring(0, nextSlashIdx + 1)}`;
      }
    }

    if (nbPath) {
      try {
        const tocRes = await fetch(`${nbPath}index.json`);
        if (tocRes.ok) {
          const tocData = await tocRes.json();
          const tocList = document.getElementById("notebook-toc");
          if (tocList) tocList.innerHTML = "";
          let currentIndex = -1;

          tocData.forEach((item, idx) => {
            const li = document.createElement("li");
            const isCurrentActive = path.includes(item.path);
            if (isCurrentActive) {
              currentIndex = idx;
              li.classList.add("current-active-li");
            }
            if (tocList) {
              li.innerHTML = `<a href="?path=${item.path}" class="${isCurrentActive ? "active" : ""}">${item.title}</a>`;
              tocList.appendChild(li);
            }
          });

          if (currentIndex !== -1) {
            setTimeout(() => {
              const activeLi = document.querySelector(".current-active-li");
              if (activeLi)
                activeLi.scrollIntoView({
                  behavior: "smooth",
                  block: "nearest",
                });
            }, 100);
          }

          const prevBtn = document.getElementById("nav-prev");
          const nextBtn = document.getElementById("nav-next");

          const isMultiPost = tocData?.length > 1;
          const hasPrev = isMultiPost && currentIndex > 0;
          const hasNext =
            isMultiPost &&
            currentIndex < tocData.length - 1 &&
            currentIndex !== -1;

          if (!hasPrev && !hasNext) {
            if (postNavContainer)
              postNavContainer.style.setProperty(
                "display",
                "none",
                "important",
              );
          } else {
            if (postNavContainer)
              postNavContainer.style.setProperty(
                "display",
                "flex",
                "important",
              );

            const updateNavBtn = (btn, hasPage, targetPost, label) => {
              if (!btn) return;
              if (hasPage) {
                btn.href = `?path=${targetPost.path}`;
                btn.innerText = label;
                btn.style.setProperty("visibility", "visible", "important");
                btn.style.setProperty("pointer-events", "auto", "important");
              } else {
                btn.style.setProperty("visibility", "hidden", "important");
                btn.style.setProperty("pointer-events", "none", "important");
              }
            };

            updateNavBtn(
              prevBtn,
              hasPrev,
              tocData[currentIndex - 1],
              "Previous",
            );
            updateNavBtn(nextBtn, hasNext, tocData[currentIndex + 1], "Next");
          }

          tocLoadedSuccessfully = true;
        }
      } catch (err) {
        console.error("Failed to load notebook index:", err);
      }
    }

    // 🚀 核心拦截：如果没有成功读取目录 JSON，决不显示底部翻页按钮
    if (!tocLoadedSuccessfully && postNavContainer) {
      postNavContainer.style.setProperty("display", "none", "important");
    }
  } catch (error) {
    console.error(error);
    if (postNavContainer)
      postNavContainer.style.setProperty("display", "none", "important");
    if (mdContainer) {
      mdContainer.innerHTML = `
        <div class="error-card">
          <i class="fa-solid fa-triangle-exclamation error-icon"></i>
          <h2 class="error-title">文章加载失败</h2>
          <p class="error-msg">${error.message}</p>
        </div>
      `;
    }
  }

  /* ==========================================================================
     4. 悬浮按钮 (返回顶部)
     ========================================================================== */

  const toTopBtn = document.getElementById("totop-btn");
  if (toTopBtn && bannerNode) {
    window.addEventListener("scroll", () => {
      toTopBtn.classList.toggle(
        "fixed-show",
        window.scrollY >= bannerNode.offsetHeight,
      );
    });
    toTopBtn.addEventListener("click", () =>
      window.scrollTo({ top: 0, behavior: "smooth" }),
    );
  }
});
