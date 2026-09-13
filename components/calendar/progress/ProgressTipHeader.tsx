import { useTheme } from '@react-navigation/native';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { getTipTargetIconName } from '@/locales/tips';

type ProgressTipHeaderProps = {
  tipId: string;
  title: string;
  progress?: string;
  progressColor?: string;
};

const ProgressTipHeader = ({ tipId, title, progress, progressColor }: ProgressTipHeaderProps) => {
  const { colors } = useTheme();
  const icon = getTipTargetIconName(tipId);

  return (
    <View style={styles.header}>
      {icon && (
        <View style={[styles.iconCircle, { backgroundColor: colors.accentWeak }]}>
          <IconSymbol name={icon} size={20} color={colors.textMuted} />
        </View>
      )}
      <ThemedText type="defaultSemiBold" style={styles.title}>
        {title}
      </ThemedText>
      {progress && (
        <ThemedText type="title3" style={{ color: progressColor }}>
          {progress}
        </ThemedText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
  },
});

export default ProgressTipHeader;
