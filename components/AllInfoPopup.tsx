import { useTheme } from '@react-navigation/native';
import { t } from 'i18next';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { useSession } from '@/app/context/SessionStorage';
import { useStorage } from '@/app/context/StorageContext';

import { ThemedModal } from './ThemedModal';

interface AIInfoPopupProps {
  visible: boolean;
  setVisible: (v: boolean) => void;
}

const AIInfoPopup: React.FC<AIInfoPopupProps> = ({ visible, setVisible }) => {
  const { hasVisitedChat, setHasVisitedChat, shareHealthPlan, setShareHealthPlan } = useStorage();
  const [healthPlanEnabled, setHealthPlanEnabled] = useState(false);
  const { forceOpenPopup, setForceOpenPopup } = useSession();
  const { colors } = useTheme();

  useEffect(() => {
    if (forceOpenPopup) {
      setVisible(true);
      setForceOpenPopup(false);
    }
  }, [forceOpenPopup, setForceOpenPopup, setVisible]);

  useEffect(() => {
    const checkFirstVisit = async () => {
      if (!hasVisitedChat) {
        setVisible(true);
        setHasVisitedChat(true);
      }
    };
    checkFirstVisit();
  }, [hasVisitedChat, setHasVisitedChat, setVisible]);

  useEffect(() => {
    const loadStoredPrefs = async () => {
      if (shareHealthPlan) {
        setHealthPlanEnabled(true);
      }
    };
    loadStoredPrefs();
  }, [shareHealthPlan]);

  useEffect(() => {
    const savePrefs = async () => {
      setShareHealthPlan(!!healthPlanEnabled);
    };
    savePrefs();
  }, [healthPlanEnabled, setShareHealthPlan]);

  const handleClose = () => setVisible(false);

  return (
    
      <ThemedModal
        visible={visible}
        title="🤖 Dina AI-delningar"
        onClose={handleClose}
        showCancelButton={true}
        cancelLabel={t('general.close')}
      >
        <Text style={[styles.desc, { color: colors.textLight }]}>
          Välj vilken information AI:n får använda för att ge dig personliga hälsoråd:
        </Text>

        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.textLight }]}>Hälsoplan och tillskott</Text>
          <Switch
            value={healthPlanEnabled}
            onValueChange={setHealthPlanEnabled}
            trackColor={{
              false: colors.secondary,
              true: colors.progressBar,
            }}
          />
        </View>

        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.textLight }]}>Kalender (delas inte)</Text>
          <Switch value={false} disabled />
        </View>

        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.textLight }]}>Chatt-historik (sparas inte)</Text>
          <Switch value={false} disabled />
        </View>

        <Text style={[styles.disclaimer, { color: colors.text }]}>
          Vi delar aldrig din identitet (som namn eller e-post) med AI:n.
        </Text>
      </ThemedModal>
  );
};

export default AIInfoPopup;

const styles = StyleSheet.create({
  iconButton: {
    marginRight: 12,
    marginBottom: 3,
    width: 40, // eller valfri storlek
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  desc: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
  },
  label: {
    fontSize: 14,
  },
  disclaimer: {
    fontSize: 12,
    marginTop: 8,
    marginBottom: 16,
    textAlign: 'center',
  },
});
