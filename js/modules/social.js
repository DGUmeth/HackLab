/* ============================================================
   social.js, Social engineering (help-desk phone call).
   TRY: play the help-desk; the "helpful/fast" path leaks a reset.
   FIX: choose the verification steps that shut the caller down.
   ============================================================ */
(function () {
  "use strict";
  const HL = window.HL;
  const { el, icon } = HL.ui;
  const W = HL.widgets;

  function bubble(who, text) {
    const mine = who === "You";
    return el("div", { attrs: { style: "display:flex;justify-content:" + (mine ? "flex-end" : "flex-start") } }, [
      el("div", { class: "card", attrs: { style: "max-width:80%;padding:10px 14px;" + (mine ? "background:var(--surface-3)" : "") } }, [
        el("div", { class: "eyebrow", attrs: { style: "margin-bottom:4px" }, text: mine ? "You (help desk)" : who }),
        el("div", { text })
      ])
    ]);
  }
  function diagram(svg) { const w = el("div", { class: "diagram" }); w.innerHTML = svg; return w; }

  HL.registerModule("social", {
    see() {
      return {
        title: "How social engineering works",
        instruction: "No code, just pressure. A caller pretends to be someone important and rushes you into skipping the rules.",
        node: diagram(`<svg viewBox="0 0 640 190" role="img" aria-label="A caller pretending to be a manager pressures the help desk into resetting a password.">
          <rect class="dg-node" x="16" y="66" width="140" height="56" rx="10"/><text class="dg-label" x="86" y="92" text-anchor="middle">"Manager"</text><text class="dg-label" x="86" y="108" text-anchor="middle" fill="#ff5257">(attacker)</text>
          <path class="dg-line dg-flow" d="M156 94 H300"/>
          <rect class="dg-node" x="300" y="66" width="140" height="56" rx="10"/><text class="dg-label" x="370" y="98" text-anchor="middle">Help desk</text>
          <path class="dg-line dg-flow" d="M440 94 H560"/>
          <rect class="dg-node" x="500" y="66" width="124" height="56" rx="10"/><text class="dg-label" x="562" y="98" text-anchor="middle">Account</text>
          <circle class="dg-packet" r="5"><animateMotion dur="2.4s" repeatCount="indefinite" path="M156 94 H500"/></circle>
        </svg>`)
      };
    },

    tryIt(ctx) {
      const level = ctx.level;
      const banner = W.resultBanner();
      const thread = el("div", { class: "grid", attrs: { style: "gap:10px", role: "log", "aria-live": "polite" } });
      const opts = el("div", { class: "qopts", attrs: { style: "margin-top:14px" } });

      const nodes = {
        start: { who: "Caller", say: "Hi, this is Mark, I'm the Finance manager. I'm locked out and the board meeting starts in 5 minutes. Reset my password to Spring2026 right now.", options: [{ t: "Sure, resetting it now.", go: "breach" }, { t: "I can help, can I verify your identity first?", go: "n2" }] },
        n2: { who: "Caller", say: "Do you know who I am?! I don't have time for this. Do it now or I'll call your manager.", options: [{ t: "Okay, okay, resetting it.", go: "breach" }, { t: "I understand, but I still have to verify via our callback process.", go: "foiled" }] }
      };
      const terminal = {
        breach: () => { thread.appendChild(bubble("System", "🔓 Password reset for an unverified caller.")); banner.show("You were rushed into resetting an unverified caller's password. The attacker is in.", "danger"); ctx.complete(); HL.ui.toast("Breached by pressure, now learn to stop it.", "danger"); },
        foiled: () => { thread.appendChild(bubble("System", "✅ Caller couldn't verify and hung up.")); banner.show("You held the line and verified, the attack failed. (Now practise the steps in Fix it.)", "safe"); ctx.complete(); }
      };

      function render(key) {
        const node = nodes[key];
        thread.appendChild(bubble(node.who, node.say));
        HL.ui.clear(opts);
        node.options.forEach((o) => opts.appendChild(el("button", { class: "qopt", attrs: { type: "button" }, onClick() {
          thread.appendChild(bubble("You", o.t)); HL.ui.clear(opts);
          if (terminal[o.go]) terminal[o.go](); else render(o.go);
        } }, [el("span", { text: o.t })])));
      }
      render("start");

      const helper = level === "beginner" ? W.hint("Notice the pressure: authority (“manager”), urgency (“5 minutes”) and intimidation. See where the fast reply leads.")
        : (level === "intermediate" ? null : el("p", { class: "mod__instruction", attrs: { style: "margin-top:12px" }, text: "Play out the call and watch how pressure drives a bad decision." }));

      return { title: "Take the call", instruction: "You're on the help desk. Respond to the caller and see where each choice leads.", node: el("div", {}, [thread, opts, helper, banner.node]) };
    },

    fix(ctx) {
      const level = ctx.level;
      const banner = W.resultBanner();
      const host = el("div", {});

      const step2 = W.chooser("The caller gives an employee ID over the phone. Do you accept it as proof?", [
        { text: "No, call back on the number in the HR directory to confirm.", correct: true },
        { text: "Yes, an ID number is enough.", correct: false },
        { text: "Yes, they sound senior and stressed.", correct: false }
      ], () => { banner.show("Verified out-of-band, the caller can't prove who they are and gives up. Attack stopped.", "safe"); ctx.complete(); HL.ui.toast("Social engineering stopped.", "safe"); });

      const step1 = W.chooser("A 'manager' demands an urgent password reset. First move?", [
        { text: "Follow the verification process, no matter how urgent it sounds.", correct: true },
        { text: "Reset it, they're a manager and it's urgent.", correct: false },
        { text: "Email them the new password to save time.", correct: false }
      ], () => { host.appendChild(step2); HL.ui.announce("Good, now verify their identity."); });

      host.appendChild(step1);
      const extra = level === "advanced" ? el("p", { class: "mod__instruction", attrs: { style: "margin-top:4px" }, text: "Advanced: urgency and authority are the manipulation, your process doesn't bend for either." }) : W.hint("Verify identity through a separate, trusted channel (a callback) before doing anything, urgency is not proof.", ["beginner"]);

      return { title: "Verify before you act", instruction: "Handle the same call the right way: pick the verification steps that stop the attacker.", node: el("div", {}, [host, extra, banner.node]) };
    },

    quiz(ctx) {
      const passed = W.resultBanner();
      const q = [
        { q: "What's the manipulation in these calls?", options: [{ text: "Authority + urgency to make you skip verification.", correct: true }, { text: "A software bug.", correct: false }, { text: "A weak password.", correct: false }] },
        { q: "Best response to an urgent reset request?", options: [{ text: "Verify identity out-of-band first.", correct: true }, { text: "Comply quickly to be helpful.", correct: false }, { text: "Email the password.", correct: false }] }
      ];
      if (ctx.level !== "beginner") q.push({ q: "Is an employee ID read over the phone good proof?", options: [{ text: "No, it can be stolen; call back on a trusted number.", correct: true }, { text: "Yes, always.", correct: false }, { text: "Yes, if they sound senior.", correct: false }] });
      return { title: "Quick check", instruction: "Answer each question to earn the badge.", node: el("div", {}, [W.quiz(q, { onPass() { passed.show("Pressure won't push you into mistakes.", "safe"); ctx.complete(); } }), passed.node]) };
    }
  });
})();
