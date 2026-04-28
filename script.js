// ═══════════════════════════════════════════════════════════════════════════
// CONFIG — key/model pool, rotates on rate-limit or quota errors
// ═══════════════════════════════════════════════════════════════════════════
const API_POOL = [
  { key: '%%API_KEY_1%%', model: 'gemini-2.5-flash' },
  { key: '%%API_KEY_2%%', model: 'gemini-2.5-flash-lite' },
  { key: '%%API_KEY_3%%', model: 'gemini-2.5-flash' },
  { key: '%%API_KEY_4%%', model: 'gemini-2.5-flash-lite' },
];

let poolIndex = 0;

function currentEndpoint() {
  const { key, model } = API_POOL[poolIndex];
  return {
    key,
    url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
  };
}

function rotatePool() {
  poolIndex = (poolIndex + 1) % API_POOL.length;
  console.warn(`[ARIA] Rotating to pool entry ${poolIndex} (${API_POOL[poolIndex].model})`);
}

// ═══════════════════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════════════════
let pinContext   = null;
let pinMarker    = null;
let isSending    = false;
let lastPinTime  = 0;
const chatHistory = [];

// ═══════════════════════════════════════════════════════════════════════════
// MAP INIT
// ═══════════════════════════════════════════════════════════════════════════
const map = L.map('map', {
  center: [23.0225, 72.5714],
  zoom: 12,
  zoomControl: true,
  attributionControl: true
});

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: 'Data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ODbL 1.0. Nominatim Search.',
  maxZoom: 18
}).addTo(map);

// ── Custom pin icons ───────────────────────────────────────────────────────
function makePinIcon(severity) {
  const colors = { critical: '#D94F3D', moderate: '#E8943A', low: '#7ab648' };
  const c = colors[severity] || '#7a7870';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="26" viewBox="0 0 20 26">
    <path d="M10 0C4.477 0 0 4.477 0 10c0 7.5 10 16 10 16s10-8.5 10-16C20 4.477 15.523 0 10 0z" fill="${c}" opacity="0.9"/>
    <circle cx="10" cy="10" r="4" fill="rgba(0,0,0,0.35)"/>
  </svg>`;
  return L.divIcon({
    html: svg, className: '', iconSize: [20, 26], iconAnchor: [10, 26], tooltipAnchor: [0, -20]
  });
}

function makeVolunteerIcon(status) {
  const colors = { available: '#4a9e6b', engaged: '#E8943A', offline: '#4a4845' };
  const c = colors[status] || '#4a4845';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12">
    <circle cx="6" cy="6" r="5" fill="${c}" stroke="rgba(0,0,0,0.4)" stroke-width="1"/>
  </svg>`;
  return L.divIcon({
    html: svg, className: '', iconSize: [12, 12], iconAnchor: [6, 6]
  });
}

// ── Render crisis pins ─────────────────────────────────────────────────────
crisisPoints.forEach(c => {
  const marker = L.marker([c.lat, c.lng], { icon: makePinIcon(c.severity) });

  marker.on('click', function(e) {
    L.DomEvent.stopPropagation(e);
    setPinContext(c.lat, c.lng, `Crisis selected: ${c.title}, Severity: ${c.severity}, Zone: ${c.zone}, People affected: ${c.peopleAffected}`, `${c.title} · ${c.severity} · ${c.zone}`);
  });

  marker.bindTooltip(`<strong>${c.title}</strong><br>${c.zone} · ${c.severity}`, { direction: 'top' });
  marker.addTo(map);
  c._marker = marker;
});

// ── Render volunteer dots ──────────────────────────────────────────────────
volunteers.forEach(v => {
  const marker = L.marker([v.lat, v.lng], {
    icon: makeVolunteerIcon(v.status),
    opacity: v.status === 'offline' ? 0.4 : 0.85
  });
  marker.bindTooltip(`${v.name} · ${v.status}`, { direction: 'top' });
  marker.addTo(map);
  v._marker = marker;
});

// ── Blank map click — pin drop ─────────────────────────────────────────────
map.on('click', async function(e) {
  if (Date.now() - lastPinTime < 1100) return;
  lastPinTime = Date.now();

  const lat = e.latlng.lat;
  const lng = e.latlng.lng;
  const address = await getAddressFromCoords(lat, lng);
  const nearest = findNearestCrisis(lat, lng);
  const distKm  = haversine(lat, lng, nearest.lat, nearest.lng);

  let detail;
  if (distKm > 2.0) {
    detail = `No crisis within 2km of this location.`;
  } else {
    detail = `Nearest crisis: ${nearest.title}, Severity: ${nearest.severity}, Zone: ${nearest.zone}, Distance: ${distKm.toFixed(1)}km`;
  }

  setPinContext(lat, lng, detail, `${address} · ${distKm.toFixed(1)}km`);
});

