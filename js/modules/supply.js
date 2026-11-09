/* ============================================================
   supply.js — Supply chain / typosquatting.
   TRY: find the malicious typosquatted package in the dependency tree.
   FIX: remove it, pin versions, and run an audit.
   ============================================================ */
(function () {
  "use strict";
  const HL = window.HL;
  const { el, icon } = HL.ui;
  const W = HL.widgets;
  function diagram(svg) { const w = el("div", { class: "diagram" }); w.innerHTML = svg; return w; }

  const DEPS = [
    { name: "express", ver: "^4.18.2", bad: false },
    { name: "lodash", ver: "^4.17.21", bad: false },
    { name: "lodahs", ver: "*", bad: true, why: "Typosquat of 'lodash' — one letter off, version unpinned." },
    { name: "chalk", ver: "^5.3.0", bad: false },
    { name: "axios", ver: "^1.6.0", bad: false }
  ];

  HL.registerModule("supply", {
    see() {
      return {
        title: "How a supply-chain attack works",
        instruction: "Your app trusts its dependencies. Sneak a malicious look-alike package into the tree and it runs with your app's access.",
        node: diagram(`<svg viewBox="0 0 640 200" role="img" aria-label="A typosquatted package hides in the dependency tree and ships inside your app.">
          <rect class="dg-node" x="250" y="20" width="140" height="44" rx="10"/><text class="dg-label" x="320" y="47" text-anchor="middle">your app</text>
          <path class="dg-line" d="M300 64 L180 120"/><path class="dg-line" d="M320 64 V120"/><path class="dg-line dg-flow" d="M340 64 L460 120"/>
          <rect class="dg-node" x="120" y="120" width="120" height="40" rx="8"/><text class="dg-label" x="180" y="145" text-anchor="middle">lodash</text>
          <rect class="dg-node" x="260" y="120" width="120" height="40" rx="8"/><text class="dg-label" x="320" y="145" text-anchor="middle">express</text>
          <rect class="dg-node" x="400" y="120" width="120" height="40" rx="8" stroke="#ff5257"/><text class="dg-label" x="460" y="145" text-anchor="middle" fill="#ff5257">lodahs</text>
          <circle class="dg-packet" r="5"><animateMotion dur="2.2s" repeatCount="indefinite" path="M340 64 L460 120"/></circle>
        </svg>`)
      };
    },

    tryIt(ctx) {
      const level = ctx.level;
      const banner = W.resultBanner();
      const list = el("div", { class: "grid", attrs: { style: "gap:8px" } });
      DEPS.forEach((d) => {
        const row = el("button", { class: "mailrow", attrs: { type: "button", style: "cursor:pointer;grid-template-columns:auto 1fr auto" }, onClick() {
          if (d.bad) { row.classList.add("is-open"); row.style.borderColor = "var(--danger)"; banner.show("Found it: " + d.name + " — " + d.why, "danger"); ctx.complete(); HL.ui.toast("Malicious package spotted.", "danger"); }
          else { HL.ui.toast(d.name + " looks legitimate.", ""); }
        } }, [el("span", {}, icon("package", 18)), el("div", {}, [el("span", { class: "mailrow__from", attrs: { style: "font-family:var(--font-mono)" }, text: d.name }), el("span", { class: "mailrow__sub", attrs: { style: "font-family:var(--font-mono)" }, text: d.ver })]), el("span", { class: "mailrow__time", text: "dependency" })]);
        list.appendChild(row);
      });

      let helper;
      if (level === "beginner") helper = W.hint("One package name is a look-alike of a popular one — compare the spelling of each carefully.");
      else if (level === "intermediate") helper = W.hint("A typosquat is one or two letters off a well-known package, often with a loose version.", ["beginner", "intermediate"]);
      else helper = el("p", { class: "mod__instruction", attrs: { style: "margin-top:12px" }, text: "Identify the malicious dependency." });

      return { title: "Find the imposter", instruction: "Here's your package.json dependency list. Click the one that doesn't belong.", node: el("div", {}, [list, helper, banner.node]) };
    },

    fix(ctx) {
      const level = ctx.level;
      const banner = W.resultBanner();
      let removed = false, pinned = false, audited = false, chosen = level === "beginner";
      const need = level === "advanced" ? () => removed && pinned && audited : () => removed && pinned;

      const removeBtn = HL.ui.button("Remove 'lodahs'", { variant: "ghost", icon: "x", onClick() { removed = true; removeBtn.disabled = true; HL.ui.toast("Typosquat removed.", "safe"); } });
      const t1 = W.toggle({ label: "Pin exact versions", sub: "No surprise updates (lockfile)", onChange(v) { pinned = v; } });
      const t2 = W.toggle({ label: "Run dependency audit in CI", sub: "Catch known-bad packages", onChange(v) { audited = v; } });

      function rerun() {
        if (!chosen) { banner.show("Pick the right fix first.", "danger"); return; }
        if (need()) { banner.show("Clean build. The imposter is gone, versions are pinned" + (level === "advanced" ? ", and the audit guards future installs." : "."), "safe"); ctx.complete(); HL.ui.toast("Supply chain secured.", "safe"); }
        else banner.show("Not safe yet — remove the imposter and pin versions" + (level === "advanced" ? " and enable the audit." : "."), "danger");
      }

      let chooser = null;
      if (level !== "beginner") {
        const opts = level === "advanced"
          ? [{ text: "Remove the typosquat, pin exact versions, and audit in CI.", correct: true }, { text: "Trust it — it has lots of weekly downloads.", correct: false }, { text: "Rename it in your imports.", correct: false }]
          : [{ text: "Remove the look-alike and pin your versions.", correct: true }, { text: "Update everything to the latest.", correct: false }, { text: "Ignore it; it's just one package.", correct: false }];
        chooser = W.chooser("How do you clean this up?", opts, () => { chosen = true; HL.ui.announce("Correct — remove it, pin versions, re-run."); });
      }

      return { title: "Clean the tree", instruction: "Remove the imposter and pin your versions, then re-run the install.", node: el("div", {}, [chooser, el("div", { attrs: { style: "margin-bottom:14px" } }, [removeBtn]), el("div", { attrs: { style: "display:grid;gap:12px;margin-bottom:16px;max-width:460px" } }, [t1.node, t2.node]), HL.ui.button("Re-run install", { variant: "primary", icon: "swap", onClick: rerun }), W.hint("Pinning versions (a lockfile) stops a bad update sneaking in; an audit flags known-malicious packages.", ["beginner"]), banner.node]) };
    },

    quiz(ctx) {
      const passed = W.resultBanner();
      const q = [
        { q: "What is typosquatting?", options: [{ text: "A malicious package named almost like a popular one.", correct: true }, { text: "A typo in your code.", correct: false }, { text: "A slow download.", correct: false }] },
        { q: "Which helps prevent it?", options: [{ text: "Pinning versions and auditing dependencies.", correct: true }, { text: "Installing more packages.", correct: false }, { text: "A longer password.", correct: false }] }
      ];
      if (ctx.level !== "beginner") q.push({ q: "Why are 'lots of downloads' not proof of safety?", options: [{ text: "Downloads can be faked or inflated by the attacker.", correct: true }, { text: "Downloads are always real.", correct: false }, { text: "Popular packages can't be malicious.", correct: false }] });
      return { title: "Quick check", instruction: "Answer each question to earn the badge.", node: el("div", {}, [W.quiz(q, { onPass() { passed.show("Your dependency tree is safer now.", "safe"); ctx.complete(); } }), passed.node]) };
    }
  });
})();
