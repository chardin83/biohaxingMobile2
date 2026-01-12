export const AIPrompts = {
  insights: {
    studies: (tipInfo: string, t: (key: string) => string) =>
      `${t("prompts:assistant.whatStudiesExist")}\n\n${tipInfo}`,

    experts: (tipInfo: string, t: (key: string) => string) =>
      `${t("prompts:assistant.whoAreTheExperts")}\n\n${tipInfo}`,

    risks: (tipInfo: string, t: (key: string) => string) =>
      `${t("prompts:assistant.whatAreTheRisks")}\n\n${tipInfo}`,
  },
} as const;

// type NestedKeyOf<ObjectType extends object> = {
//   [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
//     ? `${Key}.${NestedKeyOf<ObjectType[Key]>}`
//     : `${Key}`;
// }[keyof ObjectType & (string | number)];

// export type AIPromptKey = NestedKeyOf<typeof AIPrompts>;

export type AIPromptKey =
  | "insights.studies"
  | "insights.experts"
  | "insights.risks"
  | "chat.welcome"
  | "chat.introPrompt"
  | "analysis.fileAnalysis";