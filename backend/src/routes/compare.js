const express = require('express');
const db = require('../db');
const { ALLERGENS } = require('../allergens');

const router = express.Router();

// GET /api/compare?a=<scanIdA>&b=<scanIdB>
router.get('/', (req, res) => {
  const { a, b } = req.query;
  if (!a || !b) return res.status(400).json({ error: 'query params a and b (scan ids) are required' });

  const scanA = db.getScan(a);
  const scanB = db.getScan(b);
  if (!scanA || !scanB) return res.status(404).json({ error: 'one or both scans not found' });
  if (scanA.profileId !== scanB.profileId) {
    return res.status(400).json({ error: 'scans belong to different profiles' });
  }

  const profile = db.getProfile(scanA.profileId);
  const rows = ALLERGENS.filter(al => profile.allergens.includes(al.id)).map(al => {
    const inA = scanA.matches.find(m => m.allergenId === al.id) || null;
    const inB = scanB.matches.find(m => m.allergenId === al.id) || null;
    return { allergenId: al.id, allergenLabel: al.label, a: inA, b: inB };
  });

  res.json({
    profileId: profile.id,
    scanA: { id: scanA.id, verdictLabel: scanA.verdictLabel },
    scanB: { id: scanB.id, verdictLabel: scanB.verdictLabel },
    rows,
  });
});

module.exports = router;
