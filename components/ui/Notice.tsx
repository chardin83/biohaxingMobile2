import { useTheme } from '@react-navigation/native';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/ThemedText';

import { CloseButton } from './CloseButton';
import type { IconSymbolName } from './icon-symbol-map';
import { IconSymbol } from './IconSymbol';

type NoticeVariant = 'info' | 'success' | 'warning' | 'tutorial' | 'subtle' | 'error';

type NoticeProps = Readonly<{
  title?: string;
  message: string;
  variant?: NoticeVariant;
  iconName?: IconSymbolName;
  showIcon?: boolean;
  onDismiss?: () => void;
  dismissLabel?: string;
  dismissAccessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}>;

export default function Notice({
  title,
  message,
  variant = 'info',
  iconName,
  showIcon = true,
  onDismiss,
  dismissLabel,
  dismissAccessibilityLabel = 'Dismiss',
  style,
  children,
}: NoticeProps) {
  const { colors } = useTheme();
  const { t } = useTranslation('common');
  const [dismissed, setDismissed] = React.useState(false);
  const isTutorial = variant === 'tutorial';
  const actionLabel = isTutorial ? t('general.understood') : dismissLabel;
  const dismiss = () => {
    if (isTutorial) setDismissed(true);
    onDismiss?.();
  };

  const isWarning = variant === 'warning';

  const variantStyles = {
    error: { backgroundColor: 'rgba(255,59,48,0.1)', accentColor: colors.error, iconName: 'error' },
    subtle: { backgroundColor: 'transparent', accentColor: colors.textMuted, iconName: 'privacy' },
    info: { backgroundColor: colors.infoWeak, accentColor: colors.infoColor, iconName: 'info' },
    success: { backgroundColor: colors.surfaceGreen, accentColor: colors.surfaceGreenBorder, iconName: 'check' },
    warning: { backgroundColor: colors.surfaceWarning, accentColor: colors.warning, iconName: 'warning' },
    tutorial: { backgroundColor: colors.primaryVeryWeak, accentColor: colors.primary, iconName: 'info' },
  } as const;

  const { backgroundColor, accentColor, iconName: defaultIconName } = variantStyles[variant];
  const textColor = isWarning || isTutorial || variant === 'error' ? accentColor : undefined;
  const textStyle = textColor ? { color: textColor } : undefined;

  if (dismissed) return null;

  return (
    <View
      accessibilityRole={variant === 'error' ? 'alert' : undefined}
      accessibilityLiveRegion={variant === 'error' ? 'polite' : undefined}
      style={[
        styles.container,
        {
          backgroundColor,
          borderColor: variant === 'subtle' ? colors.borderLight : accentColor,
        },
        style,
      ]}
    >
      {showIcon && (
        <View
          style={[
            styles.icon,
            {
              backgroundColor: colors.cardBackground,
              borderColor: accentColor,
            },
            variant === 'subtle' && styles.subtleIcon,
          ]}
        >
          <IconSymbol name={iconName ?? defaultIconName} size={iconName ? 20 : 16} color={accentColor} />
        </View>
      )}
      <View style={styles.textContainer}>
        {title ? (
          <ThemedText type="defaultSemiBold" style={textStyle}>
            {title}
          </ThemedText>
        ) : null}
        <ThemedText type={variant === 'subtle' ? 'explainer' : 'caption'} style={textStyle}>
          {message}
        </ThemedText>
        {children}
        {(isTutorial || (onDismiss && actionLabel)) && (
          <Pressable onPress={dismiss} accessibilityRole="button" accessibilityLabel={actionLabel} style={styles.dismissAction}>
            <ThemedText type="defaultSemiBold" style={{ color: accentColor }}>
              {actionLabel}
            </ThemedText>
            <IconSymbol name="check" size={18} color={accentColor} />
          </Pressable>
        )}
      </View>
      {!isTutorial && onDismiss && !actionLabel && <CloseButton onPress={onDismiss} accessibilityLabel={dismissAccessibilityLabel} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 16,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
  },
  subtleIcon: { backgroundColor: 'transparent', borderWidth: 0, width: 20, height: 20 },
  icon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  dismissAction: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 6,
    minHeight: 24,
    paddingHorizontal: 4,
    marginTop: 4,
  },
});
