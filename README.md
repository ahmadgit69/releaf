# Releaf — Crisis Coordination System

> *"Relief, re-leafed."*

A real-time NGO crisis coordination command center powered by an AI field operations assistant. Built for coordinators who need to see the full picture, act fast, and deploy the right people to the right place.

---

## What It Is

Releaf is a single-page coordinator dashboard — not a volunteer app, not a data pipeline. It's the **command center**. The coordinator sees every active crisis on a live map, talks to ARIA to understand the situation, and confirms deployments with one click.

The scope is intentional. A coordinator's job is to assess, decide, and dispatch. Releaf does exactly that.

---

## ARIA — Automated Resource & Intelligence Assistant

ARIA is the brain of Releaf. It's a field operations AI tuned to speak like a military ops assistant — decisive, short, no fluff.

On startup, ARIA doesn't wait to be asked. It scans all active crises, identifies which critical ones have zero volunteer coverage, and delivers an immediate situation brief. Every session starts with ground truth.

From there, ARIA handles:

- **Situation reports** — full field overview or filtered by severity
- **Assignment recommendations** — matches volunteers to crises using a 4-layer logic: status → skills → zone proximity → load balance
- **Gap reports** — surfaces crises with no skill-matched volunteer available, flags missing skills in red
- **Crisis detail** — full breakdown of any crisis by ID or map click
- **Volunteer profiles** — individual dossiers with current assignment status
- **Zone summaries** — everything happening in a specific area of Ahmedabad
- **Volunteer roster** — full list with status, skills, and assignments

ARIA never auto-assigns. It recommends. The coordinator confirms.

### Intent-Aware Prompting

Every message is classified before hitting the API. ARIA only receives the data slice relevant to the query — never the full dataset blindly. This keeps responses fast, accurate, and within token budget.

| Intent | Data sent |
|---|---|
| Situation overview | All 25 crises (slim) |
| Assignment | All crises + available volunteers only |
| Zone query | Zone-filtered crises + available volunteers |
| Crisis detail | Single crisis object |
| Volunteer profile | Single volunteer object |
| Gap report | All crises + available volunteers |
| Greeting / general | None |

### Thinking Animation

ARIA doesn't show a spinner. It shows intent-aware typewriter phrases — *"Cross-referencing skills against active crises..."*, *"Scanning zone perimeter..."* — that loop until the API responds, then erase cleanly before the response slides in. The API call fires immediately on send; the animation runs in parallel.

---

## The Map

The right panel is a Leaflet.js map of Ahmedabad, dark-themed to match the UI.

- **Crisis pins** — color-coded by severity: 🔴 critical, 🟠 moderate, 🟢 low
- **Volunteer dots** — green (available), orange (engaged), grey (offline)
- **Pin drop** — click anywhere on the map to drop a pin. ARIA receives the location context automatically. If a crisis is within 2km, ARIA knows which one and how far. Beyond 2km, it won't hallucinate a "nearby" crisis.
- **Crisis pin click** — clicking a crisis marker sets it as the active pin context, so asking "assign volunteers" immediately refers to that crisis
- **Deployment lines** — when an assignment is confirmed, an animated dashed line draws from the volunteer's dot to the crisis pin, then fades. The dot recolors from green to orange live.
- **Resizable panel** — drag the handle between chat and map to adjust the split

Geocoding via Nominatim (OpenStreetMap). Debounced to 1.1s to respect the free tier rate limit.

---

## Response Cards

ARIA returns structured JSON for operational queries. The frontend renders them as interactive cards — not chat bubbles, not tables. Cards sit directly on the panel background, same as ARIA's plain text responses.

| Card | Trigger |
|---|---|
| Assignment | "assign volunteers", "deploy to C011", pin + "assign" |
| Situation Brief | "sitrep", "what's going on", "show critical crises" |
| Crisis Detail | Click a pin, "tell me about C003" |
| Volunteer Profile | "who is V001", "tell me about Ravi Mehta" |
| Volunteer Roster | "list all volunteers", "show me the team" |
| Gap Report | "coverage gaps", "which crises are uncovered" |
| Zone Summary | "what's happening in Vatva", "zone report Naroda" |

Assignment cards have **Confirm** and **Cancel** actions. Confirming updates the in-memory state, recolors the map marker, draws the deployment line, and has ARIA acknowledge in chat.

Gap report and crisis detail cards have inline **Assign →** buttons that directly trigger the assignment flow — no manual re-typing.

---

## Dataset

25 crises across 8 Ahmedabad zones. 12 volunteers.

- 8 critical, 10 moderate, 7 low severity crises
- 6 available, 4 engaged, 2 offline volunteers
- 5 crises intentionally have no exact skill match — forces ARIA's partial match and redeployment reasoning
- Skills are intentionally uneven (more rescue/first-aid than counseling/construction) to create realistic scarcity

This is demo data, kept imperfect on purpose. Real NGO data would slot in by replacing `data.js`.

---

## Tech Stack

| Layer | Tool |
|---|---|
| UI | HTML + CSS + Vanilla JS |
| Map | Leaflet.js 1.9.4 |
| AI | Google Gemini (via Generative Language API) with key pool rotation |
| Geocoding | Nominatim (OpenStreetMap) |
| Distance | Haversine formula — pure JS |
| Markdown | marked.js + DOMPurify |
| Fonts | Segoe UI Thin (local) |

API keys rotate automatically on rate-limit or quota errors. Add more entries to `API_POOL` in `script.js` to extend capacity.

---

## File Structure

```
releaf/
├── index.html          — layout, all markup
├── script.js           — map, ARIA logic, card renderers, send flow
├── style.css           — design system, dark theme, responsive layout
├── data.js             — 25 crises + 12 volunteers
├── aria-loader.js      — thinking animation (typewriter loop)
└── segoe-ui-this/      — local font files
```

---

## Running It

No build step. No server required for local use.

Open `index.html` directly in a browser, or serve the folder with any static file server:

```bash
npx serve .
```

Add your Gemini API key(s) to the `API_POOL` array at the top of `script.js`.

---

## Scope

Releaf is a **coordinator-facing** tool. The volunteer-facing side — receiving assignments, updating status, requesting backup — is a separate product that would consume the same data layer. That's not missing from this app; it's out of scope by design.

What Releaf covers:

- ✅ Crisis visibility (map + severity heatmap)
- ✅ AI-assisted assignment recommendations
- ✅ Volunteer availability and skill matching
- ✅ Coverage gap identification
- ✅ Deployment confirmation with live map feedback
- ✅ Proactive startup intelligence

What it doesn't cover (intentionally):

- ❌ Volunteer-facing mobile app
- ❌ Live field status updates
- ❌ Real survey/field data ingestion
- ❌ Dashboard charts or analytics

---

## Attribution

Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors, ODbL 1.0. Geocoding by [Nominatim](https://nominatim.org).
