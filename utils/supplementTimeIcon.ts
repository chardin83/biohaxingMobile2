import type { IconSymbolName } from '@/components/ui/icon-symbol-map';

export const getSupplementTimeIcon = (preferredTime: string): IconSymbolName => {
  const hour = Number.parseInt((preferredTime || '').split(':')[0] ?? '', 10);

  if (!Number.isFinite(hour)) return 'pill';
  if (hour >= 5 && hour < 11) return 'alarm';
  if (hour >= 11 && hour < 17) return 'sunny';
  if (hour >= 17 && hour < 19) return 'meal';
  if (hour >= 19 && hour < 22) return 'moon';
  return 'moon';
};