function setPinContext(lat, lng, detail, label) {
  if (pinMarker) map.removeLayer(pinMarker);
  const pinSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="22" viewBox="0 0 16 22">
    <path d="M8 0C3.582 0 0 3.582 0 8c0 6 8 14 8 14s8-8 8-14C16 3.582 12.418 0 8 0z" fill="#c8b89a" opacity="0.9"/>
    <circle cx="8" cy="8" r="3" fill="rgba(0,0,0,0.4)"/>
  </svg>`;
  pinMarker = L.marker([lat, lng], {
    icon: L.divIcon({ html: pinSvg, className: '', iconSize: [16, 22], iconAnchor: [8, 22] })
  }).addTo(map);

  pinContext = `PIN DROP: ${label} (${lat.toFixed(4)}, ${lng.toFixed(4)}) — ${detail}`;
  document.getElementById('pin-text').textContent = label;
  document.getElementById('pin-context-bar').classList.add('visible');
}

document.getElementById('pin-clear').addEventListener('click', () => {
  pinContext = null;
  if (pinMarker) { map.removeLayer(pinMarker); pinMarker = null; }
  document.getElementById('pin-context-bar').classList.remove('visible');
});

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function findNearestCrisis(lat, lng) {
  return crisisPoints.reduce((best, c) => {
    const d = haversine(lat, lng, c.lat, c.lng);
    return d < haversine(lat, lng, best.lat, best.lng) ? c : best;
  });
}

async function getAddressFromCoords(lat, lng) {
  try {
    const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
      headers: { 'User-Agent': 'ReleafCrisisCoordination/1.0' }
    });
    const data = await res.json();
    return data.display_name.split(',').slice(0, 2).join(',').trim() || 'Unknown Location';
  } catch { return 'Unknown Location'; }
}

// ═══════════════════════════════════════════════════════════════════════════
// STATS BAR
// ═══════════════════════════════════════════════════════════════════════════
function updateStats() {
  const elCritical  = document.getElementById('stat-critical');
  const elModerate  = document.getElementById('stat-moderate');
  const elAvailable = document.getElementById('stat-available');
  if (elCritical)  elCritical.textContent  = crisisPoints.filter(c => c.severity === 'critical').length;
  if (elModerate)  elModerate.textContent  = crisisPoints.filter(c => c.severity === 'moderate').length;
  if (elAvailable) elAvailable.textContent = volunteers.filter(v => v.status === 'available').length;
}
updateStats();
// ═══════════════════════════════════════════════════════════════════════════
// INTENT CLASSIFIER
// ═══════════════════════════════════════════════════════════════════════════
function classifyIntent(text) {
  const t = text.toLowerCase();
  if (t.match(/\bc\d{3}\b/i) || t.match(/\b(tell me about|show me crisis)\b/)) return 'crisis_detail';
  if (t.match(/\bv\d{3}\b/i) || t.match(/\b(volunteer|who is)\b/))             return 'volunteer_profile';
  if (t.match(/\b(all volunteers?|list volunteers?|show.*volunteers?|volunteers? list)\b/)) return 'volunteer_list';
  if (t.match(/\b(assign|deploy|send volunteers?|let.s assign|let assign|put someone|send someone)\b/)) return 'assignment';
  if (t.match(/\b(situation|sitrep|overview|status|what.s going on)\b/))        return 'situation';
  if (t.match(/\b(low|moderate|critical)\b.*\b(crisis|crises)\b/))              return 'filtered_crisis';
  if (t.match(/\b(gap|uncovered|no volunteers?|coverage)\b/))                   return 'gap_report';
  if (t.match(/\b(zone|area)\b/))                                               return 'zone_summary';
  if (t.match(/\b(hi|hello|hey|help|what can)\b/))                              return 'greeting';
  return 'general';
}

function extractZone(text) {
  const zones = [...new Set(crisisPoints.map(c => c.zone.toLowerCase()))];
  return zones.find(z => text.toLowerCase().includes(z)) || null;
}

// ═══════════════════════════════════════════════════════════════════════════
// PROMPT BUILDER — intent-filtered data slices
// ═══════════════════════════════════════════════════════════════════════════
function toSlim(c) {
  return { id: c.id, title: c.title, type: c.type, severity: c.severity, zone: c.zone,
           description: c.description, peopleAffected: c.peopleAffected,
           skillsNeeded: c.skillsNeeded, volunteersAssigned: c.volunteersAssigned };
}

function toSlimVol(v) {
  return { id: v.id, name: v.name, status: v.status, skills: v.skills, zone: v.zone, assignedCrisis: v.assignedCrisis };
}

function buildDataSlice(intent, text) {
  const availVols = volunteers.filter(v => v.status === 'available').map(toSlimVol);

  switch (intent) {
    case 'situation':
      return { crises: crisisPoints.map(toSlim) };
    case 'filtered_crisis': {
      const sev = text.match(/\b(low|moderate|critical)\b/i)?.[1]?.toLowerCase();
      return { crises: crisisPoints.filter(c => !sev || c.severity === sev).map(toSlim) };
    }
    case 'assignment':
      return { crises: crisisPoints.map(toSlim), volunteers: availVols };
    case 'zone_summary': {
      const zone = extractZone(text);
      return {
        crises:     crisisPoints.filter(c => !zone || c.zone.toLowerCase() === zone).map(toSlim),
        volunteers: volunteers.filter(v => (!zone || v.zone.toLowerCase() === zone) && v.status === 'available').map(toSlimVol)
      };
    }
    case 'crisis_detail': {
      const idMatch = text.match(/\b(c\d{3})\b/i);
      if (idMatch) {
        const c = crisisPoints.find(x => x.id.toLowerCase() === idMatch[1].toLowerCase());
        return c ? { crisis: toSlim(c) } : { crises: crisisPoints.map(toSlim) };
      }
      return { crises: crisisPoints.map(toSlim) };
    }
    case 'volunteer_profile': {
      const idMatch = text.match(/\b(v\d{3})\b/i);
      if (idMatch) {
        const v = volunteers.find(x => x.id.toLowerCase() === idMatch[1].toLowerCase());
        return v ? { volunteer: toSlimVol(v) } : { volunteers: volunteers.map(toSlimVol) };
      }
      const nameLower = text.toLowerCase();
      const byName = volunteers.find(v => nameLower.includes(v.name.toLowerCase()));
      return byName ? { volunteer: toSlimVol(byName) } : { volunteers: volunteers.map(toSlimVol) };
    }
    case 'volunteer_list':
      return { volunteers: volunteers.map(toSlimVol) };
    case 'gap_report':
      return { crises: crisisPoints.map(toSlim), volunteers: availVols };
    default:
      return {};
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SYSTEM PROMPT
// ═══════════════════════════════════════════════════════════════════════════
const CARD_SCHEMAS = `
CARD SCHEMAS (return ONLY the JSON, no text before or after):

assignment: {"type":"assignment","crisis":"<title — zone>","crisisId":"<id>","assignments":[{"volunteerId":"<id>","volunteerName":"<name>","skillsMatched":["<skill>"],"zone":"<zone>","reason":"<short reason>"}],"summary":"<1 sentence>"}

situation: {"type":"situation","filter":"<all|critical|moderate|low>","crises":[{"id":"<id>","title":"<title>","zone":"<zone>","severity":"<sev>","peopleAffected":<n>}],"volunteersAvailable":<n>,"volunteersEngaged":<n>,"summary":"<1 sentence>"}

crisis_detail: {"type":"crisis_detail","id":"<id>","title":"<title>","zone":"<zone>","severity":"<sev>","type_label":"<type>","description":"<desc>","peopleAffected":<n>,"skillsNeeded":["<skill>"],"volunteersAssigned":[],"coverageStatus":"<covered|partial|uncovered>"}

volunteer_profile: {"type":"volunteer_profile","id":"<id>","name":"<name>","status":"<status>","zone":"<zone>","skills":["<skill>"],"assignedCrisis":<null|"<crisis title>">}

volunteer_list: {"type":"volunteer_list","volunteers":[{"id":"<id>","name":"<name>","status":"<status>","zone":"<zone>","skills":["<skill>"],"assignedCrisis":<null|"<crisis id>"]}],"summary":"<1 sentence>"}

