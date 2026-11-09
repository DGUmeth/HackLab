/* ============================================================
   cheatsheet.js — one visual card per attack (icon + one-line
   defence). Printable in black-and-white (see print.css).
   ============================================================ */
(function () {
  "use strict";
  const HL = window.HL;
  const { el, icon } = HL.ui;
  HL.views = HL.views || {};

  HL.views.cheatsheet = function () {
    const grid = el("div", { class: "cheat-grid" }, HL.registry.map((m, i) =>
      el("div", { class: "card cheat rise rise-" + ((i % 4) + 1) }, [
        el("div", { attrs: { style: "display:flex;align-items:center;justify-content:space-between" } }, [
          el("span", { class: "cheat__icon" }, icon(m.icon, 32)),
          el("span", { class: "card__num", text: m.num })
        ]),
        el("div", { class: "cheat__name", text: m.title }),
        // defence contains a trusted <b> tag from our own registry — safe static HTML
        el("div", { class: "cheat__def", html: "<b>Defend:</b> " + m.defence })
      ])
    ));

    return el("div", { class: "container" }, [
      el("div", { class: "map__head rise" }, [
        el("div", {}, [el("p", { class: "eyebrow", text: "Reference" }), el("h1", { attrs: { style: "margin-top:8px" }, text: "Defence cheat sheet" })]),
        HL.ui.button("Print", { variant: "ghost", icon: "download", onClick: () => window.print() })
      ]),
      el("p", { class: "lead", attrs: { style: "margin:10px 0 28px" }, text: "One attack, one defence. Print it in black and white and pin it up." }),
      grid,
      el("p", { class: "print-hint", attrs: { style: "margin-top:20px;color:var(--text-3)" }, text: "Hack Lab — hacklab by DG Umeth" })
    ]);
  };
})();
