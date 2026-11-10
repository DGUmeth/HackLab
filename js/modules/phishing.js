/* ============================================================
   phishing.js, Phishing module.
   TRY IT: click the red flags hidden in a fake email.
   FIX IT: "check the domain" mini-game + build a verify checklist.
   All click/keyboard operable (drag is an optional enhancement).
   ============================================================ */
(function () {
  "use strict";
  const HL = window.HL;
  const { el, icon } = HL.ui;
  const W = HL.widgets;

  function diagram() {
    const svg = `
      <svg viewBox="0 0 640 210" role="img" aria-label="Attacker sends a fake email; the victim clicks and their credentials go to the attacker.">
        <rect class="dg-node" x="16" y="78" width="120" height="56" rx="10"/>
        <text class="dg-label" x="76" y="111" text-anchor="middle">Attacker</text>
        <rect class="dg-node" x="260" y="78" width="120" height="56" rx="10"/>
        <text class="dg-label" x="320" y="111" text-anchor="middle">Fake email</text>
        <rect class="dg-node" x="504" y="78" width="120" height="56" rx="10"/>
        <text class="dg-label" x="564" y="111" text-anchor="middle">You</text>
        <path class="dg-line dg-flow" d="M136 106 H260"/>
        <path class="dg-line dg-flow" d="M380 106 H504"/>
        <circle class="dg-packet" r="5"><animateMotion dur="2.4s" repeatCount="indefinite" path="M136 106 H504"/></circle>
        <path class="dg-line" stroke-dasharray="4 6" d="M504 120 C 380 180, 240 180, 136 120"/>
        <text class="dg-label" x="320" y="176" text-anchor="middle" fill="#ff5257">password typed → sent to attacker</text>
      </svg>`;
    const wrap = el("div", { class: "diagram" }); wrap.innerHTML = svg; return wrap;
  }

  HL.registerModule("phishing", {
    see() {
      return {
        title: "How phishing works",
        instruction: "A message pretends to be someone you trust and rushes you to click a link and hand over your password.",
        node: el("div", {}, [diagram()])
      };
    },

    tryIt(ctx) {
      const level = ctx.level;
      const showHints = level === "beginner";
      const needed = 4;
      const found = new Set();
      const score = el("span", { class: "flags-score", text: "0 / " + needed + " flags found" });
      const banner = W.resultBanner();

      // Build a flaggable span. real=true flags count; decoys do not.
      function flag(text, { real, note }) {
        const s = el("span", {
          class: "flag" + (real ? "" : " decoy") + (showHints && real ? "" : " "),
          attrs: { role: "button", tabindex: "0", "aria-label": (real ? "Suspicious: " : "") + text }
        }, [document.createTextNode(text)]);
        if (!showHints) s.style.borderBottom = "none"; // hide the underline cue at harder levels
        const handler = () => {
          if (s.classList.contains("found")) return;
          s.classList.add("found");
          if (real) {
            found.add(text);
            score.textContent = found.size + " / " + needed + " flags found";
            HL.ui.toast(note || "Red flag!", "danger");
            if (found.size >= needed) { banner.show("You spotted every red flag. This email is a fake.", "safe"); ctx.complete(); }
          } else {
            HL.ui.toast("That part is actually fine, keep looking.", "");
          }
        };
        s.addEventListener("click", handler);
        s.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handler(); } });
        return s;
      }

      const mail = el("div", { class: "fakeui" }, [
        el("div", { class: "fakeui__bar" }, [el("div", { class: "fakeui__dots" }, [el("i"), el("i"), el("i")]), el("div", { class: "fakeui__url", text: "Inbox, 1 new message" })]),
        el("div", { class: "fakeui__body" }, [
          el("div", { class: "mail" }, [
            el("p", {}, [el("b", { text: "From: " }), flag("security@paypa1.com", { real: true, note: "Lookalike domain: paypa1 with a '1', not paypal." })]),
            el("p", { attrs: { style: "margin-top:4px" } }, [el("b", { text: "Subject: " }), flag("URGENT: Your account will be closed in 24 hours", { real: true, note: "Pressure + urgency is a classic lure." })]),
            el("hr", { attrs: { style: "border:none;border-top:1px solid var(--border);margin:14px 0" } }),
            el("p", {}, ["Dear Customer, we noticed unusual activity. ", flag("Verify immediately", { real: false }), " to avoid suspension."]),
            el("p", { attrs: { style: "margin-top:10px" } }, ["Please confirm your details here: ", flag("http://paypal.secure-login.info/verify", { real: true, note: "The real domain is secure-login.info, not paypal." })]),
            el("p", { attrs: { style: "margin-top:10px" } }, ["Thank you, ", flag("The PayPal Team", { real: false }), "."]),
            el("p", { attrs: { style: "margin-top:10px" } }, [flag("Sent from a monitored mailbox, do not reply", { real: true, note: "Discourages you from checking, another flag." })])
          ])
        ])
      ]);

      const helper = showHints
        ? W.hint("Click the sender address, the urgent subject, the link's real domain, and the 'do not reply' line.")
        : (level === "intermediate" ? W.hint("Four things here give it away. Check who it's from, how it pressures you, and where the link really goes.", ["intermediate"])
          : el("p", { class: "mod__instruction", text: "No hints. Click every part that reveals this is a phishing email." }));

      return {
        title: "Spot the fakes",
        instruction: "Click the parts of this email that look suspicious. Find all " + needed + " red flags.",
        node: el("div", {}, [el("div", { attrs: { style: "display:flex;justify-content:flex-end;margin-bottom:10px" } }, [score]), mail, helper, banner.node])
      };
    },

    fix(ctx) {
      const level = ctx.level;
      let domainDone = false, listDone = false;
      const banner = W.resultBanner();
      function maybeComplete() { if (domainDone && listDone) { banner.show("Great habits, this is how you avoid the hook.", "safe"); ctx.complete(); HL.ui.toast("Phishing defences locked in.", "safe"); } }

      // ---- Mini-game: which link is the REAL PayPal? ----
      const domains = level === "advanced"
        ? [{ t: "https://www.paypal.com/signin", ok: true }, { t: "https://www.paypal.com.verify-id.io", ok: false }, { t: "https://secure-paypal.com/login", ok: false }, { t: "https://www.paypa1.com", ok: false }]
        : level === "intermediate"
        ? [{ t: "https://www.paypal.com", ok: true }, { t: "https://paypal-secure.com", ok: false }, { t: "https://www.paypa1.com", ok: false }]
        : [{ t: "https://www.paypal.com", ok: true }, { t: "https://www.paypa1.com", ok: false }];

      const domainGame = el("div", { class: "card" }, [
        el("div", { class: "cheat__name", text: "Check the domain" }),
        el("p", { class: "cheat__def", attrs: { style: "margin-bottom:12px" }, text: "Which link is the genuine PayPal?" }),
        el("div", { class: "qopts" }, domains.map((d, i) => el("button", {
          class: "qopt", attrs: { type: "button", style: "font-family:var(--font-mono)" },
          onClick(e) {
            const b = e.currentTarget;
            if (d.ok) { b.classList.add("correct"); b.appendChild(icon("check", 16)); domainGame.querySelectorAll(".qopt").forEach((x) => (x.disabled = true)); domainDone = true; HL.ui.announce("Correct domain identified."); maybeComplete(); }
            else { b.classList.add("wrong"); b.appendChild(icon("x", 16)); HL.ui.toast("Look closely, that's a lookalike.", "danger"); setTimeout(() => { b.classList.remove("wrong"); if (b.lastChild.tagName === "svg") b.removeChild(b.lastChild); }, 900); }
          }
        }, [el("span", { class: "qopt__key", text: String.fromCharCode(65 + i) }), el("span", { text: d.t })])))
      ]);
      if (level === "beginner") domainGame.appendChild(W.hint("The real site is exactly paypal.com, watch for extra words or a '1' instead of 'l'."));

      // ---- Build-your-checklist (click to add; drag is a bonus) ----
      const goodHabits = ["Check the sender's full email address", "Hover a link to see its real domain", "Go to the site directly, not via the link", "Slow down when a message feels urgent"];
      const badHabits = ["Click fast so your account isn't closed", "Reply with your password to confirm", "Trust the logo in the email"];
      const pool = shuffle(goodHabits.map((t) => ({ t, good: true })).concat(badHabits.map((t) => ({ t, good: false }))));
      const needGood = goodHabits.length;
      const placed = new Set();

      const checklist = el("div", { class: "dnd__col", attrs: { "aria-label": "My checklist", "data-drop": "1" } }, [el("h4", { text: "My before-you-click checklist" })]);
      const poolCol = el("div", { class: "dnd__col", attrs: { "aria-label": "Possible habits" } }, [el("h4", { text: "Tap the good habits to add them" })]);

      function tokenFor(item) {
        const tok = el("button", { class: "token", attrs: { type: "button", draggable: "true" }, }, [el("span", { class: "token__grip", text: "⋮⋮" }), el("span", { text: item.t })]);
        tok.addEventListener("click", () => moveToChecklist(item, tok));
        tok.addEventListener("dragstart", () => tok.classList.add("dragging"));
        tok.addEventListener("dragend", () => tok.classList.remove("dragging"));
        return tok;
      }
      function moveToChecklist(item, tok) {
        if (!item.good) { HL.ui.toast("That's a risky habit, leave it out.", "danger"); tok.classList.add("wrong"); setTimeout(() => tok.classList.remove("wrong"), 600); return; }
        if (placed.has(item.t)) return;
        placed.add(item.t);
        tok.remove();
        const done = el("div", { class: "token token--placed" }, [icon("check", 14), el("span", { text: item.t })]);
        checklist.appendChild(done);
        if (placed.size >= needGood) { checklist.classList.add("drop-ok"); listDone = true; HL.ui.announce("Checklist complete."); maybeComplete(); }
      }
      pool.forEach((item) => poolCol.appendChild(tokenFor(item)));

      // native drop support
      checklist.addEventListener("dragover", (e) => { e.preventDefault(); checklist.classList.add("drop-over"); });
      checklist.addEventListener("dragleave", () => checklist.classList.remove("drop-over"));
      checklist.addEventListener("drop", (e) => { e.preventDefault(); checklist.classList.remove("drop-over"); const t = poolCol.querySelector(".dragging"); if (t) t.click(); });

      return {
        title: "Don't take the bait",
        instruction: "Pick the genuine domain, then build a checklist of good habits by tapping the safe ones.",
        node: el("div", {}, [
          el("div", { class: "grid grid-2", attrs: { style: "align-items:start" } }, [domainGame, el("div", { class: "dnd" }, [poolCol, checklist])]),
          banner.node
        ])
      };
    },

    quiz(ctx) {
      const passed = W.resultBanner();
      const q = [
        { q: "Which is the biggest giveaway of phishing?", options: [
          { text: "A lookalike sender domain and a mismatched link.", correct: true },
          { text: "The email has a company logo.", correct: false },
          { text: "It was sent in the morning.", correct: false } ] },
        { q: "You get an 'urgent' account warning. Best move?", options: [
          { text: "Go to the site directly by typing its address.", correct: true },
          { text: "Click the link quickly before it expires.", correct: false },
          { text: "Reply with your password to confirm.", correct: false } ] }
      ];
      if (ctx.level !== "beginner") q.push({ q: "Which URL is a fake?", options: [
        { text: "paypal.com.verify-id.io", correct: true },
        { text: "paypal.com", correct: false },
        { text: "www.paypal.com", correct: false } ] });
      const node = el("div", {}, [W.quiz(q, { onPass() { passed.show("You can smell a phish now.", "safe"); ctx.complete(); } }), passed.node]);
      return { title: "Quick check", instruction: "Answer each question to earn the badge.", node };
    }
  });

  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
})();
