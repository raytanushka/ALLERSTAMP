const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { normalizeText, computeMatches, computeVerdict } = require('../match');

const router = express.Router();

// POST /api/scan  { profileId, ocrText, confidence }
// OCR itself runs client-side (Tesseract.js) — this endpoint takes the
// extracted text and turns it into a verdict using the server-side
// allergen dictionary, so the frontend never has to duplicate that logic.
router.post('/', (req, res) => {
  const { profileId, ocrText, confidence } = req.body || {};

  if (!profileId) return res.status(400).json({ error: 'profileId is required' });
  const profile = db.getProfile(profileId);
  if (!profile) return res.status(404).json({ error: 'profile not found' });

  if (typeof ocrText !== 'string') {
    return res.status(400).json({ error: 'ocrText must be a string' });
  }

  const normalized = normalizeText(ocrText);
  const lowConfidence = (typeof confidence === 'number' && confidence < 55) || normalized.length < 12;

  if (lowConfidence) {
    return res.status(200).json({
      lowConfidence: true,
      confidence: confidence ?? null,
      message: 'Text came through too blurry or faint to trust. Retake the photo in better light.',
    });
  }

  const matches = computeMatches(normalized, profile.allergens);
  const verdict = computeVerdict(matches);

  const scan = {
    id: uuidv4(),
    profileId,
    ocrText: normalized,
    confidence: confidence ?? null,
    matches,
    verdict: verdict.verdict,
    verdictLabel: verdict.label,
    verdictSummary: verdict.summary,
    explanation: null,
    createdAt: new Date().toISOString(),
  };
  db.createScan(scan);
  res.status(201).json(scan);
});

// GET /api/scan/:id
router.get('/:id', (req, res) => {
  const scan = db.getScan(req.params.id);
  if (!scan) return res.status(404).json({ error: 'scan not found' });
  res.json(scan);
});

module.exports = router;
