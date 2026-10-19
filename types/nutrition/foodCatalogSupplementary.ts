import type { FoodNutrientProfile } from './foodCatalogTypes';

// Only nutrients absent from the matched USDA record, app metadata and estimates belong here.
// For foods with no reliable matching USDA preparation/product, the original profile is retained.
// Such legacy amounts are unverified; this file does not establish nutritional provenance.
// Independent fructan assays can exceed legacy total-fibre values. Do not add the two totals.
export const FOOD_SUPPLEMENTARY_PROFILES = {
  cauliflower: {
    sulfurRichVegetable: true,
    fiberByType: { fiber_fermentable: 0.09 },
    // Fructans, fresh-weight mean: https://doi.org/10.3389/fnut.2024.1446771, Table 1.
    // This is the quantified fermentable fructan fraction, not all fermentable fibre.
    fiberSubtypeTotals: { inulin_type_fructans: 0.09 },
    defaultServings: [{ grams: 50 }, { grams: 100 }, { grams: 200 }]
  },
  cabbage: {
    sulfurRichVegetable: true,
    fiberByType: { fiber_fermentable: 0.03 },
    // Fructans, fresh-weight mean: https://doi.org/10.3389/fnut.2024.1446771, Table 1.
    // This is the quantified fermentable fructan fraction, not all fermentable fibre.
    fiberSubtypeTotals: { inulin_type_fructans: 0.03 },
    defaultServings: [{ grams: 50 }, { grams: 100 }, { grams: 200 }]
  },
  garlic: {
    sulfurRichVegetable: true,
    fiberByType: { fiber_fermentable: 12.5 },
    // Moshfegh et al. 1999, Table 1: raw garlic inulin-type fructans midpoint 9–16 g/100 g. FOS overlaps this amount; do not add it again. https://doi.org/10.1093/jn/129.7.1407S
    // This is the quantified fermentable fructan fraction, not all fermentable fibre.
    fiberSubtypeTotals: { inulin_type_fructans: 12.5 },
    defaultServings: [{ grams: 3 }, { grams: 6 }, { grams: 9 }]
  },
  onions: {
    sulfurRichVegetable: true,
    fiberByType: { fiber_fermentable: 1.97 },
    // Fructans, fresh-weight mean: https://doi.org/10.3389/fnut.2024.1446771, Table 1.
    // This is the quantified fermentable fructan fraction, not all fermentable fibre.
    fiberSubtypeTotals: { inulin_type_fructans: 1.97 },
    defaultServings: [{ grams: 25 }, { grams: 50 }, { grams: 100 }]
  },
  leeks: {
    sulfurRichVegetable: true,
    fiberByType: { fiber_fermentable: 0.24 },
    // Fructans, fresh-weight mean: https://doi.org/10.3389/fnut.2024.1446771, Table 1.
    // This is the quantified fermentable fructan fraction, not all fermentable fibre.
    fiberSubtypeTotals: { inulin_type_fructans: 0.24 },
    defaultServings: [{ grams: 25 }, { grams: 50 }, { grams: 100 }]
  },
  brusselsSprouts: {
    sulfurRichVegetable: true,
    fiberByType: { fiber_fermentable: 0.14 },
    // Kalala et al. 2017, Tables 1–2: 0.9 g/100 g dry matter × 15.2% DM = 0.1368 g/100 g fresh. https://doi.org/10.1080/09637486.2017.1412404
    // This is the quantified fermentable fructan fraction, not all fermentable fibre.
    fiberSubtypeTotals: { inulin_type_fructans: 0.14 },
    defaultServings: [{ grams: 50 }, { grams: 100 }, { grams: 200 }]
  },
  kale: {
    sulfurRichVegetable: true,
    fiberByType: { fiber_non_gel_forming: 2.5, fiber_fermentable: 0.9, fiber_gel_forming: 0.2 },
    fiberSubtypeTotals: {
      cellulose: 1.2,
      hemicellulose: 0.8,
      lignin: 0.5,
      pectin: 0.2,
      arabinoxylan: 0.2,
      beta_glucans: 0.05,
      resistant_starch: 0.03,
      fructooligosaccharides: 0.04,
      galactooligosaccharides: 0.02,
      pectic_oligosaccharides: 0.03,
      mucilage: 0.01,
      inulin: 0.05,
    },
    vitaminsByType: { vitamin_b7: 0.00002 },
    aminoAcidsByType: { glutamine: 330 },
    polyphenolByType: {
      polyphenols_total: 520,
      phenolic_acids: 120,
      chlorogenic_acids: 25,
      flavonoids_total: 330,
      flavonols: 130,
      quercetin: 25,
      catechins: 8,
      anthocyanins: 4,
      lignans: 2.3,
    },
    microbiomeSupport: [
      {
        microbe: 'Bifidobacterium',
        supportLevel: 'high',
        linkedNutrients: ['fiber_fermentable', 'pectin', 'polyphenols_total'],
        likelyFoods: ['kale'],
      },
      {
        microbe: 'Lactobacillus',
        supportLevel: 'medium',
        linkedNutrients: ['fiber_total', 'flavonoids_total'],
        likelyFoods: ['kale'],
      },
      {
        microbe: 'Akkermansia muciniphila',
        supportLevel: 'medium',
        linkedNutrients: ['polyphenols_total', 'quercetin'],
        likelyFoods: ['kale'],
      },
    ],
    defaultServings: [{"grams":90,"labelKey":"halfCup"},{"grams":180,"labelKey":"oneCup"},{"grams":360,"labelKey":"twoCups"}]
  },
  chard: {
    fiberByType: { fiber_non_gel_forming: 1.1, fiber_fermentable: 0.4 },
    defaultServings: [{"grams":90,"labelKey":"halfCup"},{"grams":180,"labelKey":"oneCup"},{"grams":360,"labelKey":"twoCups"}]
  },
  pumpkinSeeds: {
    fiberByType: { fiber_non_gel_forming: 4.2, fiber_fermentable: 1.3 },
    defaultServings: [{"grams":30},{"grams":60},{"grams":90}]
  },
  almonds: {
    fiberByType: { fiber_non_gel_forming: 8.7, fiber_fermentable: 2.9 },
    defaultServings: [{"grams":30},{"grams":60},{"grams":90}]
  },
  darkChocolate: {
    fiberByType: { fiber_non_gel_forming: 7.9, fiber_fermentable: 2.2 },
    polyphenolByType: { polyphenols_total: 1700, flavonoids_total: 1100, flavanols: 500 },
    defaultServings: [{"grams":30},{"grams":60},{"grams":90}]
  },
  blackBeans: {
    fiberByType: { fiber_fermentable: 4.8, fiber_non_gel_forming: 3 },
    defaultServings: [{"grams":85,"labelKey":"halfCup"},{"grams":170,"labelKey":"oneCup"},{"grams":340,"labelKey":"twoCups"}]
  },
  oysters: {
    defaultServings: [{"grams":50},{"grams":100},{"grams":200}]
  },
  beef: {
    defaultServings: [{"grams":50},{"grams":100},{"grams":200}]
  },
  chickpeas: {
    fiberByType: { fiber_fermentable: 3.5 },
    defaultServings: [{"grams":82,"labelKey":"halfCup"},{"grams":164,"labelKey":"oneCup"},{"grams":328,"labelKey":"twoCups"}]
  },
  cashews: {
    fiberByType: { fiber_non_gel_forming: 2.2 },
    defaultServings: [{"grams":30},{"grams":60},{"grams":90}]
  },
  oats: {
    fiberByType: { fiber_fermentable: 5.2, fiber_gel_forming: 4.2 },
    defaultServings: [{"grams":40,"labelKey":"halfCup"},{"grams":80,"labelKey":"oneCup"},{"grams":160,"labelKey":"twoCups"}]
  },
  soybeans: {
    fiberByType: { fiber_fermentable: 2.4, fiber_non_gel_forming: 2.6, fiber_gel_forming: 1 },
    defaultServings: [{"grams":85,"labelKey":"halfCup"},{"grams":170,"labelKey":"oneCup"},{"grams":340,"labelKey":"twoCups"}]
  },
  chiaSeeds: {
    fiberByType: { fiber_fermentable: 9.5, fiber_gel_forming: 14.5 },
    aminoAcidsByType: { glutamine: 3.5 },
    vitaminsByType: { vitamin_b5: 0.9, vitamin_b6: 0.47, vitamin_b7: 0.000007, vitamin_k: 0.0002 },
    polyphenolByType: {
      polyphenols_total: 1100,
      flavonoids_total: 220,
      flavonols: 42,
      flavanols: 31,
      phenolic_acids: 420,
      lignans: 150,
      catechins: 14,
    },
    microbiomeSupport: [
      {
        microbe: 'Roseburia',
        supportLevel: 'high',
        linkedNutrients: ['fiber_fermentable', 'fiber_gel_forming'],
        likelyFoods: ['chiaSeeds'],
      },
      {
        microbe: 'Bifidobacterium',
        supportLevel: 'medium',
        linkedNutrients: ['fiber_fermentable', 'polyphenols_total'],
        likelyFoods: ['chiaSeeds'],
      },
    ],
    defaultServings: [{"grams":12,"labelKey":"oneTablespoon"},{"grams":24,"labelKey":"twoTablespoons"},{"grams":48,"labelKey":"fourTablespoons"}]
  },
  greenBanana: {
    calories: 90,
    protein: 1.1,
    carbohydrates: 23,
    fat: 0.3,
    fiber: 2.6,
    fiberByType: { fiber_total: 2.6, fiber_fermentable: 1.6 },
    mineralsByType: { potassium: 358, magnesium: 27 },
    defaultServings: [{"grams":50},{"grams":100},{"grams":200}],
  },
  chicoryRoot: {
    fiberByType: { fiber_fermentable: 3.1 },
    polyphenolByType: {
      polyphenols_total: 180,
      phenolic_acids: 130,
      chlorogenic_acids: 100,
    },
    defaultServings: [{"grams":50},{"grams":100},{"grams":200}]
  },
  cookedCooledPotato: {
    calories: 87,
    protein: 1.9,
    carbohydrates: 20.1,
    fat: 0.1,
    fiber: 2.2,
    fiberByType: { fiber_total: 2.2, fiber_fermentable: 0.9 },
    mineralsByType: { potassium: 379, magnesium: 23 },
    defaultServings: [{"grams":85,"labelKey":"halfCup"},{"grams":170,"labelKey":"oneCup"},{"grams":340,"labelKey":"twoCups"}],
  },
  psylliumHusk: {
    calories: 200,
    protein: 2,
    carbohydrates: 88,
    fat: 0.5,
    fiber: 80,
    fiberByType: { fiber_total: 80, fiber_fermentable: 24, fiber_gel_forming: 52 },
    mineralsByType: { calcium: 80, iron: 4 },
    defaultServings: [{"grams":30},{"grams":60},{"grams":90}],
  },
  apples: {
    fiberByType: { fiber_fermentable: 1.1, fiber_gel_forming: 1 },
    polyphenolByType: {
      polyphenols_total: 170,
      phenolic_acids: 50,
      chlorogenic_acids: 40,
      flavonoids_total: 65,
      flavonols: 20,
      quercetin: 4,
    },
    defaultServings: [{"grams":50},{"grams":100},{"grams":200}]
  },
  okra: {
    fiberByType: { fiber_fermentable: 1.3, fiber_gel_forming: 1.2 },
    defaultServings: [{"grams":80,"labelKey":"halfCup"},{"grams":160,"labelKey":"oneCup"},{"grams":320,"labelKey":"twoCups"}]
  },
  beets: {
    polyphenolByType: { polyphenols_total: 120, flavonoids_total: 40 },
    defaultServings: [{"grams":50},{"grams":100},{"grams":200}]
  },
  spinach: {
    polyphenolByType: {
      polyphenols_total: 120,
      phenolic_acids: 30,
      chlorogenic_acids: 8,
      flavonoids_total: 60,
      flavonols: 35,
      quercetin: 2,
    },
    defaultServings: [{"grams":90,"labelKey":"halfCup"},{"grams":180,"labelKey":"oneCup"},{"grams":360,"labelKey":"twoCups"}]
  },
  eggs: {
    aminoAcidsByType: { glutamine: 1800 },
    vitaminsByType: { vitamin_b7: 0.00002 },
    mineralsByType: { iodine: 0.024 },
    microbiomeSupport: [
      {
        microbe: 'Faecalibacterium',
        supportLevel: 'low',
        linkedNutrients: ['protein'],
        likelyFoods: ['eggs'],
      },
    ],
    defaultServings: [
      { grams: 50, labelKey: 'oneEgg' },
      { grams: 100, labelKey: 'twoEggs' },
      { grams: 150, labelKey: 'threeEggs' },
    ]
  },
  broccoli: {
    sulfurRichVegetable: true,
    fiberByType: { fiber_non_gel_forming: 1.5, fiber_fermentable: 0.8, fiber_gel_forming: 0.3 },
    fiberSubtypeTotals: {
      cellulose: 0.8,
      hemicellulose: 0.45,
      lignin: 0.2,
      arabinoxylan: 0.05,
      pectin: 0.2,
      beta_glucans: 0.05,
      resistant_starch: 0.08,
      fructooligosaccharides: 0.04,
      galactooligosaccharides: 0.03,
      pectic_oligosaccharides: 0.02,
      mucilage: 0.03,
      inulin: 0.05,
    },
    vitaminsByType: { vitamin_b7: 0.000004 },
    aminoAcidsByType: { glutamine: 450 },
    polyphenolByType: {
      polyphenols_total: 180,
      phenolic_acids: 45,
      chlorogenic_acids: 6,
      flavonoids_total: 90,
      flavonols: 45,
      quercetin: 3,
      catechins: 6,
      flavanols: 8,
      anthocyanins: 1,
      lignans: 0.8,
    },
    microbiomeSupport: [
      {
        microbe: 'Bifidobacterium',
        supportLevel: 'high',
        linkedNutrients: ['fiber_fermentable', 'pectin', 'polyphenols_total'],
        likelyFoods: ['broccoli'],
      },
      {
        microbe: 'Roseburia',
        supportLevel: 'medium',
        linkedNutrients: ['fiber_fermentable', 'fiber_total', 'pectic_oligosaccharides'],
        likelyFoods: ['broccoli'],
      },
      {
        microbe: 'Akkermansia muciniphila',
        supportLevel: 'medium',
        linkedNutrients: ['polyphenols_total', 'quercetin'],
        likelyFoods: ['broccoli'],
      },
    ],
    defaultServings: [{"grams":78,"labelKey":"halfCup"},{"grams":156,"labelKey":"oneCup"},{"grams":312,"labelKey":"twoCups"}]
  },
  salmon: {
    aminoAcidsByType: { glutamine: 2800 },
    mineralsByType: { iodine: 0.03 },
    vitaminsByType: { vitamin_b7: 0.000005 },
    polyphenolByType: {
      polyphenols_total: 0,
      flavonoids_total: 0,
    },
    microbiomeSupport: [
      {
        microbe: 'Faecalibacterium',
        supportLevel: 'medium',
        linkedNutrients: ['protein'],
        likelyFoods: ['salmon'],
      },
    ],
    defaultServings: [{"grams":50},{"grams":100},{"grams":200}]
  },
  avocado: {
    fiberByType: { fiber_non_gel_forming: 4.2, fiber_fermentable: 1.6 },
    defaultServings: [
      { grams: 75, labelKey: 'halfAvocado' },
      { grams: 150, labelKey: 'oneAvocado' },
      { grams: 300, labelKey: 'twoAvocados' },
    ]
  },
  bellPeppers: {
    fiberByType: { fiber_non_gel_forming: 1.3, fiber_fermentable: 0.6 },
    fiberSubtypeTotals: {
      cellulose: 0.7,
      hemicellulose: 0.4,
      lignin: 0.15,
      arabinoxylan: 0.05,
      pectin: 0.3,
      beta_glucans: 0.02,
      resistant_starch: 0.03,
      fructooligosaccharides: 0.02,
      galactooligosaccharides: 0.01,
      pectic_oligosaccharides: 0.03,
      mucilage: 0.02,
      inulin: 0.02,
    },
    vitaminsByType: { vitamin_b7: 0.000002 },
    aminoAcidsByType: { glutamine: 100 },
    polyphenolByType: {
      polyphenols_total: 180,
      flavonoids_total: 85,
      flavonols: 24,
      quercetin: 2,
      flavanols: 12,
      catechins: 6,
      anthocyanins: 2,
    },
    microbiomeSupport: [
      {
        microbe: 'Bifidobacterium',
        supportLevel: 'medium',
        linkedNutrients: ['fiber_fermentable', 'pectin', 'polyphenols_total'],
        likelyFoods: ['bellPeppers'],
      },
      {
        microbe: 'Akkermansia muciniphila',
        supportLevel: 'medium',
        linkedNutrients: ['polyphenols_total', 'quercetin'],
        likelyFoods: ['bellPeppers'],
      },
    ],
    defaultServings: [{"grams":60,"labelKey":"halfBellPepper"},{"grams":120,"labelKey":"oneBellPepper"},{"grams":240,"labelKey":"twoBellPeppers"}]
  },
  blackCurrants: {
    fiber: 4.3,
    fiberByType: { fiber_total: 4.3, fiber_fermentable: 2.1, fiber_gel_forming: 1.5 },
    fiberSubtypeTotals: {
      pectin: 1.5,
      cellulose: 1.2,
      hemicellulose: 0.8,
      resistant_starch: 0.4,
      inulin: 0.4,
    },
    vitaminsByType: { vitamin_k: 19, vitamin_b9: 0.022 },
    aminoAcidsByType: { leucine: 90, valine: 80, lysine: 80 },
    polyphenolByType: {
      polyphenols_total: 680,
      anthocyanins: 350,
      flavonoids_total: 280,
      flavonols: 60,
      catechins: 25,
    },
    microbiomeSupport: [
      {
        microbe: 'Akkermansia muciniphila',
        supportLevel: 'high',
        linkedNutrients: ['anthocyanins', 'polyphenols_total', 'fiber_fermentable'],
        likelyFoods: ['blackCurrants'],
      },
      {
        microbe: 'Roseburia',
        supportLevel: 'high',
        linkedNutrients: ['fiber_fermentable', 'pectin'],
        likelyFoods: ['blackCurrants'],
      },
      {
        microbe: 'Ruminococcus',
        supportLevel: 'medium',
        linkedNutrients: ['polyphenols_total', 'fiber_total'],
        likelyFoods: ['blackCurrants'],
      },
    ],
    defaultServings: [{"grams":85,"labelKey":"halfCup"},{"grams":170,"labelKey":"oneCup"},{"grams":340,"labelKey":"twoCups"}]
  },
  brazilNuts: {
    fiberByType: { fiber_non_gel_forming: 5.4, fiber_fermentable: 1.5 },
    fiberSubtypeTotals: {
      cellulose: 2.8,
      hemicellulose: 1.6,
      lignin: 1,
      arabinoxylan: 0.35,
      pectin: 0.4,
      beta_glucans: 0.05,
      resistant_starch: 0.2,
      fructooligosaccharides: 0.08,
      galactooligosaccharides: 0.07,
      pectic_oligosaccharides: 0.12,
      mucilage: 0.05,
      inulin: 0.09,
    },
    vitaminsByType: { vitamin_b7: 0.000004 },
    polyphenolByType: {
      polyphenols_total: 420,
      flavonoids_total: 105,
      flavonols: 22,
      quercetin: 1,
      flavanols: 18,
      catechins: 9,
      ellagitannins: 12,
    },
    microbiomeSupport: [
      {
        microbe: 'Roseburia',
        supportLevel: 'medium',
        linkedNutrients: ['fiber_fermentable', 'pectic_oligosaccharides'],
        likelyFoods: ['brazilNuts'],
      },
      {
        microbe: 'Bifidobacterium',
        supportLevel: 'medium',
        linkedNutrients: ['fiber_fermentable', 'polyphenols_total'],
        likelyFoods: ['brazilNuts'],
      },
    ],
    defaultServings: [
      { grams: 5, labelKey: 'oneBrazilNut' },
      { grams: 10, labelKey: 'twoBrazilNuts' },
    ]
  },
  canTuna: {
    aminoAcidsByType: { glutamine: 3800 },
    mineralsByType: { iodine: 0.02 },
    microbiomeSupport: [
      {
        microbe: 'Faecalibacterium',
        supportLevel: 'medium',
        linkedNutrients: ['protein'],
        likelyFoods: ['canTuna'],
      },
    ],
    defaultServings: [{"grams":50},{"grams":100},{"grams":200}]
  },
  chickenBreast: {
    aminoAcidsByType: { glutamine: 4700 },
    mineralsByType: { iodine: 0.004 },
    vitaminsByType: { vitamin_b7: 0.000004 },
    microbiomeSupport: [
      {
        microbe: 'Faecalibacterium',
        supportLevel: 'medium',
        linkedNutrients: ['protein'],
        likelyFoods: ['chickenBreast'],
      },
    ],
    defaultServings: [{"grams":50},{"grams":100},{"grams":200}]
  },
  orange: {
    fiberByType: { fiber_fermentable: 1.2, fiber_gel_forming: 0.8 },
    fiberSubtypeTotals: {
      pectin: 0.9,
      cellulose: 0.8,
      hemicellulose: 0.4,
      resistant_starch: 0.1,
      mucilage: 0.2,
    },
    polyphenolByType: { polyphenols_total: 140, flavonoids_total: 90, flavanols: 35 },
    microbiomeSupport: [
      {
        microbe: 'Faecalibacterium',
        supportLevel: 'medium',
        linkedNutrients: ['fiber_total', 'fiber_fermentable', 'pectin'],
        likelyFoods: ['orange'],
      },
    ],
    defaultServings: [
      { grams: 65, labelKey: 'halfOrange' },
      { grams: 130, labelKey: 'oneOrange' },
      { grams: 260, labelKey: 'twoOranges' },
    ]
  },
  coconutOil: {
    microbiomeSupport: [
      {
        microbe: 'Faecalibacterium',
        supportLevel: 'low',
        linkedNutrients: ['fiber_total'],
        likelyFoods: ['coconutOil'],
      },
    ],
    defaultServings: [{"grams":30},{"grams":60},{"grams":90}]
  },
  coconutWater: {
    fiberByType: { fiber_gel_forming: 0.1, fiber_non_gel_forming: 0.5, fiber_fermentable: 0.4 },
    fiberSubtypeTotals: {
      beta_glucans: 0.01,
      pectin: 0.04,
      psyllium: 0,
      mucilage: 0.05,
      cellulose: 0.25,
      hemicellulose: 0.15,
      lignin: 0.05,
      arabinoxylan: 0.05,
      resistant_starch: 0.03,
      inulin: 0.07,
      fructooligosaccharides: 0.03,
      galactooligosaccharides: 0.02,
      pectic_oligosaccharides: 0.05,
    },
    vitaminsByType: { vitamin_b7: 0.000001 },
    aminoAcidsByType: { glutamine: 9 },
    polyphenolByType: {
      polyphenols_total: 28,
      flavonoids_total: 10,
      flavonols: 3,
      quercetin: 0.2,
      flavanols: 2,
      catechins: 1,
    },
    microbiomeSupport: [
      {
        microbe: 'Roseburia',
        supportLevel: 'low',
        linkedNutrients: ['fiber_fermentable', 'pectic_oligosaccharides'],
        likelyFoods: ['coconutWater'],
      },
      {
        microbe: 'Faecalibacterium',
        supportLevel: 'low',
        linkedNutrients: ['fiber_fermentable'],
        likelyFoods: ['coconutWater'],
      },
    ],
    defaultServings: [{"grams":120,"labelKey":"halfCup"},{"grams":240,"labelKey":"oneCup"},{"grams":480,"labelKey":"twoCups"}]
  },
  cod: {
    aminoAcidsByType: { glutamine: 2600 },
    mineralsByType: { iodine: 0.11 },
    microbiomeSupport: [
      {
        microbe: 'Faecalibacterium',
        supportLevel: 'medium',
        linkedNutrients: ['protein'],
        likelyFoods: ['cod'],
      },
    ],
    defaultServings: [{"grams":50},{"grams":100},{"grams":200}]
  },
  beefShank: {
    aminoAcidsByType: { glutamine: 2400 },
    microbiomeSupport: [
      {
        microbe: 'Faecalibacterium',
        supportLevel: 'low',
        linkedNutrients: ['glycine'],
        likelyFoods: ['beefShank'],
      },
    ],
    defaultServings: [{"grams":50},{"grams":100},{"grams":200}]
  },
  cottageCheese: {
    aminoAcidsByType: { glutamine: 2100 },
    mineralsByType: { iodine: 0.011 },
    defaultServings: [{"grams":50},{"grams":100},{"grams":200}]
  },
  cucumber: {
    fiberByType: { fiber_non_gel_forming: 0.3, fiber_fermentable: 0.2 },
    aminoAcidsByType: { citrulline: 25 },
    defaultServings: [{ grams: 50 }, { grams: 100 }, { grams: 200 }]
  },
  extraVirginOliveOil: {
    calories: 884,
    protein: 0,
    carbohydrates: 0,
    fat: 100,
    fiber: 0,
    polyphenolByType: {
      polyphenols_total: 150,
      phenolic_acids: 40,
      flavonoids_total: 10,
      flavonols: 5,
    },
    vitaminsByType: {
      vitamin_e: 14,
      vitamin_k: 0.0601,
    },
    defaultServings: [{ grams: 7 }, { grams: 14 }, { grams: 28 }],
  },
  fortifiedDairy: {
    calories: 47,
    protein: 3.3,
    carbohydrates: 4.9,
    fat: 1.6,
    fiber: 0.3,
    fiberByType: { fiber_total: 0.3, fiber_non_gel_forming: 0.15, fiber_fermentable: 0.1 },
    aminoAcidsByType: {
      leucine: 320,
      isoleucine: 180,
      valine: 210,
      lysine: 250,
      methionine: 80,
      threonine: 150,
      tryptophan: 50,
      glutamine: 600,
    },
    mineralsByType: {
      calcium: 140,
      iodine: 0.02,
      phosphorus: 100,
      potassium: 170,
      magnesium: 14,
      selenium: 0.003,
      zinc: 0.4,
      sodium: 60,
    },
    vitaminsByType: {
      vitamin_a: 0.05,
      vitamin_d: 0.001,
      vitamin_e: 0.2,
      vitamin_b2: 0.18,
      vitamin_b5: 0.35,
      vitamin_b9: 0.008,
      vitamin_b12: 0.00045,
    },
    microbiomeSupport: [
      {
        microbe: 'Bifidobacterium',
        supportLevel: 'low',
        linkedNutrients: ['fiber_fermentable'],
        likelyFoods: ['fortifiedDairy'],
      },
      {
        microbe: 'Faecalibacterium',
        supportLevel: 'low',
        linkedNutrients: ['protein'],
        likelyFoods: ['fortifiedDairy'],
      },
    ],
    defaultServings: [{"grams":120,"labelKey":"halfCup"},{"grams":240,"labelKey":"oneCup"},{"grams":480,"labelKey":"twoCups"}],
  },
  greekYogurt: {
    aminoAcidsByType: {
      leucine: 950,
      isoleucine: 530,
      valine: 620,
      lysine: 800,
      methionine: 210,
      threonine: 400,
      tryptophan: 100,
      histidine: 260,
      phenylalanine: 490,
      tyrosine: 500,
      glutamine: 1700,
      proline: 850,
      glycine: 200,
    },
    mineralsByType: { iodine: 0.02 },
    defaultServings: [{"grams":50},{"grams":100},{"grams":200}]
  },
  iodizedSeaSalt: {
    calories: 0,
    protein: 0,
    carbohydrates: 0,
    fat: 0,
    fiber: 0,
    mineralsByType: {
      iodine: 0.077,
      sodium: 38758,
      magnesium: 1,
      calcium: 24,
      potassium: 8,
    },
    defaultServings: [{ grams: 3 }, { grams: 6 }, { grams: 12 }],
  },
  kefir: {
    calories: 61,
    protein: 3.5,
    carbohydrates: 4.5,
    fat: 3.3,
    fiber: 0,
    aminoAcidsByType: {
      leucine: 340,
      isoleucine: 190,
      valine: 220,
      lysine: 270,
      methionine: 80,
      threonine: 160,
      phenylalanine: 180,
      tryptophan: 50,
      histidine: 100,
      arginine: 120,
      tyrosine: 170,
      glutamine: 850,
      proline: 400,
      glycine: 80,
    },
    mineralsByType: {
      calcium: 120,
      phosphorus: 95,
      potassium: 150,
      sodium: 55,
      magnesium: 12,
      zinc: 0.45,
      selenium: 0.003,
      iodine: 0.014,
    },
    vitaminsByType: {
      vitamin_a: 0.027,
      vitamin_d: 0.000001,
      vitamin_b1: 0.04,
      vitamin_b2: 0.17,
      vitamin_b3: 0.1,
      vitamin_b5: 0.35,
      vitamin_b6: 0.05,
      vitamin_b9: 0.013,
      vitamin_b12: 0.0004,
    },
    polyphenolByType: {
      polyphenols_total: 9,
      flavonoids_total: 2,
    },
    microbiomeSupport: [
      {
        microbe: 'Lactobacillus',
        supportLevel: 'high',
        linkedNutrients: ['protein'],
        likelyFoods: ['kefir'],
      },
      {
        microbe: 'Bifidobacterium',
        supportLevel: 'medium',
        linkedNutrients: ['protein'],
        likelyFoods: ['kefir'],
      },
    ],
    defaultServings: [{"grams":120,"labelKey":"halfCup"},{"grams":240,"labelKey":"oneCup"},{"grams":480,"labelKey":"twoCups"}],
  },
  kimchi: {
    fiberByType: { fiber_fermentable: 0.8, fiber_non_gel_forming: 0.6 },
    fiberSubtypeTotals: {
      cellulose: 0.35,
      hemicellulose: 0.25,
      lignin: 0.1,
      pectin: 0.45,
      arabinoxylan: 0.08,
      beta_glucans: 0.03,
      resistant_starch: 0.02,
      inulin: 0.08,
      fructooligosaccharides: 0.05,
      galactooligosaccharides: 0.04,
      pectic_oligosaccharides: 0.06,
      mucilage: 0.03,
    },
    vitaminsByType: { vitamin_b5: 0.1, vitamin_b7: 0.000001 },
    mineralsByType: { manganese: 0.08, iodine: 0.001 },
    aminoAcidsByType: {
      leucine: 80,
      isoleucine: 50,
      valine: 60,
      lysine: 70,
      methionine: 10,
      threonine: 40,
      phenylalanine: 40,
      tryptophan: 10,
      histidine: 20,
      arginine: 80,
      cysteine: 10,
      glutamine: 180,
      glycine: 40,
      proline: 40,
      tyrosine: 30,
    },
    polyphenolByType: {
      polyphenols_total: 85,
      flavonoids_total: 35,
      flavonols: 12,
      quercetin: 2,
      flavanols: 6,
      catechins: 3,
      phenolic_acids: 28,
    },
    microbiomeSupport: [
      {
        microbe: 'Lactobacillus',
        supportLevel: 'high',
        linkedNutrients: ['fiber_fermentable', 'polyphenols_total'],
        likelyFoods: ['kimchi'],
      },
      {
        microbe: 'Bifidobacterium',
        supportLevel: 'high',
        linkedNutrients: ['fiber_fermentable', 'pectin'],
        likelyFoods: ['kimchi'],
      },
      {
        microbe: 'Akkermansia muciniphila',
        supportLevel: 'medium',
        linkedNutrients: ['polyphenols_total', 'quercetin'],
        likelyFoods: ['kimchi'],
      },
    ],
    defaultServings: [{"grams":50},{"grams":100},{"grams":200}]
  },
  kiwi: {
    fiberByType: { fiber_fermentable: 1.4, fiber_gel_forming: 0.9, fiber_non_gel_forming: 0.5 },
    fiberSubtypeTotals: {
      pectin: 0.95,
      cellulose: 0.8,
      hemicellulose: 0.45,
      resistant_starch: 0.2,
      inulin: 0.18,
      fructooligosaccharides: 0.05,
      galactooligosaccharides: 0.03,
      pectic_oligosaccharides: 0.06,
      mucilage: 0.04,
      arabinoxylan: 0.08,
      beta_glucans: 0.02,
      lignin: 0.14,
    },
    vitaminsByType: { vitamin_b7: 0.000002 },
    aminoAcidsByType: { glutamine: 130 },
    polyphenolByType: {
      polyphenols_total: 120,
      flavonoids_total: 38,
      flavonols: 12,
      quercetin: 1,
      flavanols: 8,
      catechins: 4,
      phenolic_acids: 24,
    },
    microbiomeSupport: [
      {
        microbe: 'Faecalibacterium',
        supportLevel: 'medium',
        linkedNutrients: ['fiber_fermentable', 'pectin'],
        likelyFoods: ['kiwi'],
      },
      {
        microbe: 'Akkermansia muciniphila',
        supportLevel: 'medium',
        linkedNutrients: ['polyphenols_total', 'flavonoids_total'],
        likelyFoods: ['kiwi'],
      },
    ],
    defaultServings: [{"grams":38,"labelKey":"halfKiwi"},{"grams":76,"labelKey":"oneKiwi"},{"grams":152,"labelKey":"twoKiwis"}]
  },
  chanterelles: {
    fiberByType: { fiber_non_gel_forming: 2.2, fiber_fermentable: 1.2 },
    fiberSubtypeTotals: {
      beta_glucans: 0.4,
      cellulose: 1,
      hemicellulose: 0.8,
    },
    vitaminsByType: { vitamin_c: 0.001 },
    polyphenolByType: {
      phenolic_acids: 12,
      flavonoids_total: 4,
    },
    defaultServings: [{"grams":50},{"grams":100},{"grams":200}]
  },
  liver: {
    aminoAcidsByType: { glutamine: 2700 },
    defaultServings: [{"grams":50},{"grams":100},{"grams":200}]
  },
  pomegranate: {
    fiberByType: { fiber_fermentable: 1.4, fiber_non_gel_forming: 2.2 },
    polyphenolByType: {
      polyphenols_total: 500,
      ellagitannins: 236,
      flavonoids_total: 150,
      phenolic_acids: 50,
    },
    defaultServings: [{"grams":50},{"grams":100},{"grams":200}]
  },
  potatoes: {
    fiberByType: { fiber_fermentable: 0.8, fiber_non_gel_forming: 1.1, fiber_gel_forming: 0.3 },
    fiberSubtypeTotals: {
      resistant_starch: 0.35,
      pectin: 0.25,
      cellulose: 0.55,
      hemicellulose: 0.4,
      lignin: 0.15,
      arabinoxylan: 0.08,
      fructooligosaccharides: 0.05,
      galactooligosaccharides: 0.03,
      pectic_oligosaccharides: 0.04,
      mucilage: 0.03,
      inulin: 0.02,
      beta_glucans: 0.01,
    },
    vitaminsByType: { vitamin_b7: 0.000001 },
    aminoAcidsByType: { glutamine: 350 },
    polyphenolByType: {
      polyphenols_total: 65,
      flavonoids_total: 18,
      flavonols: 5,
      phenolic_acids: 22,
      chlorogenic_acids: 15,
      catechins: 2,
    },
    microbiomeSupport: [
      {
        microbe: 'Roseburia',
        supportLevel: 'medium',
        linkedNutrients: ['resistant_starch', 'fiber_fermentable'],
        likelyFoods: ['potatoes'],
      },
      {
        microbe: 'Faecalibacterium',
        supportLevel: 'medium',
        linkedNutrients: ['resistant_starch', 'fiber_total'],
        likelyFoods: ['potatoes'],
      },
      {
        microbe: 'Bifidobacterium',
        supportLevel: 'low',
        linkedNutrients: ['fiber_fermentable', 'pectin'],
        likelyFoods: ['potatoes'],
      },
    ],
    defaultServings: [{"grams":150},{"grams":300},{"grams":450}]
  },
  raspberries: {
    fiberByType: { fiber_fermentable: 2.3, fiber_gel_forming: 1.7 },
    fiberSubtypeTotals: {
      pectin: 1.7,
      cellulose: 1.2,
      hemicellulose: 0.9,
      resistant_starch: 0.3,
      arabinoxylan: 0.2,
      fructooligosaccharides: 0.1,
      galactooligosaccharides: 0.1,
      pectic_oligosaccharides: 0.2,
      lignin: 0.2,
    },
    vitaminsByType: { vitamin_b7: 0.000002 },
    aminoAcidsByType: { leucine: 80, isoleucine: 50, valine: 60, lysine: 60, threonine: 50, phenylalanine: 50, tryptophan: 10, histidine: 20, arginine: 70, glutamine: 110, glycine: 40, proline: 40, tyrosine: 30 },
    polyphenolByType: {
      polyphenols_total: 650,
      ellagitannins: 280,
      flavonoids_total: 190,
      anthocyanins: 85,
      flavonols: 32,
      catechins: 14,
      quercetin: 3,
      lignans: 0.4,
    },
    microbiomeSupport: [
      {
        microbe: 'Akkermansia muciniphila',
        supportLevel: 'high',
        linkedNutrients: ['ellagitannins', 'polyphenols_total', 'fiber_fermentable'],
        likelyFoods: ['raspberries'],
      },
      {
        microbe: 'Roseburia',
        supportLevel: 'medium',
        linkedNutrients: ['fiber_fermentable', 'pectin', 'pectic_oligosaccharides'],
        likelyFoods: ['raspberries'],
      },
      {
        microbe: 'Bifidobacterium',
        supportLevel: 'medium',
        linkedNutrients: ['fiber_fermentable', 'polyphenols_total'],
        likelyFoods: ['raspberries'],
      },
    ],
    defaultServings: [{"grams":75,"labelKey":"halfCup"},{"grams":150,"labelKey":"oneCup"},{"grams":300,"labelKey":"twoCups"}]
  },
  sardines: {
    aminoAcidsByType: { glutamine: 3100 },
    mineralsByType: { iodine: 0.035 },
    microbiomeSupport: [
      {
        microbe: 'Faecalibacterium',
        supportLevel: 'medium',
        linkedNutrients: ['protein'],
        likelyFoods: ['sardines'],
      },
    ],
    defaultServings: [{"grams":50},{"grams":100},{"grams":200}]
  },
  sauerkraut: {
    fiberByType: { fiber_fermentable: 1.4, fiber_non_gel_forming: 1.2 },
    fiberSubtypeTotals: {
      cellulose: 0.5,
      hemicellulose: 0.35,
      lignin: 0.12,
      pectin: 0.6,
      arabinoxylan: 0.1,
      beta_glucans: 0.04,
      resistant_starch: 0.03,
      inulin: 0.12,
      fructooligosaccharides: 0.07,
      galactooligosaccharides: 0.05,
      pectic_oligosaccharides: 0.08,
      mucilage: 0.04,
    },
    vitaminsByType: { vitamin_b7: 0.000002 },
    mineralsByType: { iodine: 0.0008 },
    aminoAcidsByType: { glutamine: 150 },
    polyphenolByType: {
      polyphenols_total: 95,
      flavonoids_total: 42,
      flavonols: 14,
      quercetin: 2,
      flavanols: 7,
      catechins: 4,
      phenolic_acids: 32,
    },
    microbiomeSupport: [
      {
        microbe: 'Lactobacillus',
        supportLevel: 'high',
        linkedNutrients: ['fiber_fermentable', 'polyphenols_total'],
        likelyFoods: ['sauerkraut'],
      },
      {
        microbe: 'Bifidobacterium',
        supportLevel: 'high',
        linkedNutrients: ['fiber_fermentable', 'pectin', 'fructooligosaccharides'],
        likelyFoods: ['sauerkraut'],
      },
      {
        microbe: 'Akkermansia muciniphila',
        supportLevel: 'medium',
        linkedNutrients: ['polyphenols_total', 'quercetin'],
        likelyFoods: ['sauerkraut'],
      },
    ],
    defaultServings: [{"grams":50},{"grams":100},{"grams":200}]
  },
  sesameSeeds: {
    fiberByType: { fiber_non_gel_forming: 8.5, fiber_fermentable: 2.2 },
    aminoAcidsByType: { glutamine: 3800 },
    vitaminsByType: { vitamin_b7: 0.00001 },
    polyphenolByType: {
      polyphenols_total: 950,
      flavonoids_total: 180,
      flavonols: 38,
      flavanols: 42,
      lignans: 320,
      catechins: 12,
    },
    microbiomeSupport: [
      {
        microbe: 'Roseburia',
        supportLevel: 'medium',
        linkedNutrients: ['fiber_fermentable', 'polyphenols_total'],
        likelyFoods: ['sesameSeeds'],
      },
      {
        microbe: 'Bifidobacterium',
        supportLevel: 'medium',
        linkedNutrients: ['fiber_fermentable', 'lignans'],
        likelyFoods: ['sesameSeeds'],
      },
    ],
    defaultServings: [{"grams":30},{"grams":60},{"grams":90}]
  },
  shiitakeMushrooms: {
    fiberByType: { fiber_fermentable: 1, fiber_non_gel_forming: 1.2 },
    fiberSubtypeTotals: {
      beta_glucans: 0.5,
      cellulose: 0.4,
      hemicellulose: 0.3,
      pectin: 0.1,
      lignin: 0.1,
    },
    aminoAcidsByType: { glutamine: 180 },
    polyphenolByType: {
      polyphenols_total: 35,
      phenolic_acids: 20,
      chlorogenic_acids: 10,
      flavonoids_total: 8,
    },
    microbiomeSupport: [
      {
        microbe: 'Bifidobacterium',
        supportLevel: 'medium',
        linkedNutrients: ['beta_glucans', 'fiber_fermentable'],
        likelyFoods: ['shiitakeMushrooms'],
      },
      {
        microbe: 'Lactobacillus',
        supportLevel: 'medium',
        linkedNutrients: ['beta_glucans', 'fiber_total'],
        likelyFoods: ['shiitakeMushrooms'],
      },
    ],
    defaultServings: [{"grams":30},{"grams":60},{"grams":90}]
  },
  chickenWings: {
    defaultServings: [{"grams":50},{"grams":100},{"grams":200}]
  },
  strawberries: {
    fiberByType: { fiber_fermentable: 0.9, fiber_gel_forming: 0.6 },
    fiberSubtypeTotals: {
      pectin: 0.5,
      cellulose: 0.6,
      hemicellulose: 0.3,
      lignin: 0.1,
      resistant_starch: 0.2,
      inulin: 0.12,
      fructooligosaccharides: 0.05,
      galactooligosaccharides: 0.04,
      pectic_oligosaccharides: 0.06,
      mucilage: 0.04,
      beta_glucans: 0.01,
      arabinoxylan: 0.03,
    },
    vitaminsByType: { vitamin_b7: 0.000004 },
    aminoAcidsByType: { glutamine: 50 },
    polyphenolByType: {
      polyphenols_total: 230,
      ellagitannins: 65,
      flavonoids_total: 115,
      anthocyanins: 75,
      flavonols: 25,
      flavanols: 18,
      catechins: 12,
      quercetin: 2,
      lignans: 0.3,
    },
    microbiomeSupport: [
      {
        microbe: 'Akkermansia muciniphila',
        supportLevel: 'high',
        linkedNutrients: ['anthocyanins', 'polyphenols_total', 'fiber_fermentable'],
        likelyFoods: ['strawberries'],
      },
      {
        microbe: 'Bifidobacterium',
        supportLevel: 'medium',
        linkedNutrients: ['fiber_fermentable', 'pectin', 'polyphenols_total'],
        likelyFoods: ['strawberries'],
      },
      {
        microbe: 'Roseburia',
        supportLevel: 'medium',
        linkedNutrients: ['fiber_fermentable', 'pectic_oligosaccharides'],
        likelyFoods: ['strawberries'],
      },
    ],
    defaultServings: [{"grams":75,"labelKey":"halfCup"},{"grams":150,"labelKey":"oneCup"},{"grams":300,"labelKey":"twoCups"}]
  },
  sunflowerSeeds: {
    fiberByType: { fiber_non_gel_forming: 6.1, fiber_fermentable: 1.8 },
    aminoAcidsByType: { glutamine: 5300 },
    vitaminsByType: { vitamin_b7: 0.000066 },
    polyphenolByType: {
      polyphenols_total: 600,
      flavonoids_total: 130,
      flavonols: 28,
      flavanols: 26,
      lignans: 85,
      phenolic_acids: 190,
      chlorogenic_acids: 120,
    },
    microbiomeSupport: [
      {
        microbe: 'Roseburia',
        supportLevel: 'medium',
        linkedNutrients: ['fiber_fermentable', 'polyphenols_total'],
        likelyFoods: ['sunflowerSeeds'],
      },
      {
        microbe: 'Faecalibacterium',
        supportLevel: 'low',
        linkedNutrients: ['fiber_total'],
        likelyFoods: ['sunflowerSeeds'],
      },
    ],
    defaultServings: [{"grams":30},{"grams":60},{"grams":90}]
  },
  walnuts: {
    fiberByType: { fiber_non_gel_forming: 4.8, fiber_fermentable: 1.4 },
    aminoAcidsByType: { glutamine: 290 },
    vitaminsByType: { vitamin_b7: 0.000019 },
    polyphenolByType: {
      polyphenols_total: 1300,
      ellagitannins: 400,
      flavonoids_total: 120,
      flavonols: 32,
      flavanols: 28,
      catechins: 10,
      phenolic_acids: 220,
    },
    microbiomeSupport: [
      {
        microbe: 'Akkermansia muciniphila',
        supportLevel: 'medium',
        linkedNutrients: ['ellagitannins', 'polyphenols_total'],
        likelyFoods: ['walnuts'],
      },
      {
        microbe: 'Roseburia',
        supportLevel: 'medium',
        linkedNutrients: ['fiber_fermentable', 'polyphenols_total'],
        likelyFoods: ['walnuts'],
      },
    ],
    defaultServings: [{"grams":30,"labelKey":"quarterCup"},{"grams":60,"labelKey":"halfCup"},{"grams":120,"labelKey":"oneCup"}]
  },
  watermelon: {
    fiberByType: { fiber_fermentable: 0.15, fiber_gel_forming: 0.08, fiber_non_gel_forming: 0.17 },
    fiberSubtypeTotals: {
      pectin: 0.1,
      cellulose: 0.12,
      hemicellulose: 0.08,
      resistant_starch: 0.02,
      mucilage: 0.02,
      arabinoxylan: 0.02,
      pectic_oligosaccharides: 0.02,
      fructooligosaccharides: 0.01,
      galactooligosaccharides: 0.01,
      lignin: 0.02,
    },
    aminoAcidsByType: { citrulline: 300, glutamine: 90 },
    vitaminsByType: { vitamin_b7: 0.000001 },
    polyphenolByType: {
      polyphenols_total: 35,
      flavonoids_total: 10,
      flavonols: 3,
      flavanols: 2,
      phenolic_acids: 8,
    },
    microbiomeSupport: [
      {
        microbe: 'Faecalibacterium',
        supportLevel: 'low',
        linkedNutrients: ['fiber_fermentable', 'pectin'],
        likelyFoods: ['watermelon'],
      },
      {
        microbe: 'Akkermansia muciniphila',
        supportLevel: 'low',
        linkedNutrients: ['polyphenols_total'],
        likelyFoods: ['watermelon'],
      },
    ],
    defaultServings: [{"grams":150},{"grams":300},{"grams":450}]
  },
  wheyProtein: {
    calories: 400,
    protein: 80,
    carbohydrates: 8,
    fat: 6,
    fiber: 0,
    aminoAcidsByType: {
      leucine: 8600,
      isoleucine: 5100,
      valine: 4800,
      lysine: 8000,
      methionine: 1800,
      threonine: 5700,
      phenylalanine: 2500,
      tryptophan: 1500,
      histidine: 1400,
      arginine: 1900,
      cysteine: 2000,
      glutamine: 13500,
      glycine: 1300,
      proline: 4800,
      tyrosine: 2300,
    },
    mineralsByType: {
      calcium: 450,
      phosphorus: 300,
      potassium: 500,
      sodium: 250,
      magnesium: 60,
      zinc: 1.3,
      selenium: 0.015,
      iodine: 0.01,
    },
    vitaminsByType: {
      vitamin_b1: 0.2,
      vitamin_b2: 0.9,
      vitamin_b3: 1.1,
      vitamin_b5: 1.6,
      vitamin_b6: 0.25,
      vitamin_b9: 0.05,
      vitamin_b12: 0.0015,
    },
    defaultServings: [{"grams":30},{"grams":60},{"grams":90}],
  },
} satisfies Record<string, Partial<FoodNutrientProfile>>;
