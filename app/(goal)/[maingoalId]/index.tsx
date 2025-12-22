import React from "react";
import { useLocalSearchParams } from "expo-router";
import SleepOverview from "./sleepOverview";
import ImmuneOverview from "./immuneOverview";
import CardioOverview from "./cardioOverview";
import DigestiveOverview from "./digestiveOverview";
import NervousSystemOverview from "./nervousSystemOverview";
import MusclePerformanceOverview from "./musclePerformanceOverview";
import EnergyOverview from "./energyOverview";

export default function GoalRootScreen() {
  const { mainGoalId } = useLocalSearchParams<{ mainGoalId: string }>();

  switch (mainGoalId) {
    case "sleep":
      return <SleepOverview/>;
    case "energy":
      return <EnergyOverview />;
    case "recovery":
      return <SleepOverview />;
    case "immuneSupport":
      return <ImmuneOverview />;
    case "cardioFitness":
      return <CardioOverview />;
      case "digestiveHealth":
      return <DigestiveOverview />;
      case "nervousSystem":
      return <NervousSystemOverview />;
      case "musclePerformance":
      return <MusclePerformanceOverview />;
    default:
      return <SleepOverview />; // eller en "Not found"
  }
}
