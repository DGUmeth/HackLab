/* ============================================================
   credstuff.js — Credential stuffing / brute force.
   TRY: see a password's crack time, then watch one reused
   password unlock several sites. FIX: unique passwords + MFA.
   ============================================================ */
(function () {
  "use strict";
  const HL = window.HL;
  const { el, icon } = HL.ui;
  const W = HL.widgets;

  // Rough, illustrative crack-time estimate (not real security advice).
  function crackTime(pw) {
    if (!pw) return { label: "—", pct: 0, cls: "" };
    let pool = 0;
    if (/[a-z]/.test(pw)) pool += 26;
    if (/[A-Z]/.test(pw)) pool += 26;
    if (/[0-9]/.test(pw)) pool += 10;
    if (/[^a-zA-Z0-9]/.test(pw)) pool += 30;
    const common = ["password", "123456", "qwerty", "letmein", "admin", "password123", "iloveyou"];
    if (common.some((c) => pw.toLowerCase().includes(c))) return { label: "instantly (known leaked password)", pct: 100, cls: "high" };
    const guesses = Math.pow(pool || 1, pw.length);
    const seconds = guesses / 1e10; // 10B guesses/sec
    let label, pct, cls;
    if (seconds < 1) { label = "instantly"; pct = 100; cls = "high"; }
    else if (seconds < 3600) { label = Math.round(seconds) + " seconds"; pct = 85; cls = "high"; }
    else if (seconds < 86400 * 30) { label = "a few hours–days"; pct = 55; cls = "mid"; }
    else if (seconds < 86400 * 3650) { label = "a few years"; pct = 30; cls = ""; }
    else { label = "centuries"; pct = 12; cls = ""; }
    return { label, pct, cls };
  }

  function diagram(svg) { const w = el("div", { class: "diagram" }); w.innerHTML = svg; return w; }

  HL.registerModule("credstuff", {
    see() {
      return {
        title: "How credential stuffing works",
        instruction: "Attackers take passwords leaked from one site and try them on hundreds of others — reused passwords open every door.",
        node: diagram(`<svg viewBox="0 0 640 210" role="img" aria-label="A leaked password is tried against many sites and logs in everywhere it was reused.">
          <rect class="dg-node" x="16" y="78" width="130" height="56" rx="10"/><text class="dg-label" x="81" y="105" text-anchor="middle">Leaked list</text><text class="dg-label" x="81" y="121" text-anchor="middle" fill="#ff5257">bob:hunter2</text>
          <path class="dg-line dg-flow" d="M146 106 H250"/>
          <rect class="dg-node" x="250" y="30" width="120" height="40" rx="8"/><text class="dg-label" x="310" y="55" text-anchor="middle">Email ✓</text>
          <rect class="dg-node" x="250" y="90" width="120" height="40" rx="8"/><text class="dg-label" x="310" y="115" text-anchor="middle">Bank ✓</text>
          <rect class="dg-node" x="250" y="150" width="120" height="40" rx="8"/><text class="dg-label" x="310" y="175" text-anchor="middle">Shop ✓</text>
          <circle class="dg-packet" r="5"><animateMotion dur="2.2s" repeatCount="indefinite" path="M146 106 C 210 106, 210 50, 250 50"/></circle>
          <circle class="dg-packet" r="5"><animateMotion dur="2.2s" begin="0.7s" repeatCount="indefinite" path="M146 106 H250"/></circle>
          <circle class="dg-packet" r="5"><animateMotion dur="2.2s" begin="1.4s" repeatCount="indefinite" path="M146 106 C 210 106, 210 170, 250 170"/></circle>
        </svg>`)
      };
    },

    tryIt(ctx) {
      const level = ctx.level;
      const pwIn = el("input", { class: "input", attrs: { type: "text", "aria-label": "Password to test", placeholder: "type a password", autocomplete: "off", spellcheck: "false" } });
      const label = el("b", { text: "—" });
      const fill = el("div", { class: "meter__fill" });
      const meter = el("div", {}, [el("div", { class: "meter__cap" }, [el("span", { text: "Time to crack" }), label]), el("div", { class: "meter" }, [fill])]);
      function refresh() { const r = crackTime(pwIn.value); label.textContent = r.label; fill.style.width = (r.pct || 2) + "%"; fill.className = "meter__fill " + r.cls; }
      pwIn.addEventListener("input", refresh); refresh();

      const banner = W.resultBanner();
      const sites = ["Email", "Bank", "Shop"];
      const rack = el("div", { class: "grid", attrs: { style: "gap:8px;margin-top:14px" } }, sites.map((s) => el("div", { class: "threat", attrs: { "data-site": s } }, [el("b", { text: s }), el("span", { class: "threat__status", text: "locked" })])));

      function stuff() {
        const weak = crackTime(pwIn.value).pct >= 85 || !pwIn.value;
        if (!weak) { banner.show("Strong and unique — stuffing this would take far too long.", "safe"); return; }
        let i = 0;
        const rows = rack.querySelectorAll(".threat");
        const t = setInterval(() => {
          if (i >= rows.length) { clearInterval(t); banner.show("One reused password unlocked every account.", "danger"); ctx.complete(); HL.ui.toast("All accounts breached — now fix it.", "danger"); return; }
          rows[i].classList.add("caught"); rows[i].querySelector(".threat__status").textContent = "unlocked ✓"; i++;
        }, 450);
      }

      let helper;
      if (level === "beginner") helper = el("div", { attrs: { style: "margin-top:12px" } }, [
        el("div", { class: "chips" }, [W.payloadChip("password123", () => { pwIn.value = "password123"; refresh(); }), W.payloadChip("Tr0ub4dour&3xplore!", () => { pwIn.value = "Tr0ub4dour&3xplore!"; refresh(); })]),
        W.hint("Try the weak one, press Stuff, and watch it open every site. Then try the long one.")
      ]);
      else if (level === "intermediate") helper = W.hint("Weak or leaked passwords crack instantly — and if reused, one hit opens them all.", ["beginner", "intermediate"]);
      else helper = el("p", { class: "mod__instruction", attrs: { style: "margin-top:12px" }, text: "Find a password weak enough to be stuffed across all three sites." });

      return {
        title: "Reuse = one key for every lock",
        instruction: "Test a password's strength, then run the stuffing attack across three sites.",
        node: el("div", { class: "grid grid-2" }, [
          el("div", { class: "fakeui" }, [el("div", { class: "fakeui__bar" }, [el("div", { class: "fakeui__dots" }, [el("i"), el("i"), el("i")]), el("div", { class: "fakeui__url", text: "password strength" })]), el("div", { class: "fakeui__body" }, [el("div", { class: "field" }, [el("label", { text: "Password" }), pwIn]), el("div", { attrs: { style: "margin:4px 0 16px" } }, [meter]), HL.ui.button("Stuff it across sites", { variant: "primary", icon: "key", onClick: stuff }), helper])]),
          el("div", {}, [rack, banner.node])
        ])
      };
    },

    fix(ctx) {
      const level = ctx.level;
      const banner = W.resultBanner();
      let unique = false, mfa = false, chosen = level === "beginner";
      const sites = el("div", { class: "grid", attrs: { style: "gap:8px;margin-top:4px" } }, ["Email", "Bank", "Shop"].map((s) => el("div", { class: "threat" }, [el("b", { text: s }), el("span", { class: "threat__status", text: "exposed" })])));

      function rerun() {
        if (!chosen) { banner.show("Pick the defences that actually help first.", "danger"); return; }
        if (unique && mfa) {
          sites.querySelectorAll(".threat").forEach((r) => { r.classList.add("caught"); r.querySelector(".threat__status").textContent = "protected ✓"; });
          banner.show("Blocked. Unique passwords stop reuse, and MFA stops the leaked one working.", "safe");
          ctx.complete(); HL.ui.toast("Accounts protected.", "safe");
        } else banner.show("Still exposed — you need both unique passwords and MFA.", "danger");
      }

      const t1 = W.toggle({ label: "Unique password per site", sub: "A leak can't unlock the others", onChange(v) { unique = v; } });
      const t2 = W.toggle({ label: "Enable MFA / 2FA", sub: "A password alone isn't enough", onChange(v) { mfa = v; } });

      let chooser = null;
      if (level !== "beginner") {
        const opts = level === "advanced"
          ? [{ text: "Unique passwords + MFA (and a password manager).", correct: true }, { text: "Force a 90-day password rotation only.", correct: false }, { text: "Add a CAPTCHA and call it done.", correct: false }]
          : [{ text: "Use a different password on every site, plus MFA.", correct: true }, { text: "Make the one password longer.", correct: false }, { text: "Change the username.", correct: false }];
        chooser = W.chooser("Which actually stops credential stuffing?", opts, () => { chosen = true; HL.ui.announce("Correct — now enable the toggles and re-run."); });
      }

      return {
        title: "Close every lock",
        instruction: "Turn on unique passwords and MFA, then re-run the stuffing attack and watch it fail.",
        node: el("div", {}, [el("div", { class: "grid grid-2" }, [
          el("div", {}, [chooser, el("div", { attrs: { style: "display:grid;gap:12px;margin-bottom:16px" } }, [t1.node, t2.node]), HL.ui.button("Re-run the attack", { variant: "primary", icon: "swap", onClick: rerun }), W.hint("A password manager makes a unique password per site practical; MFA blocks logins even if one leaks.", ["beginner"])]),
          el("div", {}, [sites, banner.node])
        ])])
      };
    },

    quiz(ctx) {
      const passed = W.resultBanner();
      const q = [
        { q: "Why is reusing one password dangerous?", options: [{ text: "A leak on one site unlocks all the others.", correct: true }, { text: "It uses more storage.", correct: false }, { text: "It slows logins.", correct: false }] },
        { q: "Best single defence if a password leaks?", options: [{ text: "MFA — a password alone can't log in.", correct: true }, { text: "A longer username.", correct: false }, { text: "Clearing cookies.", correct: false }] }
      ];
      if (ctx.level !== "beginner") q.push({ q: "How do you keep a unique password per site?", options: [{ text: "Use a password manager.", correct: true }, { text: "Add 1, 2, 3 to the end.", correct: false }, { text: "Memorise one strong one.", correct: false }] });
      return { title: "Quick check", instruction: "Answer each question to earn the badge.", node: el("div", {}, [W.quiz(q, { onPass() { passed.show("Reuse won't catch you out now.", "safe"); ctx.complete(); } }), passed.node]) };
    }
  });
})();
