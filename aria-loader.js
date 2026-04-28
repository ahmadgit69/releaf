// ── aria-loader.js — ARIA Thinking Animation ─────────────────────────────────
// Loops through all contextual phrases for the intent.
// Stays alive until the API resolves, then finishes the current erase-out.
// Animate-in: type chars forward. Animate-out: erase chars backward (mirror).

const THINKING_PHRASES = {
  assignment:        ["Calculating optimal deployment...", "Cross-referencing skills against active crises...", "Scanning volunteer availability..."],
  situation:         ["Pulling field intelligence...", "Compiling situation report...", "Scanning all active zones..."],
  filtered_crisis:   ["Filtering crisis database...", "Scanning severity levels...", "Pulling field intelligence..."],
  crisis_detail:     ["Retrieving crisis file...", "Accessing field data...", "Locking onto target crisis..."],
  volunteer_profile: ["Pulling personnel record...", "Accessing volunteer dossier...", "Retrieving field agent profile..."],
  gap_report:        ["Identifying coverage gaps...", "Running coverage analysis...", "Scanning for unassigned crises..."],
  zone_summary:      ["Scanning zone perimeter...", "Pulling zone intelligence...", "Compiling zone situation report..."],
  greeting:          ["Standing by...", "Reading you loud and clear...", "Processing..."],
  general:           ["Processing query...", "Analyzing request...", "Standing by..."]
};

// Returns a Promise that resolves after the full animation sequence completes.
// apiPromise is passed in — we loop phrases until it resolves, then finish cleanly.
function showThinking(container, intent, apiPromise) {
  return new Promise(resolve => {
    const phrases = THINKING_PHRASES[intent] || THINKING_PHRASES.general;

    // ── Create breadcrumb element ──────────────────────────────────────────
    const crumb = document.createElement('div');
    crumb.className = 'aria-thinking';
    crumb.setAttribute('aria-live', 'polite');
    crumb.setAttribute('aria-label', 'ARIA is thinking');

    const dot  = document.createElement('span');
    dot.className = 'thinking-dot';
    dot.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
      <!-- stem -->
      <path d="M6 11.5 Q5.2 8.5 6 4.5" stroke="currentColor" stroke-width="0.9" fill="none" stroke-linecap="round"/>
      <!-- lower left leaf -->
      <path d="M6 9 Q3.5 8.5 2.5 6 Q5 6 6 9Z"/>
      <!-- lower right leaf -->
      <path d="M6 7.5 Q8.5 7 9.5 4.5 Q7 4.5 6 7.5Z"/>
      <!-- upper left leaf -->
      <path d="M6 6 Q3.5 5 3 2.5 Q5.5 2.5 6 6Z"/>
      <!-- upper right leaf -->
      <path d="M6 4.5 Q8.5 3.5 9 1 Q6.5 1 6 4.5Z"/>
    </svg>`;

    const text = document.createElement('span');
    text.className = 'thinking-text';

    crumb.appendChild(dot);
    crumb.appendChild(text);
    container.appendChild(crumb);
    container.scrollTop = container.scrollHeight;

    // ── Fade crumb in ──────────────────────────────────────────────────────
    crumb.style.opacity = '0';
    crumb.style.transform = 'translateY(4px)';
    crumb.style.transition = 'opacity 180ms ease, transform 180ms ease';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      crumb.style.opacity = '1';
      crumb.style.transform = 'translateY(0)';
    }));

    // ── State ──────────────────────────────────────────────────────────────
    let apiDone    = false;
    let phraseIdx  = 0;
    const TYPE_SPEED  = 32;  // ms per char, typing forward
    const ERASE_SPEED = 18;  // ms per char, erasing backward (faster = snappier mirror)
    const HOLD_MS     = 1800; // pause at full phrase before erasing

    if (apiPromise) {
      apiPromise
        .then(() => { apiDone = true; })
        .catch(() => { apiDone = true; });
    }

    // ── Animate one phrase, then call onDone ───────────────────────────────
    function runPhrase(phrase, onDone) {
      let i = 0;

      // — Type in —
      function typeNext() {
        if (i < phrase.length) {
          text.textContent = phrase.slice(0, ++i);
          container.scrollTop = container.scrollHeight;
          setTimeout(typeNext, TYPE_SPEED);
        } else {
          // Fully typed — hold, then erase
          setTimeout(eraseNext, HOLD_MS);
        }
      }

      // — Erase out (mirror of type-in) —
      function eraseNext() {
        if (i > 0) {
          text.textContent = phrase.slice(0, --i);
          container.scrollTop = container.scrollHeight;
          setTimeout(eraseNext, ERASE_SPEED);
        } else {
          // Fully erased — hand off
          onDone();
        }
      }

      typeNext();
    }

    // ── Loop through phrases until API is done ─────────────────────────────
    function nextPhrase() {
      const phrase = phrases[phraseIdx % phrases.length];
      phraseIdx++;

      runPhrase(phrase, () => {
        if (!apiDone) {
          // API still running — loop to next phrase immediately
          nextPhrase();
        } else {
          // API done — fade out crumb and resolve
          crumb.style.transition = 'opacity 180ms ease, transform 180ms ease';
          crumb.style.opacity    = '0';
          crumb.style.transform  = 'translateY(-4px)';
          setTimeout(() => {
            crumb.remove();
            resolve();
          }, 180);
        }
      });
    }

    // Small initial delay so the fade-in completes before typing starts
    setTimeout(nextPhrase, 200);
  });
}
