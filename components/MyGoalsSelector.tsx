import React from "react";
import { useTranslation } from "react-i18next";
import { FlatList } from "react-native";

import { useStorage } from "@/app/context/StorageContext";
import AppCard from "@/components/ui/AppCard";
import { Area, areas } from "@/locales/areas";

interface Props {
  readonly onGoalSelected?: (area: Area) => void;
}

export default function MyGoalsSelector({ onGoalSelected }: Props) {
  const { t } = useTranslation(["areas"]);
  const { myGoals, setMyGoals } = useStorage();

  const handlePress = (area: Area) => {
    setMyGoals((prev) =>
      prev.includes(area.id)
        ? prev.filter((id) => id !== area.id)
        : [...prev, area.id]
    );
    onGoalSelected?.(area);
  };

  return (
    <FlatList
      data={areas}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <AppCard
          title={t(`areas:${item.id}.title`)}
          description={t(`areas:${item.id}.description`)}
          isActive={myGoals.includes(item.id)}
          onPress={() => handlePress(item)}
        />
      )}
      contentContainerStyle={{ paddingBottom: 40 }}
    />
  );
}
