// microbiome.ts

export type MicrobiomeArea = {
  id: string;
  descriptionKey: string;
};

export type MicrobiomeBacteria = {
  id: string;
  titleKey: string;
  areas: MicrobiomeArea[];
};

export const microbiome: MicrobiomeBacteria[] = [
  {
    id: "Bifidobacterium",
    titleKey: "Bifidobacterium.title",
    areas: [
      { id: "digestiveHealth", descriptionKey: "Bifidobacterium.areas.digestiveHealth" },
      { id: "immune", descriptionKey: "Bifidobacterium.areas.immune" }
    ]
  },
  {
    id: "Lactobacillus",
    titleKey: "Lactobacillus.title",
    areas: [
      { id: "digestiveHealth", descriptionKey: "Lactobacillus.areas.digestiveHealth" },
      { id: "immune", descriptionKey: "Lactobacillus.areas.immune" }
    ]
  },
  {
    id: "Akkermansia",
    titleKey: "Akkermansia.title",
    areas: [
      { id: "digestiveHealth", descriptionKey: "Akkermansia.areas.digestiveHealth" },
      { id: "longevity", descriptionKey: "Akkermansia.areas.longevity" }
    ]
  },
  {
    id: "Gordonibacter",
    titleKey: "Gordonibacter.title",
    areas: [
      { id: "digestiveHealth", descriptionKey: "Gordonibacter.areas.digestiveHealth" },
      { id: "energy", descriptionKey: "Gordonibacter.areas.energy" }
    ]
  },
  {
    id: "Roseburia",
    titleKey: "Roseburia.title",
    areas: [
      { id: "digestiveHealth", descriptionKey: "Roseburia.areas.digestiveHealth" },
      { id: "strength", descriptionKey: "Roseburia.areas.strength" },
      { id: "cardioFitness", descriptionKey: "Roseburia.areas.cardioFitness" }
    ]
  },
  {
    id: "Ruminococcus",
    titleKey: "Ruminococcus.title",
    areas: [
      { id: "digestiveHealth", descriptionKey: "Ruminococcus.areas.digestiveHealth" }
    ]
  },
  {
    id: "Prevotella",
    titleKey: "Prevotella.title",
    areas: [
      { id: "digestiveHealth", descriptionKey: "Prevotella.areas.digestiveHealth" }
    ]
  },
  {
    id: "Lawsinobacter asaccharolyticus",
    titleKey: "Lawsinobacter_asaccharolyticus.title",
    areas: [
      { id: "digestiveHealth", descriptionKey: "Lawsinobacter_asaccharolyticus.areas.digestiveHealth" }
    ]
  },
  {
    id: "Faecalibacterium",
    titleKey: "Faecalibacterium.title",
    areas: [
      { id: "digestiveHealth", descriptionKey: "Faecalibacterium.areas.digestiveHealth" }
    ]
  },
  {
    id: "Veillonella atypica",
    titleKey: "Veillonella_atypica.title",
    areas: [
      { id: "cardioFitness", descriptionKey: "Veillonella_atypica.areas.cardioFitness" }
    ]
  },
];
