/* ============================================================
   moduleBase.js — the shared 4-step flow every attack module uses.
   Steps: SEE IT → TRY IT → FIX IT → QUICK CHECK.

   A module registers itself with HL.registerModule(id, def) where
   def provides four builder functions. Each builder receives a
   `ctx` and returns { instruction, node }:

     def.see(ctx)   -> looping diagram (always "complete")
     def.tryIt(ctx) -> perform the attack; call ctx.complete() when done
     def.fix(ctx)   -> apply the defence; call ctx.complete() when blocked
     def.quiz(ctx)  -> questions; call ctx.complete() when passed

   The scaffold handles the stepper, Prev/Next gating, progress
   saving and the final badge award. Modules stay focused on their
   own simulation.
   ============================================================ */
(function () {
  "use strict";
  const HL = (window.HL = window.HL || {});
  const { el, icon, button } = HL.ui;

  HL.modules = HL.modules || {};
  HL.registerModule = (id, def) => { HL.modules[id] = def; };

  const STEP_LABELS = ["See it", "Try it", "Fix it", "Quick check"];
  const STEP_METHODS = ["see", "tryIt", "fix", "quiz"];

  // Called by the router. Returns the module view node.
  HL.renderModule = function (id) {
    const meta = HL.getModule(id);
    const def = HL.modules[id];
    if (!meta || !def) return comingSoon(meta);

    const level = HL.state.getLevel() || "beginner";
    const saved = HL.state.getProgress(id);
    let current = Math.min(saved.step || 0, 3);
    let maxReached = current;
    const complete = [true, false, false, false]; // See-it needs no task

    const root = el("div", { class: "container" });

    // ---- Header ----
    const header = el("div", { class: "mod__header rise" }, [
      el("div", { class: "mod__kicker" }, [
        el("span", { class: "mod__num", text: meta.num }),
        el("h1", { text: meta.title })
      ]),
      el("div", { class: "chips" }, meta.tags.map((t) => HL.ui.chip(t)).concat([HL.ui.chip(HL.state.levelLabel(level), "solid")]))
    ]);
    root.appendChild(header);

    // ---- Stepper ----
    const stepper = el("div", { class: "stepper rise rise-1", attrs: { role: "tablist", "aria-label": "Module steps" } });
    root.appendChild(stepper);

    // ---- Panel + nav ----
    const panel = el("section", { class: "mod__panel rise rise-2", attrs: { role: "tabpanel", "aria-live": "polite" } });
    const nav = el("div", { class: "mod__nav" });
    root.appendChild(panel);
    root.appendChild(nav);

    function ctx() {
      return {
        level, module: meta,
        el, icon, chip: HL.ui.chip, button, toast: HL.ui.toast, announce: HL.ui.announce, escape: HL.ui.escapeHTML,
        complete() { complete[current] = true; refreshNav(); },
        uncomplete() { complete[current] = false; refreshNav(); },
        goNext() { go(current + 1); }
      };
    }

    function buildStepper() {
      HL.ui.clear(stepper);
      STEP_LABELS.forEach((label, i) => {
        const cls = ["stepper__step"];
        if (i === current) cls.push("is-active");
        else if (i < maxReached || (i < current)) cls.push("is-done");
        if (complete[i] && i !== current) cls.push("is-done");
        const canClick = i <= maxReached;
        const step = el("button", {
          class: cls.join(" "),
          attrs: { role: "tab", "aria-selected": i === current ? "true" : "false", disabled: canClick ? null : "" },
          onClick: canClick ? () => go(i) : null
        }, [
          el("span", { class: "stepper__dot" }, complete[i] && i < current ? icon("check", 12) : String(i + 1)),
          el("span", { class: "stepper__label", text: label })
        ]);
        stepper.appendChild(step);
      });
    }

    function refreshNav() {
      HL.ui.clear(nav);
      // Prev
      nav.appendChild(
        current === 0
          ? button("All missions", { variant: "ghost", icon: "arrowL", onClick: () => (location.hash = "#/map") })
          : button("Back", { variant: "ghost", icon: "arrowL", onClick: () => go(current - 1) })
      );
      // Next / Finish
      const isLast = current === 3;
      const canAdvance = complete[current];
      if (isLast) {
        const b = button("Finish & earn badge", { variant: "primary", icon: "trophy", onClick: finish, disabled: !canAdvance });
        nav.appendChild(b);
      } else {
        nav.appendChild(button("Next step", { variant: "primary", icon: "arrowR", onClick: () => go(current + 1), disabled: !canAdvance }));
      }
    }

    function renderStep() {
      HL.ui.clear(panel);
      const method = STEP_METHODS[current];
      const out = def[method](ctx()) || {};
      const titleRow = el("div", { class: "mod__steptitle" }, [
        el("span", { class: "tag", text: STEP_LABELS[current] }),
        el("h2", { text: out.title || meta.title })
      ]);
      panel.appendChild(titleRow);
      if (out.instruction) panel.appendChild(el("p", { class: "mod__instruction", text: out.instruction }));
      if (out.node) panel.appendChild(out.node);
      // Focus panel heading for screen-reader/keyboard users on step change.
      panel.setAttribute("tabindex", "-1");
    }

    function go(i) {
      i = Math.max(0, Math.min(3, i));
      current = i;
      maxReached = Math.max(maxReached, i);
      HL.state.setStep(id, i);
      buildStepper();
      renderStep();
      refreshNav();
      panel.focus();
      // Scroll panel into comfortable view on small screens.
      if (window.scrollY > 200) window.scrollTo({ top: 120, behavior: "smooth" });
    }

    function finish() {
      HL.state.completeModule(id);
      HL.ui.toast("Badge earned: " + meta.title + " ✓", "safe");
      location.hash = "#/map";
    }

    buildStepper();
    renderStep();
    refreshNav();
    return root;
  };

  function comingSoon(meta) {
    const { el, icon } = HL.ui;
    return el("div", { class: "container" }, [
      el("div", { class: "soon rise" }, [
        icon("lock", 48),
        el("h1", { text: (meta ? meta.title : "Module") + " — coming soon" }),
        el("p", { class: "lead", attrs: { style: "margin:10px auto 22px" }, text: "This module isn't built yet. The four flagship modules are ready to play now." }),
        HL.ui.button("Back to missions", { variant: "primary", icon: "arrowL", onClick: () => (location.hash = "#/map") })
      ])
    ]);
  }

  /* ---------- Shared simulation widgets used by multiple modules ---------- */
  HL.widgets = {
    // A labelled result banner (danger/safe). Returns {node, show(text,type)}.
    resultBanner() {
      const { el, icon } = HL.ui;
      const iconSlot = el("span", { class: "result__icon" });
      const textSlot = el("span");
      const node = el("div", { class: "result", attrs: { role: "status" } }, [iconSlot, textSlot]);
      return {
        node,
        show(text, type) {
          node.className = "result show result--" + type;
          HL.ui.clear(iconSlot).appendChild(icon(type === "safe" ? "check" : "alert", 22));
          textSlot.textContent = text;
          HL.ui.announce(text);
        },
        hide() { node.className = "result"; }
      };
    },

    // A toggle switch. opts: {label, sub, onChange(checked)}
    toggle({ label, sub, onChange, id }) {
      const { el } = HL.ui;
      const input = el("input", { attrs: { type: "checkbox", id: id || "" } });
      input.addEventListener("change", () => onChange && onChange(input.checked));
      const lbl = el("label", { class: "toggle" }, [
        input,
        el("span", { class: "toggle__track" }, el("span", { class: "toggle__thumb" })),
        el("span", { class: "toggle__text" }, [el("b", { text: label }), sub ? el("span", { text: sub }) : null])
      ]);
      return { node: lbl, input, isOn: () => input.checked, set: (v) => { input.checked = v; } };
    },

    // Hint box, only shown for beginner (and optionally intermediate).
    hint(text, levels = ["beginner"]) {
      const level = HL.state.getLevel() || "beginner";
      if (!levels.includes(level)) return null;
      const { el, icon } = HL.ui;
      return el("div", { class: "hint" }, [icon("info", 16), el("div", {}, [el("b", { text: "Hint: " }), document.createTextNode(text)])]);
    },

    /* A clickable chip that runs onClick (keyboard-operable). */
    payloadChip(label, onClick, variant) {
      const c = HL.ui.chip(label, variant);
      c.setAttribute("role", "button"); c.setAttribute("tabindex", "0"); c.style.cursor = "pointer";
      c.addEventListener("click", onClick);
      c.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } });
      return c;
    },

    /* Multiple-choice "pick the fix" block. options=[{text|html, correct}].
       Calls onCorrect() when the right one is chosen; wrong answers retry. */
    chooser(prompt, options, onCorrect) {
      const { el, icon } = HL.ui;
      const wrap = el("div", { attrs: { style: "margin-bottom:18px" } }, [
        prompt ? el("p", { class: "mod__instruction", attrs: { style: "margin-bottom:10px" }, text: prompt }) : null,
        el("div", { class: "qopts" }, options.map((o, i) => el("button", {
          class: "qopt", attrs: { type: "button" },
          onClick(e) {
            const b = e.currentTarget;
            if (o.correct) {
              b.classList.add("correct"); b.appendChild(icon("check", 16));
              wrap.querySelectorAll(".qopt").forEach((x) => (x.disabled = true));
              onCorrect && onCorrect();
            } else {
              b.classList.add("wrong"); b.appendChild(icon("x", 16));
              setTimeout(() => { b.classList.remove("wrong"); if (b.lastChild && b.lastChild.tagName === "svg") b.removeChild(b.lastChild); }, 900);
            }
          }
        }, [el("span", { class: "qopt__key", text: String.fromCharCode(65 + i) }), el("span", o.html ? { html: o.html } : { text: o.text })])))
      ]);
      return wrap;
    },

    /* Quiz: questions = [{ q, options:[{text, correct}] }].
       Calls onPass() once every question has been answered correctly.
       Wrong answers can be retried. Keyboard + screen-reader friendly. */
    quiz(questions, { onPass } = {}) {
      const { el, icon } = HL.ui;
      const solved = new Set();
      const wrap = el("div", { class: "quiz" });

      questions.forEach((q, qi) => {
        const card = el("div", { class: "qcard" });
        card.appendChild(el("p", { class: "qcard__q", text: (qi + 1) + ". " + q.q }));
        const opts = el("div", { class: "qopts", attrs: { role: "group", "aria-label": q.q } });
        q.options.forEach((opt, oi) => {
          const key = String.fromCharCode(65 + oi); // A, B, C…
          const btn = el("button", {
            class: "qopt",
            attrs: { type: "button" },
            onClick() {
              if (solved.has(qi)) return;        // already correct, lock it
              if (opt.correct) {
                btn.classList.add("correct");
                solved.add(qi);
                // lock siblings
                opts.querySelectorAll(".qopt").forEach((b) => (b.disabled = true));
                btn.appendChild(icon("check", 16));
                if (solved.size === questions.length && onPass) onPass();
              } else {
                btn.classList.add("wrong");
                btn.appendChild(icon("x", 16));
                HL.ui.announce("Not quite — try another answer.");
                setTimeout(() => { btn.classList.remove("wrong"); btn.lastChild && btn.lastChild.tagName === "svg" && btn.removeChild(btn.lastChild); }, 900);
              }
            }
          }, [el("span", { class: "qopt__key", text: key }), el("span", { text: opt.text })]);
          opts.appendChild(btn);
        });
        card.appendChild(opts);
        wrap.appendChild(card);
      });
      return wrap;
    }
  };
})();
