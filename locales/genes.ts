// genes.ts

export type GeneArea = {
  id: string;
  descriptionKey: string;
};

export type Gene = {
  id: string;
  titleKey: string;
  areas: GeneArea[];
};


export const genes: Gene[] = [
  {
    id: "MTHFR",
    titleKey: "MTHFR.title",
    areas: [
      { id: "energy", descriptionKey: "MTHFR.areas.energy" },
      { id: "cardioFitness", descriptionKey: "MTHFR.areas.cardioFitness" },
      { id: "strength", descriptionKey: "MTHFR.areas.strength" },
      { id: "digestiveHealth", descriptionKey: "MTHFR.areas.digestiveHealth" }
    ]
  },
  {
    id: "PGC1A",
    titleKey: "PGC1A.title",
    areas: [
      { id: "energy", descriptionKey: "PGC1A.areas.energy" },
      { id: "cardioFitness", descriptionKey: "PGC1A.areas.cardioFitness" },
      { id: "strength", descriptionKey: "PGC1A.areas.strength" }
    ]
  },
  {
    id: "SIRT1_SIRT3",
    titleKey: "SIRT1_SIRT3.title",
    areas: [
      { id: "energy", descriptionKey: "SIRT1_SIRT3.areas.energy" }
    ]
  },
  {
    id: "NRF1_NRF2",
    titleKey: "NRF1_NRF2.title",
    areas: [
      { id: "energy", descriptionKey: "NRF1_NRF2.areas.energy" }
    ]
  },
  {
    id: "UCP2_UCP3",
    titleKey: "UCP2_UCP3.title",
    areas: [
      { id: "energy", descriptionKey: "UCP2_UCP3.areas.energy" }
    ]
  },
  {
    id: "MT_ND1_MT_CO1",
    titleKey: "MT_ND1_MT_CO1.title",
    areas: [
      { id: "energy", descriptionKey: "MT_ND1_MT_CO1.areas.energy" }
    ]
  },
  {
    id: "ACE",
    titleKey: "ACE.title",
    areas: [
      { id: "cardioFitness", descriptionKey: "ACE.areas.cardioFitness" },
      { id: "strength", descriptionKey: "ACE.areas.strength" }
    ]
  },
  {
    id: "ACTN3",
    titleKey: "ACTN3.title",
    areas: [
      { id: "cardioFitness", descriptionKey: "ACTN3.areas.cardioFitness" },
      { id: "strength", descriptionKey: "ACTN3.areas.strength" }
    ]
  },
  {
    id: "NOS3",
    titleKey: "NOS3.title",
    areas: [
      { id: "cardioFitness", descriptionKey: "NOS3.areas.cardioFitness" }
    ]
  },
  {
    id: "ADRB2",
    titleKey: "ADRB2.title",
    areas: [
      { id: "cardioFitness", descriptionKey: "ADRB2.areas.cardioFitness" }
    ]
  },
  {
    id: "MSTN",
    titleKey: "MSTN.title",
    areas: [
      { id: "strength", descriptionKey: "MSTN.areas.strength" }
    ]
  },
  {
    id: "IGF1",
    titleKey: "IGF1.title",
    areas: [
      { id: "strength", descriptionKey: "IGF1.areas.strength" }
    ]
  },
  {
    id: "FUT2",
    titleKey: "FUT2.title",
    areas: [
      { id: "digestiveHealth", descriptionKey: "FUT2.areas.digestiveHealth" }
    ]
  },
  {
    id: "LCT",
    titleKey: "LCT.title",
    areas: [
      { id: "digestiveHealth", descriptionKey: "LCT.areas.digestiveHealth" }
    ]
  },
  {
    id: "HLA_DQ2_DQ8",
    titleKey: "HLA_DQ2_DQ8.title",
    areas: [
      { id: "digestiveHealth", descriptionKey: "HLA_DQ2_DQ8.areas.digestiveHealth" }
    ]
  },
  {
    id: "MUC2",
    titleKey: "MUC2.title",
    areas: [
      { id: "digestiveHealth", descriptionKey: "MUC2.areas.digestiveHealth" }
    ]
  },
  {
    id: "ALDH2",
    titleKey: "ALDH2.title",
    areas: [
      { id: "digestiveHealth", descriptionKey: "ALDH2.areas.digestiveHealth" }
    ]
  }
];
