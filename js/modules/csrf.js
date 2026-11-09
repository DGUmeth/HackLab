/* ============================================================
   csrf.js — Cross-Site Request Forgery.
   TRY: an evil tab makes your browser send a money transfer to
   the bank using your logged-in cookie. FIX: CSRF token + SameSite.
   ============================================================ */
(function () {
  "use strict";
  const HL = window.HL;
  const { el, icon } = HL.ui;
  const W = HL.widgets;
  function diagram(svg) { const w = el("div", { class: "diagram" }); w.innerHTML = svg; return w; }

  HL.registerModule("csrf", {
    see() {
      return {
        title: "How CSRF works",
        instruction: "While you're logged into your bank, an evil page makes your browser send a request — and the browser attaches your cookie automatically.",
        node: diagram(`<svg viewBox="0 0 640 210" role="img" aria-label="An evil tab triggers a request to the bank; the browser auto-attaches the user's session cookie.">
          <rect class="dg-node" x="16" y="30" width="130" height="50" rx="10"/><text class="dg-label" x="81" y="60" text-anchor="middle">Evil tab</text>
          <rect class="dg-node" x="16" y="130" width="130" height="50" rx="10"/><text class="dg-label" x="81" y="160" text-anchor="middle">You (logged in)</text>
          <rect class="dg-node" x="494" y="80" width="130" height="50" rx="10"/><text class="dg-label" x="559" y="110" text-anchor="middle">Bank</text>
          <path class="dg-line dg-flow" d="M146 55 C 320 55, 360 100, 494 105"/>
          <path class="dg-line" stroke-dasharray="4 6" d="M146 155 C 320 155, 360 115, 494 110"/>
          <text class="dg-label" x="330" y="45" text-anchor="middle">forged "transfer €5000"</text>
          <text class="dg-label" x="330" y="185" text-anchor="middle" fill="#ff5257">+ your cookie (auto)</text>
          <circle class="dg-packet" r="5"><animateMotion dur="2.4s" repeatCount="indefinite" path="M146 55 C 320 55, 360 100, 494 105"/></circle>
        </svg>`)
      };
    },

    tryIt(ctx) {
      const level = ctx.level;
      const banner = W.resultBanner();
      const balance = el("b", { text: "€8,000", attrs: { style: "font-size:1.4rem;font-family:var(--font-head)" } });
      const bank = el("div", { class: "fakeui" }, [el("div", { class: "fakeui__bar" }, [el("div", { class: "fakeui__dots" }, [el("i"), el("i"), el("i")]), el("div", { class: "fakeui__url", text: "https://mybank.example  ·  logged in ✓" })]), el("div", { class: "fakeui__body" }, [el("p", { class: "eyebrow", text: "Your balance" }), balance])]);

      function forge() {
        banner.show("The evil page's hidden request transferred €5,000 — your browser sent your cookie with it.", "danger");
        balance.textContent = "€3,000";
        bank.classList.add("flash-danger"); setTimeout(() => bank.classList.remove("flash-danger"), 1100);
        ctx.complete(); HL.ui.toast("Forged transfer went through.", "danger");
      }

      const evil = el("div", { class: "fakeui", attrs: { style: "border-color:rgba(255,82,87,.4)" } }, [
        el("div", { class: "fakeui__bar" }, [el("div", { class: "fakeui__dots" }, [el("i"), el("i"), el("i")]), el("div", { class: "fakeui__url", text: "http://free-prize.example" })]),
        el("div", { class: "fakeui__body" }, [el("p", { attrs: { style: "font-family:var(--font-head);font-size:1.2rem;margin-bottom:6px" }, text: "🎁 You won a prize!" }), el("p", { class: "card__desc", attrs: { style: "margin-bottom:14px" }, text: "Click to claim (this secretly posts to your bank)." }), HL.ui.button("Claim prize", { variant: "primary", onClick: forge })])
      ]);

      const helper = level === "beginner" ? W.hint("Click “Claim prize” on the evil tab and watch your bank balance drop — you never touched the bank tab.")
        : (level === "intermediate" ? null : el("p", { class: "mod__instruction", text: "Trigger the forged request from the evil tab, then defend the bank." }));

      return { title: "The evil tab acts as you", instruction: "You're logged into your bank in one tab. Click the trap in the evil tab and watch what happens.", node: el("div", {}, [el("div", { class: "grid grid-2" }, [bank, evil]), helper, banner.node]) };
    },

    fix(ctx) {
      const level = ctx.level;
      const banner = W.resultBanner();
      let token = false, samesite = false, chosen = level === "beginner";
      const t1 = W.toggle({ label: "Require a CSRF token", sub: "A secret the evil page can't know", onChange(v) { token = v; } });
      const t2 = W.toggle({ label: "SameSite=Strict cookie", sub: "Don't send the cookie cross-site", onChange(v) { samesite = v; } });

      function rerun() {
        if (!chosen) { banner.show("Choose the real defences first.", "danger"); return; }
        if (token || samesite) { banner.show("Rejected (403). The forged request has no valid CSRF token / the cookie wasn't sent cross-site.", "safe"); ctx.complete(); HL.ui.toast("Forgery blocked.", "safe"); }
        else banner.show("Still forged — the request went through.", "danger");
      }

      let chooser = null;
      if (level !== "beginner") {
        const opts = level === "advanced"
          ? [{ html: 'Add a per-request <code class="tok-safe">CSRF token</code> + <code class="tok-safe">SameSite=Strict</code>', correct: true }, { html: 'Check the <code class="tok-inject">Referer</code> header only', correct: false }, { html: 'Use <code class="tok-inject">GET</code> for the transfer', correct: false }]
          : [{ text: "Require a secret CSRF token and set SameSite cookies.", correct: true }, { text: "Make the transfer button bigger.", correct: false }, { text: "Hide the bank's URL.", correct: false }];
        chooser = W.chooser("Which actually stops CSRF?", opts, () => { chosen = true; HL.ui.announce("Correct — enable it and re-run."); });
      }

      return { title: "Prove it's really you", instruction: "Add a CSRF token and SameSite cookie, then re-run the evil tab's forged request.", node: el("div", {}, [chooser, el("div", { attrs: { style: "display:grid;gap:12px;margin-bottom:16px;max-width:460px" } }, [t1.node, t2.node]), HL.ui.button("Re-run the forged request", { variant: "primary", icon: "swap", onClick: rerun }), W.hint("The token is a secret value on your bank's page; the evil site can't read it, so its request is rejected.", ["beginner"]), banner.node]) };
    },

    quiz(ctx) {
      const passed = W.resultBanner();
      const q = [
        { q: "What makes CSRF possible?", options: [{ text: "The browser auto-sends your cookie with cross-site requests.", correct: true }, { text: "A weak password.", correct: false }, { text: "An out-of-date browser.", correct: false }] },
        { q: "Which stops it?", options: [{ text: "A per-request CSRF token + SameSite cookies.", correct: true }, { text: "HTTPS alone.", correct: false }, { text: "A longer session.", correct: false }] }
      ];
      if (ctx.level !== "beginner") q.push({ q: "Why isn't checking Referer enough?", options: [{ text: "It can be missing or spoofed in some cases.", correct: true }, { text: "It's too slow.", correct: false }, { text: "It encrypts the request.", correct: false }] });
      return { title: "Quick check", instruction: "Answer each question to earn the badge.", node: el("div", {}, [W.quiz(q, { onPass() { passed.show("Forged requests won't fool you.", "safe"); ctx.complete(); } }), passed.node]) };
    }
  });
})();
