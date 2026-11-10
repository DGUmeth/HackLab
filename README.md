# Hack Lab

An interactive, visual-first website that teaches the most common web attacks, and how to defend against them, through safe, hands-on simulations. Built for beginners and non-technical people, with Beginner / Intermediate / Advanced difficulty levels.

> **Everything is simulated.** No real exploits run. User input is matched against known demo payloads and the result is animated. Nothing you type is ever executed (no `eval`, no injecting user input as HTML).

By **DG Umeth**, IT graduate, Griffith University. A portfolio piece, styled to match [my portfolio](https://portfolio-henna-nine-57.vercel.app/).

---

## What's inside

- **Landing / level select**, choose Beginner, Intermediate or Advanced (change it any time from the top bar).
- **Mission Map**, numbered nodes with locked / in-progress / completed state, a progress bar and badges.
- **12 playable modules**, each with the same 4-step flow (**See it → Try it → Fix it → Quick check**) and all three difficulty levels:
  1. **SQL Injection**, rewrite a live database query to bypass a login; fix with parameterised queries.
  2. **Cross-Site Scripting (XSS)**, plant a script in a comment; fix with output escaping, CSP & HttpOnly.
  3. **Phishing**, spot the red flags in a fake email; fix with a domain mini-game and a habit checklist.
  4. **DDoS**, flood a server until it crashes; fix by deploying a rate limiter + CDN/WAF.
  5. **Credential stuffing**, watch a reused password unlock every account; fix with unique passwords + MFA.
  6. **CSRF**, an evil tab forges a bank transfer with your cookie; fix with CSRF tokens + SameSite.
  7. **Broken access / IDOR**, change an invoice ID to read someone else's data; fix with a server-side ownership check.
  8. **Malware / ransomware**, open a disguised file and watch files encrypt; recover from an offline backup.
  9. **Man-in-the-Middle**, send a login over HTTP and see it in clear text; fix with HTTPS + heeding cert warnings.
  10. **Session hijacking**, steal and reuse a session cookie; fix with HttpOnly, Secure, expiry & regeneration.
  11. **Social engineering**, a help-desk call where pressure leaks a reset; fix by verifying identity out-of-band.
  12. **Supply chain**, find a typosquatted package; fix by removing it, pinning versions and auditing.
- **Final boss**, spot and stop several attacks hidden in one fake company site.
- **Cheat sheet**, one card per attack, printable in black & white.
- **About**, how it's built, the simulation approach, and links.

Progress, badges and your chosen level are saved in `localStorage` (wrapped in `try/catch`, so the site still works if storage is blocked).

---

## Run it locally

It's a static site, no build step, no dependencies.

**Option A, just open it.** Double-click `index.html`. (Everything works from `file://`.)

**Option B, a local server** (recommended, closer to production):

```bash
# Python 3
python3 -m http.server 8000
# then open http://localhost:8000

# …or Node
npx serve .
```

---

## Deploy for free

**Vercel**
```bash
npm i -g vercel
vercel        # from the project folder; accept the defaults
```
Or import the repo at [vercel.com/new](https://vercel.com/new), no framework preset, output is the root.

**GitHub Pages**
1. Push this folder to a GitHub repo.
2. Repo → **Settings → Pages** → Source: *Deploy from a branch* → `main` / `root`.
3. Your site goes live at `https://<user>.github.io/<repo>/`.

**Netlify**, drag the folder onto [app.netlify.com/drop](https://app.netlify.com/drop), or connect the repo (no build command, publish directory = root).

---

## Project structure

```
index.html              App shell: nav, <main>, footer, script order
css/
  tokens.css            Design tokens (black/white palette, type, spacing, motion)
  base.css              Reset, typography, layout primitives, a11y helpers
  components.css        Nav, buttons, cards, chips, stepper, badges, footer, toasts
  modules.css           Simulation + view styles (diagrams, drag-drop, quiz, meters…)
  print.css             Black-and-white print styles (cheat sheet)
js/
  state.js              localStorage: level, progress, badges (try/catch)
  ui.js                 Safe DOM builder (el), icon library, toasts
  router.js             Hash routing
  app.js                Boot: level switcher, mobile nav, start router
  modules/
    registry.js         Metadata for all 12 attacks
    moduleBase.js       Shared 4-step flow + reusable widgets (toggle, quiz, hint…)
    sqli.js xss.js phishing.js ddos.js         One file per playable module…
    credstuff.js csrf.js idor.js malware.js     …12 modules in total
    mitm.js session.js social.js supply.js
  views/
    landing.js missionMap.js boss.js cheatsheet.js about.js
```

### Add a new module
1. Add its entry to `js/modules/registry.js` with `built: true`.
2. Create `js/modules/<id>.js` calling `HL.registerModule("<id>", { see, tryIt, fix, quiz })`.
3. Add its `<script>` tag to `index.html` (before `views/`).

The scaffold handles the stepper, progress saving and badge award, a module only builds its own simulation.

---

## Accessibility

Keyboard-operable throughout (drag-and-drop has a tap/click fallback), ARIA labels and live-region announcements, high-contrast black & white, and `prefers-reduced-motion` is respected (animations are disabled).

---

© 2026 DG Umeth