gap_report: {"type":"gap_report","uncoveredCount":<n>,"crises":[{"id":"<id>","title":"<title>","zone":"<zone>","severity":"<sev>","skillsNeeded":["<skill>"],"missingSkills":["<skill>"]}],"summary":"<1 sentence>"}

zone_summary: {"type":"zone_summary","zone":"<zone>","crises":[{"id":"<id>","title":"<title>","severity":"<sev>","peopleAffected":<n>}],"volunteers":[{"id":"<id>","name":"<name>","status":"<status>","skills":["<skill>"]}],"coverageOverall":"<covered|partial|uncovered>","summary":"<1 sentence>"}
`;

function buildSystemPrompt(intent, text) {
  const dataSlice = buildDataSlice(intent, text);
  return `You are ARIA — Automated Resource & Intelligence Assistant — a field operations AI for NGO crisis coordinators.

ROLE: Assist coordinators in managing active crises and deploying volunteers efficiently. Decisive, precise, urgent.

TONE: Military-style. Short sentences. Action-oriented. No fluff. Use terms like "Deploying", "Assigning", "Priority target", "Status", "Confirmed". In plain text responses use markdown: **bold** for key terms, bullet points for lists.

CONVERSATION: You are in an ongoing conversation. Refer back to what was discussed if relevant.

