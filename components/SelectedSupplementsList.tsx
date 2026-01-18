import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text,View } from "react-native";

import { Supplement } from "@/app/domain/Supplement";
import { SupplementTime } from "@/app/domain/SupplementTime";
import { Colors } from "@/constants/Colors";

import SupplementItem from "./SupplementItem";

interface SelectedSupplementsListProps {
  supplements: SupplementTime[];
  selectedDate: string;
  deleteSupplement: (supplement: string, time: string) => void;
  editSupplement: (supplement: string, time: string) => void;
}

const SelectedSupplementsList: React.FC<SelectedSupplementsListProps> = ({
  supplements,
  selectedDate,
  deleteSupplement,
  editSupplement,
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.selectedItemsContainer}>
      <Text style={styles.subLabel}>
        {t("selectedSupplementList.choosenFor")} {""}
        {selectedDate}:
      </Text>

      {Object.entries(
        supplements.reduce(
          (grouped: Record<string, Supplement[]>, supplement) => {
            const { time } = supplement;
            if (!grouped[time]) {
              grouped[time] = [];
            }
            grouped[time].push(supplement);
            return grouped;
          },
          {}
        )
      )
        // Sort times in ascending order
        .sort(([timeA], [timeB]) => {
          const [hoursA, minutesA] = timeA.split(":").map(Number);
          const [hoursB, minutesB] = timeB.split(":").map(Number);
          return hoursA - hoursB || minutesA - minutesB;
        })
        .map(([time, supplementNames]) => (
          <View key={time} style={{ paddingBottom: 20 }}>
            <Text style={styles.timeLabel}>{time}:</Text>
            {supplementNames.map((supplement) => (
              <SupplementItem
                key={`${time}-${supplement.name}`}
                planName={`${time}`}
                supplement={supplement}
                onRemoveSupplement={deleteSupplement}
                onEditSupplement={editSupplement}
              />
            ))}
          </View>
        ))}
    </View>
  );
};

const styles = StyleSheet.create({
  selectedItemsContainer: {
    marginHorizontal: 0,
    marginBottom: 10,
  },
  subLabel: {
    fontSize: 14,
    marginTop: 20,
    marginBottom: 10,
    fontWeight: "bold",
    color: Colors.dark.textWhite,
  },
  timeLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: Colors.dark.primary, // Darker color for better contrast
  },
});

export default SelectedSupplementsList;
