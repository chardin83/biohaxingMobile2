import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Switch, Text, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';

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
      if (showMusic) play(); // Kontrollera showMusic här!
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
      onClose={() => {}}>
      <Text style={{ color: 'white', textAlign: 'center', fontSize: 18 }}>
        {t(`${newLevelReached}`)} ({t('levelUp.level')} {newLevelReached})
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, justifyContent: 'center' }}>
        <Text style={{ color: 'white', marginRight: 8 }}>Musik</Text>
        <Switch value={showMusic} onValueChange={handleToggleMusic} />
      </View>
    </ThemedModal>
  );
}