DATA ACCESS: Reason only from provided data. Never hallucinate names, locations, or severity levels.

PROXIMITY: No coordinates access. Use zone as proximity indicator. Same zone = closest. If PIN DROP provided, use pre-computed distance directly.

VOLUNTEER RULES:
1. Only assign volunteers with status "available". Never "engaged" or "offline".
2. Skills must match crisis skillsNeeded. If exact match unavailable, use best partial match and note missing skills.
3. Among matched volunteers, prioritize by zone proximity (same zone first).
4. If volunteersAssigned in a crisis is non-empty, do not reassign unless explicitly asked.
5. If a volunteer is needed at multiple crises, flag the conflict.
6. When coordinator says "assign someone", "let's assign", "send someone", "deploy to", or names a crisis — immediately select the best available volunteer(s) and output the assignment card. Do NOT ask for clarification unless there is a genuine ambiguity (e.g. multiple crises with identical names).

NO MATCH: "No available volunteers with required skills. Nearest partial match: [name], missing skill: [skill]. Recommend redeployment from [lower priority crisis] if critical."

RESPONSE FORMATS:
- For structured queries (assignment, situation, crisis detail, volunteer profile, gap report, zone summary): return ONLY the JSON object. NO conversational text before or after. NO "JSON:" label. NO explanations. JUST the raw JSON object starting with { and ending with }.
- For conversational/general queries: respond in formatted Markdown, NOT JSON.

${CARD_SCHEMAS}

CONTEXT INJECTION: If coordinator pins a location it appears as "PIN DROP: [address] ([lat],[lng]) — [details]". Treat as coordinator pointing at that location.

