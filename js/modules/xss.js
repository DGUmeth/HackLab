/* ============================================================
   xss.js, Cross-Site Scripting module.
   We NEVER execute user input. A known payload is DETECTED and we
   *simulate* what unescaped output would do (a fake cookie being
   stolen). The comment itself is always rendered with textContent.
   ============================================================ */
(function () {
  "use strict";
  const HL = window.HL;
  const { el, icon } = HL.ui;
  const W = HL.widgets;

  function isPayload(s) {
    const t = (s || "").toLowerCase();
    return /<script/.test(t) || /onerror\s*=/.test(t) || /onload\s*=/.test(t) || /javascript:/.test(t) || /<img[^>]+src\s*=/.test(t) && /on\w+=/.test(t);
  }

  function diagram() {
    const svg = `
      <svg viewBox="0 0 640 230" role="img" aria-label="Attacker stores a script in a comment; it runs in a victim's browser and sends their cookie to the attacker.">
        <rect class="dg-node" x="16" y="30" width="120" height="56" rx="10"/>
        <text class="dg-label" x="76" y="63" text-anchor="middle">Attacker</text>
        <rect class="dg-node" x="260" y="88" width="120" height="56" rx="10"/>
        <text class="dg-label" x="320" y="121" text-anchor="middle">Website</text>
        <rect class="dg-node" x="504" y="30" width="120" height="56" rx="10"/>
        <text class="dg-label" x="564" y="63" text-anchor="middle">Victim</text>
        <path class="dg-line dg-flow" d="M136 58 C 220 58, 230 112, 260 114"/>
        <path class="dg-line dg-flow" d="M380 114 C 430 112, 470 60, 504 58"/>
        <text class="dg-label" x="210" y="92" text-anchor="middle">&lt;script&gt;…</text>
        <text class="dg-label" x="470" y="92" text-anchor="middle">runs in browser</text>
        <path class="dg-line" stroke-dasharray="4 6" d="M504 72 C 400 170, 240 170, 136 80"/>
        <circle class="dg-packet" r="5"><animateMotion dur="2.6s" repeatCount="indefinite" path="M504 72 C 400 170, 240 170, 136 80"/></circle>
        <text class="dg-label" x="320" y="196" text-anchor="middle" fill="#ff5257">cookie stolen → sent to attacker</text>
      </svg>`;
    const wrap = el("div", { class: "diagram" });
    wrap.innerHTML = svg;
    return wrap;
  }

  // One comment row. Always rendered via textContent (safe).
  function commentRow(name, text, { escaped, malicious }) {
    const badge = malicious
      ? (escaped
          ? el("span", { class: "chip chip--safe", text: "rendered as text" })
          : el("span", { class: "chip chip--danger", text: "⚠ would execute" }))
      : null;
    return el("div", { class: "card", attrs: { style: "padding:14px 16px" } }, [
      el("div", { attrs: { style: "display:flex;justify-content:space-between;align-items:center;gap:10px" } }, [
        el("b", { text: name }), badge
      ]),
      el("div", { class: "code", attrs: { style: "margin-top:8px" }, text: text }) // textContent, never innerHTML
    ]);
  }

  // Fake "script executed → cookie exfiltrated" animation (simulated).
  function exfilAnimation(host) {
    HL.ui.clear(host);
    const cookie = el("div", { class: "result show result--danger", attrs: { role: "status" } }, [
      el("span", { class: "result__icon" }, icon("cookie", 22)),
      el("span", { text: "script ran: document.cookie = SESSION=9f3a… sent to evil.site" })
    ]);
    host.appendChild(cookie);
  }

  HL.registerModule("xss", {
    see() {
      return {
        title: "How stored XSS works",
        instruction: "If a site shows your comment without escaping it, a script inside the comment runs in every visitor's browser.",
        node: el("div", {}, [diagram()])
      };
    },

    tryIt(ctx) {
      const level = ctx.level;
      const input = el("textarea", { class: "textarea", attrs: { "aria-label": "Your comment", placeholder: "Write a comment…" } });
      const list = el("div", { class: "grid", attrs: { style: "gap:10px" } });
      const exfilHost = el("div", { attrs: { style: "margin-top:14px" } });
      const banner = W.resultBanner();

      // Seed with a normal comment.
      list.appendChild(commentRow("Priya", "Great article, thanks!", {}));

      function post() {
        const val = input.value.trim();
        if (!val) return;
        const mal = isPayload(val);
        list.appendChild(commentRow("You", val, { escaped: false, malicious: mal }));
        input.value = "";
        if (mal) {
          exfilAnimation(exfilHost);
          banner.show("The comment wasn't escaped, so the browser treated it as code and ran it.", "danger");
          ctx.complete();
          HL.ui.toast("Payload fired, now escape the output.", "danger");
        } else {
          banner.show("Harmless comment posted. Try one that smuggles a script.", "safe");
        }
      }

      let helper = null;
      if (level === "beginner") {
        const drop = (v) => () => { input.value = v; input.focus(); };
        helper = el("div", { attrs: { style: "margin-top:12px" } }, [
          el("p", { class: "mod__instruction", attrs: { style: "margin-bottom:10px" }, text: "Tap a sample comment, then press Post:" }),
          el("div", { class: "chips" }, [
            payloadChip("<script>steal()</script>", drop("<script>steal()</script>")),
            payloadChip("<img src=x onerror=steal()>", drop('<img src=x onerror="steal()">')),
            payloadChip("Nice post! (normal)", drop("Nice post!"))
          ]),
          W.hint("A comment containing a <script> tag becomes real code when the page shows it unescaped.")
        ]);
      } else if (level === "intermediate") {
        helper = W.hint("Smuggle an HTML tag that runs code, a <script> tag, or an <img> with onerror.", ["beginner", "intermediate"]);
      } else {
        helper = el("p", { class: "mod__instruction", attrs: { style: "margin-top:12px" }, text: "No hints. Post a comment that would execute in another visitor's browser." });
      }

      return {
        title: "Plant a script",
        instruction: "Leave a comment that runs code when the page displays it. Nothing is really executed, the effect is simulated.",
        node: el("div", { class: "grid grid-2" }, [
          el("div", { class: "fakeui" }, [
            el("div", { class: "fakeui__bar" }, [el("div", { class: "fakeui__dots" }, [el("i"), el("i"), el("i")]), el("div", { class: "fakeui__url", text: "https://blog.example/post/42#comments" })]),
            el("div", { class: "fakeui__body" }, [
              el("div", { class: "field" }, [el("label", { text: "Add a comment" }), input]),
              HL.ui.button("Post comment", { variant: "primary", onClick: post }),
              helper
            ])
          ]),
          el("div", {}, [el("h4", { attrs: { style: "font-family:var(--font-mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-3);margin-bottom:12px" }, text: "Comments" }), list, exfilHost, banner.node])
        ])
      };
    },

    fix(ctx) {
      const level = ctx.level;
      const payload = "<script>steal()</script>";
      const list = el("div", { class: "grid", attrs: { style: "gap:10px" } });
      const banner = W.resultBanner();
      let escaped = false;
      let defenceChosen = level === "beginner";

      function render() {
        HL.ui.clear(list).appendChild(commentRow("Attacker", payload, { escaped, malicious: true }));
      }
      render();

      function rerun() {
        if (!defenceChosen) { banner.show("Pick the correct defence first.", "danger"); return; }
        if (escaped) { banner.show("Blocked. The payload shows as plain text, the browser does not run it.", "safe"); ctx.complete(); HL.ui.toast("Output escaped, XSS neutralised.", "safe"); }
        else banner.show("Still dangerous, the script would run.", "danger");
      }

      const toggle = W.toggle({ label: "Escape output (htmlspecialchars / Blade {{ }})", sub: "Show input as text, not HTML", onChange(on) { escaped = on; render(); } });

      // Visual CSP + HttpOnly cards
      const defenceCards = el("div", { class: "grid grid-2", attrs: { style: "margin-top:20px" } }, [
        defenceCard("shield", "Content-Security-Policy", "Blocks inline/injected scripts from running at all."),
        defenceCard("cookie", "HttpOnly cookie", "JavaScript can't read the session cookie, so it can't be stolen.")
      ]);

      let chooser = null;
      if (level !== "beginner") {
        const options = level === "advanced" ? [
          { html: '<code class="tok-safe">{{ $comment }}</code>, Blade auto-escapes', correct: true },
          { html: '<code class="tok-inject">{!! $comment !!}</code>, raw, unescaped', correct: false },
          { html: '<code class="tok-inject">echo $comment;</code>, raw echo', correct: false }
        ] : [
          { text: "Escape output when rendering it (encode < > & as entities).", correct: true },
          { text: "Trim the comment to 100 characters.", correct: false },
          { text: "Block the word 'script' from comments.", correct: false }
        ];
        chooser = buildChooser(level === "advanced" ? "Pick the safe way to render the comment:" : "Which defence stops XSS?", options, () => { defenceChosen = true; });
      }

      return {
        title: "Escape the output",
        instruction: "Escape the comment so the browser prints it instead of running it, then re-run the payload.",
        node: el("div", {}, [
          el("div", { class: "grid grid-2" }, [
            el("div", {}, [chooser, el("div", { attrs: { style: "margin:4px 0 16px" } }, [toggle.node]), HL.ui.button("Re-run the attack", { variant: "primary", icon: "swap", onClick: rerun }), W.hint("Escaping turns < into &lt; so a <script> tag is shown, not executed.", ["beginner"])]),
            el("div", {}, [el("h4", { attrs: { style: "font-family:var(--font-mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-3);margin-bottom:12px" }, text: "Output" }), list, banner.node])
          ]),
          defenceCards
        ])
      };
    },

    quiz(ctx) {
      const passed = W.resultBanner();
      const q = [
        { q: "What causes stored XSS?", options: [
          { text: "The site displays user input as HTML without escaping it.", correct: true },
          { text: "The user's browser is out of date.", correct: false },
          { text: "The password database was leaked.", correct: false } ] },
        { q: "What does escaping output do?", options: [
          { text: "Shows a <script> tag as text instead of running it.", correct: true },
          { text: "Deletes all comments.", correct: false },
          { text: "Encrypts the page.", correct: false } ] }
      ];
      if (ctx.level !== "beginner") q.push({ q: "Why mark the session cookie HttpOnly?", options: [
        { text: "So JavaScript can't read it, so a script can't steal it.", correct: true },
        { text: "So it loads faster.", correct: false },
        { text: "So it never expires.", correct: false } ] });
      const node = el("div", {}, [W.quiz(q, { onPass() { passed.show("Nailed it, XSS and its defences.", "safe"); ctx.complete(); } }), passed.node]);
      return { title: "Quick check", instruction: "Answer each question to earn the badge.", node };
    }
  });

  /* shared small helpers (also used by other modules via closure copies) */
  function payloadChip(label, onClick) {
    const c = HL.ui.chip(label); c.setAttribute("role", "button"); c.setAttribute("tabindex", "0"); c.style.cursor = "pointer";
    c.addEventListener("click", onClick);
    c.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } });
    return c;
  }
  function defenceCard(ic, title, desc) {
    return el("div", { class: "card" }, [el("span", { class: "cheat__icon" }, icon(ic, 28)), el("div", { class: "cheat__name", text: title }), el("div", { class: "cheat__def", text: desc })]);
  }
  function buildChooser(prompt, options, onCorrect) {
    const wrap = el("div", { attrs: { style: "margin-bottom:18px" } }, [
      el("p", { class: "mod__instruction", attrs: { style: "margin-bottom:10px" }, text: prompt }),
      el("div", { class: "qopts" }, options.map((o, i) => el("button", {
        class: "qopt", attrs: { type: "button" },
        onClick(e) {
          const b = e.currentTarget;
          if (o.correct) { b.classList.add("correct"); b.appendChild(icon("check", 16)); wrap.querySelectorAll(".qopt").forEach((x) => (x.disabled = true)); onCorrect(); HL.ui.announce("Correct, now enable it and re-run."); }
          else { b.classList.add("wrong"); b.appendChild(icon("x", 16)); setTimeout(() => { b.classList.remove("wrong"); if (b.lastChild.tagName === "svg") b.removeChild(b.lastChild); }, 900); }
        }
      }, [el("span", { class: "qopt__key", text: String.fromCharCode(65 + i) }), el("span", o.html ? { html: o.html } : { text: o.text })])))
    ]);
    return wrap;
  }
})();
