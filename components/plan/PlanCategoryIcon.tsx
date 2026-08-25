import { useTheme } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { IconSymbol } from '@/components/ui/IconSymbol';

export type PlanCategory = 'training' | 'nutrition' | 'supplement' | 'other';

type PlanCategoryIconProps = {
  category: PlanCategory;
  variant?: 'badge' | 'plain';
  size?: number;
};

const badgeStyle = StyleSheet.create({
  container: {
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const getIconName = (category: PlanCategory): React.ComponentProps<typeof IconSymbol>['name'] => {
  switch (category) {
    case 'training':
      return 'trainingGym';
    case 'nutrition':
      return 'flame';
    case 'supplement':
      return 'pill';
    case 'other':
      return 'ellipsis';
    default:
      return 'target';
  }
};

export const getPlanCategoryIconColor = (category: PlanCategory, colors: any) => {
  switch (category) {
    case 'training':
      return colors.planSectionIcon;
    case 'nutrition':
      return colors.planSectionNutritionIcon;
    case 'supplement':
      return colors.planSectionSupplementIcon;
    case 'other':
      return colors.planSectionOtherIcon;
    default:
      return colors.icon;
  }
};

const getIconColors = (category: PlanCategory, colors: any) => {
  const iconColor = getPlanCategoryIconColor(category, colors);

  switch (category) {
    case 'training':
      return { iconColor, tintColor: colors.planSectionIconTint };
    case 'nutrition':
      return { iconColor, tintColor: colors.planSectionNutritionTint };
    case 'supplement':
      return { iconColor, tintColor: colors.planSectionSupplementTint };
    case 'other':
      return { iconColor, tintColor: colors.planSectionOtherTint };
    default:
      return { iconColor, tintColor: colors.overlayLight };
  }
};

export default function PlanCategoryIcon({ category, variant = 'badge', size }: Readonly<PlanCategoryIconProps>) {
  const { colors } = useTheme();
  const iconName = getIconName(category);
  const { iconColor, tintColor } = getIconColors(category, colors);

  if (variant === 'plain') {
    return <IconSymbol name={iconName} size={size ?? 18} color={iconColor} />;
  }

const badgeSize = size ? size + 8 : 30;

  return (
    <View style={[badgeStyle.container, { width: badgeSize, height: badgeSize, borderColor: iconColor, backgroundColor: tintColor }]}> 
      <IconSymbol name={iconName} size={size ?? 20} color={iconColor} />
    </View>
  );
}
