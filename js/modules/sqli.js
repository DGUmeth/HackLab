/* ============================================================
   sqli.js, SQL Injection module (the template for the others).
   Fully simulated: nothing typed is ever executed. User input is
   matched against known demo payloads and the *display* of the SQL
   query is rebuilt to show how injection changes its structure.
   ============================================================ */
(function () {
  "use strict";
  const HL = window.HL;
  const { el, icon } = HL.ui;
  const W = HL.widgets;

  /* ---- Detect a classic injection in a demo-safe way (pattern match only) ---- */
  function isInjection(s) {
    const t = (s || "").toLowerCase();
    return (
      /'\s*or\s*'?\s*1\s*'?\s*=\s*'?\s*1/.test(t) ||   // ' OR '1'='1
      /'\s*or\s*1\s*=\s*1/.test(t) ||                  // ' OR 1=1
      /'\s*or\s*'?[a-z0-9]+'?\s*=\s*'?[a-z0-9]+/.test(t) && /'/.test(s) || // ' OR 'a'='a
      /--/.test(s) && /'/.test(s) ||                   // admin' --
      /'\s*or\s*true/.test(t)
    );
  }

  /* ---- Build the live SQL query display ----
     mode: 'unsafe' (concatenated) or 'safe' (parameterised). */
  function queryPanel(user, pass, mode) {
    const injected = mode === "unsafe" && isInjection(user);
    const label = el("div", { class: "code__label" }, [
      el("span", { text: mode === "safe" ? "Database query (parameterised)" : "Database query (string-built)" }),
      el("span", { class: mode === "safe" ? "tok-safe" : (injected ? "tok-inject" : "tok-comment"), text: mode === "safe" ? "SAFE" : injected ? "INJECTED" : "normal" })
    ]);

    const code = el("pre", { class: "code" });
    // We assemble the query out of safe text nodes + styled spans. No eval, no innerHTML of input.
    const push = (txt, cls) => code.appendChild(el("span", cls ? { class: cls, text: txt } : { text: txt }));

    if (mode === "safe") {
      // Parameterised: placeholders in SQL, values bound separately as plain data.
      push("SELECT ", "tok-key"); push("* "); push("FROM ", "tok-key"); push("users\n");
      push("WHERE ", "tok-key"); push("username = "); push("?", "tok-str"); push(" ");
      push("AND ", "tok-key"); push("password = "); push("?", "tok-str"); push("\n\n");
      push("-- values bound as data:\n", "tok-comment");
      push("  [1] "); push(user || "(empty)", "tok-safe"); push("\n");
      push("  [2] "); push(pass || "(empty)", "tok-safe");
    } else {
      push("SELECT ", "tok-key"); push("* "); push("FROM ", "tok-key"); push("users\n");
      push("WHERE ", "tok-key"); push("username = ");
      push("'" + (user || "") + "'", injected ? "tok-inject" : "tok-str");
      push("\n  AND ", "tok-key"); push("password = ");
      push("'" + (pass || "") + "'", "tok-str");
      if (injected) {
        code.appendChild(el("span", { class: "tok-comment", text: "\n\n-- the red part is now SQL, not data → the password check is bypassed" }));
      }
    }
    return el("div", {}, [label, code]);
  }

  /* ---- Looping attacker→app→database diagram (SEE IT) ---- */
  function diagram() {
    const svg = `
      <svg viewBox="0 0 640 220" role="img" aria-label="Attacker sends a crafted input through the app to the database, bypassing the login.">
        <g class="dg-labels" font-family="monospace">
          <rect class="dg-node" x="16" y="78" width="120" height="64" rx="10"/>
          <text class="dg-label" x="76" y="114" text-anchor="middle">Attacker</text>
          <rect class="dg-node" x="260" y="78" width="120" height="64" rx="10"/>
          <text class="dg-label" x="320" y="114" text-anchor="middle">Web app</text>
          <rect class="dg-node" x="504" y="78" width="120" height="64" rx="10"/>
          <text class="dg-label" x="564" y="114" text-anchor="middle">Database</text>
          <path class="dg-line dg-flow" d="M136 110 H260"/>
          <path class="dg-line dg-flow" d="M380 110 H504"/>
          <text class="dg-label" x="198" y="96" text-anchor="middle">' OR '1'='1</text>
          <text class="dg-label" x="442" y="96" text-anchor="middle">SELECT * …</text>
          <circle class="dg-packet" r="5"><animateMotion dur="2.2s" repeatCount="indefinite" path="M136 110 H260"/></circle>
          <circle class="dg-packet" r="5"><animateMotion dur="2.2s" begin="1.1s" repeatCount="indefinite" path="M380 110 H504"/></circle>
          <text class="dg-label" x="564" y="166" text-anchor="middle" fill="#ff5257">row returned → logged in</text>
        </g>
      </svg>`;
    const wrap = el("div", { class: "diagram" });
    wrap.innerHTML = svg; // trusted static markup
    return wrap;
  }

  HL.registerModule("sqli", {
    /* ---------- SEE IT ---------- */
    see() {
      return {
        title: "How SQL injection works",
        instruction: "The app builds a database query by gluing your text into it. A crafted input turns into SQL and skips the password check.",
        node: el("div", {}, [
          diagram(),
          el("div", { class: "hint", attrs: { style: "margin-top:18px" } }, [
            icon("info", 16),
            el("div", {}, [el("b", { text: "In one line: " }), document.createTextNode("input that should be data becomes commands.")])
          ])
        ])
      };
    },

    /* ---------- TRY IT ---------- */
    tryIt(ctx) {
      const level = ctx.level;
      const userIn = el("input", { class: "input", attrs: { type: "text", "aria-label": "Username", placeholder: "username", autocomplete: "off", spellcheck: "false" } });
      const passIn = el("input", { class: "input", attrs: { type: "text", "aria-label": "Password", placeholder: "password", autocomplete: "off", spellcheck: "false" } });
      if (level === "beginner") userIn.value = "admin";

      const queryHost = el("div");
      const banner = W.resultBanner();

      function refresh() { HL.ui.clear(queryHost).appendChild(queryPanel(userIn.value, passIn.value, "unsafe")); }
      userIn.addEventListener("input", refresh);
      passIn.addEventListener("input", refresh);
      refresh();

      function attempt() {
        if (isInjection(userIn.value) || isInjection(passIn.value)) {
          banner.show("Access granted as admin, login bypassed with no real password.", "danger");
          queryHost.classList.add("flash-danger");
          setTimeout(() => queryHost.classList.remove("flash-danger"), 1100);
          ctx.complete();
          HL.ui.toast("Injection worked, now go fix it.", "danger");
        } else {
          banner.show("Invalid credentials. (Tip: ordinary passwords just fail, try bending the query.)", "safe");
        }
      }

      // Login card
      const form = el("div", { class: "fakeui" }, [
        el("div", { class: "fakeui__bar" }, [
          el("div", { class: "fakeui__dots" }, [el("i"), el("i"), el("i")]),
          el("div", { class: "fakeui__url", text: "https://shop.example/login" })
        ]),
        el("div", { class: "fakeui__body" }, [
          el("div", { class: "field" }, [el("label", { text: "Username" }), userIn]),
          el("div", { class: "field" }, [el("label", { text: "Password" }), passIn]),
          HL.ui.button("Log in", { variant: "primary", onClick: attempt })
        ])
      ]);

      // Payload helpers (level-dependent guidance)
      let helper = null;
      if (level === "beginner") {
        const drop = (val, field) => () => { (field === "pass" ? passIn : userIn).value = val; refresh(); (field === "pass" ? passIn : userIn).focus(); };
        helper = el("div", { attrs: { style: "margin-top:16px" } }, [
          el("p", { class: "mod__instruction", attrs: { style: "margin-bottom:10px" }, text: "Tap a sample input to drop it into the Username box, then press Log in:" }),
          el("div", { class: "chips" }, [
            payloadChip("' OR '1'='1", drop("' OR '1'='1", "user")),
            payloadChip("admin' --", drop("admin' --", "user")),
            payloadChip("hunter2 (normal)", drop("hunter2", "user"))
          ]),
          W.hint("The quote closes the text, and OR '1'='1' is always true, so the check passes.")
        ]);
      } else if (level === "intermediate") {
        helper = el("div", { attrs: { style: "margin-top:16px" } }, [
          W.hint("Close the username string with a quote, then make the condition always true, or comment out the rest with --.", ["beginner", "intermediate"])
        ]);
      } else {
        helper = el("div", { attrs: { style: "margin-top:16px" } }, [
          el("p", { class: "mod__instruction", text: "No hints. Craft an input that returns the admin row regardless of the password." })
        ]);
      }

      return {
        title: "Break into the login",
        instruction: "Watch the query rebuild as you type. Make it log you in without a real password.",
        node: el("div", { class: "grid grid-2" }, [
          el("div", {}, [form, helper]),
          el("div", {}, [queryHost, banner.node])
        ])
      };
    },

    /* ---------- FIX IT ---------- */
    fix(ctx) {
      const level = ctx.level;
      const payloadUser = "' OR '1'='1";
      const queryHost = el("div");
      const banner = W.resultBanner();
      let mode = "unsafe";
      let defenceChosen = level === "beginner"; // int/adv must choose first

      function render() { HL.ui.clear(queryHost).appendChild(queryPanel(payloadUser, "whatever", mode)); }
      render();

      function rerun() {
        if (!defenceChosen) { banner.show("Pick the correct defence first.", "danger"); return; }
        if (mode === "safe") {
          banner.show("Blocked. The payload is treated as a plain (wrong) username, login fails safely.", "safe");
          ctx.complete();
          HL.ui.toast("Defended! Input stayed as data.", "safe");
        } else {
          banner.show("Still vulnerable, the input is being glued into the SQL.", "danger");
        }
      }

      const toggle = W.toggle({
        label: "Use parameterised query",
        sub: "Bind input as data, not SQL",
        onChange(on) { mode = on ? "safe" : "unsafe"; render(); if (on) HL.ui.announce("Parameterised query enabled."); }
      });

      // Safe vs unsafe Laravel/PHP snippet (shown at intermediate+advanced)
      const snippet = codePair();

      // Defence chooser for intermediate/advanced
      let chooser = null;
      if (level !== "beginner") {
        const options = level === "advanced" ? advancedSnippetOptions() : intermediateOptions();
        chooser = el("div", { attrs: { style: "margin-bottom:20px" } }, [
          el("p", { class: "mod__instruction", attrs: { style: "margin-bottom:10px" }, text: level === "advanced" ? "Choose the line that safely fixes this:" : "Which fix actually stops SQL injection?" }),
          el("div", { class: "qopts" }, options.map((o, i) =>
            el("button", {
              class: "qopt", attrs: { type: "button" },
              onClick(e) {
                const btn = e.currentTarget;
                if (o.correct) {
                  btn.classList.add("correct"); btn.appendChild(icon("check", 16));
                  chooser.querySelectorAll(".qopt").forEach((b) => (b.disabled = true));
                  defenceChosen = true;
                  HL.ui.announce("Correct defence selected. Now enable it and re-run.");
                } else {
                  btn.classList.add("wrong"); btn.appendChild(icon("x", 16));
                  setTimeout(() => { btn.classList.remove("wrong"); if (btn.lastChild.tagName === "svg") btn.removeChild(btn.lastChild); }, 900);
                }
              }
            }, [el("span", { class: "qopt__key", text: String.fromCharCode(65 + i) }), el("span", o.html ? { html: o.html } : { text: o.text })])
          ))
        ]);
      }

      const controls = el("div", {}, [
        chooser,
        el("div", { attrs: { style: "margin-bottom:16px" } }, [toggle.node]),
        HL.ui.button("Re-run the attack", { variant: "primary", icon: "swap", onClick: rerun }),
        W.hint("Parameterised queries send the SQL and the values separately, so input can never change the command.", ["beginner"])
      ]);

      return {
        title: "Shut the door",
        instruction: "Turn the app's unsafe query into a parameterised one, then re-run the same payload and watch it get blocked.",
        node: el("div", {}, [
          el("div", { class: "grid grid-2" }, [controls, el("div", {}, [queryHost, banner.node])]),
          level !== "beginner" ? el("div", { attrs: { style: "margin-top:26px" } }, [snippet]) : null
        ])
      };
    },

    /* ---------- QUICK CHECK ---------- */
    quiz(ctx) {
      const passed = W.resultBanner();
      const questions = quizByLevel(ctx.level);
      const node = el("div", {}, [
        W.quiz(questions, { onPass() { passed.show("All correct, you've got SQL injection down.", "safe"); ctx.complete(); } }),
        passed.node
      ]);
      return {
        title: "Quick check",
        instruction: "Answer each question to earn the badge. Wrong answers just let you try again.",
        node
      };
    }
  });

  /* ---------- helpers ---------- */
  function payloadChip(label, onClick) {
    const c = HL.ui.chip(label);
    c.setAttribute("role", "button"); c.setAttribute("tabindex", "0");
    c.style.cursor = "pointer";
    c.addEventListener("click", onClick);
    c.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } });
    return c;
  }

  function codePair() {
    const bad = `// ❌ Unsafe: input glued into SQL
$user = $request->input('username');
DB::select(
  "SELECT * FROM users
   WHERE username = '$user'"
);`;
    const good = `// ✅ Safe: value bound as data
$user = $request->input('username');
DB::select(
  "SELECT * FROM users
   WHERE username = ?",
  [$user]
);`;
    return el("div", { class: "codepair" }, [
      el("div", { class: "codecol codecol--bad" }, [
        el("h4", {}, [icon("x", 14), document.createTextNode("Vulnerable (Laravel/PHP)")]),
        el("pre", { class: "code", text: bad })
      ]),
      el("div", { class: "codecol codecol--good" }, [
        el("h4", {}, [icon("check", 14), document.createTextNode("Fixed")]),
        el("pre", { class: "code", text: good })
      ])
    ]);
  }

  function intermediateOptions() {
    return [
      { text: "Use parameterised queries / prepared statements (bind values).", correct: true },
      { text: "Strip apostrophes from the input before building the string.", correct: false },
      { text: "Hide database error messages from the user.", correct: false }
    ];
  }
  function advancedSnippetOptions() {
    return [
      { html: '<code class="tok-safe">DB::select("… WHERE username = ?", [$user])</code>', correct: true },
      { html: '<code class="tok-inject">DB::select("… WHERE username = \'$user\'")</code>', correct: false },
      { html: '<code class="tok-inject">DB::select("… WHERE username = \'" . addslashes($user) . "\'")</code>', correct: false }
    ];
  }

  function quizByLevel(level) {
    const base = [
      {
        q: "What makes a login vulnerable to SQL injection?",
        options: [
          { text: "User input is pasted directly into the SQL string.", correct: true },
          { text: "The password is too short.", correct: false },
          { text: "The site doesn't use HTTPS.", correct: false }
        ]
      },
      {
        q: "Which input is a classic injection payload?",
        options: [
          { text: "' OR '1'='1", correct: true },
          { text: "P@ssw0rd!", correct: false },
          { text: "admin@example.com", correct: false }
        ]
      }
    ];
    if (level === "beginner") return base;
    const extra = {
      q: "Why do parameterised queries stop injection?",
      options: [
        { text: "Values travel separately from the SQL, so input can't become commands.", correct: true },
        { text: "They encrypt the database.", correct: false },
        { text: "They make queries run faster.", correct: false }
      ]
    };
    if (level === "intermediate") return base.concat(extra);
    // advanced: add a trickier one
    return base.concat(extra, {
      q: "Which is still unsafe even though it 'cleans' input?",
      options: [
        { text: "Escaping quotes by hand with string concatenation.", correct: true },
        { text: "Binding parameters with ? placeholders.", correct: false },
        { text: "Using an ORM's query builder with bindings.", correct: false }
      ]
    });
  }
})();
