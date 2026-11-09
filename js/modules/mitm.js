/* ============================================================
   mitm.js — Man-in-the-Middle (open Wi-Fi).
   TRY: send a login over HTTP; the attacker reads it in clear text.
   FIX: switch to HTTPS (scrambled) + heed the certificate warning.
   ============================================================ */
(function () {
  "use strict";
  const HL = window.HL;
  const { el, icon } = HL.ui;
  const W = HL.widgets;
  function diagram(svg) { const w = el("div", { class: "diagram" }); w.innerHTML = svg; return w; }

  function scramble(s) { return s.replace(/./g, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]); }

  HL.registerModule("mitm", {
    see() {
      return {
        title: "How a MITM attack works",
        instruction: "On open Wi-Fi, an attacker sits between you and the site. Over plain HTTP they can read everything you send.",
        node: diagram(`<svg viewBox="0 0 640 200" role="img" aria-label="On open Wi-Fi an attacker in the middle reads traffic between the user and the website.">
          <rect class="dg-node" x="16" y="72" width="120" height="56" rx="10"/><text class="dg-label" x="76" y="104" text-anchor="middle">You</text>
          <rect class="dg-node" x="260" y="72" width="120" height="56" rx="10"/><text class="dg-label" x="320" y="98" text-anchor="middle">Café Wi-Fi</text><text class="dg-label" x="320" y="114" text-anchor="middle" fill="#ff5257">attacker</text>
          <rect class="dg-node" x="504" y="72" width="120" height="56" rx="10"/><text class="dg-label" x="564" y="104" text-anchor="middle">Website</text>
          <path class="dg-line dg-flow" d="M136 100 H260"/><path class="dg-line dg-flow" d="M380 100 H504"/>
          <circle class="dg-packet" r="5"><animateMotion dur="2.2s" repeatCount="indefinite" path="M136 100 H504"/></circle>
          <text class="dg-label" x="320" y="150" text-anchor="middle" fill="#ff5257">reads your password</text>
        </svg>`)
      };
    },

    tryIt(ctx) {
      const level = ctx.level;
      const banner = W.resultBanner();
      const user = el("input", { class: "input", attrs: { value: "alex@example.com", "aria-label": "Email" } });
      const pass = el("input", { class: "input", attrs: { value: "S3cret!", type: "text", "aria-label": "Password" } });
      const intercept = el("pre", { class: "code", attrs: { "aria-label": "Attacker's view" }, text: "(nothing captured yet)" });

      function send() {
        const line = "POST /login  email=" + user.value + "  password=" + pass.value;
        intercept.textContent = line;
        intercept.className = "code tok-inject";
        banner.show("Over HTTP, the attacker on the Wi-Fi read your email and password in clear text.", "danger");
        ctx.complete(); HL.ui.toast("Credentials intercepted.", "danger");
      }

      const helper = level === "beginner" ? W.hint("Press “Send login (HTTP)” and look at the attacker's panel — your password is right there.")
        : (level === "intermediate" ? null : el("p", { class: "mod__instruction", text: "Send credentials over the insecure connection and inspect what leaks." }));

      return { title: "Send it in the clear", instruction: "You're on café Wi-Fi using plain HTTP. Log in and see what the attacker captures.", node: el("div", { class: "grid grid-2" }, [
        el("div", { class: "fakeui" }, [el("div", { class: "fakeui__bar" }, [el("div", { class: "fakeui__dots" }, [el("i"), el("i"), el("i")]), el("div", { class: "fakeui__url", text: "http://shop.example/login  ·  not secure" })]), el("div", { class: "fakeui__body" }, [el("div", { class: "field" }, [el("label", { text: "Email" }), user]), el("div", { class: "field" }, [el("label", { text: "Password" }), pass]), HL.ui.button("Send login (HTTP)", { variant: "primary", onClick: send }), helper])]),
        el("div", {}, [el("p", { class: "eyebrow", attrs: { style: "color:var(--danger)" }, text: "Attacker on the Wi-Fi sees" }), intercept, banner.node])
      ]) };
    },

    fix(ctx) {
      const level = ctx.level;
      const banner = W.resultBanner();
      let https = false, heeded = false, chosen = level === "beginner";
      const intercept = el("pre", { class: "code", text: "(nothing captured yet)" });
      const toggle = W.toggle({ label: "Use HTTPS (TLS)", sub: "Encrypt traffic end-to-end", onChange(v) { https = v; } });

      function send() {
        if (!chosen) { banner.show("Pick the right fix first.", "danger"); return; }
        if (https) { intercept.textContent = "POST /login  " + scramble("email=alex password=S3cret") ; intercept.className = "code tok-safe"; if (heeded) { banner.show("Encrypted and verified. The attacker sees only scrambled bytes.", "safe"); ctx.complete(); HL.ui.toast("Traffic secured.", "safe"); } else banner.show("Encrypted — now handle the certificate warning below.", "safe"); }
        else { intercept.textContent = "POST /login  email=alex@example.com password=S3cret!"; intercept.className = "code tok-inject"; banner.show("Still in the clear — enable HTTPS.", "danger"); }
      }

      // Certificate-warning decision
      const certDecision = W.chooser("A certificate warning appears: “This site's identity can't be verified.” What do you do?", [
        { text: "Do not proceed — leave the site.", correct: true },
        { text: "Click 'Proceed anyway' to continue.", correct: false },
        { text: "Ignore it; the padlock will appear eventually.", correct: false }
      ], () => { heeded = true; HL.ui.announce("Good — never click through a certificate warning on open Wi-Fi."); });

      let chooser = null;
      if (level !== "beginner") {
        const opts = level === "advanced"
          ? [{ html: 'Force <code class="tok-safe">HTTPS + HSTS</code> and verify the certificate', correct: true }, { html: 'Trust the cafe <code class="tok-inject">captive portal</code> certificate', correct: false }, { html: 'Use a <code class="tok-inject">longer password</code>', correct: false }]
          : [{ text: "Use HTTPS so traffic is encrypted end-to-end.", correct: true }, { text: "Type faster so there's less to capture.", correct: false }, { text: "Use a nickname instead of your email.", correct: false }];
        chooser = W.chooser("Which actually protects you on open Wi-Fi?", opts, () => { chosen = true; HL.ui.announce("Correct — enable HTTPS and re-send."); });
      }

      return { title: "Encrypt the connection", instruction: "Switch to HTTPS, re-send the login, and make the right call on the certificate warning.", node: el("div", {}, [chooser, el("div", { attrs: { style: "margin-bottom:14px;max-width:460px" } }, [toggle.node]), HL.ui.button("Send login again", { variant: "primary", icon: "swap", onClick: send }), el("div", { attrs: { style: "margin-top:16px" } }, [el("p", { class: "eyebrow", text: "Attacker sees" }), intercept]), el("div", { attrs: { style: "margin-top:16px" } }, [certDecision]), W.hint("HTTPS scrambles your data; the certificate proves you're really talking to the site, not the attacker.", ["beginner"]), banner.node]) };
    },

    quiz(ctx) {
      const passed = W.resultBanner();
      const q = [
        { q: "Why is open Wi-Fi + HTTP risky?", options: [{ text: "Someone in the middle can read your traffic in clear text.", correct: true }, { text: "It drains your battery.", correct: false }, { text: "It's slower.", correct: false }] },
        { q: "What does HTTPS give you?", options: [{ text: "Encryption + proof of the site's identity.", correct: true }, { text: "A faster connection.", correct: false }, { text: "A stronger password.", correct: false }] }
      ];
      if (ctx.level !== "beginner") q.push({ q: "A certificate warning appears. You should…", options: [{ text: "Not proceed — it may be an attacker.", correct: true }, { text: "Always click proceed.", correct: false }, { text: "Disable HTTPS.", correct: false }] });
      return { title: "Quick check", instruction: "Answer each question to earn the badge.", node: el("div", {}, [W.quiz(q, { onPass() { passed.show("Safe on any network now.", "safe"); ctx.complete(); } }), passed.node]) };
    }
  });
})();
