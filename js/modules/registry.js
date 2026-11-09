/* ============================================================
   registry.js — metadata for all 12 attack modules.
   `built: true` modules have a full SEE/TRY/FIX/QUICK-CHECK flow
   (registered into HL.modules by their own file). The rest show on
   the Mission Map + Cheat Sheet as "Coming soon".
   ============================================================ */
(function () {
  "use strict";
  const HL = (window.HL = window.HL || {});

  HL.registry = [
    {
      id: "sqli", num: "01", built: true, icon: "database",
      title: "SQL Injection", short: "SQLi",
      tags: ["SQLi", "Injection", "Server"],
      blurb: "Type trickery that rewrites a database query to walk straight past the login.",
      defence: "Use <b>parameterised queries</b> — never glue user input into SQL."
    },
    {
      id: "xss", num: "02", built: true, icon: "code",
      title: "Cross-Site Scripting", short: "XSS",
      tags: ["XSS", "Client-side"],
      blurb: "A comment that hides a script, running in the next visitor's browser.",
      defence: "<b>Escape output</b> + set a Content-Security-Policy and HttpOnly cookies."
    },
    {
      id: "phishing", num: "03", built: true, icon: "mail",
      title: "Phishing", short: "Phish",
      tags: ["Phishing", "Human"],
      blurb: "A fake email that looks real and nudges you to click before you think.",
      defence: "<b>Check the sender domain + link</b> before you click. Slow down on urgency."
    },
    {
      id: "ddos", num: "04", built: true, icon: "bolt",
      title: "DDoS Flood", short: "DDoS",
      tags: ["DDoS", "Availability"],
      blurb: "A flood of fake traffic piling onto a server until real users can't get in.",
      defence: "<b>Rate-limit + CDN/WAF</b> to filter the flood and keep real users flowing."
    },

    { id: "credstuff", num: "05", built: true, icon: "key", title: "Credential Stuffing", short: "Creds",
      tags: ["Passwords", "Human"], blurb: "One leaked password unlocks many accounts.",
      defence: "<b>Unique passwords + MFA</b> on every account." },
    { id: "csrf", num: "06", built: true, icon: "swap", title: "CSRF", short: "CSRF",
      tags: ["CSRF", "Client-side"], blurb: "An evil page makes your browser act as you.",
      defence: "<b>CSRF tokens + SameSite cookies.</b>" },
    { id: "idor", num: "07", built: true, icon: "lock", title: "Broken Access / IDOR", short: "IDOR",
      tags: ["Access", "Server"], blurb: "Changing an ID in the URL reveals someone else's data.",
      defence: "<b>Server-side ownership checks</b> on every request." },
    { id: "malware", num: "08", built: true, icon: "skull", title: "Malware / Ransomware", short: "Malware",
      tags: ["Malware"], blurb: "A disguised file encrypts everything.",
      defence: "<b>Offline backups</b> + don't open unexpected files." },
    { id: "mitm", num: "09", built: true, icon: "wifi", title: "Man-in-the-Middle", short: "MITM",
      tags: ["Network"], blurb: "On open Wi-Fi, someone reads your traffic.",
      defence: "<b>Use HTTPS</b> and heed certificate warnings." },
    { id: "session", num: "10", built: true, icon: "cookie", title: "Session Hijacking", short: "Session",
      tags: ["Sessions"], blurb: "A stolen cookie becomes a logged-in you.",
      defence: "<b>Secure + HttpOnly cookies</b>, short expiry, regenerate on login." },
    { id: "social", num: "11", built: true, icon: "phone", title: "Social Engineering", short: "SocEng",
      tags: ["Human"], blurb: "A convincing caller talks their way in.",
      defence: "<b>Verify identity</b> out-of-band before helping." },
    { id: "supply", num: "12", built: true, icon: "package", title: "Supply Chain", short: "Supply",
      tags: ["Dependencies"], blurb: "A typosquatted package sneaks in malware.",
      defence: "<b>Pin versions + audit</b> dependencies." }
  ];

  HL.getModule = (id) => HL.registry.find((m) => m.id === id);
})();
