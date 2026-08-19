const { ALLERGENS, ADVISORY_PHRASES } = require('./allergens');

/** Clean up raw OCR text: collapse whitespace, strip OCR noise characters, lowercase. */
function normalizeText(raw) {
  return String(raw || '')
    .replace(/\r/g, ' ')
    .replace(/[|_~^]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/,\s*,/g, ',')
    .trim()
    .toLowerCase();
}

/**
 * Scan normalized ingredient text for every synonym of every allergen in
 * the given profile. A hit inside a 60-character window after an advisory
 * phrase ("may contain", "traces of" ...) is classified as 'advisory'
 * (cross-contact risk) rather than 'direct' (listed ingredient).
 */
function computeMatches(normalizedText, profileAllergenIds) {
  const matches = [];
  const profileAllergens = ALLERGENS.filter(a => profileAllergenIds.includes(a.id));

  profileAllergens.forEach(allergen => {
    allergen.synonyms.forEach(synonym => {
      const idx = normalizedText.indexOf(synonym);
      if (idx !== -1) {
        const windowStart = Math.max(0, idx - 60);
        const windowText = normalizedText.slice(windowStart, idx);
        const isAdvisory = ADVISORY_PHRASES.some(p => windowText.includes(p));
        matches.push({
          allergenId: allergen.id,
          allergenLabel: allergen.label,
          synonym,
          type: isAdvisory ? 'advisory' : 'direct',
        });
      }
    });
  });

  return matches;
}

/** Roll matches up into a single verdict: MATCH > AWARENESS > NO MATCH. */
function computeVerdict(matches) {
  const hasDirect = matches.some(m => m.type === 'direct');
  const hasAdvisory = matches.some(m => m.type === 'advisory');
  if (hasDirect) return { verdict: 'red', label: 'MATCH', summary: 'Direct allergen found in ingredients' };
  if (hasAdvisory) return { verdict: 'amber', label: 'AWARENESS', summary: 'Possible cross-contact advisory' };
  return { verdict: 'green', label: 'NO MATCH', summary: 'Nothing from the profile detected' };
}

module.exports = { normalizeText, computeMatches, computeVerdict };
