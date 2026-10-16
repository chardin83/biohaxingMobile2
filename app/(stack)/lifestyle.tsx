import { useTheme } from '@react-navigation/native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import ProgressDateNavigator from '@/components/journal/progress/ProgressDateNavigator';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import Container from '@/components/ui/Container';
import OptionSelector from '@/components/ui/OptionSelector';
import { LIFE_STYLE_ITEMS, type LifeStyleId } from '@/constants/lifeStyle';
import { formatDate, fromDateKey, toDateKey } from '@/utils/dateUtils';

export default function LifeStylePage() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const { lifeStyleLog, lifeStyleLoading, lifeStyleError, logLifeStyleEntry } = useStorage();
  const today = toDateKey(new Date());
  const [selectedDay, setSelectedDay] = useState(today);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const changeDay = (offset: number) => {
    const date = fromDateKey(selectedDay);
    date.setDate(date.getDate() + offset);
    setSelectedDay(toDateKey(date));
    setSaveError(false);
  };

  const saveAnswer = async (id: LifeStyleId, value: string) => {
    setSaving(true);
    setSaveError(false);
    try {
      await logLifeStyleEntry(selectedDay, id, value === 'true');
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container background="default" showBackButton>
      <ProgressDateNavigator
        label={formatDate(selectedDay, i18n.resolvedLanguage ?? i18n.language)}
        canGoForward={selectedDay < today}
        onBack={() => changeDay(-1)}
        onForward={() => changeDay(1)}
      />
      <ThemedText type="title2">{t('common:lifeStyle.title')}</ThemedText>
      {lifeStyleLoading && <ActivityIndicator color={colors.primary} />}
      <Card style={styles.card}>
        {(Object.keys(LIFE_STYLE_ITEMS) as LifeStyleId[]).map((id, index) => {
          const answer = lifeStyleLog[selectedDay]?.[id];
          return (
            <View key={id} style={[styles.row, index > 0 && styles.dividedRow, { borderColor: colors.borderLight }]}>
              <ThemedText style={styles.label}>{t(`common:lifeStyle.items.${id}`)}</ThemedText>
              <OptionSelector
                compact
                accessibilityLabel={t(`common:lifeStyle.items.${id}`)}
                value={answer ? String(answer.value) : undefined}
                options={[
                  { value: 'true', label: t('common:filter.yes') },
                  { value: 'false', label: t('common:filter.no') },
                ]}
                disabled={lifeStyleLoading || Boolean(lifeStyleError) || saving}
                onChange={value => { saveAnswer(id, value); }}
              />
            </View>
          );
        })}
      </Card>
      {lifeStyleError && <ThemedText type="error">{t(`common:${lifeStyleError}`)}</ThemedText>}
      {saveError && <ThemedText type="error">{t('common:lifeStyle.saveError')}</ThemedText>}
    </Container>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  dividedRow: { borderTopWidth: StyleSheet.hairlineWidth },
  label: { flex: 1 },
});
