import React from "react";
import { SafeAreaView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import BackButton from "@/components/BackButton";
import NervousSystemOverview from "./nervousSystemOverview";
import SleepOverview from "./sleepOverview";
import EnergyOverview from "./energyOverview";
import MusclePerformanceOverview from "./musclePerformanceOverview";
import CardioOverview from "./cardioOverview";
import DigestiveOverview from "./digestiveOverview";
import ImmuneOverview from "./immuneOverview";

export default function GoalRootScreen() {
  const { mainGoalId } = useLocalSearchParams<{ mainGoalId: string }>();

  return (
    <LinearGradient colors={["#071526", "#040B16"]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <BackButton onPress={() => router.push("/(tabs)/dashboard")} />

        {mainGoalId === "nervousSystem" && <NervousSystemOverview mainGoalId={mainGoalId} />}
        {mainGoalId === "sleep" && <SleepOverview mainGoalId={mainGoalId} />}
        {mainGoalId === "energy" && <EnergyOverview mainGoalId={mainGoalId} />}
        {mainGoalId === "recovery" && <MusclePerformanceOverview mainGoalId={mainGoalId} />}
        {mainGoalId === "cardioFitness" && <CardioOverview mainGoalId={mainGoalId} />}
        {mainGoalId === "digestiveHealth" && <DigestiveOverview mainGoalId={mainGoalId} />}
        {mainGoalId === "immuneSupport" && <ImmuneOverview mainGoalId={mainGoalId} />}
      </SafeAreaView>
    </LinearGradient>
  );
}
