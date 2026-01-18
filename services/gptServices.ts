// services/gptService.ts
import { t } from "i18next";

import { PlansByCategory } from "@/app/context/StorageContext";
import { GPTResponse } from "@/app/domain/GPTResponse";
import { Message } from "@/app/domain/Message";
import { ENDPOINTS } from "@/config";

export interface AnalysisResponse {
    type: string;
    content?: string;
    confidence?: number;
    match?: boolean;
  }

export interface NutritionAnalysisResponse {
  type: "match_result" | "text" | "nutrition" | "error";
  content?: string;
  match?: boolean;
  confidence?: number;
  uploadedFileId?: string;
  raw?: any;
  nutrition?: {
    protein?: number;
    calories?: number;
    carbohydrates?: number;
    fat?: number;
    fiber?: number;
    [k: string]: any;
  };
  message?: string;
}

type AnalyseParams = {
  uri?: string;
  name?: string;
  type?: string;
  file_base64?: string;
  mime?: string;
  prompt?: string;
  supplement?: string;
};

export const buildSystemPrompt = (
  plans: PlansByCategory,
  shareHealthPlan: boolean
): string => {
  const supplementPlans = plans?.supplements ?? [];

  if (shareHealthPlan && supplementPlans.length > 0) {
    const planSummary = supplementPlans
      .map((plan) =>
        plan.supplements?.length
          ? `🕒 ${plan.prefferedTime}: ${plan.supplements
              .map((s: any) => `${s.name} (${s.quantity}${s.unit})`)
              .join(", ")}`
          : null
      )
      .filter(Boolean)
      .join("\n");

    const prompt = t("prompts:system.withPlanTemplate", { plan: planSummary });

    // ✅ Bekräfta via utskrift
    console.log("[buildSystemPrompt] withPlanTemplate:", prompt);

    return prompt;
  }

  return t("prompts:system.noPlan");
};

export const askGPT = async (messagesToSend: Message[]): Promise<GPTResponse> => {
  const res = await fetch(ENDPOINTS.askAIv2, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: messagesToSend }),
  });

  const text = await res.text();
  return JSON.parse(text) as GPTResponse;
};

export type FileAnalysisParams = {
  uri?: string;
  name?: string;
  type?: string;
  prompt?: string;
  supplement?: string;
  file_base64?: string;
  mime?: string;
};

