/* ============================================================
   ui.js — shared, safe DOM helpers + icon library
   IMPORTANT (security): user-entered text is NEVER placed via
   innerHTML. We use el()/text nodes. innerHTML is only used for
   STATIC, trusted markup defined here in the source (e.g. icons).
   ============================================================ */
(function () {
  "use strict";
  const HL = (window.HL = window.HL || {});

  /* ---- el(): safe element builder ----
     props: { class, text, html(TRUSTED only), onClick, attrs:{}, data:{}, aria:{} }
     children: array of nodes/strings or a single node/string */
  function el(tag, props = {}, children = []) {
    const node = document.createElement(tag);
    if (props.class) node.className = props.class;
    if (props.id) node.id = props.id;
    if (props.text != null) node.textContent = props.text;       // SAFE for user input
    if (props.html != null) node.innerHTML = props.html;         // TRUSTED static only
    if (props.onClick) node.addEventListener("click", props.onClick);
    if (props.on) for (const [ev, fn] of Object.entries(props.on)) node.addEventListener(ev, fn);
    if (props.attrs) for (const [k, v] of Object.entries(props.attrs)) { if (v != null) node.setAttribute(k, v); }
    if (props.data) for (const [k, v] of Object.entries(props.data)) node.dataset[k] = v;
    if (props.aria) for (const [k, v] of Object.entries(props.aria)) node.setAttribute("aria-" + k, v);
    appendChildren(node, children);
    return node;
  }

  function appendChildren(node, children) {
    if (children == null) return;
    const list = Array.isArray(children) ? children : [children];
    for (const c of list) {
      if (c == null || c === false) continue;
      node.appendChild(typeof c === "string" || typeof c === "number" ? document.createTextNode(String(c)) : c);
    }
  }

  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); return node; }

  // HTML-escape for when we must build a trusted code template string.
  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ---- Icon library (static trusted SVG). Returns an <svg> element. ---- */
  const PATHS = {
    shield:  '<path fill="none" stroke="currentColor" stroke-width="1.6" d="M12 3l7 3v5c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9V6z"/>',
    database:'<ellipse cx="12" cy="6" rx="7" ry="3" fill="none" stroke="currentColor" stroke-width="1.6"/><path fill="none" stroke="currentColor" stroke-width="1.6" d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/>',
    bug:     '<path fill="none" stroke="currentColor" stroke-width="1.6" d="M9 8a3 3 0 016 0M6 13H3m18 0h-3M6 18l-2 2m16-2l2 2M6 8L4 6m14 2l2-2M12 8a4 4 0 014 4v3a4 4 0 01-8 0v-3a4 4 0 014-4zM12 12v6"/>',
    mail:    '<path fill="none" stroke="currentColor" stroke-width="1.6" d="M4 6h16v12H4zM4 7l8 6 8-6"/>',
    bolt:    '<path fill="currentColor" d="M13 2L4 14h6l-1 8 9-12h-6z"/>',
    key:     '<path fill="none" stroke="currentColor" stroke-width="1.6" d="M15 7a4 4 0 11-5.2 5.2L4 18v2h2l1-1h2v-2h2l1.8-1.8A4 4 0 0115 7z"/><circle cx="16" cy="7" r="1.2" fill="currentColor"/>',
    swap:    '<path fill="none" stroke="currentColor" stroke-width="1.6" d="M7 7h11l-3-3M17 17H6l3 3"/>',
    lock:    '<path fill="none" stroke="currentColor" stroke-width="1.6" d="M7 11V8a5 5 0 0110 0v3M5 11h14v9H5z"/>',
    cookie:  '<path fill="none" stroke="currentColor" stroke-width="1.6" d="M12 3a9 9 0 109 9 4 4 0 01-5-5 4 4 0 01-4-4z"/><circle cx="9" cy="12" r="1" fill="currentColor"/><circle cx="14" cy="15" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/>',
    phone:   '<path fill="none" stroke="currentColor" stroke-width="1.6" d="M6 3h4l1 5-2.5 1.5a11 11 0 005 5L15 13l5 1v4a2 2 0 01-2 2A16 16 0 014 6a2 2 0 012-3z"/>',
    package: '<path fill="none" stroke="currentColor" stroke-width="1.6" d="M12 3l8 4v10l-8 4-8-4V7zM4 7l8 4 8-4M12 11v10"/>',
    server:  '<path fill="none" stroke="currentColor" stroke-width="1.6" d="M4 5h16v5H4zM4 14h16v5H4z"/><circle cx="7" cy="7.5" r="1" fill="currentColor"/><circle cx="7" cy="16.5" r="1" fill="currentColor"/>',
    user:    '<path fill="none" stroke="currentColor" stroke-width="1.6" d="M12 12a4 4 0 100-8 4 4 0 000 8zM5 20a7 7 0 0114 0z"/>',
    skull:   '<path fill="none" stroke="currentColor" stroke-width="1.6" d="M12 3a8 8 0 00-5 14v3h10v-3a8 8 0 00-5-14z"/><circle cx="9" cy="12" r="1.4" fill="currentColor"/><circle cx="15" cy="12" r="1.4" fill="currentColor"/>',
    check:   '<path fill="none" stroke="currentColor" stroke-width="2" d="M5 12l5 5 9-11"/>',
    x:       '<path fill="none" stroke="currentColor" stroke-width="2" d="M6 6l12 12M18 6L6 18"/>',
    alert:   '<path fill="none" stroke="currentColor" stroke-width="1.6" d="M12 4l9 16H3zM12 10v4M12 17v.5"/>',
    arrowR:  '<path fill="none" stroke="currentColor" stroke-width="1.8" d="M5 12h14M13 6l6 6-6 6"/>',
    arrowL:  '<path fill="none" stroke="currentColor" stroke-width="1.8" d="M19 12H5M11 6l-6 6 6 6"/>',
    trophy:  '<path fill="none" stroke="currentColor" stroke-width="1.6" d="M7 4h10v4a5 5 0 01-10 0zM7 6H4v1a3 3 0 003 3m10-4h3v1a3 3 0 01-3 3M9 15h6l1 5H8z"/>',
    info:    '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/><path fill="none" stroke="currentColor" stroke-width="1.8" d="M12 11v5M12 8v.5"/>',
    eye:     '<path fill="none" stroke="currentColor" stroke-width="1.6" d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/>',
    code:    '<path fill="none" stroke="currentColor" stroke-width="1.6" d="M9 8l-5 4 5 4M15 8l5 4-5 4"/>',
    link:    '<path fill="none" stroke="currentColor" stroke-width="1.6" d="M9 15l6-6M8 12l-2 2a3 3 0 004 4l2-2M16 12l2-2a3 3 0 00-4-4l-2 2"/>',
    wifi:    '<path fill="none" stroke="currentColor" stroke-width="1.6" d="M3 9a14 14 0 0118 0M6 12.5a9 9 0 0112 0M9 16a4 4 0 016 0"/><circle cx="12" cy="19" r="1" fill="currentColor"/>',
    download:'<path fill="none" stroke="currentColor" stroke-width="1.6" d="M12 4v10m-4-4l4 4 4-4M5 19h14"/>',
    flag:    '<path fill="none" stroke="currentColor" stroke-width="1.6" d="M5 21V4h11l-2 4 2 4H5"/>'
  };

  function icon(name, size = 20) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", size);
    svg.setAttribute("height", size);
    svg.setAttribute("aria-hidden", "true");
    svg.innerHTML = PATHS[name] || PATHS.info; // trusted static strings only
    return svg;
  }

  /* ---- Toast + live-region announcements ---- */
  function toast(message, type = "") {
    const host = document.getElementById("toastHost");
    if (!host) return;
    const t = el("div", { class: "toast" + (type ? " toast--" + type : "") }, [
      type === "safe" ? icon("check", 16) : type === "danger" ? icon("alert", 16) : icon("info", 16),
      el("span", { text: message })
    ]);
    host.appendChild(t);
    announce(message);
    setTimeout(() => { t.style.opacity = "0"; t.style.transform = "translateY(8px)"; }, 2600);
    setTimeout(() => t.remove(), 3000);
  }

  function announce(message) {
    const live = document.getElementById("liveRegion");
    if (live) { live.textContent = ""; setTimeout(() => (live.textContent = message), 30); }
  }

  /* ---- Small shared builders ---- */
  function chip(label, variant) { return el("span", { class: "chip" + (variant ? " chip--" + variant : ""), text: label }); }

  function button(label, { variant = "ghost", onClick, size, icon: ic, attrs, disabled } = {}) {
    const kids = [];
    if (ic) kids.push(icon(ic, 16));
    kids.push(el("span", { text: label }));
    return el("button", {
      class: "btn btn--" + variant + (size ? " btn--" + size : ""),
      onClick, attrs: Object.assign({ type: "button" }, disabled ? { disabled: "" } : {}, attrs || {})
    }, kids);
  }

  function reducedMotion() {
    try { return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
    catch (e) { return false; }
  }

  HL.ui = { el, clear, escapeHTML, icon, toast, announce, chip, button, appendChildren, reducedMotion };
})();
