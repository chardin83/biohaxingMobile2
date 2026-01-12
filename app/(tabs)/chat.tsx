import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import React, { JSX, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useKeyboardVisible } from "@/hooks/useKeyboardVisible";
import AIInfoPopup from "@/components/AllInfoPopup";
import { useStorage } from "../context/StorageContext";
import { useGPTFunctionHandler } from "@/hooks/useGPTFunctionHandler";
import { useLocalSearchParams } from "expo-router";
import { t } from "i18next";
import { Colors } from "@/constants/Colors";
import { Message } from "../domain/Message";
import { askGPT, buildSystemPrompt } from "@/services/gptServices";
import BackButton from "@/components/BackButton";
import { useRouter } from "expo-router";

export default function ChatWithGPT4o(): JSX.Element {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const { handleGPTFunctionCall } = useGPTFunctionHandler();
  const router = useRouter();
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

  const parsedSupplements = supplements
    ? (JSON.parse(supplements) as string[])
    : [];

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

  const fullSystemPrompt = () => buildSystemPrompt(plans, shareHealthPlan);

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
  }, [loading]);

  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content: t("chat.welcomeMessage"),
      },
    ]);
  }, []);

  useEffect(() => {
    if (initialPrompt) {
      const sendInitialPrompt = async () => {
        const userMessage: Message = { role: "user", content: initialPrompt };
        const planOverviewMessage: Message = {
          role: "system",
          content: fullSystemPrompt(),
        };

        const visibleMessages: Message[] = [userMessage];
        const messagesToSend: Message[] = [planOverviewMessage, ...visibleMessages];

        setMessages(visibleMessages);
        setLoading(true);

        try {
          const data = await askGPT(messagesToSend);
          if (data.type === "text") {
            const content = data.content ?? "🤖 Inget svar tillgängligt.";
            setMessages((prev) => [...prev, { role: "assistant", content }]);
          }
        } catch (error) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "Något gick fel. 😕 " + error },
          ]);
        } finally {
          setLoading(false);
        }
      };

      sendInitialPrompt();
    }
  }, [initialPrompt]);

  useEffect(() => {
    if (parsedSupplements.length > 0) {
      const suppList = parsedSupplements.join(", ");
      const introPrompt = t("chat.introPrompt", {
        goal,
        supplements: suppList,
      });

      const userMessage: Message = { role: "user", content: introPrompt };
      const planOverviewMessage: Message = {
        role: "system",
        content: fullSystemPrompt(),
      };

      const messagesToSend: Message[] = [planOverviewMessage, userMessage];
      setMessages([userMessage]);
      setLoading(true);

      const ask = async () => {
        try {
          const data = await askGPT(messagesToSend);
          const gptReply = data.content ?? "🤖 Inget svar.";

          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: gptReply },
            {
              role: "assistant",
              content: t("chat.askToAddSupplements"),
            },
          ]);
        } catch (e) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "Fel: " + e },
          ]);
        } finally {
          setLoading(false);
        }
      };

      ask();
    }
  }, [parsedSupplements.length]);

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

    const userMessage: Message = { role: "user", content: input };
    const planOverviewMessage: Message = {
      role: "system",
      content: fullSystemPrompt(),
    };

    const visibleMessages: Message[] = [...messages, userMessage];
    const messagesToSend: Message[] = [planOverviewMessage, ...visibleMessages];

    setMessages(visibleMessages);
    setInput("");
    setLoading(true);

    // Ge XP för meddelandet om vi har tip-kontext
    if (tipContext?.mainGoalId && tipContext?.tipId) {
      const xpGained = addChatMessageXP(
        tipContext.mainGoalId, 
        tipContext.tipId
      );
      console.log(`💬 +${xpGained} XP for chatting!`);
    }

    try {
      const data = await askGPT(messagesToSend);

      if (data.type === "text") {
        const content = data.content ?? "🤖 Inget svar tillgängligt.";
        setMessages((prev) => [...prev, { role: "assistant", content }]);
      } else if (data.type === "function_call" && data.arguments) {
        handleGPTFunctionCall(data.arguments, setMessages);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Inget användbart svar." },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Något gick fel. 😕 " + error },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={{ flex: 1 }}>
        {showBackButton && <BackButton onPress={handleBack} />}
        
        {/* Visa XP-indikator om vi har tip-kontext */}
        {tipContext && (
          <View style={styles.xpIndicator}>
            <Text style={styles.xpIndicatorText}>💬 +2 XP per message</Text>
          </View>
        )}
        
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          onScroll={(event) => {
            const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
            const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
            // Anses vara nära botten om mindre än 100 pixlar från botten
            isNearBottom.current = distanceFromBottom < 100;
          }}
          scrollEventThrottle={400}
          contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "flex-end",
              paddingBottom: tabBarHeight + 80,
              paddingTop: showBackButton ? (tipContext ? 40 : 0) : 10,
            }}
          >
            {messages.map((msg, index) => (
              <View
                key={index}
                style={[
                  styles.messageBubble,
                  msg.role === "user"
                    ? styles.userBubble
                    : styles.assistantBubble,
                ]}
              >
                <Text style={styles.sender}>
                  {msg.role === "user" ? "Du" : "GPT"}:
                </Text>
                <Text style={styles.messageText}>{msg.content}</Text>
              </View>
            ))}
            
            {loading && (
              <View style={[styles.messageBubble, styles.assistantBubble]}>
                <Text style={styles.sender}>GPT:</Text>
                <View style={styles.typingIndicator}>
                  <Animated.View style={[styles.typingDot, { opacity: dot1Anim }]} />
                  <Animated.View style={[styles.typingDot, { opacity: dot2Anim }]} />
                  <Animated.View style={[styles.typingDot, { opacity: dot3Anim }]} />
                </View>
              </View>
            )}
          </ScrollView>
          <View
            style={[
              styles.inputContainer,
              { bottom: isKeyboardVisible ? 0 : tabBarHeight },
            ]}
          >
            <View style={styles.inputRow}>
              <View style={styles.iconWrapperAdjusted}>
                <AIInfoPopup />
              </View>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Skriv en fråga..."
                placeholderTextColor={Colors.dark.textMuted}
                style={styles.input}
                onFocus={() => {
                  // Scrolla till botten när användaren fokuserar på input
                  setTimeout(() => {
                    scrollRef.current?.scrollToEnd({ animated: true });
                    isNearBottom.current = true;
                  }, 300);
                }}
              />
              <MaterialIcons
                name="send"
                size={32}
                color={
                  loading || !input.trim() ? Colors.dark.textMuted : Colors.dark.primary
                }
                onPress={loading || !input.trim() ? undefined : sendMessage}
                style={styles.sendIcon}
              />
            </View>
            {!!errorMessage && (
              <Text style={styles.errorText}>{errorMessage}</Text>
            )}
          </View>
        </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    backgroundColor: Colors.dark.background,
  },
  messageBubble: {
    borderRadius: 16,
    padding: 10,
    marginVertical: 5,
    maxWidth: "80%",
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: Colors.dark.progressBar,
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: Colors.dark.secondary,
  },
  messageText: {
    fontSize: 16,
    color: Colors.dark.text,
  },
  sender: {
    fontWeight: "bold",
    marginBottom: 5,
    color: Colors.dark.textLight,
  },
  inputContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    padding: 10,
    borderTopWidth: 1,
    borderColor: Colors.dark.border,
    backgroundColor: "rgba(0, 19, 38, 0.9)",
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.dark.border,
    color: Colors.dark.text,
    flex: 1,
    borderRadius: 5,
    padding: 10,
    backgroundColor: Colors.dark.background,
  },
  errorText: {
    color: Colors.dark.error,
    marginTop: 10,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 12,
    backgroundColor: Colors.dark.secondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  iconWrapperAdjusted: {
    width: 32,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 4,
  },
  sendIcon: {
    padding: 6,
    marginLeft: 6,
    color: Colors.dark.primary,
    shadowColor: Colors.dark.buttonGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  xpIndicator: {
    position: "absolute",
    top: 50,
    right: 20,
    backgroundColor: Colors.dark.accentVeryWeak,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.dark.accentWeak,
    zIndex: 10,
  },
  xpIndicatorText: {
    color: Colors.dark.primary,
    fontSize: 12,
    fontWeight: "600",
  },
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dark.primary,
    marginHorizontal: 2,
  },
});

