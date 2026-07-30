/* Donny Optimize — menu-fx.js
   Clean hamburger dropdown on mobile (<= 720px). Desktop nav untouched.
   Robust against bundle re-renders: delegated events + MutationObserver. */
(function () {
  "use strict";
  if (window.__menuFx) return;
  window.__menuFx = true;

  var BP = 720;
  var open = false;

  function injectCss() {
    if (document.getElementById("menu-fx-css")) return;
    var st = document.createElement("style");
    st.id = "menu-fx-css";
    st.textContent =
      "#menufx-btn{display:none;align-items:center;justify-content:center;width:44px;height:44px;border-radius:10px;" +
      "background:#131619;border:1px solid #2a3f13;cursor:pointer;padding:0;flex:none;-webkit-tap-highlight-color:transparent;}" +
      "#menufx-btn i{display:block;width:18px;height:2px;background:#9dff2e;border-radius:2px;position:relative;box-shadow:0 6px 0 #9dff2e,0 -6px 0 #9dff2e;}" +
      "#menufx-btn.open i{box-shadow:none;transform:rotate(45deg);}" +
      "#menufx-btn.open i:after{content:'';position:absolute;left:0;top:0;width:18px;height:2px;background:#9dff2e;transform:rotate(90deg);}" +
      "#menufx-panel{display:none;position:fixed;top:62px;left:12px;right:12px;z-index:9999;flex-direction:column;gap:2px;" +
      "background:rgba(14,16,19,0.98);backdrop-filter:blur(16px);border:1px solid #23272d;border-radius:16px;padding:10px;" +
      "box-shadow:0 24px 60px -20px rgba(0,0,0,0.9);}" +
      "#menufx-panel.open{display:flex;}" +
      "#menufx-panel a,#menufx-panel span{font-family:'JetBrains Mono',monospace;font-size:14px;letter-spacing:0.08em;" +
      "padding:16px;border-radius:10px;color:#cbd0d5;text-decoration:none;display:block;}" +
      "#menufx-panel a:active,#menufx-panel a:hover{background:rgba(157,255,46,0.08);color:#c4ff7a;}" +
      "#menufx-panel .cur{color:#9dff2e;background:rgba(157,255,46,0.08);}" +
      "@media(max-width:" + BP + "px){#menufx-btn{display:flex;}.menufx-nav{display:none!important;}}" +
      "@media(min-width:" + (BP + 1) + "px){#menufx-panel{display:none!important;}#menufx-btn{display:none!important;}}";
    (document.head || document.documentElement).appendChild(st);
  }

  function findNav() {
    var divs = document.querySelectorAll("div");
    for (var i = 0; i < divs.length; i++) {
      var s = divs[i].getAttribute("style") || "";
      if (s.indexOf("JetBrains") > -1 && s.indexOf("11.5px") > -1 && divs[i].querySelector("a")) return divs[i];
    }
    return null;
  }

  function setOpen(v) {
    open = v;
    var btn = document.getElementById("menufx-btn");
    var panel = document.getElementById("menufx-panel");
    if (btn) btn.classList.toggle("open", open);
    if (panel) panel.classList.toggle("open", open);
  }

  function ensure() {
    injectCss();
    var nav = findNav();
    if (!nav) return;
    nav.classList.add("menufx-nav");
    var header = nav.parentElement;
    if (!header) return;

    // button
    if (!document.getElementById("menufx-btn")) {
      var btn = document.createElement("button");
      btn.id = "menufx-btn";
      btn.type = "button";
      btn.setAttribute("aria-label", "Menu");
      btn.innerHTML = "<i></i>";
      header.appendChild(btn);
      // direct handlers (iOS can suppress delegated click on dynamic buttons)
      var fire = function (e) { e.preventDefault(); e.stopPropagation(); setOpen(!open); };
      btn.addEventListener("touchend", fire, { passive: false });
      btn.addEventListener("click", fire);
    }
    // panel (rebuild items to stay in sync)
    var panel = document.getElementById("menufx-panel");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "menufx-panel";
      document.body.appendChild(panel);
    }
    var links = nav.querySelectorAll("a,span");
    var want = [];
    for (var i = 0; i < links.length; i++) {
      var t = (links[i].textContent || "").trim();
      if (t) want.push({ tag: links[i].tagName, txt: t, href: links[i].getAttribute("href") });
    }
    var sig = want.map(function (w) { return w.tag + w.txt; }).join("|");
    if (panel.getAttribute("data-sig") !== sig) {
      panel.setAttribute("data-sig", sig);
      panel.innerHTML = "";
      for (var j = 0; j < want.length; j++) {
        var w = want[j];
        if (w.tag === "A") {
          var a = document.createElement("a");
          a.href = w.href || "#";
          a.textContent = w.txt;
          panel.appendChild(a);
        } else {
          var sp = document.createElement("span");
          sp.className = "cur";
          sp.textContent = w.txt;
          panel.appendChild(sp);
        }
      }
      panel.classList.toggle("open", open);
    }
  }

  // Delegated, capture-phase handlers survive DOM swaps.
  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest("#menufx-btn");
    if (btn) { e.preventDefault(); e.stopPropagation(); setOpen(!open); return; }
    var panel = document.getElementById("menufx-panel");
    if (panel && panel.contains(e.target)) {
      if (e.target.tagName === "A") setOpen(false);
      return;
    }
    if (open) setOpen(false);
  }, true);

  // close on outside tap (touch)
  document.addEventListener("touchend", function (e) {
    if (e.target.closest && e.target.closest("#menufx-btn")) return;
    var panel = document.getElementById("menufx-panel");
    if (panel && panel.contains(e.target)) return;
    if (open) setOpen(false);
  }, true);

  function boot() {
    ensure();
    var mo = new MutationObserver(function () { ensure(); });
    mo.observe(document.body, { childList: true, subtree: true });
    var n = 0;
    (function poll() { ensure(); if (n++ < 40) setTimeout(poll, 250); })();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
