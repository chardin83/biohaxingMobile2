import { t } from 'i18next';
import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import AppCard from '@/components/ui/AppCard';
import Container from '@/components/ui/Container';
import { Colors } from '@/constants/Colors';
import { Area, areas } from '@/locales/areas';

export default function Areas() {
  const { myGoals, setMyGoals } = useStorage();
  const handlePress = (area: Area) => {
    setMyGoals(prev => (prev.includes(area.id) ? prev.filter(id => id !== area.id) : [...prev, area.id]));
  };
  return (
    <Container background="default" centerContent showBackButton>
      <Text style={styles.title}>{t('common:areas.selectAreas')}</Text>
      {areas.map(item => (
        <AppCard
          key={item.id}
          title={t(`areas:${item.id}.title`)}
          description={t(`areas:${item.id}.description`)}
          isActive={myGoals.includes(item.id)}
          onPress={() => handlePress(item)}
        />
      ))}
    </Container>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.dark.primary,
    marginBottom: 20,
  },
});
