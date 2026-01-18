import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';

import { ThemedModal } from './ThemedModal';

export default function GlobalLevelUpModal() {
  const { t } = useTranslation(['levels']);
  const { levelUpModalVisible, setLevelUpModalVisible, newLevelReached, clearNewLevelReached } = useStorage();

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
    >
      <Text style={{ color: 'white', textAlign: 'center', fontSize: 18 }}>
        {t(`${newLevelReached}`)} ({t('levelUp.level')} {newLevelReached})
      </Text>
    </ThemedModal>
  );
}
