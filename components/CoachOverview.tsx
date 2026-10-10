import { useTheme } from '@react-navigation/native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import AppButton from '@/components/ui/AppButton';
import { Card } from '@/components/ui/Card';
import { CloseButton } from '@/components/ui/CloseButton';
import { IconSymbol } from '@/components/ui/IconSymbol';
import ProgressBarWithLabel from '@/components/ui/ProgressbarWithLabel';

type Props = Readonly<{ remaining: number; total: number; onDiscoverPremium: () => void }>;

export default function CoachOverview({ remaining, total, onDiscoverPremium }: Props) {
  const { t } = useTranslation('common');
  const { colors } = useTheme();
  const [progressWidth, setProgressWidth] = useState(200);
  const [questionsDismissed, setQuestionsDismissed] = useState(false);
  const [premiumDismissed, setPremiumDismissed] = useState(false);
  const progress = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0;

  return (
    <>
      {remaining > 0 && !questionsDismissed && (
        <Card>
          <View style={styles.cardHeading}>
            <ThemedText type="title3" style={styles.cardTitle}>
              {t('chat.weeklyQuestions')}
            </ThemedText>
            <CloseButton onPress={() => setQuestionsDismissed(true)} />
          </View>
          <ThemedText type="defaultSemiBold" style={styles.balance}>
            {t('chat.questionsRemaining', { remaining, total })}
          </ThemedText>
          <View onLayout={event => setProgressWidth(event.nativeEvent.layout.width)}>
            <ProgressBarWithLabel progress={progress} width={progressWidth} color={colors.primary} />
          </View>
          <ThemedText type="caption" style={styles.reset}>
            {t('chat.questionsReset')}
          </ThemedText>
        </Card>
      )}
      {remaining === 0 && !premiumDismissed && (
        <Card style={{ borderColor: colors.gold, borderWidth: StyleSheet.hairlineWidth, backgroundColor: colors.goldTransparent }}>
          <View style={styles.cardHeading}>
            <IconSymbol name="crown" size={24} color={colors.gold} />
            <ThemedText type="title3" style={styles.cardTitle}>
              {t('chat.premiumTitle')}
            </ThemedText>
            <CloseButton onPress={() => setPremiumDismissed(true)} />
          </View>
          <ThemedText style={styles.description}>{t('chat.premiumDescription')}</ThemedText>
          <AppButton title={t('chat.discoverPremium')} variant="primary" onPress={onDiscoverPremium} />
        </Card>
      )}

    </>
  );
}

const styles = StyleSheet.create({
  cardHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  cardTitle: { flex: 1 },
  balance: { marginBottom: 12 },
  reset: { marginTop: 10 },
  description: { marginBottom: 16 },
});
