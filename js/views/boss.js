/* ============================================================
   boss.js — Final boss: a fake company site with several planted
   attacks. Spot each one and choose how to stop it.
   ============================================================ */
(function () {
  "use strict";
  const HL = window.HL;
  const { el, icon } = HL.ui;
  HL.views = HL.views || {};

  const THREATS = [
    { id: "t1", icon: "mail", where: "Inbox banner", found: "“security@acme-corp.co” asks staff to reset passwords via a link.",
      q: "What is this, and how do you stop it?",
      options: [ { text: "Phishing — verify the sender and go to the site directly.", correct: true }, { text: "DDoS — add a rate limiter.", correct: false }, { text: "Nothing — it has the company logo.", correct: false } ] },
    { id: "t2", icon: "database", where: "Admin login",
      found: "The login runs: …WHERE user = '$name' with input glued in.",
      q: "How do you shut this down?",
      options: [ { text: "SQL injection — use parameterised queries.", correct: true }, { text: "Hide the error messages.", correct: false }, { text: "Make the password longer.", correct: false } ] },
    { id: "t3", icon: "code", where: "Product reviews",
      found: "A review contains <script>…</script> and is shown unescaped.",
      q: "What stops it running in visitors' browsers?",
      options: [ { text: "XSS — escape output and set a CSP.", correct: true }, { text: "Add HTTPS.", correct: false }, { text: "Delete the reviews page.", correct: false } ] },
    { id: "t4", icon: "download", where: "Downloads",
      found: "A file named “invoice.pdf.exe” is offered for download.",
      q: "What's the danger and the move?",
      options: [ { text: "Malware — the real extension is .exe; don't run it.", correct: true }, { text: "It's a normal PDF, open it.", correct: false }, { text: "CSRF — add a token.", correct: false } ] }
  ];

  HL.views.boss = function () {
    const caught = new Set();
    const total = THREATS.length;
    const banner = HL.widgets.resultBanner();

    const scoreTag = el("span", { class: "chip chip--solid", text: "0 / " + total + " stopped" });

    // Fake company site mock (decorative context)
    const site = el("div", { class: "boss__site rise" }, [
      el("div", { class: "fakeui__bar" }, [el("div", { class: "fakeui__dots" }, [el("i"), el("i"), el("i")]), el("div", { class: "fakeui__url", text: "https://acme-corp.example/admin" })]),
      el("div", { class: "fakeui__body" }, [
        el("div", { attrs: { style: "display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px" } }, [
          el("b", { attrs: { style: "font-family:var(--font-head);font-size:1.3rem" }, text: "ACME CORP · Admin" }),
          el("span", { class: "chip chip--danger", text: "4 threats hidden" })
        ]),
        el("p", { class: "lead", attrs: { style: "margin-top:10px" }, text: "Four attacks are live on this site. Inspect each area below and choose how to stop it." })
      ])
    ]);

    const list = el("div", { class: "boss__threats" }, THREATS.map((t) => threatCard(t)));

    function threatCard(t) {
      const opts = el("div", { class: "qopts", attrs: { style: "display:none;margin-top:12px" } });
      const card = el("div", { class: "threat", attrs: { style: "flex-direction:column;align-items:stretch" } });
      const headRow = el("div", { attrs: { style: "display:flex;align-items:center;gap:14px;justify-content:space-between;width:100%" } }, [
        el("div", { attrs: { style: "display:flex;align-items:center;gap:12px" } }, [
          el("span", { class: "node__icon", attrs: { style: "width:28px;height:28px" } }, icon(t.icon, 26)),
          el("div", {}, [el("b", { text: t.where }), el("div", { class: "card__desc", text: t.found })])
        ]),
        el("span", { class: "threat__status", text: "not stopped" })
      ]);
      const inspectBtn = HL.ui.button("Inspect & stop", { variant: "ghost", size: "sm", icon: "eye", onClick: () => { opts.style.display = "grid"; inspectBtn.remove(); } });

      t.options.forEach((o, i) => {
        const b = el("button", { class: "qopt", attrs: { type: "button" }, onClick() {
          if (o.correct) {
            b.classList.add("correct"); b.appendChild(icon("check", 16));
            opts.querySelectorAll(".qopt").forEach((x) => (x.disabled = true));
            card.classList.add("caught");
            headRow.querySelector(".threat__status").textContent = "stopped ✓";
            caught.add(t.id);
            scoreTag.textContent = caught.size + " / " + total + " stopped";
            HL.ui.toast("Threat stopped: " + t.where, "safe");
            if (caught.size === total) win();
          } else {
            b.classList.add("wrong"); b.appendChild(icon("x", 16));
            setTimeout(() => { b.classList.remove("wrong"); if (b.lastChild.tagName === "svg") b.removeChild(b.lastChild); }, 900);
          }
        } }, [el("span", { class: "qopt__key", text: String.fromCharCode(65 + i) }), el("span", { text: o.text })]);
        opts.appendChild(b);
      });

      card.appendChild(headRow);
      card.appendChild(el("p", { class: "mod__instruction", attrs: { style: "margin:12px 0 0;font-size:var(--fs-sm)" }, text: t.q }));
      card.appendChild(inspectBtn);
      card.appendChild(opts);
      return card;
    }

    function win() {
      HL.state.setBossBest(total);
      banner.show("All clear — you spotted and stopped every attack. Boss defeated!", "safe");
      HL.ui.toast("Boss defeated! 🏆", "safe");
    }

    const best = HL.state.getBossBest();
    return el("div", { class: "container" }, [
      el("div", { class: "map__head rise" }, [
        el("div", {}, [el("p", { class: "eyebrow", text: "Final boss" }), el("h1", { attrs: { style: "margin-top:8px" }, text: "Defend ACME Corp" })]),
        el("div", { attrs: { style: "display:flex;gap:10px;align-items:center" } }, [best ? el("span", { class: "chip", text: "Best: " + best + "/" + total }) : null, scoreTag])
      ]),
      el("p", { class: "lead", attrs: { style: "margin:10px 0 24px" }, text: "A mix of everything you've learned. Stop all four attacks to win." }),
      site,
      list,
      banner.node,
      el("div", { attrs: { style: "margin-top:24px" } }, [HL.ui.button("Back to missions", { variant: "ghost", icon: "arrowL", onClick: () => (location.hash = "#/map") })])
    ]);
  };
})();