CURRENT DATA:
${JSON.stringify(dataSlice, null, 1)}`;
}
// ═══════════════════════════════════════════════════════════════════════════
// API CALL
// ═══════════════════════════════════════════════════════════════════════════
async function callARIA(userText, intent) {
  const systemPrompt = buildSystemPrompt(intent, userText);
  const fullText = pinContext ? `${pinContext}\nUser: ${userText}` : userText;

  chatHistory.push({ role: 'user', content: fullText });

  const contents = [
    { parts: [{ text: systemPrompt }], role: 'user' },
    { parts: [{ text: 'Understood. Standing by.' }], role: 'model' },
    ...chatHistory.slice(-10).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }))
  ];

  const body = JSON.stringify({
    contents,
    generationConfig: { temperature: 0.3, maxOutputTokens: 800 }
  });

  // Errors that warrant rotating to the next key/model
  const ROTATE_ON  = new Set([400, 429, 403]);
  // Errors worth retrying on the same key after a short wait
  const RETRY_ON   = new Set([500, 502, 503, 504]);
  const MAX_ATTEMPTS = API_POOL.length * 2; // give each slot up to 2 tries

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const { key, url } = currentEndpoint();
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-goog-api-key': key },
        body
      });

      if (!res.ok) {
        const err = await res.text();
        console.error(`[ARIA] Error ${res.status} on pool[${poolIndex}] (attempt ${attempt + 1}):`, err);

        if (ROTATE_ON.has(res.status)) {
          // Rate-limited or quota exhausted — try next key immediately
          rotatePool();
          continue;
        }

        if (RETRY_ON.has(res.status)) {
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }

        return `**Error ${res.status}.** API call failed. Check console.`;
      }

      const data = await res.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response.';
      chatHistory.push({ role: 'assistant', content: reply });
      return reply;

    } catch (e) {
      console.error('[ARIA] Network error:', e);
      if (attempt < MAX_ATTEMPTS - 1) {
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
      return '**Network error.** Could not reach ARIA. Check connection.';
    }
  }

  return '**All API keys exhausted.** Add more entries to API_POOL in script.js.';
}

// ═══════════════════════════════════════════════════════════════════════════
// CARD PARSER
// ═══════════════════════════════════════════════════════════════════════════
function tryParseCard(text) {
  try {
    // Strip markdown code fences, "JSON:" labels, and any conversational prefix
    let clean = text
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .replace(/^.*?JSON:\s*/i, '')  // Remove "JSON:" prefix
      .replace(/^[^{]*/, '')          // Remove everything before first {
      .trim();
    
    // Extract first { to last }
    const start = clean.indexOf('{');
    const end   = clean.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    const json = clean.slice(start, end + 1);
    const obj  = JSON.parse(json);
    if (!obj.type) return null;
    return obj;
  } catch { return null; }
}

// ═══════════════════════════════════════════════════════════════════════════
// CARD RENDERERS
// ═══════════════════════════════════════════════════════════════════════════
function initials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function renderAssignmentCard(data) {
  const card = document.createElement('div');
  card.className = 'card msg-aria';

  const assignCount = data.assignments?.length || 0;
  card.innerHTML = `
    <div class="card-header">
      <span class="card-title">${data.crisis || 'Assignment'}</span>
      <span class="badge count">${assignCount} volunteer${assignCount !== 1 ? 's' : ''}</span>
    </div>
    <div class="card-body" id="asgn-body-${data.crisisId}">
      ${(data.assignments || []).map(a => `
        <div class="vol-row">
          <div class="vol-avatar">${initials(a.volunteerName)}</div>
          <div class="vol-info">
            <div class="vol-name">${a.volunteerName} <span style="color:var(--fg-muted);font-weight:300">${a.volunteerId}</span></div>
            <div class="vol-meta">${a.zone}</div>
            <div class="tags" style="margin-top:4px">${(a.skillsMatched||[]).map(s=>`<span class="tag">${s}</span>`).join('')}</div>
            <div class="vol-reason">${a.reason}</div>
          </div>
        </div>
      `).join('')}
      ${data.summary ? `<div class="card-summary">${data.summary}</div>` : ''}
    </div>
    <div class="card-footer">
      <button class="btn btn-primary" id="confirm-${data.crisisId}">Confirm Deployment</button>
      <button class="btn btn-secondary" id="cancel-${data.crisisId}">Cancel</button>
    </div>`;

  setTimeout(() => {
    const confirmBtn = card.querySelector(`#confirm-${data.crisisId}`);
    const cancelBtn  = card.querySelector(`#cancel-${data.crisisId}`);

    confirmBtn?.addEventListener('click', () => {
      (data.assignments || []).forEach(a => {
        const vol = volunteers.find(v => v.id === a.volunteerId);
        if (vol) {
          vol.status = 'engaged';
          vol.assignedCrisis = data.crisisId;
          updateVolunteerMarker(a.volunteerId, data.crisisId);
        }
        const crisis = crisisPoints.find(c => c.id === data.crisisId);
        if (crisis && !crisis.volunteersAssigned.includes(a.volunteerId)) {
          crisis.volunteersAssigned.push(a.volunteerId);
        }
      });
      updateStats();
      confirmBtn.textContent = 'Deployed ✓';
      confirmBtn.disabled = true;
      cancelBtn.disabled  = true;
      confirmBtn.style.opacity = '0.5';
      appendARIAMessage(`**Confirmed.** ${assignCount} volunteer${assignCount!==1?'s':''} deployed to ${data.crisis}. Map updated.`);
    });

    cancelBtn?.addEventListener('click', () => {
      card.style.opacity = '0.4';
      cancelBtn.disabled = true;
      confirmBtn.disabled = true;
    });
  }, 0);

  return card;
}

function renderSituationCard(data) {
  const card = document.createElement('div');
  card.className = 'card msg-aria';
  const filterLabel = data.filter && data.filter !== 'all' ? data.filter.charAt(0).toUpperCase() + data.filter.slice(1) + ' Priority' : 'All Crises';
  card.innerHTML = `
    <div class="card-header">
      <span class="card-title">Situation Brief</span>
      <span class="badge ${data.filter || 'count'}">${filterLabel}</span>
    </div>
    <div class="card-body">
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <span class="badge available">${data.volunteersAvailable ?? volunteers.filter(v=>v.status==='available').length} available</span>
        <span class="badge engaged">${data.volunteersEngaged ?? volunteers.filter(v=>v.status==='engaged').length} engaged</span>
      </div>
      ${(data.crises || []).map(c => `
        <div class="crisis-row">
          <span class="sev-dot ${c.severity}"></span>
          <div class="crisis-row-info">
            <div class="crisis-row-title">${c.title}</div>
            <div class="crisis-row-meta">${c.zone} · ${c.peopleAffected} affected</div>
          </div>
          <span class="badge ${c.severity}">${c.severity}</span>
        </div>
      `).join('')}
      ${data.summary ? `<div class="card-summary">${data.summary}</div>` : ''}
    </div>`;
  return card;
}

