import AsyncStorage from '@react-native-async-storage/async-storage';

const HAS_VISITED_CHAT_KEY = 'hasVisitedChat';
const SHARE_HEALTH_PLAN_KEY = 'shareHealthPlan';

type ChatClearSubscriber = () => void;

const clearSubscribers = new Set<ChatClearSubscriber>();

export const subscribeToChatClear = (subscriber: ChatClearSubscriber) => {
  clearSubscribers.add(subscriber);
  return () => clearSubscribers.delete(subscriber);
};

export const clearChat = async () => {
  await AsyncStorage.multiSet([
    [HAS_VISITED_CHAT_KEY, 'false'],
    [SHARE_HEALTH_PLAN_KEY, 'false'],
  ]);

  clearSubscribers.forEach(subscriber => subscriber());
};