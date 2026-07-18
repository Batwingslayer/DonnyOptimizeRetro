/* Donny Optimize — space-fx.js
   Universal drop-in: lightspeed warp background + 3D molecule renderer.
   Works on any page. Warp attaches behind content automatically.
   Molecule renders into any element with [data-mol] (needs three.js; auto-loaded). */
(function () {
  "use strict";

  /* ---------- LIGHTSPEED WARP BACKGROUND ---------- */
  function initWarp() {
    if (document.querySelector("canvas[data-warp-fx]")) return;
    var canvas = document.createElement("canvas");
    canvas.setAttribute("data-warp-fx", "");
    canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;opacity:0.9;z-index:0;";
    document.body.insertBefore(canvas, document.body.firstChild);
    document.body.style.background = "#0a0b0d";

    // Reveal the warp: make the opaque page shell transparent, lift it above the canvas.
    try {
      var shells = document.querySelectorAll("body > div, x-dc, x-dc > div, [id$='-root']");
      for (var i = 0; i < shells.length; i++) {
        var el = shells[i];
        var bg = getComputedStyle(el).backgroundColor;
        if (bg === "rgb(10, 11, 13)" || bg === "rgb(12, 13, 15)") {
          el.style.background = "transparent";
          if (getComputedStyle(el).position === "static") el.style.position = "relative";
          el.style.zIndex = "1";
        }
      }
    } catch (e) {}

    var ctx = canvas.getContext("2d");
    var W, H, cx, cy, dpr;
    function resize() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = W / 2; cy = H / 2;
    }
    resize();
    window.addEventListener("resize", resize);

    var COUNT = Math.max(280, Math.min(650, Math.round(W * H / 2600)));
    var stars = [];
    function spawn(star) {
      var ang = Math.random() * Math.PI * 2;
      var rad = Math.random() * Math.max(W, H) * 0.5;
      star.x = Math.cos(ang) * rad;
      star.y = Math.sin(ang) * rad;
      star.z = Math.random() * W;
      star.pz = star.z;
      var roll = Math.random();
      star.col = roll > 0.82 ? "157,255,46" : (roll > 0.6 ? "180,255,150" : "255,255,255");
    }
    for (var s = 0; s < COUNT; s++) { var o = {}; spawn(o); stars.push(o); }

    var speed = 3;
    function loop() {
      ctx.fillStyle = "rgba(10,11,13,0.32)";
      ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.translate(cx, cy);
      for (var i = 0; i < stars.length; i++) {
        var st = stars[i];
        st.pz = st.z;
        st.z -= speed;
        if (st.z < 1) { spawn(st); st.z = W; st.pz = W; continue; }
        var k = 128 / st.z, pk = 128 / st.pz;
        var x = st.x * k, y = st.y * k;
        var px = st.x * pk, py = st.y * pk;
        if (Math.abs(x) > W || Math.abs(y) > H) { spawn(st); continue; }
        var t = (1 - st.z / W);
        var w = Math.max(0.4, t * 2.4);
        var op = Math.min(1, t * 1.2);
        ctx.strokeStyle = "rgba(" + st.col + "," + op + ")";
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      ctx.restore();
      requestAnimationFrame(loop);
    }
    loop();
  }

  /* ---------- 3D MOLECULE ---------- */
  function loadThree(cb) {
    if (window.THREE) return cb();
    var existing = document.querySelector("script[data-three-fx]");
    if (existing) { existing.addEventListener("load", cb); return; }
    var sc = document.createElement("script");
    sc.setAttribute("data-three-fx", "");
    sc.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
    sc.onload = cb;
    document.head.appendChild(sc);
  }

  function renderMolecule(mount) {
    if (mount.getAttribute("data-mol-done")) return;
    if (mount.querySelector("canvas")) { mount.setAttribute("data-mol-done", "1"); return; }
    mount.setAttribute("data-mol-done", "1");
    var THREE = window.THREE;
    var slug = mount.getAttribute("data-mol") || document.title || "molecule";
    var w = mount.clientWidth || 300, h = mount.clientHeight || 184;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(48, w / h, 0.1, 100);
    camera.position.z = 10;
    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    var l1 = new THREE.PointLight(0x9dff2e, 1.3, 60); l1.position.set(7, 7, 9); scene.add(l1);
    var l2 = new THREE.PointLight(0xff3ea5, 0.95, 60); l2.position.set(-7, -5, 7); scene.add(l2);
    var l3 = new THREE.PointLight(0x4fd1ff, 0.6, 60); l3.position.set(0, 6, -6); scene.add(l3);

    var seed = 0;
    for (var c = 0; c < slug.length; c++) seed = (seed * 31 + slug.charCodeAt(c)) % 233280;
    function rand() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }

    var group = new THREE.Group();
    var palette = [0x9dff2e, 0xff3ea5, 0x4fd1ff, 0xffffff, 0xffb03a];
    var atoms = [];
    var n = 8 + Math.floor(rand() * 6);
    var pos = new THREE.Vector3(0, 0, 0);
    for (var a = 0; a < n; a++) {
      atoms.push(pos.clone());
      var base = (rand() < 0.28 && atoms.length > 2) ? atoms[Math.floor(rand() * atoms.length)] : pos;
      pos = base.clone().add(new THREE.Vector3((rand() - 0.5) * 2.6, (rand() - 0.5) * 2.6, (rand() - 0.5) * 2.6));
    }
    var center = atoms.reduce(function (acc, v) { return acc.add(v.clone()); }, new THREE.Vector3()).multiplyScalar(1 / n);
    atoms.forEach(function (v) { v.sub(center); });

    var bondMat = new THREE.MeshStandardMaterial({ color: 0x3a4a2a, emissive: 0x223318, emissiveIntensity: 0.35, roughness: 0.5, metalness: 0.1 });
    for (var b = 1; b < atoms.length; b++) {
      var best = 0, bd = Infinity;
      for (var j = 0; j < b; j++) { var d = atoms[b].distanceTo(atoms[j]); if (d < bd) { bd = d; best = j; } }
      var A = atoms[b], B = atoms[best];
      var dir = B.clone().sub(A); var len = dir.length();
      var cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, len, 12), bondMat);
      cyl.position.copy(A.clone().add(B).multiplyScalar(0.5));
      cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
      group.add(cyl);
    }
    atoms.forEach(function (v) {
      var r = 0.38 + rand() * 0.32;
      var col = palette[Math.floor(rand() * palette.length)];
      var m = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 28),
        new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.45, roughness: 0.28, metalness: 0.15 }));
      m.position.copy(v); group.add(m);
      var halo = new THREE.Mesh(new THREE.SphereGeometry(r * 1.5, 16, 16),
        new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false }));
      halo.position.copy(v); group.add(halo);
    });
    scene.add(group);
    var maxR = atoms.reduce(function (mx, v) { return Math.max(mx, v.length()); }, 0);
    group.scale.setScalar(Math.min(1.2, 1 / (maxR + 1) * 4.2));

    var rotY = 0, rotX = 0.2, velY = 0.006, dragging = false, lastX = 0, lastY = 0;
    var dom = renderer.domElement;
    mount.style.cursor = "grab"; mount.style.touchAction = "none";
    dom.addEventListener("pointerdown", function (e) { dragging = true; lastX = e.clientX; lastY = e.clientY; mount.style.cursor = "grabbing"; });
    window.addEventListener("pointerup", function () { dragging = false; mount.style.cursor = "grab"; });
    window.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      rotY += (e.clientX - lastX) * 0.01; rotX += (e.clientY - lastY) * 0.01;
      lastX = e.clientX; lastY = e.clientY; velY = 0.006;
    });
    function tick() {
      if (!dragging) rotY += velY;
      group.rotation.y = rotY; group.rotation.x = rotX;
      renderer.render(scene, camera);
      requestAnimationFrame(tick);
    }
    tick();
    if (window.ResizeObserver) {
      new ResizeObserver(function () {
        w = mount.clientWidth || w; h = mount.clientHeight || h;
        camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h);
      }).observe(mount);
    }
  }

  function initMolecules() {
    var mounts = document.querySelectorAll("[data-mol]");
    if (!mounts.length) return;
    loadThree(function () {
      mounts.forEach(function (m) { try { renderMolecule(m); } catch (e) {} });
    });
  }

  function boot() {
    initWarp();
    // molecules may mount after the app renders; poll briefly
    var tries = 0;
    (function scan() {
      initMolecules();
      if (tries++ < 40) setTimeout(scan, 250);
    })();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
