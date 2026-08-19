const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { ALLERGEN_IDS } = require('../allergens');
const db = require('../db');

const router = express.Router();

// POST /api/profile  { allergens: ["milk","peanut"] }
router.post('/', (req, res) => {
  const { allergens } = req.body || {};
  if (!Array.isArray(allergens) || allergens.length === 0) {
    return res.status(400).json({ error: 'allergens must be a non-empty array' });
  }
  const invalid = allergens.filter(a => !ALLERGEN_IDS.has(a));
  if (invalid.length > 0) {
    return res.status(400).json({ error: `unknown allergen id(s): ${invalid.join(', ')}` });
  }

  const profile = {
    id: uuidv4(),
    allergens,
    createdAt: new Date().toISOString(),
  };
  db.createProfile(profile);
  res.status(201).json(profile);
});

// GET /api/profile/:id
router.get('/:id', (req, res) => {
  const profile = db.getProfile(req.params.id);
  if (!profile) return res.status(404).json({ error: 'profile not found' });
  res.json(profile);
});

// GET /api/profile/:id/scans  — scan history for compare / review
router.get('/:id/scans', (req, res) => {
  const profile = db.getProfile(req.params.id);
  if (!profile) return res.status(404).json({ error: 'profile not found' });
  res.json(db.listScansByProfile(req.params.id));
});

module.exports = router;
