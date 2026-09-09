import type { UserProfile } from './userProfileTypes';

type Subscriber = (profile: UserProfile) => void;

const subscribers = new Set<Subscriber>();

export const subscribeUserProfile = (
  fn: Subscriber
) => {
  subscribers.add(fn);

  return () => {
    subscribers.delete(fn);
  };
};

export const emitUserProfile = (
  profile: UserProfile
) => {
  subscribers.forEach(fn => fn(profile));
};