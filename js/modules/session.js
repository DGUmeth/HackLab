/* ============================================================
   session.js — Session hijacking.
   TRY: steal a session cookie and reuse it to become the victim.
   FIX: Secure + HttpOnly + short expiry + regenerate-on-login.
   ============================================================ */
(function () {
  "use strict";
  const HL = window.HL;
  const { el, icon } = HL.ui;
  const W = HL.widgets;
  function diagram(svg) { const w = el("div", { class: "diagram" }); w.innerHTML = svg; return w; }

  HL.registerModule("session", {
    see() {
      return {
        title: "How session hijacking works",
        instruction: "Your session cookie proves it's you. If an attacker copies it, they're logged in as you — no password needed.",
        node: diagram(`<svg viewBox="0 0 640 200" role="img" aria-label="An attacker copies a session cookie and reuses it to log in as the victim.">
          <rect class="dg-node" x="16" y="72" width="120" height="56" rx="10"/><text class="dg-label" x="76" y="98" text-anchor="middle">Victim</text><text class="dg-label" x="76" y="114" text-anchor="middle">SESSION=9f3a</text>
          <path class="dg-line" stroke-dasharray="4 6" d="M136 100 H300"/>
          <rect class="dg-node" x="300" y="72" width="120" height="56" rx="10"/><text class="dg-label" x="360" y="104" text-anchor="middle" fill="#ff5257">attacker copies</text>
          <path class="dg-line dg-flow" d="M420 100 H520"/>
          <rect class="dg-node" x="520" y="72" width="104" height="56" rx="10"/><text class="dg-label" x="572" y="104" text-anchor="middle">Site: "Hi Victim"</text>
          <circle class="dg-packet" r="5"><animateMotion dur="2.2s" repeatCount="indefinite" path="M300 100 H520"/></circle>
        </svg>`)
      };
    },

    tryIt(ctx) {
      const level = ctx.level;
      const banner = W.resultBanner();
      const cookie = "SESSION=9f3a8c1b7e2d";
      const stolen = el("pre", { class: "code", text: "(no cookie yet)" });
      const who = el("b", { text: "— not logged in —" });

      function steal() { stolen.textContent = cookie; stolen.className = "code tok-inject"; HL.ui.toast("Cookie copied from the victim.", "danger"); }
      function reuse() {
        if (stolen.textContent.indexOf("SESSION") === -1) { banner.show("Steal the cookie first.", "safe"); return; }
        who.textContent = "Logged in as Victim ✓";
        banner.show("The attacker pasted your cookie and is now logged in as you.", "danger");
        ctx.complete(); HL.ui.toast("Session hijacked.", "danger");
      }

      const helper = level === "beginner" ? W.hint("Press Steal, then Reuse — the attacker becomes you with no password.")
        : (level === "intermediate" ? null : el("p", { class: "mod__instruction", text: "Capture the session cookie and use it to take over the account." }));

      return { title: "Copy the cookie, become the user", instruction: "Steal the victim's session cookie, then reuse it to log in as them.", node: el("div", { class: "grid grid-2" }, [
        el("div", {}, [el("div", { class: "fakeui" }, [el("div", { class: "fakeui__bar" }, [el("div", { class: "fakeui__dots" }, [el("i"), el("i"), el("i")]), el("div", { class: "fakeui__url", text: "attacker console" })]), el("div", { class: "fakeui__body" }, [el("p", { class: "eyebrow", text: "Captured cookie" }), stolen, el("div", { attrs: { style: "display:flex;gap:10px;margin-top:14px" } }, [HL.ui.button("Steal cookie", { variant: "ghost", icon: "cookie", onClick: steal }), HL.ui.button("Reuse it", { variant: "primary", onClick: reuse })])])]), helper]),
        el("div", {}, [el("p", { class: "eyebrow", text: "The website" }), el("div", { class: "card", attrs: { style: "margin-top:8px" } }, [who]), banner.node])
      ]) };
    },

    fix(ctx) {
      const level = ctx.level;
      const banner = W.resultBanner();
      const flags = { httpOnly: false, secure: false, expiry: false, regen: false };
      let chosen = level === "beginner";
      const need = level === "advanced" ? ["httpOnly", "secure", "expiry", "regen"] : ["httpOnly", "secure"];

      const toggles = [
        ["httpOnly", "HttpOnly", "JavaScript can't read the cookie"],
        ["secure", "Secure", "Only sent over HTTPS"],
        ["expiry", "Short expiry", "Stolen cookies die quickly"],
        ["regen", "Regenerate on login", "Old cookie becomes useless"]
      ].map(([k, label, sub]) => { const t = W.toggle({ label, sub, onChange(v) { flags[k] = v; } }); return t.node; });

      function rerun() {
        if (!chosen) { banner.show("Pick the right protections first.", "danger"); return; }
        const ok = need.every((k) => flags[k]);
        if (ok) { banner.show("Blocked. The cookie can't be read or reused — the stolen one is rejected.", "safe"); ctx.complete(); HL.ui.toast("Session protected.", "safe"); }
        else banner.show("Still hijackable — turn on " + (level === "advanced" ? "all four protections" : "HttpOnly and Secure") + ".", "danger");
      }

      let chooser = null;
      if (level !== "beginner") {
        const opts = level === "advanced"
          ? [{ text: "HttpOnly + Secure + short expiry + regenerate on login.", correct: true }, { text: "Store the session in localStorage instead.", correct: false }, { text: "Make the cookie value longer.", correct: false }]
          : [{ text: "HttpOnly and Secure cookie flags.", correct: true }, { text: "A longer password.", correct: false }, { text: "A custom cookie name.", correct: false }];
        chooser = W.chooser("Which protects the session cookie?", opts, () => { chosen = true; HL.ui.announce("Correct — enable the flags and re-run."); });
      }

      return { title: "Protect the cookie", instruction: "Turn on the cookie protections, then re-run the hijack and watch it fail.", node: el("div", {}, [chooser, el("div", { attrs: { style: "display:grid;gap:12px;margin-bottom:16px;max-width:520px" } }, toggles), HL.ui.button("Re-run the hijack", { variant: "primary", icon: "swap", onClick: rerun }), W.hint("HttpOnly stops scripts reading it; Secure keeps it off plain HTTP; expiry + regeneration limit a stolen one.", ["beginner"]), banner.node]) };
    },

    quiz(ctx) {
      const passed = W.resultBanner();
      const q = [
        { q: "What is a session cookie?", options: [{ text: "A token that proves you're logged in.", correct: true }, { text: "Your saved password.", correct: false }, { text: "A cache file.", correct: false }] },
        { q: "Which flag stops JavaScript stealing it?", options: [{ text: "HttpOnly", correct: true }, { text: "Bold", correct: false }, { text: "Autoplay", correct: false }] }
      ];
      if (ctx.level !== "beginner") q.push({ q: "Why regenerate the session on login?", options: [{ text: "So any previously stolen/fixed cookie stops working.", correct: true }, { text: "To log in faster.", correct: false }, { text: "To save memory.", correct: false }] });
      return { title: "Quick check", instruction: "Answer each question to earn the badge.", node: el("div", {}, [W.quiz(q, { onPass() { passed.show("Sessions are safe in your hands.", "safe"); ctx.complete(); } }), passed.node]) };
    }
  });
})();
