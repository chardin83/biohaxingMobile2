import React from "react";
import { FlatList } from "react-native";
import AppCard from "@/components/ui/AppCard";
import { MainGoal, mainGoals } from "@/locales/mainGoals";
import { useTranslation } from "react-i18next";
import { useStorage } from "@/app/context/StorageContext";

interface Props {
  readonly onGoalSelected?: (goal: MainGoal) => void;
}

export default function MyGoalsSelector({ onGoalSelected }: Props) {
  const { t } = useTranslation(["goals"]);
  const { myGoals, setMyGoals } = useStorage();

  const handlePress = (goal: MainGoal) => {
    setMyGoals((prev) =>
      prev.includes(goal.id)
        ? prev.filter((id) => id !== goal.id)
        : [...prev, goal.id]
    );
    onGoalSelected?.(goal);
  };

  return (
    <FlatList
      data={mainGoals}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <AppCard
          title={t(`goals:${item.id}.title`)}
          description={t(`goals:${item.id}.description`)}
          isActive={myGoals.includes(item.id)}
          onPress={() => handlePress(item)}
        />
      )}
      contentContainerStyle={{ paddingBottom: 40 }}
    />
  );
}
