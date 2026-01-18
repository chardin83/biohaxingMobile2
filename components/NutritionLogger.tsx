import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useStorage } from "@/app/context/StorageContext";
import { colors } from "@/app/theme/styles";
import { Colors } from "@/constants/Colors";
import { NutritionAnalyze } from "@/services/gptServices";

import ImagePickerButton from "./ImagePickerButton";

interface NutritionLoggerProps {
  selectedDate: string;
}

const NutritionLogger: React.FC<NutritionLoggerProps> = ({ selectedDate }) => {
  const { t } = useTranslation();
  const { dailyNutritionSummaries, setDailyNutritionSummaries } = useStorage();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  // Ny: hantera lokal fil från ImagePickerButton via NutritionAnalyze
  const handleImageSelected = async (file: { uri: string; name: string; type: string }) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const data = await NutritionAnalyze({
        uri: file.uri,
        name: file.name,
        type: file.type,
        prompt: "nutrition_analysis", // valfri prompt, kan anpassas
      });

      // Försök plocka ut strukturerad nutrition-data från responsen
      let analysis: {
        protein: number;
        calories: number;
        carbohydrates: number;
        fat: number;
        fiber: number;
      } | null = null;

      if (data?.nutrition && typeof data.nutrition === "object") {
        analysis = {
          protein: Number(data.nutrition.protein ?? 0),
          calories: Number(data.nutrition.calories ?? 0),
          carbohydrates: Number(data.nutrition.carbohydrates ?? data.nutrition.carbs ?? 0),
          fat: Number(data.nutrition.fat ?? 0),
          fiber: Number(data.nutrition.fiber ?? 0),
        };
      } else if (data?.raw && typeof data.raw === "object") {
        // fallback if server returns macros under raw
        const raw = data.raw;
        analysis = {
          protein: Number(raw.protein ?? raw.macros?.protein ?? 0),
          calories: Number(raw.calories ?? raw.macros?.calories ?? 0),
          carbohydrates: Number(raw.carbohydrates ?? raw.macros?.carbohydrates ?? raw.macros?.carbs ?? 0),
          fat: Number(raw.fat ?? raw.macros?.fat ?? 0),
          fiber: Number(raw.fiber ?? raw.macros?.fiber ?? 0),
        };
      } else if (data?.content) {
        // försök parse JSON från content
        try {
          const parsed = JSON.parse(data.content);
          if (parsed?.protein || parsed?.calories) {
            analysis = {
              protein: Number(parsed.protein ?? 0),
              calories: Number(parsed.calories ?? 0),
              carbohydrates: Number(parsed.carbohydrates ?? parsed.carbs ?? 0),
              fat: Number(parsed.fat ?? 0),
              fiber: Number(parsed.fiber ?? 0),
            };
          }
        } catch {
          // inget JSON — visa textinnehåll för användaren
        }
      }

      if (!analysis) {
        // Om vi inte fick strukturerad data, visa textinnehåll eller generellt meddelande
        const text = data?.content ?? t("dayEdit.analysisNoStructuredData") ?? "Ingen strukturerad näringsdata hittades.";
        setAnalysisResult(typeof text === "string" ? text : JSON.stringify(text));
        return;
      }

      // Uppdatera storage med verklig analys
      setDailyNutritionSummaries((prev) => {
        const existing = prev[selectedDate]?.meals ?? [];
        const newMeal = { date: selectedDate, ...analysis };
        const updatedMeals = [...existing, newMeal];

        const totals = updatedMeals.reduce(
          (acc, m) => ({
            protein: acc.protein + (m.protein ?? 0),
            calories: acc.calories + (m.calories ?? 0),
            carbohydrates: acc.carbohydrates + (m.carbohydrates ?? 0),
            fat: acc.fat + (m.fat ?? 0),
            fiber: acc.fiber + (m.fiber ?? 0),
          }),
          { protein: 0, calories: 0, carbohydrates: 0, fat: 0, fiber: 0 }
        );

        return {
          ...prev,
          [selectedDate]: {
            date: selectedDate,
            meals: updatedMeals,
            totals,
            goalsMet: {
              protein: totals.protein >= 100,
              calories: totals.calories >= 2000,
              carbohydrates: totals.carbohydrates >= 250,
              fat: totals.fat >= 70,
              fiber: totals.fiber >= 25,
            },
          },
        };
      });

      setAnalysisResult("✅ Måltid loggad och analyserad!");
    } catch (err) {
      console.error("Error analyzing image:", err);
      setAnalysisResult(t("dayEdit.analysisFailed") ?? "❌ Misslyckades med att analysera bilden.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const summary = dailyNutritionSummaries[selectedDate];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <ImagePickerButton
          onImageSelected={handleImageSelected}
          isLoading={isAnalyzing}
          label={t("dayEdit.pickImage")}
        />
        {analysisResult && <Text style={styles.result}>{analysisResult}</Text>}

        <Text style={styles.label}>{t("dayEdit.logMeal")}</Text>
        {summary && (
          <View style={styles.summaryContainer}>
            <Text style={styles.label}>{t("dayEdit.nutritionSummary")}</Text>
            <Text style={styles.summaryText}>
              🍗 Protein: {summary.totals.protein} g
            </Text>
            <Text style={styles.summaryText}>
              🔥 Kalorier: {summary.totals.calories} kcal
            </Text>
            <Text style={styles.summaryText}>
              🍞 Kolhydrater: {summary.totals.carbohydrates} g
            </Text>
            <Text style={styles.summaryText}>
              🥑 Fett: {summary.totals.fat} g
            </Text>
            <Text style={styles.summaryText}>
              🌾 Fibrer: {summary.totals.fiber} g
            </Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    marginTop: 20,
    fontWeight: "bold",
    color: colors.text,
  },
  result: {
    marginTop: 20,
    fontSize: 16,
    color: Colors.dark.text,
  },
  summaryContainer: {
    padding: 15,
    backgroundColor: Colors.dark.secondary,
    borderRadius: 8,
  },
  summaryText: {
    fontSize: 15,
    color: Colors.dark.text,
    marginBottom: 6,
  },
});

export default NutritionLogger;
