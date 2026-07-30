/* Donny Optimize — menu-fx.js
   Turns the top nav into a clean hamburger dropdown on mobile (<= 720px).
   Desktop is untouched. Safe to load on every page; runs after bundle unpack. */
(function () {
  "use strict";
  if (window.__menuFx) return;
  window.__menuFx = true;

  var BP = 720;

  function injectCss() {
    if (document.getElementById("menu-fx-css")) return;
    var st = document.createElement("style");
    st.id = "menu-fx-css";
    st.textContent =
      "#menufx-btn{display:none;flex:none;align-items:center;justify-content:center;width:42px;height:42px;border-radius:10px;" +
      "background:#131619;border:1px solid #2a3f13;cursor:pointer;padding:0;}" +
      "#menufx-btn span{display:block;width:18px;height:2px;background:#9dff2e;border-radius:2px;position:relative;box-shadow:0 6px 0 #9dff2e,0 -6px 0 #9dff2e;transition:.2s;}" +
      "#menufx-btn.open span{box-shadow:0 0 0 #9dff2e;transform:rotate(45deg);}" +
      "#menufx-btn.open span:after{content:'';position:absolute;left:0;top:0;width:18px;height:2px;background:#9dff2e;border-radius:2px;transform:rotate(90deg);}" +
      "#menufx-panel{display:none;position:fixed;top:60px;left:12px;right:12px;z-index:60;flex-direction:column;gap:2px;" +
      "background:rgba(14,16,19,0.97);backdrop-filter:blur(16px);border:1px solid #23272d;border-radius:16px;padding:10px;" +
      "box-shadow:0 24px 60px -20px rgba(0,0,0,0.9);}" +
      "#menufx-panel.open{display:flex;animation:menufxIn .22s ease both;}" +
      "@keyframes menufxIn{from{opacity:0;transform:translateY(-8px);}to{opacity:1;transform:none;}}" +
      "#menufx-panel a,#menufx-panel span{font-family:'JetBrains Mono',monospace;font-size:14px;letter-spacing:0.08em;" +
      "padding:15px 16px;border-radius:10px;color:#cbd0d5;text-decoration:none;display:block;}" +
      "#menufx-panel a:active,#menufx-panel a:hover{background:rgba(157,255,46,0.08);color:#c4ff7a;}" +
      "#menufx-panel .cur{color:#9dff2e;background:rgba(157,255,46,0.08);}" +
      "@media(max-width:" + BP + "px){#menufx-btn{display:flex;}.menufx-nav{display:none!important;}}" +
      "@media(min-width:" + (BP + 1) + "px){#menufx-panel{display:none!important;}}";
    (document.head || document.documentElement).appendChild(st);
  }

  function build(nav) {
    if (document.getElementById("menufx-btn")) return true;
    var header = nav.parentElement;
    if (!header) return false;
    nav.classList.add("menufx-nav");

    // hamburger button in the header row
    var btn = document.createElement("button");
    btn.id = "menufx-btn";
    btn.setAttribute("aria-label", "Menu");
    btn.innerHTML = "<span></span>";
    header.appendChild(btn);

    // dropdown panel with cloned items
    var panel = document.createElement("div");
    panel.id = "menufx-panel";
    var kids = nav.querySelectorAll("a,span");
    for (var i = 0; i < kids.length; i++) {
      var k = kids[i];
      var txt = (k.textContent || "").trim();
      if (!txt) continue;
      if (k.tagName === "A") {
        var a = document.createElement("a");
        a.href = k.getAttribute("href") || "#";
        a.textContent = txt;
        panel.appendChild(a);
      } else {
        var s = document.createElement("span");
        s.className = "cur";
        s.textContent = txt;
        panel.appendChild(s);
      }
    }
    document.body.appendChild(panel);

    function close() { btn.classList.remove("open"); panel.classList.remove("open"); }
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var on = btn.classList.toggle("open");
      panel.classList.toggle("open", on);
    });
    panel.addEventListener("click", function (e) { if (e.target.tagName === "A") close(); });
    document.addEventListener("click", function (e) {
      if (!panel.contains(e.target) && e.target !== btn) close();
    });
    return true;
  }

  function findNav() {
    var divs = document.querySelectorAll("div");
    for (var i = 0; i < divs.length; i++) {
      var s = divs[i].getAttribute("style") || "";
      if (s.indexOf("JetBrains") > -1 && s.indexOf("11.5px") > -1 && divs[i].querySelector("a")) {
        return divs[i];
      }
    }
    return null;
  }

  function boot() {
    injectCss();
    var tries = 0;
    (function scan() {
      var nav = findNav();
      if (nav && build(nav)) return;
      if (tries++ < 60) setTimeout(scan, 200);
    })();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else { boot(); }
})();
