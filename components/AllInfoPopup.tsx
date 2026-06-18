import { t } from 'i18next';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { useSession } from '@/app/context/SessionStorage';
import { useStorage } from '@/app/context/StorageContext';
import AISharingControls from '@/components/AISharingControls';

import { ThemedModal } from './ThemedModal';

interface AIInfoPopupProps {
  visible: boolean;
  setVisible: (v: boolean) => void;
  sharePlanText?: string;
}

const AIInfoPopup: React.FC<AIInfoPopupProps> = ({ visible, setVisible, sharePlanText }) => {
  const { hasVisitedChat, setHasVisitedChat } = useStorage();
  const { forceOpenPopup, setForceOpenPopup } = useSession();

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



  const handleClose = () => setVisible(false);

  return (
    
      <ThemedModal
        visible={visible}
        title="🤖 Dina AI-delningar"
        onClose={handleClose}
        showCancelButton={true}
        cancelLabel={t('general.close')}
      >
        <View style={styles.cardContainer}>
        <AISharingControls sharePlanText={sharePlanText} />
        </View>
      </ThemedModal>
  );
};

export default AIInfoPopup;

const styles = StyleSheet.create({
  cardContainer: {
    alignItems: 'stretch',
  },
});
