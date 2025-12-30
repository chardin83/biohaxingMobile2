export const AIPrompts = {
  insights: {
    studies: (tipInfo: string) => `Find relevant scientific studies about the following topic. For each study, provide:
- Study title
- Lead author(s) and year
- Journal/publication
- Key findings
- Sample size if available
- DOI or link if possible

Topic: ${tipInfo}

Please provide at least 3-5 relevant studies if available.`,

    experts: (tipInfo: string) => `List influential experts, researchers, doctors, or thought leaders who are actively discussing this topic. For each person, provide:
- Name and credentials
- Their main contribution or perspective
- Notable publications or talks
- Social media or website if relevant

Topic: ${tipInfo}

Please list at least 3-5 key experts in this field.`,

    risks: (tipInfo: string) => `Analyze potential risks, side effects, or contraindications associated with this practice. Include:
- Known risks backed by research
- Potential interactions or contraindications
- Populations who should be cautious
- Safety recommendations
- Severity of risks (mild, moderate, severe)

Topic: ${tipInfo}

Be thorough but balanced in presenting risks.`,
  },

  chat: {
    welcome: "chat.welcomeMessage",
    introPrompt: (goal: string, supplements: string) => 
      `I want to achieve: ${goal}\nI'm considering these supplements: ${supplements}\n\nCan you help me create an optimal plan?`,
  },

  analysis: {
    fileAnalysis: (prompt: string, supplementName?: string) => 
      supplementName 
        ? `${prompt}\n\nSupplement to verify: ${supplementName}`
        : prompt,
  },
} as const;

export type AIPromptKey = keyof typeof AIPrompts;