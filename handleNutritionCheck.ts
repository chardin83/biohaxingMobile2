import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

import { handleNutritionAnalyze } from "./handleNutritionAnalyze";

export async function nutritionEntryPoint(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return {
        status: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "error", message: "Only multipart/form-data is supported." }),
      };
    }

    const form = await request.formData();
    const file = form.get("file") as unknown as File | undefined;
    const ingredientListFile = form.get("ingredient_list_file") as unknown as File | undefined;
    const prompt = form.get("prompt")?.toString() ?? "";
    const mealDescription = form.get("mealDescription")?.toString() ?? "";
    const supplement = form.get("supplement")?.toString() ?? "";
    const rawLocale = form.get("locale")?.toString() ?? "";
    const locale: "sv" | "en" = rawLocale === "en" ? "en" : "sv";
    const ingredientListBase64 = form.get("ingredient_list_base64")?.toString() ?? "";
    const ingredientListMime = form.get("ingredient_list_mime")?.toString() ?? "";
    const trackingTargetsRaw = form.get("trackingTargets")?.toString() ?? form.get("weeklyTrackingTargets")?.toString();
    // Log input for debugging
    console.log('[nutritionEntryPoint] trackingTargetsRaw:', trackingTargetsRaw);

    let trackingTargets: Array<{ key: string; unit: "items" | "count"; amount?: number; aiInstruction?: string }> | undefined;
    if (trackingTargetsRaw) {
      try {
        const parsed = JSON.parse(trackingTargetsRaw);
        if (Array.isArray(parsed)) {
          trackingTargets = parsed
            .filter((item: any) => item && typeof item.key === "string" && (item.unit === "items" || item.unit === "count"))
            .map((item: any) => ({
              key: item.key.trim(),
              unit: item.unit,
              amount: typeof item.amount === "number" ? item.amount : undefined,
              aiInstruction: typeof item.aiInstruction === "string" ? item.aiInstruction : undefined,
            }))
            .filter(item => item.key.length > 0);
        }
        // Log output for debugging
        console.log('[nutritionEntryPoint] trackingTargets:', trackingTargets);
      } catch (e) {
        console.log('[nutritionEntryPoint] trackingTargets parse error:', e);
        trackingTargets = undefined;
      }
    }

    if (!file) {
      return {
        status: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "error", message: "No file attached." }),
      };
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const ingredientListBuffer = ingredientListFile
      ? Buffer.from(await ingredientListFile.arrayBuffer())
      : undefined;

    const messages = [
      {
        role: "system",
        content:
          "You analyze meal images and return structured nutrition data via function_call where possible.",
      },
    ];

    const result = await handleNutritionAnalyze(messages, {
      rawBuffer: fileBuffer,
      mime: file.type || "image/jpeg",
      filename: file.name || undefined,
      ingredientListRawBuffer: ingredientListBuffer,
      ingredientListBase64: ingredientListBase64 || undefined,
      ingredientListMime: ingredientListMime || ingredientListFile?.type || undefined,
      mealDescription: mealDescription || undefined,
      prompt,
      supplement,
      locale,
      trackingTargets,
    });

    return {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    };
  } catch (err: any) {
    const message = err?.message ?? "Error in nutrition entry.";
    context.error("nutrition-entry error:", message);

    return {
      status: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "error", message }),
    };
  }
}

app.http("handleNutritionCheck", {
  methods: ["POST"],
  authLevel: "function",
  handler: nutritionEntryPoint,
});
