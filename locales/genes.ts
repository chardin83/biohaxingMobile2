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
      { id: "digestiveHealth", descriptionKey: "HLA_DQ2_DQ8.areas.digestiveHealth" },
      { id: "immune", descriptionKey: "HLA_DQ2_DQ8.areas.immune" }
    ]
  },
  {
    id: "IFNG",
    titleKey: "IFNG.title",
    areas: [
      { id: "immune", descriptionKey: "IFNG.areas.immune" }
    ]
  },
  {
    id: "IL6",
    titleKey: "IL6.title",
    areas: [
      { id: "immune", descriptionKey: "IL6.areas.immune" }
    ]
  },
  {
    id: "IL10",
    titleKey: "IL10.title",
    areas: [
      { id: "immune", descriptionKey: "IL10.areas.immune" }
    ]
  },
  {
    id: "TNF",
    titleKey: "TNF.title",
    areas: [
      { id: "immune", descriptionKey: "TNF.areas.immune" }
    ]
  },
  {
    id: "TLR2",
    titleKey: "TLR2.title",
    areas: [
      { id: "immune", descriptionKey: "TLR2.areas.immune" }
    ]
  },
  {
    id: "TLR4",
    titleKey: "TLR4.title",
    areas: [
      { id: "immune", descriptionKey: "TLR4.areas.immune" }
    ]
  },
  {
    id: "MBL2",
    titleKey: "MBL2.title",
    areas: [
      { id: "immune", descriptionKey: "MBL2.areas.immune" }
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
  ,
  {
    id: "PER1",
    titleKey: "PER1.title",
    areas: [
      { id: "sleepQuality", descriptionKey: "PER1.areas.sleepQuality" }
    ]
  },
  {
    id: "PER2",
    titleKey: "PER2.title",
    areas: [
      { id: "sleepQuality", descriptionKey: "PER2.areas.sleepQuality" }
    ]
  },
  {
    id: "CLOCK",
    titleKey: "CLOCK.title",
    areas: [
      { id: "sleepQuality", descriptionKey: "CLOCK.areas.sleepQuality" }
    ]
  },
  {
    id: "ADA",
    titleKey: "ADA.title",
    areas: [
      { id: "sleepQuality", descriptionKey: "ADA.areas.sleepQuality" }
    ]
  },
  {
    id: "MTNR1B",
    titleKey: "MTNR1B.title",
    areas: [
      { id: "sleepQuality", descriptionKey: "MTNR1B.areas.sleepQuality" }
    ]
  },
  {
    id: "BDNF",
    titleKey: "BDNF.title",
    areas: [
      { id: "sleepQuality", descriptionKey: "BDNF.areas.sleepQuality" },
      { id: "strength", descriptionKey: "BDNF.areas.strength" },
      { id: "nervousSystem", descriptionKey: "BDNF.areas.nervousSystem" }
    ]
  },
  {
    id: "COMT",
    titleKey: "COMT.title",
    areas: [
      { id: "sleepQuality", descriptionKey: "COMT.areas.sleepQuality" },
      { id: "nervousSystem", descriptionKey: "COMT.areas.nervousSystem" }
    ]
  }
];
