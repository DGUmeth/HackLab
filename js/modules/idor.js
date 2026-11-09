/* ============================================================
   idor.js — Broken Access Control / IDOR.
   TRY: change the invoice ID in the URL and see someone else's data.
   FIX: enable a server-side ownership check -> 403 Forbidden.
   ============================================================ */
(function () {
  "use strict";
  const HL = window.HL;
  const { el, icon } = HL.ui;
  const W = HL.widgets;

  const INVOICES = {
    101: { name: "You (Alex Carter)", amount: "€120.00", item: "Pro plan — October", owner: true },
    102: { name: "Jane Doe", amount: "€4,980.00", item: "Enterprise plan — October", owner: false },
    103: { name: "Omar Said", amount: "€75.00", item: "Starter plan — October", owner: false }
  };
  function diagram(svg) { const w = el("div", { class: "diagram" }); w.innerHTML = svg; return w; }

  HL.registerModule("idor", {
    see() {
      return {
        title: "How IDOR works",
        instruction: "If the server shows any record by its ID without checking who's asking, changing the number in the URL reveals other people's data.",
        node: diagram(`<svg viewBox="0 0 640 200" role="img" aria-label="Changing the invoice ID in the URL returns another customer's invoice.">
          <rect class="dg-node" x="16" y="72" width="150" height="56" rx="10"/><text class="dg-label" x="91" y="98" text-anchor="middle">/invoice/101</text><text class="dg-label" x="91" y="114" text-anchor="middle" fill="#ff5257">→ 102</text>
          <path class="dg-line dg-flow" d="M166 100 H474"/>
          <rect class="dg-node" x="474" y="72" width="150" height="56" rx="10"/><text class="dg-label" x="549" y="98" text-anchor="middle">Server</text><text class="dg-label" x="549" y="114" text-anchor="middle" fill="#ff5257">Jane's invoice</text>
          <circle class="dg-packet" r="5"><animateMotion dur="2.2s" repeatCount="indefinite" path="M166 100 H474"/></circle>
        </svg>`)
      };
    },

    tryIt(ctx) {
      const level = ctx.level;
      const banner = W.resultBanner();
      const idIn = el("input", { class: "input", attrs: { type: "text", value: "101", "aria-label": "Invoice ID", style: "max-width:120px" } });
      const panel = el("div", { class: "fakeui__body" });
      const url = el("span", { text: "https://app.example/invoice/101" });

      function openInvoice() {
        const id = String(idIn.value).trim();
        url.textContent = "https://app.example/invoice/" + id;
        const inv = INVOICES[id];
        HL.ui.clear(panel);
        if (!inv) { panel.appendChild(el("p", { class: "card__desc", text: "No invoice with that ID." })); return; }
        panel.appendChild(el("p", { class: "eyebrow", text: "Invoice #" + id }));
        panel.appendChild(el("h3", { attrs: { style: "margin:6px 0" }, text: inv.name }));
        panel.appendChild(el("p", { class: "card__desc", text: inv.item }));
        panel.appendChild(el("p", { attrs: { style: "font-family:var(--font-head);font-size:1.4rem;margin-top:8px" }, text: inv.amount }));
        if (!inv.owner) {
          panel.appendChild(el("span", { class: "chip chip--danger", attrs: { style: "margin-top:12px" }, text: "not your invoice" }));
          banner.show("You're viewing " + inv.name + "'s private invoice just by changing the ID.", "danger");
          ctx.complete(); HL.ui.toast("Accessed someone else's data.", "danger");
        } else banner.show("This is your own invoice. Try a different ID…", "safe");
      }
      openInvoice();

      let helper;
      if (level === "beginner") helper = el("div", { attrs: { style: "margin-top:12px" } }, [el("div", { class: "chips" }, [W.payloadChip("Try 102", () => { idIn.value = "102"; openInvoice(); }), W.payloadChip("Try 103", () => { idIn.value = "103"; openInvoice(); })]), W.hint("Change 101 to 102 and press Open — you'll see Jane's invoice.")]);
      else if (level === "intermediate") helper = W.hint("Your invoice is #101. What happens with the IDs next to yours?", ["beginner", "intermediate"]);
      else helper = el("p", { class: "mod__instruction", attrs: { style: "margin-top:12px" }, text: "Access an invoice that isn't yours." });

      return {
        title: "Change the number, see the data",
        instruction: "This page loads invoices by ID with no ownership check. Change the ID and open someone else's.",
        node: el("div", {}, [el("div", { class: "fakeui" }, [el("div", { class: "fakeui__bar" }, [el("div", { class: "fakeui__dots" }, [el("i"), el("i"), el("i")]), el("div", { class: "fakeui__url" }, [url])]), panel]), el("div", { attrs: { style: "display:flex;gap:10px;align-items:center;margin-top:14px" } }, [el("label", { class: "eyebrow", text: "Invoice ID" }), idIn, HL.ui.button("Open", { variant: "primary", onClick: openInvoice })]), helper, banner.node])
      };
    },

    fix(ctx) {
      const level = ctx.level;
      const banner = W.resultBanner();
      let check = false, chosen = level === "beginner";
      const idIn = el("input", { class: "input", attrs: { type: "text", value: "102", "aria-label": "Invoice ID", style: "max-width:120px" } });
      const panel = el("div", { class: "fakeui__body" });

      function openInvoice() {
        if (!chosen) { banner.show("Pick the correct fix first.", "danger"); return; }
        const id = String(idIn.value).trim();
        const inv = INVOICES[id];
        HL.ui.clear(panel);
        if (check && inv && !inv.owner) {
          panel.appendChild(el("p", { class: "eyebrow", attrs: { style: "color:var(--safe)" }, text: "403 Forbidden" }));
          panel.appendChild(el("p", { class: "card__desc", attrs: { style: "margin-top:6px" }, text: "This invoice doesn't belong to you." }));
          banner.show("Blocked. The server checks ownership before returning the record.", "safe");
          ctx.complete(); HL.ui.toast("Access denied — fixed.", "safe");
        } else if (inv) {
          panel.appendChild(el("h3", { text: inv.name })); panel.appendChild(el("p", { class: "card__desc", text: inv.amount }));
          banner.show(check ? "That one is yours, so it's allowed." : "Still leaking — enable the ownership check.", check ? "safe" : "danger");
        }
      }

      const toggle = W.toggle({ label: "Server-side ownership check", sub: "Verify the record belongs to the logged-in user", onChange(v) { check = v; } });
      let chooser = null;
      if (level !== "beginner") {
        const opts = level === "advanced"
          ? [{ html: 'Scope the query: <code class="tok-safe">WHERE id = ? AND user_id = session.user</code>', correct: true }, { html: 'Make IDs <code class="tok-inject">random UUIDs</code> and hope nobody guesses', correct: false }, { html: 'Hide the ID in a <code class="tok-inject">hidden form field</code>', correct: false }]
          : [{ text: "Check on the server that the record belongs to the logged-in user.", correct: true }, { text: "Use bigger ID numbers.", correct: false }, { text: "Hide the invoice link in the menu.", correct: false }];
        chooser = W.chooser("Which actually fixes IDOR?", opts, () => { chosen = true; HL.ui.announce("Correct — enable it and re-open."); });
      }

      return { title: "Check who's asking", instruction: "Enable the ownership check, then try to open invoice #102 again.", node: el("div", {}, [chooser, el("div", { attrs: { style: "margin-bottom:14px;max-width:460px" } }, [toggle.node]), el("div", { class: "fakeui" }, [el("div", { class: "fakeui__bar" }, [el("div", { class: "fakeui__dots" }, [el("i"), el("i"), el("i")]), el("div", { class: "fakeui__url", text: "https://app.example/invoice/102" })]), panel]), el("div", { attrs: { style: "display:flex;gap:10px;align-items:center;margin-top:14px" } }, [el("label", { class: "eyebrow", text: "Invoice ID" }), idIn, HL.ui.button("Open", { variant: "primary", icon: "swap", onClick: openInvoice })]), W.hint("Obscure IDs only hide the problem; the real fix is checking ownership on every request.", ["beginner"]), banner.node]) };
    },

    quiz(ctx) {
      const passed = W.resultBanner();
      const q = [
        { q: "What is IDOR?", options: [{ text: "Accessing others' records by changing an ID, with no ownership check.", correct: true }, { text: "Guessing passwords.", correct: false }, { text: "Flooding a server.", correct: false }] },
        { q: "The correct fix is…", options: [{ text: "Check on the server that the record belongs to the user.", correct: true }, { text: "Use longer IDs.", correct: false }, { text: "Hide the URL.", correct: false }] }
      ];
      if (ctx.level !== "beginner") q.push({ q: "Why aren't random UUIDs a real fix?", options: [{ text: "They only obscure IDs; access still isn't authorised.", correct: true }, { text: "They're too long.", correct: false }, { text: "They break the database.", correct: false }] });
      return { title: "Quick check", instruction: "Answer each question to earn the badge.", node: el("div", {}, [W.quiz(q, { onPass() { passed.show("Access control locked down.", "safe"); ctx.complete(); } }), passed.node]) };
    }
  });
})();
