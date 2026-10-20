/* 中国瑜伽网 · 共享脚本：注入导航/页脚、移动端菜单、滚动动画 */
(function () {
  "use strict";

  var NAV = [
    { href: "index.html",        label: "首页" },
    { href: "books.html",        label: "好书共读" },
    { href: "courses.html",      label: "小动作大作用" },
    { href: "products.html",     label: "食疗产品" },
    { href: "base.html",         label: "线下基地" },
    { href: "charity.html",      label: "公益善行" },
    { href: "alliance.html",     label: "康养联盟" },
    { href: "essays.html",       label: "文化随笔" },
    { href: "cases.html",        label: "学员案例" },
    { href: "booking.html",      label: "线下预约" }
  ];

  var here = location.pathname.split("/").pop() || "index.html";

  function renderHeader() {
    var links = NAV.map(function (n) {
      var act = (n.href === here) ? ' class="active"' : "";
      return '<li><a href="' + n.href + '"' + act + ">" + n.label + "</a></li>";
    }).join("");

    return '' +
      '<div class="wrap nav">' +
        '<a class="brand" href="index.html">' +
          '<span class="logo">瑜</span>' +
          '<span class="name">中国瑜伽网<small>CHINA YOGA · 康养联盟</small></span>' +
        '</a>' +
        '<ul class="nav-links" id="navLinks">' + links +
          '<li class="nav-cta"><a class="btn btn-gold btn-sm" href="booking.html">预约体验</a></li>' +
        '</ul>' +
        '<button class="nav-toggle" id="navToggle" aria-label="菜单">☰</button>' +
      '</div>';
  }

  function renderFooter() {
    return '' +
      '<div class="wrap">' +
        '<div class="footer-grid">' +
          '<div class="footer-brand">' +
            '<h4>中国瑜伽网 · 康养联盟</h4>' +
            '<p>以书为媒，传承中医、身心灵、道家与食疗智慧。线上共读好书、学习养生功法；线下相约深圳梧桐山，赤脚山间、熏蒸静心，福慧双修。</p>' +
            '<p class="note">深圳梧桐山坑背村129-1 · 慈禅甘露堂中医馆</p>' +
          '</div>' +
          '<div><h4>内容板块</h4>' +
            '<a href="books.html">好书共读</a>' +
            '<a href="courses.html">小动作大作用</a>' +
            '<a href="products.html">食疗产品</a>' +
            '<a href="essays.html">文化随笔</a></div>' +
          '<div><h4>平台与服务</h4>' +
            '<a href="base.html">线下基地</a>' +
            '<a href="charity.html">公益善行</a>' +
            '<a href="alliance.html">康养联盟</a>' +
            '<a href="booking.html">线下预约</a></div>' +
          '<div><h4>联系我们</h4>' +
            '<a href="booking.html">预约梧桐山体验</a>' +
            '<a href="alliance.html">申请入驻合作</a>' +
            '<a href="cases.html">学员案例</a>' +
            '<span class="note" style="color:#b6ad95">www.chinayoga.com</span></div>' +
        '</div>' +
        '<div class="footer-bottom">' +
          '© ' + new Date().getFullYear() + ' 中国瑜伽网康养联盟 · 慈禅甘露堂　|　以产业养公益，以公益润人心，以修行养生命' +
          '<br>本站内容仅供文化学习与日常养生参考，不构成医疗诊断或治疗建议。' +
        '</div>' +
      '</div>';
  }

  function init() {
    var h = document.getElementById("site-header");
    var f = document.getElementById("site-footer");
    if (h) h.innerHTML = renderHeader();
    if (f) f.innerHTML = renderFooter();

    var toggle = document.getElementById("navToggle");
    var links = document.getElementById("navLinks");
    if (toggle && links) {
      toggle.addEventListener("click", function () { links.classList.toggle("open"); });
      links.addEventListener("click", function (e) {
        if (e.target.tagName === "A") links.classList.remove("open");
      });
    }

    // 滚动揭示动画
    var els = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window && els.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
        });
      }, { threshold: 0.12 });
      els.forEach(function (el) { io.observe(el); });
    } else {
      els.forEach(function (el) { el.classList.add("in"); });
    }

    // 表单：阻止提交并提示
    document.querySelectorAll("form[data-demo]").forEach(function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var box = form.querySelector(".form-result");
        if (box) {
          box.textContent = "✓ 已收到您的意向登记，平台守护人将于 1–2 个工作日内与您联系。";
          box.style.display = "block";
        }
        form.reset();
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else { init(); }
})();
