// =============================================================
// lock.js — passcode gate for the dashboard.
// Drop on any page with:  <script src="lock.js" defer></script>
// (place it FIRST, before the other scripts, so it runs early).
//
// It self-injects a full-screen passcode overlay and blocks the
// page until the correct code is entered. Once unlocked it stays
// unlocked across pages/reloads for a sliding time window, so you
// don't re-enter on every navigation between trackers.
//
// ⚠️  This is convenience privacy, NOT real security. A fixed
// client-side passcode can be bypassed by anyone who opens
// devtools. It keeps casual eyes (someone glancing at your phone)
// out — nothing more. The code lives here as a hash, not plaintext,
// so it isn't readable at a glance in the source.
// =============================================================
(function () {
  'use strict';

  // ---------- Config ----------
  const CODE_LEN   = 6;                  // number of digits in the passcode
  const CODE_HASH  = 5538170215792892;   // cyrb53("777888") — change this to change the code
  const UNLOCK_KEY = 'dash:unlocked_until';
  const UNLOCK_TTL_MS = 8 * 60 * 60 * 1000; // stay unlocked 8h after last use (sliding)

  // ---------- Already unlocked? Refresh the window and bail (no flash). ----------
  function unlockedNow() {
    try {
      const until = parseInt(localStorage.getItem(UNLOCK_KEY) || '0', 10);
      return until && Date.now() < until;
    } catch (e) { return false; }
  }
  function refreshWindow() {
    try { localStorage.setItem(UNLOCK_KEY, String(Date.now() + UNLOCK_TTL_MS)); } catch (e) {}
  }
  if (unlockedNow()) { refreshWindow(); return; }

  // ---------- Tiny non-crypto hash (works on file://, where crypto.subtle may be absent) ----------
  function cyrb53(str, seed) {
    seed = seed || 0;
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1  = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2  = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
  }

  // ---------- CSS ----------
  const css = `
#lockScreen {
  position: fixed; inset: 0; z-index: 99999;
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
  background: #050506;
  color: #B8B6B0;
  font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  opacity: 1;
  transition: opacity 0.32s ease;
}
#lockScreen.lock-hiding { opacity: 0; }
#lockScreen::before {
  content: ''; position: fixed; inset: 0;
  background:
    radial-gradient(circle at 82% 14%, rgba(224, 118, 88, 0.16), transparent 45%),
    radial-gradient(circle at 18% 90%, rgba(180, 180, 200, 0.06), transparent 50%);
  filter: blur(40px);
  pointer-events: none; z-index: 0;
  animation: lock-drift 36s ease-in-out infinite alternate;
}
#lockScreen::after {
  content: ''; position: fixed; inset: 0;
  background-image: radial-gradient(rgba(255,255,255,0.014) 1px, transparent 1px);
  background-size: 3px 3px;
  pointer-events: none; z-index: 0;
}
@keyframes lock-drift {
  0%   { transform: translate3d(0,0,0); }
  100% { transform: translate3d(-22px, 14px, 0); }
}

.lock-card {
  position: relative; z-index: 1;
  width: 100%; max-width: 320px;
  padding: 34px 28px 28px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(24px) saturate(1.2);
  -webkit-backdrop-filter: blur(24px) saturate(1.2);
  box-shadow: 0 24px 60px rgba(0,0,0,0.55);
  text-align: center;
}
.lock-card.lock-shake { animation: lock-shake 0.42s cubic-bezier(0.36,0.07,0.19,0.97); }
@keyframes lock-shake {
  10%, 90% { transform: translateX(-1px); }
  20%, 80% { transform: translateX(2px); }
  30%, 50%, 70% { transform: translateX(-5px); }
  40%, 60% { transform: translateX(5px); }
}

.lock-icon { font-size: 30px; line-height: 1; filter: drop-shadow(0 0 14px rgba(107,227,164,0.35)); }
.lock-title {
  margin: 12px 0 4px;
  font-size: 22px; font-weight: 700; letter-spacing: -0.025em;
  background: linear-gradient(180deg, #FFFFFF 0%, #C7C4BC 120%);
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent; color: transparent;
}
.lock-sub {
  font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  font-size: 10px; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase;
  color: #76746E;
  transition: color 0.25s;
}
.lock-sub.is-error { color: #FF6B6B; }

.lock-dots { display: flex; gap: 13px; justify-content: center; margin: 22px 0 26px; }
.lock-dot {
  width: 12px; height: 12px; border-radius: 50%;
  border: 1.5px solid rgba(255,255,255,0.18);
  background: transparent;
  transition: background 0.18s, border-color 0.18s, box-shadow 0.18s;
}
.lock-dot.is-filled {
  background: #6BE3A4; border-color: #6BE3A4;
  box-shadow: 0 0 10px rgba(107,227,164,0.5);
}
.lock-card.lock-error .lock-dot {
  background: #FF6B6B; border-color: #FF6B6B;
  box-shadow: 0 0 10px rgba(255,107,107,0.5);
}

.lock-keys { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.lock-key {
  appearance: none; -webkit-appearance: none;
  height: 58px;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 15px;
  background: rgba(255,255,255,0.035);
  color: #FAFAFA;
  font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  font-size: 22px; font-weight: 600;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  transition: background 0.12s, border-color 0.12s, transform 0.06s;
}
.lock-key:hover { background: rgba(255,255,255,0.06); }
.lock-key:active { background: rgba(255,255,255,0.10); transform: scale(0.96); }
.lock-key.is-blank { background: transparent; border-color: transparent; cursor: default; }
.lock-key.is-action { font-size: 19px; color: #76746E; }
`;

  // ---------- DOM ----------
  const style = document.createElement('style');
  style.id = 'lockScreenStyle';
  style.textContent = css;
  (document.head || document.documentElement).appendChild(style);

  const overlay = document.createElement('div');
  overlay.id = 'lockScreen';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Passcode lock');

  const card = document.createElement('div');
  card.className = 'lock-card';

  const dotsHtml = Array.from({ length: CODE_LEN })
    .map(() => '<span class="lock-dot"></span>').join('');

  // Keypad: 1-9, then blank / 0 / backspace
  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
  const keysHtml = keys.map(function (k) {
    if (k === '') return '<button class="lock-key is-blank" tabindex="-1" aria-hidden="true"></button>';
    if (k === '⌫') return '<button class="lock-key is-action" data-action="del" aria-label="Delete">⌫</button>';
    return '<button class="lock-key" data-digit="' + k + '">' + k + '</button>';
  }).join('');

  card.innerHTML =
    '<div class="lock-icon">🔒</div>' +
    '<h1 class="lock-title">Locked</h1>' +
    '<div class="lock-sub" id="lockSub">Enter passcode</div>' +
    '<div class="lock-dots" id="lockDots">' + dotsHtml + '</div>' +
    '<div class="lock-keys" id="lockKeys">' + keysHtml + '</div>';

  overlay.appendChild(card);
  (document.body || document.documentElement).appendChild(overlay);

  // Block scrolling of the page behind the overlay.
  const htmlEl = document.documentElement;
  const prevHtmlOverflow = htmlEl.style.overflow;
  const prevBodyOverflow = document.body ? document.body.style.overflow : '';
  htmlEl.style.overflow = 'hidden';
  if (document.body) document.body.style.overflow = 'hidden';

  // ---------- State + behavior ----------
  const dotEls = Array.prototype.slice.call(card.querySelectorAll('.lock-dot'));
  const subEl  = card.querySelector('#lockSub');
  let entered = '';
  let busy = false; // true during the wrong-code animation

  function render() {
    dotEls.forEach(function (d, i) { d.classList.toggle('is-filled', i < entered.length); });
  }

  function clearError() {
    card.classList.remove('lock-error');
    subEl.classList.remove('is-error');
    subEl.textContent = 'Enter passcode';
  }

  function press(digit) {
    if (busy) return;
    if (card.classList.contains('lock-error')) clearError();
    if (entered.length >= CODE_LEN) return;
    entered += digit;
    render();
    if (entered.length === CODE_LEN) submit();
  }

  function del() {
    if (busy) return;
    if (card.classList.contains('lock-error')) clearError();
    entered = entered.slice(0, -1);
    render();
  }

  function submit() {
    if (cyrb53(entered) === CODE_HASH) {
      unlock();
    } else {
      wrong();
    }
  }

  function wrong() {
    busy = true;
    card.classList.add('lock-error', 'lock-shake');
    subEl.textContent = 'Wrong code';
    subEl.classList.add('is-error');
    if (navigator.vibrate) { try { navigator.vibrate(60); } catch (e) {} }
    setTimeout(function () {
      card.classList.remove('lock-shake');
      entered = '';
      render();
      busy = false;
    }, 480);
  }

  function unlock() {
    refreshWindow();
    document.removeEventListener('keydown', onKey);
    overlay.classList.add('lock-hiding');
    setTimeout(function () {
      htmlEl.style.overflow = prevHtmlOverflow;
      if (document.body) document.body.style.overflow = prevBodyOverflow;
      overlay.remove();
      style.remove();
    }, 340);
  }

  // Tap / click the keypad
  card.querySelector('#lockKeys').addEventListener('click', function (e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.dataset.digit) press(btn.dataset.digit);
    else if (btn.dataset.action === 'del') del();
  });

  // Physical keyboard (desktop)
  function onKey(e) {
    if (e.key >= '0' && e.key <= '9') { press(e.key); e.preventDefault(); }
    else if (e.key === 'Backspace') { del(); e.preventDefault(); }
    else if (e.key === 'Enter' && entered.length === CODE_LEN) { submit(); e.preventDefault(); }
  }
  document.addEventListener('keydown', onKey);
})();
