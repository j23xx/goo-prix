// GOO PRIX · src/voice.js — The announcer: short spoken lines through the browser's own offline voices.
'use strict';

// ============================================================================================
// VOICE — speech synthesis with local voices only (no network), one line at a time, with priorities
// ============================================================================================
const VOICE = {
  ok: typeof window !== 'undefined' && 'speechSynthesis' in window && !SHOT,
  voice: null,       // the announcer: a local English voice
  alt: null,         // a second local voice for the pilots' barks
  busyUntil: 0,      // performance time when the current line should be done
  lastPri: 0,
  said: new Map(),   // line -> last time, so the same line is not spammed

  pickVoices() {
    if (!this.ok) return;
    const all = window.speechSynthesis.getVoices().filter((v) => v.localService && /^en(-|_|$)/i.test(v.lang));
    if (!all.length) return;
    // prefer punchy, clear system voices when they exist; otherwise take the first local English voice
    const rank = (v) => (/daniel|fred|alex|samantha|karen|moira|rishi|tessa|zarvox|ralph|albert/i.test(v.name) ? 0 : 1);
    all.sort((a, b) => rank(a) - rank(b));
    this.voice = all.find((v) => /daniel|alex|fred|ralph/i.test(v.name)) || all[0];
    this.alt = all.find((v) => v !== this.voice && /samantha|karen|moira|tessa|zarvox|albert/i.test(v.name)) || all[1] || all[0];
  },

  // Speak `text`. pri: 1 chatter, 2 event, 3 must-hear (level / boss / game over). A higher
  // priority line cuts off a lower one; an equal or lower one waits its turn or is dropped.
  say(text, pri, opts) {
    if (!this.ok || save.muted || !AU.ready) return;
    const o = opts || {};
    const now = performance.now();
    const last = this.said.get(text) || 0;
    if (now - last < (o.cooldown != null ? o.cooldown : 2500)) return;
    const synth = window.speechSynthesis;
    if (!this.voice) this.pickVoices();
    if (!this.voice) return;
    if (now < this.busyUntil) {
      if ((pri || 1) <= this.lastPri) return;
      synth.cancel();
    }
    const u = new SpeechSynthesisUtterance(text);
    u.voice = o.alt ? this.alt : this.voice;
    u.lang = u.voice.lang;
    u.rate = o.rate || 1.15;
    u.pitch = o.pitch || 0.9;
    u.volume = 0.95;
    synth.speak(u);
    this.said.set(text, now);
    this.lastPri = pri || 1;
    this.busyUntil = now + 250 + text.length * 70 / u.rate;
  },

  stop() { if (this.ok) window.speechSynthesis.cancel(); this.busyUntil = 0; },
};
if (VOICE.ok) {
  VOICE.pickVoices();
  window.speechSynthesis.onvoiceschanged = () => VOICE.pickVoices();
}
function say(text, pri, opts) { VOICE.say(text, pri, opts); }
