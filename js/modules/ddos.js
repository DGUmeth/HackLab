/* ============================================================
   ddos.js, Distributed Denial of Service module.
   TRY IT: launch a flood and watch the load meter crash the server.
   FIX IT: add rate-limiter + CDN/WAF defences; bad traffic is
   filtered, real users still get through.
   ============================================================ */
(function () {
  "use strict";
  const HL = window.HL;
  const { el, icon } = HL.ui;
  const W = HL.widgets;
  const SVGNS = "http://www.w3.org/2000/svg";

  function svgEl(name, attrs) { const n = document.createElementNS(SVGNS, name); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; }

  // A reusable "traffic field": bots on the left stream packets to a server on the right.
  function field({ withShield } = {}) {
    const svg = svgEl("svg", { viewBox: "0 0 640 220", role: "img" });
    svg.setAttribute("aria-label", "Traffic flowing from many bots toward a server.");
    svg.appendChild(svgEl("rect", { class: "dg-node", x: 20, y: 70, width: 110, height: 80, rx: 10 }));
    const botLabel = svgEl("text", { class: "dg-label", x: 75, y: 115, "text-anchor": "middle" }); botLabel.textContent = "Bots"; svg.appendChild(botLabel);

    if (withShield) {
      svg.appendChild(svgEl("rect", { x: 388, y: 56, width: 14, height: 108, rx: 4, fill: "none", stroke: "#3ad07a", "stroke-width": "2" }));
      const sl = svgEl("text", { class: "dg-label", x: 395, y: 48, "text-anchor": "middle", fill: "#3ad07a" }); sl.textContent = "WAF"; svg.appendChild(sl);
    }

    const server = svgEl("rect", { class: "dg-node", x: 500, y: 70, width: 120, height: 80, rx: 10 }); svg.appendChild(server);
    const statusText = svgEl("text", { class: "dg-label", x: 560, y: 108, "text-anchor": "middle" }); statusText.textContent = "online"; svg.appendChild(statusText);
    const serverLabel = svgEl("text", { class: "dg-label", x: 560, y: 128, "text-anchor": "middle" }); serverLabel.textContent = "Server"; svg.appendChild(serverLabel);

    const packets = svgEl("g", {}); svg.appendChild(packets);
    const wrap = el("div", { class: "diagram" }); wrap.appendChild(svg);

    return {
      node: wrap, server, statusText,
      // spawn a packet. type 'bad' (red) or 'good' (white). blocked=stops at shield.
      spawn(type, blocked) {
        if (packets.childNodes.length > 60) return; // cap
        const y = 80 + Math.random() * 60;
        const endX = blocked ? 392 : 540;
        const c = svgEl("circle", { r: 4, cx: 130, cy: y, fill: type === "bad" ? "#ff5257" : "#ffffff", opacity: "0.9" });
        const anim = svgEl("animateMotion", { dur: (0.9 + Math.random() * 0.5) + "s", fill: "freeze", path: `M0 0 H ${endX - 130}` });
        c.appendChild(anim); packets.appendChild(c);
        const ms = 1400;
        setTimeout(() => c.remove(), ms);
      },
      setServer(state) {
        if (state === "down") { this.server.setAttribute("stroke", "#ff5257"); this.statusText.textContent = "503 DOWN"; this.statusText.setAttribute("fill", "#ff5257"); }
        else if (state === "ok") { this.server.setAttribute("stroke", "#3ad07a"); this.statusText.textContent = "online"; this.statusText.setAttribute("fill", "#3ad07a"); }
        else { this.server.setAttribute("stroke", ""); this.statusText.textContent = "online"; this.statusText.setAttribute("fill", ""); }
      }
    };
  }

  function loadMeter() {
    const fill = el("div", { class: "meter__fill" });
    const val = el("span", { text: "0%" });
    const node = el("div", {}, [
      el("div", { class: "meter__cap" }, [el("span", { text: "Server load" }), val]),
      el("div", { class: "meter", attrs: { role: "progressbar", "aria-label": "Server load", "aria-valuemin": "0", "aria-valuemax": "100", "aria-valuenow": "0" } }, [fill])
    ]);
    return {
      node,
      set(pct) {
        pct = Math.max(0, Math.min(100, pct));
        fill.style.width = pct + "%";
        val.textContent = Math.round(pct) + "%";
        node.querySelector(".meter").setAttribute("aria-valuenow", Math.round(pct));
        fill.classList.toggle("mid", pct >= 50 && pct < 85);
        fill.classList.toggle("high", pct >= 85);
      }
    };
  }

  HL.registerModule("ddos", {
    see() {
      const f = field({});
      let load = 0;
      const meter = loadMeter();
      if (HL.ui.reducedMotion()) {
        // Static illustration for reduced-motion users.
        meter.set(90);
      } else {
        // auto-loop demo
        const timer = setInterval(() => {
          if (!document.body.contains(f.node)) { clearInterval(timer); return; }
          for (let i = 0; i < 4; i++) f.spawn("bad", false);
          load = load + 9; if (load >= 100) { load = 0; }
          meter.set(load < 95 ? load : 100);
        }, 420);
      }
      return {
        title: "How a DDoS flood works",
        instruction: "Thousands of machines send junk requests at once. The server's load climbs until real users can't get through.",
        node: el("div", {}, [f.node, el("div", { attrs: { style: "margin-top:16px" } }, [meter.node])])
      };
    },

    tryIt(ctx) {
      const level = ctx.level;
      const f = field({});
      const meter = loadMeter();
      const banner = W.resultBanner();
      let load = 0, timer = null, crashed = false;

      function tick() {
        for (let i = 0; i < 6; i++) f.spawn("bad", false);
        load += 6 + Math.random() * 6;
        meter.set(load);
        if (load >= 100 && !crashed) {
          crashed = true; clearInterval(timer); timer = null;
          f.setServer("down");
          banner.show("Server overloaded, it crashed. Real customers now get errors.", "danger");
          launchBtn.disabled = true;
          ctx.complete();
          HL.ui.toast("Server down. Now defend it.", "danger");
        }
      }
      const launchBtn = HL.ui.button("Launch the flood", { variant: "primary", icon: "bolt", onClick() {
        if (timer || crashed) return;
        banner.show("Flood launched, watch the load climb.", "danger");
        timer = setInterval(tick, 300);
      } });

      const helper = level === "beginner"
        ? W.hint("Press Launch and watch the load meter climb to 100%, that's the server crashing.")
        : (level === "intermediate" ? null : el("p", { class: "mod__instruction", text: "Overwhelm the server, then fix it so legitimate users stay online." }));

      return {
        title: "Overwhelm the server",
        instruction: "Unleash a flood of bot traffic and watch the load meter push the server offline.",
        node: el("div", {}, [f.node, el("div", { attrs: { style: "margin:16px 0" } }, [meter.node]), launchBtn, helper, banner.node])
      };
    },

    fix(ctx) {
      const level = ctx.level;
      const f = field({ withShield: true });
      const meter = loadMeter();
      const banner = W.resultBanner();
      const active = new Set();

      // defence options (effective vs weak)
      const defs = level === "advanced"
        ? [{ t: "Rate limiter", good: true }, { t: "CDN / WAF", good: true }, { t: "Bigger server (scale up)", good: false }, { t: "Restart on crash", good: false }]
        : level === "intermediate"
        ? [{ t: "Rate limiter", good: true }, { t: "CDN / WAF", good: true }, { t: "Add more RAM", good: false }]
        : [{ t: "Rate limiter", good: true }, { t: "CDN / WAF", good: true }];
      const needed = defs.filter((d) => d.good).length;

      const stack = el("div", { class: "dnd__col", attrs: { "aria-label": "Active defences" } }, [el("h4", { text: "Defences protecting the server" })]);
      const pool = el("div", { class: "dnd__col", attrs: { "aria-label": "Available defences" } }, [el("h4", { text: "Tap a defence to deploy it" })]);

      defs.forEach((d) => {
        const tok = el("button", { class: "token", attrs: { type: "button" } }, [el("span", { class: "token__grip" }, icon("shield", 14)), el("span", { text: d.t })]);
        tok.addEventListener("click", () => {
          if (!d.good) { HL.ui.toast(d.t + " helps a little, but won't filter a flood.", "danger"); tok.classList.add("wrong"); setTimeout(() => tok.classList.remove("wrong"), 600); return; }
          if (active.has(d.t)) return;
          active.add(d.t); tok.remove();
          stack.appendChild(el("div", { class: "token token--placed" }, [icon("check", 14), el("span", { text: d.t })]));
          if (active.size >= needed) { stack.classList.add("drop-ok"); HL.ui.announce("Defences ready, re-run the flood."); }
        });
        pool.appendChild(tok);
      });

      let load = 0, timer = null, settled = false;
      function rerun() {
        if (active.size < needed) { banner.show("Deploy the effective defences first.", "danger"); return; }
        if (timer) return;
        settled = false; load = 0; f.setServer("ok"); banner.hide();
        timer = setInterval(() => {
          for (let i = 0; i < 6; i++) f.spawn("bad", true);  // bad traffic stopped at the WAF
          for (let i = 0; i < 2; i++) f.spawn("good", false); // real users get through
          load = Math.min(48 + Math.random() * 10, 60);       // stays in the safe zone
          meter.set(load);
          if (!settled) {
            settled = true;
            setTimeout(() => {
              clearInterval(timer); timer = null;
              banner.show("Flood filtered. Load holds steady and real users stay online.", "safe");
              ctx.complete(); HL.ui.toast("Defended, server survived.", "safe");
            }, 2200);
          }
        }, 300);
      }

      return {
        title: "Filter the flood",
        instruction: "Deploy the defences that filter junk traffic, then re-run the flood and watch the server stay up.",
        node: el("div", {}, [
          f.node,
          el("div", { attrs: { style: "margin:16px 0" } }, [meter.node]),
          el("div", { class: "dnd", attrs: { style: "margin-bottom:16px" } }, [pool, stack]),
          HL.ui.button("Re-run the flood", { variant: "primary", icon: "swap", onClick: rerun }),
          level === "beginner" ? W.hint("A rate limiter caps requests per IP; a CDN/WAF soaks up and filters bad traffic before it reaches you.") : null,
          banner.node
        ])
      };
    },

    quiz(ctx) {
      const passed = W.resultBanner();
      const q = [
        { q: "What is the goal of a DDoS attack?", options: [
          { text: "Overwhelm a service so real users can't use it.", correct: true },
          { text: "Steal the password database.", correct: false },
          { text: "Rewrite a SQL query.", correct: false } ] },
        { q: "Which defence actually filters flood traffic?", options: [
          { text: "A CDN/WAF plus rate limiting.", correct: true },
          { text: "A longer password.", correct: false },
          { text: "Turning the server off and on.", correct: false } ] }
      ];
      if (ctx.level !== "beginner") q.push({ q: "Why isn't 'just add more servers' a full fix?", options: [
        { text: "Attackers can scale their flood too; you must filter bad traffic.", correct: true },
        { text: "Servers can't be added.", correct: false },
        { text: "It encrypts traffic.", correct: false } ] });
      const node = el("div", {}, [W.quiz(q, { onPass() { passed.show("You can keep a service standing now.", "safe"); ctx.complete(); } }), passed.node]);
      return { title: "Quick check", instruction: "Answer each question to earn the badge.", node };
    }
  });
})();