export async function sendFileToAISupplementAnalysis({
  uri,
  name,
  type,
  prompt,
  supplement,
  file_base64,
  mime,
}: FileAnalysisParams): Promise<AnalysisResponse | any> {
  const fd = new FormData();

  // Om base64 skickas explicit, använd samma format som NutritionAnalyze
  if (file_base64) {
    const raw = file_base64.includes(",") ? file_base64.split(",")[1] : file_base64;
    fd.append("file_base64", raw);
    fd.append("mime", mime ?? (type ?? "image/jpeg"));
  } else if (typeof uri === "string" && uri.startsWith("data:")) {
    // data:<mime>;base64,... -> extrahera base64-delen
    const raw = uri.includes(",") ? uri.split(",")[1] : uri;
    fd.append("file_base64", raw);
    // extrahera mime från data-uri om möjligt
    const match = uri.match(/^data:(.*);base64,/);
    fd.append("mime", mime ?? (match ? match[1] : type ?? "image/jpeg"));
  } else if (uri) {
    // React Native file object
    fd.append(
      "file",
      {
        uri: String(uri),
        name: name ?? `upload_${Date.now()}.jpg`,
        type: type ?? "image/jpeg",
      } as any
    );
  } else {
    throw new Error("No file provided to sendFileToAIAnalysis");
  }

  fd.append("prompt", String(prompt ?? ""));
  if (supplement) fd.append("supplement", String(supplement));

  // Välj endpoint: supplement-specifik eller generell
  //const endpoint = supplement ? ENDPOINTS.handleSupplementCheck : ENDPOINTS.askAIv2;
  const endpoint = ENDPOINTS.handleSupplementCheck;


  const res = await fetch(endpoint, {
    method: "POST",
    body: fd as any,
  });

  const text = await res.text().catch(() => "");
  let rawJson: any = null;
  try {
    rawJson = text ? JSON.parse(text) : null;
  } catch (err) {
    // om ej JSON så kasta med rå text om error, annars returnera text
    if (!res.ok) {
      throw new Error(`Analysis API error: ${res.status} ${text}`);
    }
    return { type: "text", content: text } as AnalysisResponse;
  }

  // Om server returnerar { result: { ... } } så returnera result direkt
  const payload = rawJson && typeof rawJson === "object" && "result" in rawJson ? rawJson.result : rawJson;

  if (!res.ok) {
    const msg = (payload && (payload.message || payload.content)) ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return payload;
}

export async function sendFileToAIAnalysis({
  uri,
  name,
  type,
  prompt,
  supplement,
  file_base64,
  mime,
}: FileAnalysisParams): Promise<AnalysisResponse | any> {
  const fd = new FormData();

  // Om base64 skickas explicit, använd samma format som NutritionAnalyze
  if (file_base64) {
    const raw = file_base64.includes(",") ? file_base64.split(",")[1] : file_base64;
    fd.append("file_base64", raw);
    fd.append("mime", mime ?? (type ?? "image/jpeg"));
  } else if (typeof uri === "string" && uri.startsWith("data:")) {
    // data:<mime>;base64,... -> extrahera base64-delen
    const raw = uri.includes(",") ? uri.split(",")[1] : uri;
    fd.append("file_base64", raw);
    // extrahera mime från data-uri om möjligt
    const match = uri.match(/^data:(.*);base64,/);
    fd.append("mime", mime ?? (match ? match[1] : type ?? "image/jpeg"));
  } else if (uri) {
    // React Native file object
    fd.append(
      "file",
      {
        uri: String(uri),
        name: name ?? `upload_${Date.now()}.jpg`,
        type: type ?? "image/jpeg",
      } as any
    );
  } else {
    throw new Error("No file provided to sendFileToAIAnalysis");
  }

  fd.append("prompt", String(prompt ?? ""));
  fd.append("validationSpec", "verifiera att bilden visar " + (supplement ?? "HRV"));
  fd.append("task", String(prompt ?? ""));
  if (supplement) fd.append("supplement", String(supplement));

  // Välj endpoint: supplement-specifik eller generell
  //const endpoint = supplement ? ENDPOINTS.handleSupplementCheck : ENDPOINTS.askAIv2;
  const endpoint = ENDPOINTS.handleAnalyze;

  // innan fetch
  console.log("[sendFileToAIAnalysis] sending to endpoint:", endpoint, {
    fileProvided: !!(file_base64 || uri),
    uri,
    name,
    type,
    file_base64_present: !!file_base64,
    prompt,
    supplement,
    validationSpec: fd.get("validationSpec"),
    task: fd.get("task"),
  });

  const res = await fetch(endpoint, {
    method: "POST",
    body: fd as any,
  });

  const text = await res.text().catch(() => "");
  console.log("[sendFileToAIAnalysis] RAW RESPONSE text:", text);
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (err) {
    // om ej JSON så kasta med rå text
    if (!res.ok) {
      throw new Error(`Analysis API error: ${res.status} ${text}`);
    }
    return { type: "text", content: text } as AnalysisResponse;
  }

  if (!res.ok) {
    const msg = (json && (json.message || json.content)) ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return json;
}


export async function NutritionAnalyze(params: AnalyseParams): Promise<NutritionAnalysisResponse> {
  const form = new FormData();

  if (params.file_base64) {
    const raw = params.file_base64.includes(",") ? params.file_base64.split(",")[1] : params.file_base64;
    form.append("file_base64", raw);
    form.append("mime", params.mime ?? "image/jpeg");
  } else if (params.uri) {
    // @ts-ignore - React Native file object
    form.append("file", {
      uri: params.uri,
      name: params.name ?? `upload_${Date.now()}.jpg`,
      type: params.type ?? "image/jpeg",
    } as any);
  } else {
    throw new Error("No file data provided to NutritionAnalyze");
  }

  form.append("prompt", params.prompt ?? "");
  form.append("supplement", params.supplement ?? "");

  const resp = await fetch(ENDPOINTS.handleNutritionCheck, {
    method: "POST",
    body: form as any, // don't set Content-Type
  });

  const text = await resp.text();
  let json: NutritionAnalysisResponse | null = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (err) {
    throw new Error(`Invalid JSON from server: ${text}`);
  }

  if (!resp.ok) {
    const msg = (json && (json.message || json.content)) ?? `HTTP ${resp.status}`;
    throw new Error(msg);
  }

  return json!;
}
