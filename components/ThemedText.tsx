import { useTheme } from '@react-navigation/native';
import { StyleSheet, Text, type TextProps } from 'react-native';

import { AppTheme } from '@/app/theme/AppTheme';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'title2' | 'title3' | 'defaultSemiBold' | 'subtitle' | 'link' | 'caption' | 'value' | 'label' | 'explainer';
  uppercase?: boolean;
};

function getTextColor(
  colors: AppTheme['colors'],
  dark: boolean,
  type: ThemedTextProps['type'],
  lightColor?: string,
  darkColor?: string
) {
  if (dark && darkColor) return darkColor;
  if (!dark && lightColor) return lightColor;
  if (type === 'label') return colors.textTertiary ?? colors.text;
  if (type === 'explainer') return colors.textMuted ?? colors.text;
  return colors.text;
}

function getTextStyle(type: ThemedTextProps['type'], colors: AppTheme['colors']) {
  switch (type) {
    case 'default':
      return styles.default;
    case 'title':
      return styles.title;
    case 'title2':
      return styles.title2;
    case 'title3':
      return styles.title3;
    case 'defaultSemiBold':
      return styles.defaultSemiBold;
    case 'subtitle':
      return styles.subtitle;
    case 'link':
      return [styles.link, { color: colors.tint ?? colors.primary }];
    case 'caption':
      return styles.caption;
    case 'label':
      return styles.label;
    case 'explainer':
      return styles.explainer;
    default:
      return undefined;
  }
}

export function ThemedText({ style, lightColor, darkColor, type = 'default', uppercase = false, ...rest }: ThemedTextProps) {
  const { colors, dark } = useTheme();

  const color = getTextColor(colors, dark, type, lightColor, darkColor);
  const textStyle = getTextStyle(type, colors);

  return (
    <Text
      style={[
        { color },
        textStyle,
        uppercase && styles.uppercase,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 14,
    lineHeight: 18,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
    marginBottom: 8,
  },
  title2: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    marginBottom: 4,
  },
  title3: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  caption: {
    fontSize: 12,
    lineHeight: 20,
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
  },
  infoSection: {
    marginVertical: 16,
  },
  label: {
    fontSize: 13,
  },
  explainer: {
    fontSize: 12,
    lineHeight: 16,
  },
  uppercase: {
    textTransform: 'uppercase',
  },
});
