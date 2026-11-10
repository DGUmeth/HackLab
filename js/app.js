/* ============================================================
   app.js, boots the application: builds the level switcher,
   wires the mobile nav, and starts the router.
   ============================================================ */
(function () {
  "use strict";
  const HL = window.HL;

  const LEVELS = [
    { id: "beginner", dots: 1, full: "Beginner" },
    { id: "intermediate", dots: 2, full: "Intermediate" },
    { id: "advanced", dots: 3, full: "Advanced" }
  ];

  // ---- Level switcher in the nav ----
  function buildLevelSwitch() {
    const host = document.getElementById("levelSwitch");
    if (!host) return;
    HL.ui.clear(host);
    const current = HL.state.getLevel();
    LEVELS.forEach((lv) => {
      // Dots instead of text: Beginner ·  Intermediate ··  Advanced ···
      const dots = HL.ui.el("span", { class: "level-switch__dots", attrs: { "aria-hidden": "true" } },
        [1, 2, 3].map((d) => HL.ui.el("i", { class: d <= lv.dots ? "on" : "" })));
      const btn = HL.ui.el("button", {
        attrs: { type: "button", title: lv.full, "aria-pressed": current === lv.id ? "true" : "false", "aria-label": lv.full + " mode" },
        onClick() {
          HL.state.setLevel(lv.id);
          HL.ui.toast(lv.full + " mode on.", "safe");
        }
      });
      btn.appendChild(dots);
      host.appendChild(btn);
    });
  }
  HL.refreshLevelSwitch = buildLevelSwitch;

  // When the level changes, update the switcher and re-render the current view
  // (so a module reflects the new difficulty immediately).
  window.addEventListener("hl:level", () => {
    buildLevelSwitch();
    if (HL.router) HL.router.render();
    // On the landing page the re-render jumps to the top; instead keep the
    // user at the "Start the game" step they just unlocked.
    const hash = location.hash || "#/";
    if (hash === "#/" || hash === "") {
      requestAnimationFrame(() => {
        const row = document.getElementById("startRow");
        if (!row) return;
        const reduce = HL.ui && HL.ui.reducedMotion && HL.ui.reducedMotion();
        row.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
        const btn = document.getElementById("startBtn");
        if (btn) { try { btn.focus({ preventScroll: true }); } catch (e) { btn.focus(); } }
      });
    }
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
