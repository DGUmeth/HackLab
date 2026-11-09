/* ============================================================
   landing.js — hero + difficulty level select (the entry screen).
   ============================================================ */
(function () {
  "use strict";
  const HL = window.HL;
  const { el, icon } = HL.ui;

  const LEVELS = [
    { id: "beginner", dots: 1, title: "Beginner", desc: "Guided, visual, no code.", points: ["Hints on every step", "Plain-language labels", "Tap-to-try payloads"] },
    { id: "intermediate", dots: 2, title: "Intermediate", desc: "Fewer hints, some code.", points: ["Pick the right defence", "Safe vs unsafe snippets", "More decoys"] },
    { id: "advanced", dots: 3, title: "Advanced", desc: "No hints, you do the work.", points: ["Craft the payloads", "Choose the safe code", "Trickier variations"] }
  ];

  HL.views = HL.views || {};
  HL.views.landing = function () {
    const builtCount = HL.registry.filter((m) => m.built).length;

    const enterBtn = HL.ui.button("Enter the Lab", { variant: "primary", icon: "arrowR", onClick: enter });
    function enter() {
      if (!HL.state.hasChosen()) { HL.ui.toast("Pick a difficulty level to begin.", ""); scrollToCards(); return; }
      location.hash = "#/map";
    }
    function scrollToCards() { const c = document.getElementById("levelCards"); if (c) c.scrollIntoView({ behavior: "smooth", block: "center" }); }

    const hero = el("section", { class: "hero container rise" }, [
      el("p", { class: "eyebrow", text: "Safe · Simulated · Hands-on" }),
      el("h1", { class: "hero__title" }, [document.createTextNode("HACK "), el("span", { class: "fx", text: "LAB" })]),
      el("p", { class: "hero__tag", text: "Learn the most common web attacks by breaking things safely — then shut them down." }),
      el("div", { class: "hero__cta" }, [enterBtn, HL.ui.button("View cheat sheet", { variant: "ghost", icon: "shield", onClick: () => (location.hash = "#/cheatsheet") })]),
      el("div", { class: "hero__stats" }, [
        stat(builtCount, "Playable now"),
        stat(HL.registry.length, "Attacks mapped"),
        stat(3, "Difficulty levels")
      ])
    ]);

    // Level cards
    const chosen = HL.state.getLevel();
    const cards = el("div", { class: "grid grid-3 levelcards", id: "levelCards" }, LEVELS.map((lv, i) => {
      const card = el("button", {
        class: "card levelcard rise rise-" + (i + 1) + (chosen === lv.id ? " is-selected" : ""),
        attrs: { type: "button", "aria-pressed": chosen === lv.id ? "true" : "false" },
        onClick() {
          HL.state.setLevel(lv.id);
          cards.querySelectorAll(".levelcard").forEach((c) => { c.classList.remove("is-selected"); c.setAttribute("aria-pressed", "false"); });
          card.classList.add("is-selected"); card.setAttribute("aria-pressed", "true");
          HL.ui.toast(lv.title + " mode selected.", "safe");
          HL.refreshLevelSwitch && HL.refreshLevelSwitch();
          enterBtn.focus();
        }
      }, [
        el("div", { class: "levelcard__head" }, [
          el("span", { class: "card__num", text: "0" + (i + 1) }),
          el("span", { class: "levelcard__dots" }, [1, 2, 3].map((d) => el("i", { class: d <= lv.dots ? "on" : "" })))
        ]),
        el("div", { class: "card__title", text: lv.title }),
        el("div", { class: "card__desc", text: lv.desc }),
        el("ul", {}, lv.points.map((p) => el("li", { text: p })))
      ]);
      return card;
    }));

    const chooseLead = el("div", { class: "container section", attrs: { style: "padding-bottom:0" } }, [
      el("p", { class: "eyebrow", text: "Step 1" }),
      el("h2", { attrs: { style: "margin-top:8px" }, text: "Choose your level" }),
      el("p", { class: "lead", attrs: { style: "margin-top:8px" }, text: "Same attacks and animations at every level — only the hints and challenge change. Switch any time from the top bar." })
    ]);

    return el("div", {}, [hero, chooseLead, el("div", { class: "container", attrs: { style: "padding-bottom:40px" } }, [cards])]);
  };

  function stat(n, label) { return el("div", { class: "hero__stat" }, [el("b", { text: String(n) }), el("span", { text: label })]); }
})();
