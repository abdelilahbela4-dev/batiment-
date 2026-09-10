// Shared pricing tables. The quote page and the home-page live estimate must
// never quote different numbers, so both read from here.

export const PRICES = {
  construction: { low: 1750, high: 2500 },
  renovation: { low: 600, high: 950, full: { low: 850, high: 1500 } },
  extension: { low: 1400, high: 1900, masonry: { low: 1600, high: 2300 }, raise: { low: 1800, high: 2600 } },
  isolation: { low: 90, high: 160 },
  amenagement: { low: 700, high: 1300 },
};

export const AIDS = {
  isolationPerM2: { bleu: 75, jaune: 60, violet: 40, rose: 15 },
  isolationCeePerM2: 10,
  renoPct: { bleu: 0.35, jaune: 0.25, violet: 0.15, rose: 0.05 },
  renoCap: 20000,
  renoCee: { bleu: 1500, jaune: 1200, violet: 900, rose: 600 },
};

// Surface bounds per project type: a loft conversion and a new build do not
// share a sensible range, and one slider for both produced absurd figures.
export const SURFACE = {
  construction: { min: 60, max: 300, start: 120, step: 5 },
  renovation: { min: 20, max: 300, start: 100, step: 5 },
  extension: { min: 10, max: 120, start: 35, step: 5 },
  isolation: { min: 40, max: 400, start: 140, step: 10 },
  amenagement: { min: 10, max: 150, start: 40, step: 5 },
};
