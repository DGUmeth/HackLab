/* ============================================================
   app.js — boots the application: builds the level switcher,
   wires the mobile nav, and starts the router.
   ============================================================ */
(function () {
  "use strict";
  const HL = window.HL;

  const LEVELS = [
    { id: "beginner", label: "BGN", full: "Beginner" },
    { id: "intermediate", label: "INT", full: "Intermediate" },
    { id: "advanced", label: "ADV", full: "Advanced" }
  ];

  // ---- Level switcher in the nav ----
  function buildLevelSwitch() {
    const host = document.getElementById("levelSwitch");
    if (!host) return;
    HL.ui.clear(host);
    const current = HL.state.getLevel();
    LEVELS.forEach((lv) => {
      const btn = HL.ui.el("button", {
        attrs: { type: "button", title: lv.full, "aria-pressed": current === lv.id ? "true" : "false", "aria-label": lv.full + " mode" },
        text: lv.label,
        onClick() {
          HL.state.setLevel(lv.id);
          HL.ui.toast(lv.full + " mode on.", "safe");
        }
      });
      host.appendChild(btn);
    });
  }
  HL.refreshLevelSwitch = buildLevelSwitch;

  // When the level changes, update the switcher and re-render the current view
  // (so a module reflects the new difficulty immediately).
  window.addEventListener("hl:level", () => {
    buildLevelSwitch();
    if (HL.router) HL.router.render();
  });
  window.addEventListener("hl:badge", () => { /* progress reflected on next map visit */ });
  window.addEventListener("hl:reset", buildLevelSwitch);

  // ---- Mobile nav toggle ----
  function wireNav() {
    const toggle = document.getElementById("navToggle");
    const menu = document.getElementById("navMenu");
    if (!toggle || !menu) return;
    toggle.addEventListener("click", () => {
      const open = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    // Close menu when a link is tapped
    menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => {
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }));
  }

  // ---- Boot ----
  function boot() {
    buildLevelSwitch();
    wireNav();
    if (!location.hash) location.hash = "#/";
    HL.router.render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
