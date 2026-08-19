const express = require('express');
const db = require('../db');
const { ALLERGENS } = require('../allergens');

const router = express.Router();

function fallbackExplanation(scan) {
  if (scan.matches.length === 0) {
    return "No ingredients matching the profile turned up in the scanned text. Lighting and print quality can still hide a word or two, so give the label a quick human check if unsure.";
  }
  const m = scan.matches[0];
  if (scan.verdictLabel === 'MATCH') {
    return `The ingredient list names "${m.synonym}," a known form of ${m.allergenLabel} — a direct hit against the profile, so this product isn't safe to eat as scanned.`;
  }
  return `The label carries an advisory statement mentioning "${m.synonym}," tied to ${m.allergenLabel}. It's not a listed ingredient, but a cross-contact risk worth weighing if that allergy is severe.`;
}

// POST /api/scan/:id/explain — generate (and cache) the AI "why" explanation
router.post('/:id/explain', async (req, res) => {
  const scan = db.getScan(req.params.id);
  if (!scan) return res.status(404).json({ error: 'scan not found' });

  if (scan.explanation) {
    return res.json({ explanation: scan.explanation, cached: true });
  }

  const profile = db.getProfile(scan.profileId);
  const profileLabels = ALLERGENS.filter(a => profile.allergens.includes(a.id)).map(a => a.label).join(', ');
  const matchList = scan.matches.map(m => `${m.synonym} (${m.type}) -> ${m.allergenLabel}`).join('; ') || 'none';

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const explanation = fallbackExplanation(scan);
    db.updateScan(scan.id, { explanation });
    return res.json({ explanation, cached: false, fallback: true, reason: 'ANTHROPIC_API_KEY not set' });
  }

  const prompt = `You are a food-safety assistant inside an allergen scanner app called AllerStamp.
User's allergy profile: ${profileLabels}.
Verdict computed by the app: ${scan.verdictLabel}.
Detected ingredient signals: ${matchList}.
OCR ingredient text (may be imperfect): """${scan.ocrText.slice(0, 600)}"""

Write a short, plain-language explanation (2-3 sentences, no markdown, no headers) of WHY this verdict was reached, referencing the specific ingredient(s) found and which allergen they map to. If verdict is NO MATCH, reassure briefly but note OCR can miss things. Keep it warm but direct, like a careful friend reading a label for someone.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Anthropic API error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const explanation = (data.content || []).map(b => b.text || '').join('').trim() || fallbackExplanation(scan);
    db.updateScan(scan.id, { explanation });
    res.json({ explanation, cached: false });
  } catch (err) {
    console.error('[explain] falling back:', err.message);
    const explanation = fallbackExplanation(scan);
    db.updateScan(scan.id, { explanation });
    res.json({ explanation, cached: false, fallback: true, reason: err.message });
  }
});

module.exports = router;
