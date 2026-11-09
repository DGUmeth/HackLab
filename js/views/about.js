/* ============================================================
   about.js — how it was built + about the creator.
   ============================================================ */
(function () {
  "use strict";
  const HL = window.HL;
  const { el, icon } = HL.ui;
  HL.views = HL.views || {};

  HL.views.about = function () {
    const stack = [
      ["Markup", "Semantic HTML, hash-routed single page"],
      ["Styling", "Vanilla CSS with design tokens, no framework"],
      ["Logic", "Plain JavaScript, one module per attack"],
      ["State", "localStorage (wrapped in try/catch)"],
      ["Hosting", "Static — Vercel / GitHub Pages / Netlify"],
      ["A11y", "Keyboard-operable, ARIA labels, reduced-motion"]
    ];

    const safetyNote = el("div", { class: "card" }, [
      el("div", { class: "mod__kicker" }, [icon("shield", 22), el("h2", { attrs: { style: "font-size:var(--fs-h3)" }, text: "Everything here is simulated" })]),
      el("p", { class: "card__desc", attrs: { style: "margin-top:10px;font-size:var(--fs-body)" }, text: "No real exploits run. Inputs are matched against known demo payloads and the result is animated. User text is never executed — no eval, and user input is never injected as HTML. The “attacks” are safe visual demonstrations." })
    ]);

    const stackCard = el("div", { class: "card" }, [
      el("div", { class: "mod__kicker" }, [icon("code", 22), el("h2", { attrs: { style: "font-size:var(--fs-h3)" }, text: "How it's built" })]),
      el("ul", { class: "stacklist", attrs: { style: "margin-top:14px" } }, stack.map(([k, v]) => el("li", {}, [el("b", { text: k }), el("span", { text: v })])))
    ]);

    const creator = el("div", { class: "card", attrs: { style: "margin-top:20px" } }, [
      el("p", { class: "eyebrow", text: "Creator" }),
      el("h2", { attrs: { style: "margin-top:10px" }, text: "DG Umeth" }),
      el("p", { class: "lead", attrs: { style: "margin-top:10px" }, text: "IT graduate (Griffith University) aiming for entry-level networking, security and IT-support roles. Hack Lab is a portfolio piece built to make security basics click for non-technical people." }),
      el("div", { class: "hero__cta", attrs: { style: "justify-content:flex-start;margin-top:20px" } }, [
        linkBtn("Portfolio", "https://portfolio-henna-nine-57.vercel.app/", "arrowR", "primary"),
        linkBtn("GitHub", "https://github.com/DGUmeth", "code"),
        linkBtn("LinkedIn", "https://www.linkedin.com/in/umeth-mahanama-3b0a00215", "user"),
        linkBtn("Email", "mailto:umethmatara23@gmail.com", "mail")
      ])
    ]);

    const reset = el("div", { attrs: { style: "margin-top:28px" } }, [
      HL.ui.button("Reset my progress", { variant: "ghost", icon: "swap", onClick() {
        if (confirm("Reset all progress, badges and level choice?")) { HL.state.resetAll(); HL.ui.toast("Progress reset.", ""); location.hash = "#/"; }
      } })
    ]);

    return el("div", { class: "container" }, [
      el("div", { class: "map__head rise" }, [el("div", {}, [el("p", { class: "eyebrow", text: "About" }), el("h1", { attrs: { style: "margin-top:8px" }, text: "About Hack Lab" })])]),
      el("div", { class: "about__grid rise rise-1" }, [safetyNote, stackCard]),
      creator,
      reset
    ]);
  };

  function linkBtn(label, href, ic, variant) {
    const a = HL.ui.el("a", { class: "btn btn--" + (variant || "ghost"), attrs: { href, target: href.startsWith("mailto") ? null : "_blank", rel: "noopener" } }, [HL.ui.icon(ic, 16), HL.ui.el("span", { text: label })]);
    return a;
  }
})();
