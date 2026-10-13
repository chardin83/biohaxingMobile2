export function getTimeSlotNameKey(time: Date): 'morning' | 'lunch' | 'dinner' | 'evening' | 'night' {
  const hour = time.getHours();
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 15) return 'lunch';
  if (hour >= 15 && hour < 18) return 'dinner';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}
