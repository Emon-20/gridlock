/* ========================================
   GRIDLOCK — Modular Entrypoint Bridge
   This file provides backward-compatibility for environments
   or bookmarks directly importing script.js.
   ======================================== */

// Ensure all modular components are loaded:
// - js/audio.js (Web Audio synthesizer)
// - js/ai.js    (Smart 3-Tier AI opponent)
// - js/game.js  (Core game engine & state machine)
// - js/ui.js    (DOM renderer & responsive layout)

console.log('GridLock: Modular architecture active (js/audio.js, js/ai.js, js/game.js, js/ui.js)');
