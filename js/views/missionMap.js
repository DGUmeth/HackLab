/* ============================================================
   missionMap.js — the visual level map: one numbered node per
   attack with locked / in-progress / completed state, a progress
   bar, and earned badges.
   ============================================================ */
(function () {
  "use strict";
  const HL = window.HL;
  const { el, icon } = HL.ui;
  HL.views = HL.views || {};

  HL.views.missionMap = function () {
    const built = HL.registry.filter((m) => m.built);
    const doneCount = built.filter((m) => HL.state.hasBadge(m.id)).length;
    const pct = built.length ? Math.round((doneCount / built.length) * 100) : 0;
    const level = HL.state.getLevel() || "beginner";

    // ---- Header + progress ----
    const fill = el("div", { class: "progress__fill" });
    setTimeout(() => (fill.style.width = pct + "%"), 60);
    const head = el("div", { class: "map__head rise" }, [
      el("div", {}, [
        el("p", { class: "eyebrow", text: "Mission map · " + HL.state.levelLabel(level) + " mode" }),
        el("h1", { attrs: { style: "margin-top:8px" }, text: "Pick an attack to master" })
      ]),
      el("div", { class: "map__progress" }, [
        el("div", { class: "meta" }, [el("span", { text: doneCount + " of " + built.length + " modules complete" }), el("span", { text: pct + "%" })]),
        el("div", { class: "progress" }, [fill])
      ])
    ]);

    // ---- Nodes ----
    const nodes = el("div", { class: "grid grid-3 nodes" }, HL.registry.map((m, i) => node(m, i)));

    // ---- Badges row ----
    const earned = HL.registry.filter((m) => HL.state.hasBadge(m.id));
    const badgeRow = el("div", {}, [
      el("h2", { attrs: { style: "margin-top:56px" }, text: "Badges" }),
      el("p", { class: "lead", attrs: { style: "margin:8px 0 18px" }, text: earned.length ? "Earned by finishing a module's quick check." : "Finish a module's quick check to earn your first badge." }),
      el("div", { class: "badges-row" }, built.map((m) => {
        const got = HL.state.hasBadge(m.id);
        return el("span", { class: "badge " + (got ? "badge--earned" : "badge--locked") }, [icon(got ? "trophy" : "lock", 14), el("span", { text: m.short })]);
      }))
    ]);

    // ---- Boss teaser ----
    const bossCard = el("div", { class: "card rise", attrs: { style: "margin-top:40px;display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap" } }, [
      el("div", {}, [
        el("div", { class: "mod__kicker" }, [icon("trophy", 22), el("h2", { attrs: { style: "font-size:var(--fs-h3)" }, text: "Final boss challenge" })]),
        el("p", { class: "card__desc", attrs: { style: "margin-top:8px;max-width:48ch" }, text: "Spot and stop several attacks hidden in one fake company site." })
      ]),
      HL.ui.button("Face the boss", { variant: "primary", icon: "arrowR", onClick: () => (location.hash = "#/boss") })
    ]);

    return el("div", { class: "container" }, [head, nodes, badgeRow, bossCard]);
  };

  function node(m, i) {
    const built = m.built;
    const status = built ? HL.state.getModuleStatus(m.id) : "locked";
    const statusMap = { todo: ["todo", "Start"], progress: ["todo", "In progress"], done: ["done", "Completed"], locked: ["locked", "Coming soon"] };
    const [cls, label] = statusMap[status];

    const card = el("div", {
      class: "card node rise rise-" + ((i % 4) + 1) + (built ? "" : " is-locked"),
      attrs: built ? { role: "link", tabindex: "0", "aria-label": m.title + " — " + label } : { "aria-label": m.title + " — coming soon" }
    }, [
      el("div", { class: "node__top" }, [
        el("span", { class: "card__num", text: m.num }),
        el("span", { class: "node__status " + cls, text: label })
      ]),
      el("span", { class: "node__icon" }, icon(m.icon, 36)),
      el("div", {}, [el("div", { class: "card__title", attrs: { style: "font-size:var(--fs-h3)" }, text: m.title }), el("div", { class: "card__desc", text: m.blurb })]),
      el("div", { class: "node__foot" }, [
        el("div", { class: "chips" }, m.tags.slice(0, 2).map((t) => HL.ui.chip(t))),
        built ? el("span", { class: "node__go" }, [status === "done" ? "Review " : "Open ", icon("arrowR", 14)]) : icon("lock", 18)
      ])
    ]);

    if (built) {
      const open = () => (location.hash = "#/module/" + m.id);
      card.addEventListener("click", open);
      card.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
      card.style.cursor = "pointer";
    } else {
      card.addEventListener("click", () => HL.ui.toast(m.title + " — coming soon.", ""));
    }
    return card;
  }
})();
