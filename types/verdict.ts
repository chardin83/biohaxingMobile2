export enum VerdictValue {
  Interested = "interested",
  StartNow = "startNow",
  WantMore = "wantMore",
  AlreadyWorks = "alreadyWorks",
  NotInterested = "notInterested",
  NoResearch = "noResearch",
  TestedFailed = "testedFailed",
}

export const POSITIVE_VERDICTS: readonly VerdictValue[] = [
  VerdictValue.Interested,
  VerdictValue.StartNow,
  VerdictValue.WantMore,
  VerdictValue.AlreadyWorks,
];

export const NEGATIVE_VERDICTS: readonly VerdictValue[] = [
  VerdictValue.NotInterested,
  VerdictValue.NoResearch,
  VerdictValue.TestedFailed,
];

export const isPositiveVerdict = (v?: VerdictValue) =>
  v ? POSITIVE_VERDICTS.includes(v) : false;

export const isNegativeVerdict = (v?: VerdictValue) =>
  v ? NEGATIVE_VERDICTS.includes(v) : false;

// Om du behöver behålla union-typen
export type VerdictValueUnion = `${VerdictValue}`;