/* ============================================================
   state.js, persistent state for Hack Lab
   Stores the chosen difficulty level, per-module progress and
   earned badges in localStorage. Every access is wrapped in
   try/catch so the site still works if storage is unavailable
   (private mode, blocked cookies, file:// quirks).
   ============================================================ */
(function () {
  "use strict";

  // Shared global namespace for the whole app.
  const HL = (window.HL = window.HL || {});

  const KEY = "hacklab.v1";
  const LEVELS = ["beginner", "intermediate", "advanced"];

  // Default shape of our saved data.
  const defaults = {
    level: null,            // null until the user picks on the landing screen
    seenLanding: false,     // becomes true once they enter the lab
    progress: {},           // { moduleId: { step: 0..3, done: bool } }
    badges: {},             // { moduleId: true }
    bossBest: 0             // best boss-challenge score (threats caught)
  };

  let data = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return structuredCloneSafe(defaults);
      const parsed = JSON.parse(raw);
      // Merge so new fields in future versions don't break old saves.
      return Object.assign(structuredCloneSafe(defaults), parsed);
    } catch (e) {
      return structuredCloneSafe(defaults);
    }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      /* storage unavailable, carry on in-memory only */
    }
  }

  // Tiny deep-clone that works everywhere (avoids structuredClone gaps).
  function structuredCloneSafe(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  const state = {
    LEVELS,

    // ----- Level -----
    getLevel() { return data.level; },
    setLevel(level) {
      if (!LEVELS.includes(level)) return;
      data.level = level;
      data.seenLanding = true;
      save();
      window.dispatchEvent(new CustomEvent("hl:level", { detail: level }));
    },
    hasChosen() { return !!data.level; },
    levelLabel(l) {
      const v = l || data.level || "beginner";
      return v.charAt(0).toUpperCase() + v.slice(1);
    },

    // ----- Landing -----
    markSeenLanding() { data.seenLanding = true; save(); },

    // ----- Progress -----
    getProgress(id) { return data.progress[id] || { step: 0, done: false }; },
    setStep(id, step) {
      const p = this.getProgress(id);
      p.step = Math.max(p.step, step); // never go backwards on the furthest step reached
      data.progress[id] = p;
      save();
    },
    getModuleStatus(id) {
      const p = data.progress[id];
      if (!p) return "todo";
      if (p.done) return "done";
      if (p.step > 0) return "progress";
      return "todo";
    },

    // ----- Badges / completion -----
    completeModule(id) {
      const p = this.getProgress(id);
      p.done = true;
      p.step = 3;
      data.progress[id] = p;
      data.badges[id] = true;
      save();
      window.dispatchEvent(new CustomEvent("hl:badge", { detail: id }));
    },
    hasBadge(id) { return !!data.badges[id]; },
    badgeCount() { return Object.keys(data.badges).length; },

    // ----- Boss -----
    setBossBest(score) {
      if (score > data.bossBest) { data.bossBest = score; save(); }
    },
    getBossBest() { return data.bossBest; },

    // ----- Reset (used by About page) -----
    resetAll() {
      data = structuredCloneSafe(defaults);
      save();
      window.dispatchEvent(new CustomEvent("hl:reset"));
    }
  };

  HL.state = state;
})();
