import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useTheme } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { t } from 'i18next';
import React, { JSX, useCallback, useEffect, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import AIInfoPopup from '@/components/AllInfoPopup';
import BackButton from '@/components/BackButton';
import { ThemedText } from '@/components/ThemedText';
import LabeledInput from '@/components/ui/LabeledInput';
import { useGPTFunctionHandler } from '@/hooks/useGPTFunctionHandler';
import { useKeyboardVisible } from '@/hooks/useKeyboardVisible';
import { askGPT, buildSystemPrompt } from '@/services/gptServices';

import { useStorage } from '../../context/StorageContext';
import { Message } from '../../domain/Message';

// Ensure each message has a unique id
function createMessage(message: Omit<Message, 'id'> & { id?: string }): Message & { id: string } {
  return {
    ...message,
    id: message.id ?? `${message.role}-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`,
  };
}

export default function ChatWithGPT4o(): JSX.Element {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const { handleGPTFunctionCall } = useGPTFunctionHandler();
  const router = useRouter();
  const { colors } = useTheme();
  const { supplements, goal, initialPrompt, returnPath, returnParams } = useLocalSearchParams<{
    supplements?: string;
    goal?: string;
    initialPrompt?: string;
    returnPath?: string;
    returnParams?: string;
  }>();

  // Animation för typing indicator
  const dot1Anim = useRef(new Animated.Value(0.4)).current;
  const dot2Anim = useRef(new Animated.Value(0.4)).current;
  const dot3Anim = useRef(new Animated.Value(0.4)).current;

  const parsedSupplements = React.useMemo(
    () => (supplements ? (JSON.parse(supplements) as string[]) : []),
    [supplements]
  );

  const tabBarHeight = useBottomTabBarHeight();
  const isKeyboardVisible = useKeyboardVisible();
  const scrollRef = useRef<ScrollView>(null);
  const isNearBottom = useRef(true); // Håll koll på om användaren är nära botten
  const { plans, errorMessage, shareHealthPlan, addChatMessageXP } = useStorage();

  // Parse returnParams för att få tillgång till mainGoalId, tipId
  const tipContext = returnParams ? JSON.parse(returnParams) : null;

  // Visa back-knappen om vi har initialPrompt, supplements eller goal
  const showBackButton = !!(initialPrompt || supplements || goal);

  // Custom back handler
  const handleBack = () => {
    if (returnPath) {
      const params = returnParams ? JSON.parse(returnParams) : {};
      router.push({
        pathname: returnPath as any,
        params,
      });
    } else {
      router.back();
    }
  };

  const fullSystemPrompt = useCallback(() => buildSystemPrompt(plans, shareHealthPlan), [plans, shareHealthPlan]);

  // Animera typing indicator
  useEffect(() => {
    if (loading) {
      const createPulse = (animValue: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(animValue, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0.4,
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        );
      };

      const animation = Animated.parallel([
        createPulse(dot1Anim, 0),
        createPulse(dot2Anim, 150),
        createPulse(dot3Anim, 300),
      ]);

      animation.start();

      return () => animation.stop();
    } else {
      dot1Anim.setValue(0.4);
      dot2Anim.setValue(0.4);
      dot3Anim.setValue(0.4);
    }
  }, [dot1Anim, dot2Anim, dot3Anim, loading]);

  useEffect(() => {
    setMessages([
      createMessage({
        role: 'assistant',
        content: t('chat.welcomeMessage'),
      }),
    ]);
  }, []);

  useEffect(() => {
    if (initialPrompt) {
      const sendInitialPrompt = async () => {
        const userMessage = createMessage({ role: 'user', content: initialPrompt });
        const planOverviewMessage = createMessage({
          role: 'system',
          content: fullSystemPrompt(),
        });

        const visibleMessages = [userMessage];
        const messagesToSend = [planOverviewMessage, ...visibleMessages];

        setMessages(visibleMessages);
        setLoading(true);

        try {
          const data = await askGPT(messagesToSend);
          if (data.type === 'text') {
            const content = data.content ?? '🤖 Inget svar tillgängligt.';
            setMessages(prev => [...prev, createMessage({ role: 'assistant', content })]);
          }
        } catch (error) {
          setMessages(prev => [...prev, createMessage({ role: 'assistant', content: 'Något gick fel. 😕 ' + error })]);
        } finally {
          setLoading(false);
        }
      };

      sendInitialPrompt();
    }
  }, [fullSystemPrompt, initialPrompt]);

  useEffect(() => {
    if (parsedSupplements.length > 0) {
      const suppList = parsedSupplements.join(', ');
      const introPrompt = t('chat.introPrompt', {
        goal,
        supplements: suppList,
      });

      const userMessage = createMessage({ role: 'user', content: introPrompt });
      const planOverviewMessage = createMessage({
        role: 'system',
        content: fullSystemPrompt(),
      });

      const messagesToSend = [planOverviewMessage, userMessage];
      setMessages([userMessage]);
      setLoading(true);

      const ask = async () => {
        try {
          const data = await askGPT(messagesToSend);
          const gptReply = data.content ?? '🤖 Inget svar.';

          setMessages(prev => [
            ...prev,
            createMessage({ role: 'assistant', content: gptReply }),
            createMessage({
              role: 'assistant',
              content: t('chat.askToAddSupplements'),
            }),
          ]);
        } catch (e) {
          setMessages(prev => [...prev, createMessage({ role: 'assistant', content: 'Fel: ' + e })]);
        } finally {
          setLoading(false);
        }
      };

      ask();
    }
  }, [fullSystemPrompt, goal, parsedSupplements, parsedSupplements.length]);

  useEffect(() => {
    // Scrolla endast om användaren redan är nära botten
    if (isNearBottom.current) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, loading]);

  const sendMessage = async (): Promise<void> => {
    if (!input.trim()) return;

    const userMessage = createMessage({ role: 'user', content: input });
    const planOverviewMessage = createMessage({
      role: 'system',
      content: fullSystemPrompt(),
    });

    const visibleMessages = [...messages, userMessage];
    const messagesToSend = [planOverviewMessage, ...visibleMessages];

    setMessages(visibleMessages);
    setInput('');
    setLoading(true);

    // Ge XP för meddelandet om vi har tip-kontext
    if (tipContext?.areaId && tipContext?.tipId) {
      const xpGained = addChatMessageXP(tipContext.mainGoalId, tipContext.tipId);
      console.log(`💬 +${xpGained} XP for chatting!`);
    }

    try {
      const data = await askGPT(messagesToSend);

      if (data.type === 'text') {
        const content = data.content ?? '🤖 Inget svar tillgängligt.';
        setMessages(prev => [...prev, createMessage({ role: 'assistant', content })]);
      } else if (data.type === 'function_call' && data.arguments) {
        handleGPTFunctionCall(data.arguments, setMessages);
      } else {
        setMessages(prev => [...prev, createMessage({ role: 'assistant', content: 'Inget användbart svar.' })]);
      }
    } catch (error) {
      setMessages(prev => [...prev, createMessage({ role: 'assistant', content: 'Något gick fel. 😕 ' + error })]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate paddingTop outside of JSX to avoid nested ternary in style
  let paddingTopValue = 10;
  if (showBackButton) {
    paddingTopValue = tipContext ? 10 : 0;
  }

  // Calculate bottom value for inputContainer outside of JSX to avoid nested ternary and inline style warning
  let inputContainerBottom = 0;
  if (!isKeyboardVisible) {
    inputContainerBottom = typeof tabBarHeight === 'number' ? tabBarHeight : 0;
  }

  const [showAIPopup, setShowAIPopup] = useState(false);

  return (
    <>
      {showBackButton && <BackButton onPress={handleBack} />}
      <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={globalStyles.flex1}>


          {/* Visa XP-indikator om vi har tip-kontext */}
          {tipContext && (
            <View style={[styles.xpIndicator, { borderColor: colors.accentWeak, backgroundColor: colors.accentWeak }]}>
              <Text style={[styles.xpIndicatorText, { color: colors.primary }]}>💬 +2 XP</Text>
            </View>
          )}

          <ScrollView
            ref={scrollRef}
            style={globalStyles.flex1}
            keyboardShouldPersistTaps="handled"
            onScroll={event => {
              const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
              const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
              // Anses vara nära botten om mindre än 100 pixlar från botten
              isNearBottom.current = distanceFromBottom < 100;
            }}
            scrollEventThrottle={400}
            contentContainerStyle={[
              styles.scrollContentContainer,
              { paddingBottom: tabBarHeight + 80, paddingTop: paddingTopValue }
            ]}
          >
            {messages.map((msg, index) => (
              <View
                key={`${msg.role}-${index}`}
                style={[
                  styles.messageBubble,
                  msg.role === 'user'
                    ? [styles.userBubble, { backgroundColor: colors.userBubble }]
                    : [styles.assistantBubble, { backgroundColor: colors.assistantBubble }],
                ]}
              >
                <ThemedText type="label" uppercase style={{ color: colors.textLight }}>
                  {msg.role === 'user' ? 'Du' : 'GPT'}:
                </ThemedText>
                <ThemedText type="default">
                  {msg.content}
                </ThemedText>
              </View>
            ))}

            {loading && (
              <View style={[styles.messageBubble, styles.assistantBubble, { backgroundColor: colors.assistantBubble }]}>
                <ThemedText type="label" uppercase style={{ color: colors.textLight }}>GPT:</ThemedText>
                <View style={styles.typingIndicator}>
                  <Animated.View style={[styles.typingDot, { opacity: dot1Anim, backgroundColor: colors.primary }]} />
                  <Animated.View style={[styles.typingDot, { opacity: dot2Anim, backgroundColor: colors.primary }]} />
                  <Animated.View style={[styles.typingDot, { opacity: dot3Anim, backgroundColor: colors.primary }]} />
                </View>
              </View>
            )}
          </ScrollView>
          <View style={[styles.inputContainer, { bottom: inputContainerBottom, borderColor: colors.border, backgroundColor: colors.background }]}>
            <View style={[styles.inputRow]}>
              <TouchableOpacity onPress={() => setShowAIPopup(true)} style={styles.iconButton}>
                <MaterialCommunityIcons name="shield-check-outline" size={24} color={colors.secondary} />
              </TouchableOpacity>
              <LabeledInput
                label=""
                value={input}
                onChangeText={setInput}
                placeholder="Skriv en fråga..."
                containerStyle={styles.input}
                multilineInput 
                onFocus={() => {
                  setTimeout(() => {
                    scrollRef.current?.scrollToEnd({ animated: true });
                    isNearBottom.current = true;
                  }, 300);
                }}
              />
              <MaterialIcons
                name="send"
                size={32}
                color={loading || !input.trim() ? colors.textMuted : colors.primary}
                onPress={loading || !input.trim() ? undefined : sendMessage}
                style={[
                  styles.sendIcon,
                  {
                    color: colors.primary,
                    shadowColor: colors.buttonGlow,
                  },
                ]}
              />
            </View>
            {!!errorMessage && <Text style={[styles.errorText, { color: colors.error }]}>{errorMessage}</Text>}
          </View>
        </View>
      </KeyboardAvoidingView>
      <AIInfoPopup visible={showAIPopup} setVisible={setShowAIPopup} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
  },
  scrollContentContainer: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageBubble: {
    borderRadius: 16,
    padding: 10,
    marginVertical: 5,
    maxWidth: '85%',
  },
  userBubble: {
    alignSelf: 'flex-end',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
  },
  inputContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingBottom: 8,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
  },
  errorText: {
    marginTop: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingVertical: 1,
  },
  iconWrapperAdjusted: {
    width: 36,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  sendIcon: {
    padding: 6,
    marginLeft: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  xpIndicator: {
    position: 'absolute',
    top: 10,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    zIndex: 10,
  },
  xpIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 2,
  },
  iconButton: {
    padding: 6,
    borderRadius: 20,
  },
});
