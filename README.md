# AllerStamp

A food-label allergen scanner: build an allergy profile, photograph an
ingredients panel, OCR it, map ingredients to allergens (including hidden
aliases like *whey → milk* or *groundnut → peanut*), get a MATCH /
AWARENESS / NO MATCH verdict, and read an AI-generated explanation of why.

```
frontend/public/index.html   Kraft-paper "inspection ticket" UI. OCR runs
                              in the browser via Tesseract.js; everything
                              else talks to the backend API.

backend/                     Express API: allergen dictionary, profile
                              storage, ingredient matching, verdicts,
                              scan history, and AI explanations.
```

## Architecture

```
 ┌────────────┐   image    ┌──────────────┐   ocrText     ┌─────────────┐
 │  Browser   │──Tesseract─▶  extracted    │──POST /scan──▶│  Express     │
 │ (frontend) │   .js OCR   │  text        │               │  API         │
 └────────────┘             └──────────────┘               │              │
       ▲                                                    │ normalize    │
       │        verdict + matches + explanation             │ match        │
       └────────────────────────────────────────────────────│ verdict      │
                                                              │ AI explain  │
                                                              └──────┬──────┘
                                                                     │
                                                          data/db.json (file store)
```

OCR stays client-side (no image upload needed, works offline-ish). The
backend owns the allergen dictionary, the matching/verdict logic, scan
persistence, and the call to the Anthropic API for the "why" explanation —
so your API key never ships to the browser.

## Quick start

```bash
cd backend
cp .env.example .env      # add your ANTHROPIC_API_KEY
npm install
npm start                 # http://localhost:4000
```

The backend serves the frontend automatically from `backend/public` if
present. For local development you can instead just open
`frontend/public/index.html` directly (or serve it with any static
server) and point it at the API:

```
http://localhost:5500/index.html?api=http://localhost:4000
```

To bundle the frontend into the backend for a single deployable service:

```bash
mkdir -p backend/public
cp frontend/public/index.html backend/public/index.html
```

## API reference

| Method | Path                        | Description                                   |
|--------|------------------------------|------------------------------------------------|
| GET    | `/api/health`                | Liveness check                                 |
| GET    | `/api/allergens`             | The allergen dictionary (id, label, synonyms)  |
| POST   | `/api/profile`                | Create a profile: `{ allergens: ["milk", ...] }` |
| GET    | `/api/profile/:id`            | Fetch a profile                                |
| GET    | `/api/profile/:id/scans`      | Scan history for a profile                     |
| POST   | `/api/scan`                   | Match OCR text against a profile → verdict     |
| GET    | `/api/scan/:id`               | Fetch a scan                                   |
| POST   | `/api/scan/:id/explain`       | Generate (and cache) the AI "why" explanation  |
| GET    | `/api/compare?a=<id>&b=<id>`  | Row-by-row comparison of two scans             |

### Example: `POST /api/scan`

```json
{
  "profileId": "b3f2...",
  "ocrText": "ingredients: sugar, whey powder, soy lecithin. may contain peanuts.",
  "confidence": 82
}
```

```json
{
  "id": "9c1a...",
  "verdict": "red",
  "verdictLabel": "MATCH",
  "verdictSummary": "Direct allergen found in ingredients",
  "matches": [
    { "allergenId": "milk", "allergenLabel": "Milk", "synonym": "whey", "type": "direct" },
    { "allergenId": "soy", "allergenLabel": "Soy", "synonym": "soy lecithin", "type": "direct" },
    { "allergenId": "peanut", "allergenLabel": "Peanut", "synonym": "peanuts", "type": "advisory" }
  ]
}
```

## Storage

Data persists to `backend/data/db.json` (created automatically, gitignored).
Swap `backend/src/db.js` for a real database (Postgres, SQLite, etc.) without
touching route or matching logic — it's a small, isolated module.

## Notes

- Without `ANTHROPIC_API_KEY` set, `/api/scan/:id/explain` still works —
  it falls back to a rule-based explanation.
- The matching logic treats a hit inside 60 characters of an advisory
  phrase ("may contain", "traces of", …) as `advisory` rather than `direct`.
- This is a decision-support tool, not a medical device — always verify
  serious allergies against the physical label.
