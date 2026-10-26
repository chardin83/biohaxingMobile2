import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';

type Props = Readonly<{
  questions: readonly string[];
  onQuestionPress: (question: string) => void;
  busy?: boolean;
  description?: string;
}>;

export default function AIChatBox({ questions, onQuestionPress, busy = false, description }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation('common');
  const [question, setQuestion] = React.useState('');
  const canSend = !busy && question.trim().length > 0;

  const sendQuestion = () => {
    if (!canSend) return;
    onQuestionPress(question.trim());
    setQuestion('');
  };

  return (
    <View style={[styles.container, { borderColor: colors.borderLight }]}>
      <View style={styles.heading}>
        <IconSymbol name="aiChat" size={32} color={colors.textMuted} />
        <ThemedText type="defaultSemiBold" style={styles.title}>
          {t('aiChatBox.title')}
        </ThemedText>
      </View>
      <ThemedText type="caption" style={{ color: colors.textMuted }}>
        {description ?? t('aiChatBox.description')}
      </ThemedText>
      <View style={styles.questions}>
        {questions.map(suggestion => (
          <Pressable
            key={suggestion}
            accessibilityRole="button"
            accessibilityLabel={suggestion}
            accessibilityState={{ disabled: busy }}
            disabled={busy}
            onPress={() => onQuestionPress(suggestion)}
            style={({ pressed }) => [styles.tile, { backgroundColor: colors.overlayLight, opacity: busy ? 0.5 : pressed ? 0.7 : 1 }]}
          >
            <ThemedText type="caption">{suggestion}</ThemedText>
          </Pressable>
        ))}
      </View>
      <View style={[styles.composer, { borderColor: colors.border, backgroundColor: colors.overlayLight }]}>
        <TextInput
          value={question}
          onChangeText={setQuestion}
          placeholder={t('aiChatBox.placeholder')}
          accessibilityLabel={t('aiChatBox.placeholder')}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { color: colors.text }]}
          editable={!busy}
          multiline
          maxLength={2000}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('aiChatBox.send')}
          accessibilityState={{ disabled: !canSend, busy }}
          disabled={!canSend}
          onPress={sendQuestion}
          style={({ pressed }) => [styles.send, { opacity: !canSend ? 0.4 : pressed ? 0.7 : 1 }]}
        >
          <IconSymbol name="paperplane.fill" size={20} color={canSend ? colors.primaryText : colors.textMuted} />
        </Pressable>
      </View>
      {busy && (
        <ThemedText type="caption" accessibilityLiveRegion="polite" style={{ color: colors.textMuted }}>
          {t('aiChatBox.answering')}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 16, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, gap: 8 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1 },
  questions: { gap: 8, marginTop: 4 },
  tile: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, minHeight: 44, justifyContent: 'center' },
  composer: { flexDirection: 'row', alignItems: 'flex-end', borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, paddingLeft: 14, marginTop: 4 },
  input: { flex: 1, fontSize: 14, lineHeight: 20, minHeight: 48, maxHeight: 120, paddingVertical: 14, textAlignVertical: 'top' },
  send: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
});
