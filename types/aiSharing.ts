export const PROFILE_SHARING_FIELDS = ['age', 'activityPal'] as const;
export type ProfileSharingField = (typeof PROFILE_SHARING_FIELDS)[number];
export type ProfileSharing = Record<ProfileSharingField, boolean>;
export const DEFAULT_PROFILE_SHARING: ProfileSharing = {
  age: false,
  activityPal: false,
};