function renderCrisisDetailCard(data) {
  const card = document.createElement('div');
  card.className = 'card msg-aria';
  const assigned = data.volunteersAssigned?.length
    ? data.volunteersAssigned.map(id => { const v = volunteers.find(x=>x.id===id); return v ? v.name : id; }).join(', ')
    : 'No volunteers assigned';
  card.innerHTML = `
    <div class="card-header">
      <span class="card-title">${data.title}</span>
      <span class="badge ${data.severity}">${data.severity}</span>
    </div>
    <div class="card-body">
      <div style="display:flex;gap:6px;align-items:center">
        <span style="font-size:10px;color:var(--fg-muted)">${data.zone}</span>
        <span class="badge ${data.coverageStatus || 'uncovered'}">${data.coverageStatus || 'uncovered'}</span>
      </div>
      <p style="font-size:12px;color:var(--fg-dim);line-height:1.5">${data.description}</p>
      <div class="people-count"><strong>${data.peopleAffected}</strong> people affected</div>
      <div>
        <div style="font-size:10px;color:var(--fg-muted);margin-bottom:4px;letter-spacing:0.06em;text-transform:uppercase">Skills needed</div>
        <div class="tags">${(data.skillsNeeded||[]).map(s=>`<span class="tag">${s}</span>`).join('')}</div>
      </div>
      <div style="font-size:11px;color:var(--fg-dim)">${assigned}</div>
    </div>
    <div class="card-footer">
      <button class="btn btn-ghost" data-crisis-title="${data.title}" data-crisis-id="${data.id}">Assign Volunteers →</button>
    </div>`;

  card.querySelector('[data-crisis-title]')?.addEventListener('click', function() {
    sendMessage(`Assign volunteers to ${this.dataset.crisisTitle}`);
  });
  return card;
}

function renderVolunteerProfileCard(data) {
  const card = document.createElement('div');
  card.className = 'card msg-aria';
  const assignment = data.assignedCrisis
    ? `Assigned: ${data.assignedCrisis}`
    : 'Available for deployment';
  card.innerHTML = `
    <div class="card-header">
      <div style="display:flex;align-items:center;gap:10px">
        <div class="vol-avatar" style="width:32px;height:32px;font-size:11px">${initials(data.name)}</div>
        <div>
          <div class="card-title">${data.name}</div>
          <div style="font-size:10px;color:var(--fg-muted)">${data.id}</div>
        </div>
      </div>
      <span class="badge ${data.status}">${data.status}</span>
    </div>
    <div class="card-body">
      <div style="font-size:11px;color:var(--fg-dim)">${data.zone}</div>
      <div class="tags">${(data.skills||[]).map(s=>`<span class="tag">${s}</span>`).join('')}</div>
      <div style="font-size:11px;color:var(--fg-dim);font-style:italic">${assignment}</div>
    </div>`;
  return card;
}

function renderVolunteerListCard(data) {
  const card = document.createElement('div');
  card.className = 'card msg-aria';
  const volCount = data.volunteers?.length || 0;
  const availCount = data.volunteers?.filter(v => v.status === 'available').length || 0;
  const engagedCount = data.volunteers?.filter(v => v.status === 'engaged').length || 0;
  
  card.innerHTML = `
    <div class="card-header">
      <span class="card-title">Volunteer Roster</span>
      <span class="badge count">${volCount} total</span>
    </div>
    <div class="card-body">
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
        <span class="badge available">${availCount} available</span>
        <span class="badge engaged">${engagedCount} engaged</span>
        <span class="badge offline">${volCount - availCount - engagedCount} offline</span>
      </div>
      ${(data.volunteers || []).map(v => {
        const assignment = v.assignedCrisis ? `Assigned: ${v.assignedCrisis}` : 'Available';
        return `
          <div class="vol-row">
            <div class="vol-avatar">${initials(v.name)}</div>
            <div class="vol-info">
              <div class="vol-name">${v.name} <span style="color:var(--fg-muted);font-weight:300">${v.id}</span></div>
              <div class="vol-meta">${v.zone}</div>
              <div class="tags" style="margin-top:4px">${(v.skills||[]).map(s=>`<span class="tag">${s}</span>`).join('')}</div>
              <div style="font-size:10px;color:var(--fg-dim);font-style:italic;margin-top:2px">${assignment}</div>
            </div>
            <span class="badge ${v.status}">${v.status}</span>
          </div>`;
      }).join('')}
      ${data.summary ? `<div class="card-summary">${data.summary}</div>` : ''}
    </div>`;
  return card;
}

