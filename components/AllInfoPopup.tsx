import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useSession } from "@/app/context/SessionStorage";
import { useStorage } from "@/app/context/StorageContext";
import { borders } from "@/app/theme/styles";
import { Colors } from "@/constants/Colors";

const AIInfoPopup: React.FC = () => {
  const {
    hasVisitedChat,
    setHasVisitedChat,
    shareHealthPlan,
    setShareHealthPlan,
  } = useStorage();
  const [visible, setVisible] = useState(false);
  const [healthPlanEnabled, setHealthPlanEnabled] = useState(false);
  const { forceOpenPopup, setForceOpenPopup } = useSession();

  useEffect(() => {
    if (forceOpenPopup) {
      setVisible(true);
      setForceOpenPopup(false);
    }
  }, [forceOpenPopup]);

  // Kontrollera om popup ska visas första gången
  useEffect(() => {
    const checkFirstVisit = async () => {
      if (!hasVisitedChat) {
        setVisible(true);
        setHasVisitedChat(true);
      }
    };
    checkFirstVisit();
  }, []);

  useEffect(() => {
    const loadStoredPrefs = async () => {
      if (shareHealthPlan) {
        setHealthPlanEnabled(true);
      }
    };
    loadStoredPrefs();
  }, []);

  useEffect(() => {
    const savePrefs = async () => {
      setShareHealthPlan(!!healthPlanEnabled);
    };
    savePrefs();
  }, [healthPlanEnabled]);

  const handleClose = () => {
    setVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        style={styles.iconButton}
      >
        <MaterialCommunityIcons
          name="shield-check-outline"
          size={24}
          color={Colors.dark.text}
        />
      </TouchableOpacity>

      {visible && (
        <Modal
          visible
          transparent
          animationType="slide"
          onRequestClose={handleClose}
        >
          <View style={styles.backdrop}>
            <View style={styles.modal}>
              <Text style={styles.title}>🤖 Dina AI-delningar</Text>

              <Text style={styles.desc}>
                Välj vilken information AI:n får använda för att ge dig
                personliga hälsoråd:
              </Text>

              <View style={styles.row}>
                <Text style={styles.label}>Hälsoplan och tillskott</Text>
                <Switch
                  value={healthPlanEnabled}
                  onValueChange={setHealthPlanEnabled}
                  trackColor={{
                    false: Colors.dark.secondary,
                    true: Colors.dark.progressBar,
                  }}
                  thumbColor={
                    healthPlanEnabled
                      ? Colors.dark.textWhite // "#C3FF00" – stark, konsekvent accent
                      : "#999999" // mörkgrå för av
                  }
                />
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Kalender (delas inte)</Text>
                <Switch value={false} disabled />
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Chatt-historik (sparas inte)</Text>
                <Switch value={false} disabled />
              </View>

              <Text style={styles.disclaimer}>
                Vi delar aldrig din identitet (som namn eller e-post) med AI:n.
              </Text>

              <Pressable onPress={handleClose} style={styles.closeButton}>
                <Text style={styles.closeText}>Stäng</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
};

export default AIInfoPopup;

const styles = StyleSheet.create({
  iconButton: {
    marginRight: 12,
    marginBottom: 3,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modal: {
    backgroundColor: Colors.dark.secondary,
    borderRadius: borders.radius,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    color: Colors.dark.primary, // Gör titeln mer framträdande
    textTransform: "uppercase",
  },
  desc: {
    fontSize: 14,
    marginBottom: 16,
    color: Colors.dark.textLight,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  label: {
    fontSize: 14,
    color: Colors.dark.textLight,
  },
  disclaimer: {
    fontSize: 12,
    color: Colors.dark.text,
    marginTop: 8,
    marginBottom: 16,
    textAlign: "center",
  },
  closeButton: {
    marginTop: 24,
    backgroundColor: Colors.dark.background,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.dark.primary,
  },
  closeText: {
    color: Colors.dark.primary,
    textAlign: "center",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    textShadowColor: Colors.dark.buttonTextGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },

  planBox: {
    backgroundColor: Colors.dark.secondary,
    padding: 10,
    borderRadius: borders.radius,
    marginBottom: 10,
  },
  planInfoTitle: {
    color: Colors.dark.text,
    fontWeight: "600",
    marginBottom: 5,
  },
  planText: {
    color: Colors.dark.text,
    fontSize: 14,
  },
});
