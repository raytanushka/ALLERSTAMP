// Single source of truth for allergens + their label-text aliases.
// The frontend fetches this from GET /api/allergens so both sides
// always agree on what "Milk" or "Peanut" can look like on a label.

const ALLERGENS = [
  { id: 'milk',      label: 'Milk',       synonyms: ['milk', 'whey', 'casein', 'caseinate', 'lactose', 'butter', 'ghee', 'curd', 'milk solids', 'buttermilk', 'cream'] },
  { id: 'peanut',    label: 'Peanut',     synonyms: ['peanut', 'peanuts', 'groundnut', 'groundnuts', 'arachis', 'peanut oil', 'peanut flour'] },
  { id: 'treenut',   label: 'Tree Nut',   synonyms: ['almond', 'cashew', 'walnut', 'pecan', 'hazelnut', 'pistachio', 'macadamia', 'brazil nut', 'pine nut'] },
  { id: 'soy',       label: 'Soy',        synonyms: ['soy', 'soya', 'soybean', 'soybeans', 'soy lecithin', 'edamame', 'soja'] },
  { id: 'egg',       label: 'Egg',        synonyms: ['egg', 'eggs', 'albumin', 'ovalbumin', 'egg white', 'egg yolk', 'mayonnaise', 'egg powder'] },
  { id: 'wheat',     label: 'Wheat',      synonyms: ['wheat', 'gluten', 'semolina', 'durum', 'spelt', 'farina', 'wheat flour', 'wheat starch'] },
  { id: 'fish',      label: 'Fish',       synonyms: ['fish', 'cod', 'salmon', 'anchovy', 'anchovies', 'fish sauce', 'surimi', 'tuna'] },
  { id: 'shellfish', label: 'Shellfish',  synonyms: ['shrimp', 'prawn', 'crab', 'lobster', 'crustacean', 'shellfish', 'oyster', 'clam'] },
  { id: 'sesame',    label: 'Sesame',     synonyms: ['sesame', 'sesame oil', 'tahini', 'sesamum', 'sesame seed'] },
];

const ADVISORY_PHRASES = [
  'may contain',
  'manufactured in a facility',
  'processed in a facility',
  'traces of',
  'shared equipment',
  'may also contain',
];

const ALLERGEN_IDS = new Set(ALLERGENS.map(a => a.id));

module.exports = { ALLERGENS, ADVISORY_PHRASES, ALLERGEN_IDS };
