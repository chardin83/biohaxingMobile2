import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type { Message } from '@/app/domain/Message';
import ChatMessageContent from '@/components/ChatMessageContent';
import { ThemedModal } from '@/components/ThemedModal';
import { ThemedText } from '@/components/ThemedText';
import AIChatBox from '@/components/ui/AIChatBox';
import AppButton from '@/components/ui/AppButton';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import PremiumOffer from '@/components/ui/PremiumOffer';
import { PREMIUM } from '@/constants/Premium';
import { analyzeMetric, type MetricAnalysisResult } from '@/services/metricAnalysis';

export default function MetricAnalysis({ context, hasData, days, metricNames }: { context: string; hasData: boolean; days: number; metricNames: string[] }) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const [premiumVisible, setPremiumVisible] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<MetricAnalysisResult | null>(null);
  const [history, setHistory] = React.useState<Message[]>([]);
  const [failedQuestion, setFailedQuestion] = React.useState<string | undefined>();
  const [error, setError] = React.useState(false);
  const pending = React.useRef(false);
  const mounted = React.useRef(true);
  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const analyze = async (question?: string) => {
    if (!PREMIUM) {
      setPremiumVisible(true);
      return;
    }
    if (!hasData || pending.current) return;
    pending.current = true;
    setBusy(true);
    setError(false);
    const nextHistory: Message[] = question ? [...history, { role: 'user', content: question }] : [];
    try {
      const content = await analyzeMetric(context, i18n.resolvedLanguage ?? i18n.language, nextHistory);
      if (mounted.current) {
        setResult(content);
        setHistory([...nextHistory, { role: 'assistant', content: JSON.stringify(content) }]);
        setFailedQuestion(undefined);
      }
    } catch {
      if (mounted.current) {
        setError(true);
        setFailedQuestion(question);
      }
    } finally {
      pending.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  return (
    <Card>
      <View style={styles.heading}>
        <IconSymbol name="sparkles" size={22} color={colors.primary} />
        <ThemedText type="title3" style={[styles.title, { color: colors.cardTitle }]}>
          {t('metrics:aiAnalysis.title')}
        </ThemedText>
      </View>
      {PREMIUM && result ? (
        <ThemedText type="caption" style={{ color: colors.textMuted }}>
          {t('metrics:aiAnalysis.summary', { count: days, metrics: metricNames.join(' · ') })}
        </ThemedText>
      ) : (
        <ThemedText>{t('metrics:aiAnalysis.description')}</ThemedText>
      )}
      {!hasData && <ThemedText>{t('metrics:aiAnalysis.noData')}</ThemedText>}
      {PREMIUM && result ? (
        <>
          {history.map((message, index) =>
            message.role === 'user' ? (
              <ThemedText key={index} type="defaultSemiBold" style={styles.button}>
                {message.content}
              </ThemedText>
            ) : (
              <ChatMessageContent key={index} content={(JSON.parse(message.content) as MetricAnalysisResult).analysis} />
            )
          )}
          <AIChatBox questions={result.followUpQuestions} onQuestionPress={question => analyze(question)} busy={busy} />
        </>
      ) : null}
      {error && (
        <View>
          <ThemedText accessibilityRole="alert">{t('metrics:aiAnalysis.error')}</ThemedText>
          {result && <AppButton title={t('metrics:aiAnalysis.retry')} disabled={busy} onPress={() => analyze(failedQuestion)} />}
        </View>
      )}
      {!result && (
        <AppButton
          title={t(PREMIUM ? 'metrics:aiAnalysis.analyze' : 'metrics:aiAnalysis.unlock')}
          variant={PREMIUM ? 'primary' : 'premium'}
          busy={busy}
          disabled={busy || (PREMIUM && !hasData)}
          onPress={() => analyze()}
          style={styles.button}
        />
      )}
      {!PREMIUM && (
        <ThemedText type="caption" style={[styles.premiumNote, { color: colors.textMuted }]}>
          {t('metrics:aiAnalysis.premiumOnly')}
        </ThemedText>
      )}
      {premiumVisible && (
        <ThemedModal visible title={t('common:premium.premium')} onClose={() => setPremiumVisible(false)} showCancelButton={false}>
          <PremiumOffer onDismiss={() => setPremiumVisible(false)} />
        </ThemedModal>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  title: { flex: 1, fontSize: 18 },
  button: {
    marginTop: 14,
  },
  premiumNote: { marginTop: 6, textAlign: 'center' },
});
