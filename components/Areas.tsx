import { useTheme } from '@react-navigation/native';
import { t } from 'i18next';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import AppCard from '@/components/ui/AppCard';
import { Area, areas } from '@/locales/areas';

export default function Areas({ invalid = false, onboarding = false }: Readonly<{ invalid?: boolean; onboarding?: boolean }>) {
  const { myAreas, setMyAreas } = useStorage();
  const { colors } = useTheme();

  const handlePress = (area: Area) => {
    setMyAreas(prev => (prev.includes(area.id) ? prev.filter(id => id !== area.id) : [...prev, area.id]));
  };

  return (
    <View style={[styles.content, onboarding && styles.onboardingContent]}>
      <Text accessibilityRole="header" style={[styles.title, { color: onboarding ? colors.text : colors.primaryText }]}>
        {onboarding ? (
          <>
            {t('common:areas.selectAreasLead')} <Text style={{ color: colors.primaryText }}>{t('common:areas.selectAreasAccent')}</Text>{' '}
            {t('common:areas.selectAreasEnd')}
          </>
        ) : (
          t('common:areas.selectAreas')
        )}
      </Text>
      {areas.map(item => (
        <AppCard
          key={item.id}
          testID={`area-card-${item.id}`}
          title={t(`areas:${item.id}.title`)}
          description={t(`areas:${item.id}.description`)}
          isActive={myAreas.includes(item.id)}
          onPress={() => handlePress(item)}
          showCheckbox={true}
          style={invalid ? { borderColor: colors.error } : undefined}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  onboardingContent: { paddingTop: 24 },
  content: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