function renderGapReportCard(data) {
  const card = document.createElement('div');
  card.className = 'card msg-aria';
  card.innerHTML = `
    <div class="card-header">
      <span class="card-title">Coverage Gaps</span>
      <span class="badge uncovered">${data.uncoveredCount} uncovered</span>
    </div>
    <div class="card-body">
      ${(data.crises || []).map(c => `
        <div class="crisis-row">
          <span class="sev-dot ${c.severity}"></span>
          <div class="crisis-row-info">
            <div class="crisis-row-title">${c.title}</div>
            <div class="crisis-row-meta">${c.zone}</div>
            <div class="tags" style="margin-top:3px">
              ${(c.missingSkills||[]).map(s=>`<span class="tag missing">${s}</span>`).join('')}
              ${(c.skillsNeeded||[]).filter(s=>!(c.missingSkills||[]).includes(s)).map(s=>`<span class="tag">${s}</span>`).join('')}
            </div>
          </div>
          <button class="btn btn-ghost" style="flex-shrink:0" data-cid="${c.id}" data-ctitle="${c.title}">Assign →</button>
        </div>
      `).join('')}
      ${data.summary ? `<div class="card-summary">${data.summary}</div>` : ''}
    </div>`;

  card.querySelectorAll('[data-cid]').forEach(btn => {
    btn.addEventListener('click', function() {
      sendMessage(`Assign volunteers to ${this.dataset.ctitle}`);
    });
  });
  return card;
}

function renderZoneSummaryCard(data) {
  const card = document.createElement('div');
  card.className = 'card msg-aria';
  card.innerHTML = `
    <div class="card-header">
      <span class="card-title">${data.zone}</span>
      <span class="badge ${data.coverageOverall || 'partial'}">${data.coverageOverall || 'partial'}</span>
    </div>
    <div class="card-body">
      ${data.crises?.length ? `
        <div style="font-size:10px;color:var(--fg-muted);letter-spacing:0.06em;text-transform:uppercase;margin-bottom:4px">Crises</div>
        ${data.crises.map(c => `
          <div class="crisis-row">
            <span class="sev-dot ${c.severity}"></span>
            <div class="crisis-row-info">
              <div class="crisis-row-title">${c.title}</div>
              <div class="crisis-row-meta">${c.peopleAffected} affected</div>
            </div>
          </div>`).join('')}` : ''}
      ${data.volunteers?.length ? `
        <div style="font-size:10px;color:var(--fg-muted);letter-spacing:0.06em;text-transform:uppercase;margin:8px 0 4px">Volunteers</div>
        ${data.volunteers.map(v => `
          <div class="vol-row">
            <div class="vol-avatar">${initials(v.name)}</div>
            <div class="vol-info">
              <div class="vol-name">${v.name}</div>
              <div class="tags" style="margin-top:3px">${(v.skills||[]).map(s=>`<span class="tag">${s}</span>`).join('')}</div>
            </div>
            <span class="badge ${v.status}">${v.status}</span>
          </div>`).join('')}` : ''}
      ${data.summary ? `<div class="card-summary">${data.summary}</div>` : ''}
    </div>`;
  return card;
}
// ═══════════════════════════════════════════════════════════════════════════
// MAP UPDATE — deployment line + marker recolor
// ═══════════════════════════════════════════════════════════════════════════
function updateVolunteerMarker(volunteerId, crisisId) {
  const vol    = volunteers.find(v => v.id === volunteerId);
  const crisis = crisisPoints.find(c => c.id === crisisId);
  if (!vol || !vol._marker || !crisis) return;

  vol._marker.setIcon(makeVolunteerIcon(vol.status));
  vol._marker.setOpacity(vol.status === 'offline' ? 0.4 : 0.85);

  const deployLine = L.polyline(
    [[vol.lat, vol.lng], [crisis.lat, crisis.lng]],
    { color: '#E8943A', weight: 2, dashArray: '8, 8', className: 'deploy-line' }
  ).addTo(map);

  setTimeout(() => {
    deployLine.setStyle({ opacity: 0 });
    setTimeout(() => map.removeLayer(deployLine), 500);
  }, 3000);
}

// ═══════════════════════════════════════════════════════════════════════════
// CHAT RENDERING
// ═══════════════════════════════════════════════════════════════════════════
const messagesEl = document.getElementById('chat-messages');

function appendMessage(role, text) {
  const el = document.createElement('div');
  if (role === 'user') {
    el.className = 'msg-user';
    el.textContent = text;
  } else if (role === 'system') {
    el.className = 'msg-system';
    el.textContent = text;
  }
  messagesEl.appendChild(el);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return el;
}

