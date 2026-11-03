/* 中国瑜伽网 · 动态内容加载与渲染
 * 页面通过 ContentHub.load(type, containerId, {render}) 从 /content/{type}.json 取数并渲染。
 * 内容均为管理员经后台发布，正文做 HTML 转义，避免注入。
 */
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // 正文：空行分段为 <p>，行内换行转 <br>
  function bodyToHtml(text) {
    return String(text || "")
      .split(/\n{2,}/)
      .map(function (p) {
        return "<p>" + esc(p).replace(/\n/g, "<br>") + "</p>";
      })
      .join("");
  }

  // 重新挂载滚动揭示动画（兼容 main.js 的动态注入元素）
  function observeReveal(scope) {
    var els = scope.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window && els.length) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (en) {
            if (en.isIntersecting) {
              en.target.classList.add("in");
              io.unobserve(en.target);
            }
          });
        },
        { threshold: 0.12 }
      );
      els.forEach(function (el) { io.observe(el); });
    } else {
      els.forEach(function (el) { el.classList.add("in"); });
    }
  }

  // ---- 媒体（图片/视频）渲染 ----
  function mediaHtml(it) {
    var h = "";
    if (it.image) {
      h += '<div class="media"><img src="' + esc(it.image) + '" alt="' +
        esc(it.title || it.name || "配图") + '" loading="lazy"></div>';
    }
    if (it.video) {
      h += '<div class="media"><video src="' + esc(it.video) + '" controls preload="none"></video></div>';
    }
    return h;
  }

  // ---- 各类型渲染模板（返回容器内部 HTML） ----
  function renderEssays(data) {
    return data
      .map(function (it) {
        var meta = [it.date, it.author].filter(Boolean).join(" · ");
        return (
          '<article class="card reveal">' +
          '<span class="eyebrow">' + esc(it.tag || "随笔") + "</span>" +
          "<h3>" + esc(it.title) + "</h3>" +
          (meta ? '<p class="note">' + esc(meta) + "</p>" : "") +
          mediaHtml(it) +
          bodyToHtml(it.body || it.excerpt || "") +
          (it.author ? '<p class="note">—— ' + esc(it.author) + "</p>" : "") +
          "</article>"
        );
      })
      .join("");
  }

  function renderCases(data) {
    return data
      .map(function (it) {
        return (
          '<div class="card reveal">' +
          '<div class="ic">' + esc(it.icon || "🧡") + "</div>" +
          "<h3>" + esc(it.name) + (it.tag ? " · " + esc(it.tag) : "") + "</h3>" +
          "<p>" + esc(it.text) + "</p>" +
          mediaHtml(it) +
          '<p class="note">—— 个人体验分享，非医疗承诺</p>' +
          "</div>"
        );
      })
      .join("");
  }

  function renderCharity(data) {
    return data
      .map(function (it) {
        return (
          '<div class="tl-item">' +
          '<div class="year">' + esc(it.date || "日常") + "</div>" +
          "<h3>" + esc(it.title) + "</h3>" +
          mediaHtml(it) +
          "<p>" + esc(it.body || "") + "</p>" +
          "</div>"
        );
      })
      .join("");
  }

  function renderNews(data) {
    return data
      .map(function (it) {
        return (
          '<div class="card reveal">' +
          '<span class="eyebrow">' + esc(it.date || "动态") + "</span>" +
          "<h3>" + esc(it.title) + "</h3>" +
          mediaHtml(it) +
          bodyToHtml(it.content || "") +
          "</div>"
        );
      })
      .join("");
  }

  var RENDERERS = {
    essays: renderEssays,
    cases: renderCases,
    charity: renderCharity,
    news: renderNews,
  };

  async function load(type, containerId, opts) {
    opts = opts || {};
    var el = document.getElementById(containerId);
    if (!el) return;
    var render = opts.render || RENDERERS[type];
    el.innerHTML = '<div class="loading">加载中…</div>';
    try {
      var res = await fetch("content/" + type + ".json", { cache: "no-cache" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      var data = await res.json();
      if (!Array.isArray(data) || !data.length) {
        el.innerHTML = '<p class="empty">暂无内容，敬请期待。</p>';
        observeReveal(el);
        return;
      }
      el.innerHTML = render(data, opts);
      observeReveal(el);
    } catch (e) {
      el.innerHTML = '<p class="empty">内容加载失败，请稍后刷新。</p>';
      console.error("[content] load failed:", e);
    }
  }

  window.ContentHub = {
    load: load,
    renderEssays: renderEssays,
    renderCases: renderCases,
    renderCharity: renderCharity,
    renderNews: renderNews,
  };
})();
