import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { ThemedText } from '@/components/ThemedText';
import ThemedSwitch from '@/components/ui/ThemedSwitch';

import { useMusic } from './MusicContext';
import { useSparks } from './SparksContext';
import { ThemedModal } from './ThemedModal';

export default function GlobalLevelUpModal() {
  const { t } = useTranslation(['levels']);
  const { levelUpModalVisible, setLevelUpModalVisible, newLevelReached, clearNewLevelReached } = useStorage();
  // Hämta och spara showMusic i StorageContext eller AsyncStorage för att minnas valet
  const { showMusic, setShowMusic } = useStorage();

  const { play, stop } = useMusic();
  const { triggerSparks } = useSparks();

  // Spela musik och visa sparks direkt när modalen öppnas
  useEffect(() => {
    if (levelUpModalVisible && newLevelReached) {
      triggerSparks();
      if (showMusic) {
        play().catch(error => {
          console.warn('Failed to play level-up music:', error);
        });
      }
    }
  }, [levelUpModalVisible, newLevelReached, play, showMusic, triggerSparks]);

  // Spara användarens val
  const handleToggleMusic = async (value: boolean) => {
    setShowMusic(value);
    if (!value) await stop(); // Vänta på att musiken stängs av ordentligt
  };

  if (!levelUpModalVisible || !newLevelReached) return null;

  const handleClose = () => {
    setLevelUpModalVisible(false);
    clearNewLevelReached();
  };

  return (
    <ThemedModal
      visible={levelUpModalVisible}
      title={t('levelUp.title')}
      okLabel={t('common:ok')}
      onSave={handleClose}
      showCancelButton={false}
      onClose={() => {}}
    >
      <ThemedText type="title3" style={styles.levelText}>
        {t(`${newLevelReached}`)} ({t('levelUp.level')} {newLevelReached})
      </ThemedText>
      <View style={styles.musicRow}>
        <ThemedText style={styles.musicLabel}>Musik</ThemedText>
        <ThemedSwitch value={showMusic} onValueChange={handleToggleMusic} />
      </View>
    </ThemedModal>
  );
}

const styles = StyleSheet.create({
  levelText: {
    textAlign: 'center',
  },
  musicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    justifyContent: 'center',
  },
  musicLabel: {
    marginRight: 8,
  },
});