function appendARIAMessage(text) {
  const card = tryParseCard(text);
  let el;

  if (card) {
    switch (card.type) {
      case 'assignment':        el = renderAssignmentCard(card);       break;
      case 'situation':         el = renderSituationCard(card);        break;
      case 'crisis_detail':     el = renderCrisisDetailCard(card);     break;
      case 'volunteer_profile': el = renderVolunteerProfileCard(card); break;
      case 'volunteer_list':    el = renderVolunteerListCard(card);    break;
      case 'gap_report':        el = renderGapReportCard(card);        break;
      case 'zone_summary':      el = renderZoneSummaryCard(card);      break;
      default:                  el = null;
    }
  }

  if (!el) {
    el = document.createElement('div');
    el.className = 'msg-aria';
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    // Slide-in animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => { el.classList.add('visible'); });
    });

    // Character-by-character render into a temp buffer, then parse markdown
    // We type into a raw string and re-parse on each tick for live markdown.
    let charIdx = 0;
    const CHAR_DELAY = 12; // ms per character

    function typeChar() {
      if (charIdx <= text.length) {
        el.innerHTML = DOMPurify.sanitize(marked.parse(text.slice(0, charIdx)));
        messagesEl.scrollTop = messagesEl.scrollHeight;
        charIdx++;
        setTimeout(typeChar, CHAR_DELAY);
      }
    }
    typeChar();

    return el;
  }

  messagesEl.appendChild(el);
  messagesEl.scrollTop = messagesEl.scrollHeight;

  // Slide-in animation for cards
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { el.classList.add('visible'); });
  });

  return el;
}

// ═══════════════════════════════════════════════════════════════════════════
// SEND MESSAGE
// ═══════════════════════════════════════════════════════════════════════════
async function sendMessage(overrideText) {
  if (isSending) return;

  const inputEl = document.getElementById('chat-input');
  const text    = (overrideText || inputEl.value).trim();
  if (!text) return;

  isSending = true;
  if (!overrideText) inputEl.value = '';
  inputEl.style.height = 'auto';

  const intent = classifyIntent(text);

  appendMessage('user', text);

  // Fire API immediately, animate in parallel
  const apiPromise = callARIA(text, intent);
  await showThinking(messagesEl, intent, apiPromise);
  const response = await apiPromise;

  appendARIAMessage(response);
  isSending = false;
}

// Input handlers
const inputEl  = document.getElementById('chat-input');
const sendBtn  = document.getElementById('send-btn');

inputEl.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

inputEl.addEventListener('input', () => {
  inputEl.style.height = 'auto';
  inputEl.style.height = Math.min(inputEl.scrollHeight, 100) + 'px';
});

sendBtn.addEventListener('click', () => sendMessage());

// ═══════════════════════════════════════════════════════════════════════════
// RESIZE HANDLE
// ═══════════════════════════════════════════════════════════════════════════
(() => {
  const shell        = document.getElementById('shell');
  const resizeHandle = document.getElementById('resizeHandle');
  const MIN_W   = 280;
  const MAX_W   = () => Math.floor(window.innerWidth * 0.55);
  const DEFAULT = 380;
  let currentW  = DEFAULT;

  function setWidth(w, animate = true) {
    currentW = Math.max(MIN_W, Math.min(MAX_W(), w));
    if (!animate) shell.style.transition = 'none';
    shell.style.gridTemplateColumns = `${currentW}px 1fr`;
    if (!animate) requestAnimationFrame(() => shell.style.transition = '');
  }

  window.addEventListener('resize', () => setWidth(currentW));

  let dragging = false, startX = 0, startW = 0;

  resizeHandle.addEventListener('mousedown', e => {
    dragging = true; startX = e.clientX; startW = currentW;
    resizeHandle.classList.add('dragging');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });

  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    setWidth(startW + (e.clientX - startX), false);
  });

  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    resizeHandle.classList.remove('dragging');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  });

  resizeHandle.addEventListener('touchstart', e => {
    dragging = true; startX = e.touches[0].clientX; startW = currentW;
    resizeHandle.classList.add('dragging');
    e.preventDefault();
  }, { passive: false });

  document.addEventListener('touchmove', e => {
    if (!dragging) return;
    setWidth(startW + (e.touches[0].clientX - startX), false);
  }, { passive: true });

  document.addEventListener('touchend', () => {
    dragging = false;
    resizeHandle.classList.remove('dragging');
  });

  setWidth(DEFAULT, false);
})();

// ═══════════════════════════════════════════════════════════════════════════
// STARTUP INTELLIGENCE
// ═══════════════════════════════════════════════════════════════════════════
(function init() {
  const sysEl = appendMessage('system', 'Initializing ARIA systems...');

  const uncovered = crisisPoints.filter(c => c.severity === 'critical' && c.volunteersAssigned.length === 0);
  const available = volunteers.filter(v => v.status === 'available').length;

  const startupPrompt = `SYSTEM INIT: ${uncovered.length} critical crises have zero volunteer coverage. ${available} volunteers available. Provide a 2-sentence urgent situation brief and name the single highest priority crisis to act on first.`;

  callARIA(startupPrompt, 'situation').then(response => {
    sysEl.remove();
    appendARIAMessage(response);
  });
})();
