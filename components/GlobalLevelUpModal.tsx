import { useTranslation } from "react-i18next";
import { ThemedModal } from "./ThemedModal";
import { Text } from "react-native";
import { useStorage } from "@/app/context/StorageContext";

export default function GlobalLevelUpModal() {
  const { t } = useTranslation(["levels"]);
  const { levelUpModalVisible, setLevelUpModalVisible, newLevelReached } =
    useStorage();

  if (!levelUpModalVisible || !newLevelReached) return null;

  return (
    <ThemedModal
      visible={levelUpModalVisible}
      title={t("levelUp.title")}
      okLabel={t("common:ok")}
      onSave={() => setLevelUpModalVisible(false)}
      showCancelButton={false}
    >
      <Text style={{ color: "white", textAlign: "center", fontSize: 18 }}>
        {t(`${newLevelReached}`)} ({t("levelUp.level")} {newLevelReached})
      </Text>
    </ThemedModal>
  );
}
