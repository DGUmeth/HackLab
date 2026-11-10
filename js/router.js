/* ============================================================
   router.js, tiny hash router. Renders the matching view into
   #app. Routes:
     #/                → landing (level select)
     #/map             → mission map
     #/module/<id>     → attack module (4-step flow)
     #/boss            → final boss
     #/cheatsheet      → cheat sheet
     #/about           → about
   ============================================================ */
(function () {
  "use strict";
  const HL = window.HL;

  // Routes that are reachable before a level has been chosen.
  const PRE_CHOICE_OK = ["#/", "", "#/about", "#/cheatsheet"];

  function parse() {
    const hash = location.hash || "#/";
    const parts = hash.replace(/^#\//, "").split("/"); // ["module","sqli"]
    return { hash, name: parts[0] || "", param: parts[1] || "" };
  }

  function render() {
    const app = document.getElementById("app");
    if (!app) return;
    const { hash, name, param } = parse();

    // Gate: force a level choice on first entry into interactive areas.
    if (!HL.state.hasChosen() && !PRE_CHOICE_OK.includes(hash) && name !== "") {
      location.hash = "#/";
      return;
    }

    let view;
    try {
      switch (name) {
        case "": view = HL.views.landing(); break;
        case "map": view = HL.views.missionMap(); break;
        case "module": view = HL.renderModule(param); break;
        case "boss": view = HL.views.boss(); break;
        case "cheatsheet": view = HL.views.cheatsheet(); break;
        case "about": view = HL.views.about(); break;
        default: view = HL.views.landing(); break;
      }
    } catch (err) {
      console.error("View render error:", err);
      view = HL.ui.el("div", { class: "container soon" }, [HL.ui.el("h1", { text: "Something went wrong" }), HL.ui.el("p", { class: "lead", text: "Try returning to the mission map." })]);
    }

    HL.ui.clear(app).appendChild(view);
    // Respect reduced-motion for SMIL (SVG) animations, which CSS can't stop.
    if (HL.ui.reducedMotion()) {
      app.querySelectorAll("svg").forEach((s) => { try { s.pauseAnimations && s.pauseAnimations(); } catch (e) {} });
    }
    window.scrollTo({ top: 0, behavior: "auto" });
    app.focus();
    updateActiveNav(name);
    closeMobileMenu();
  }

  function updateActiveNav(name) {
    const map = { map: "#/map", module: "#/map", boss: "#/boss", cheatsheet: "#/cheatsheet", about: "#/about" };
    const active = map[name] || "";
    document.querySelectorAll("[data-navlink]").forEach((a) => {
      a.classList.toggle("is-active", a.getAttribute("href") === active);
    });
  }

  function closeMobileMenu() {
    const menu = document.getElementById("navMenu");
    const toggle = document.getElementById("navToggle");
    if (menu) menu.classList.remove("is-open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  }

  HL.router = { render };
  window.addEventListener("hashchange", render);
})();
