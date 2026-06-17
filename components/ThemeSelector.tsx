import { useTheme } from '@react-navigation/native';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View  } from 'react-native';

import { getStoredPreferredTheme, setPreferredTheme } from '@/app/context/themeEvents';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';

export type ThemeChoice = 'device' | 'light' | 'dark';
const choices: ThemeChoice[] = ['device', 'light', 'dark'];

type Props = Readonly<{
  onChange?: (choice: ThemeChoice) => void;
}>;

export default function ThemeSelector({ onChange }: Props) {
  const { t } = useTranslation('common');
  const { colors } = useTheme();
  const [selected, setSelected] = React.useState<ThemeChoice>('device');

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const stored = await getStoredPreferredTheme();
      if (mounted && stored) setSelected(stored);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const onPick = async (c: ThemeChoice) => {
    try {
      setSelected(c);
      await setPreferredTheme(c);
      onChange?.(c);
    } catch (err) {
      console.warn('ThemeSelector: failed to save', err);
    }
  };

  return (
    <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.cardBackground }]}> 
      {choices.map((choice, i) => {
        // extracted from nested ternaries
        let iconName: string;
        if (choice === 'dark') {
          iconName = 'moon';
        } else if (choice === 'device') {
          iconName = 'smartphone';
        } else {
          iconName = 'sunny';
        }

        let label: string;
        if (choice === 'device') {
          label = t('themeSelector.device');
        } else if (choice === 'dark') {
          label = t('themeSelector.dark');
        } else {
          label = t('themeSelector.light');
        }

        return (
          <Pressable
            key={choice}
            onPress={() => onPick(choice)}
            style={[styles.row, i === choices.length - 1 ? styles.rowNoBorder : styles.rowBorder]}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconCircle, { backgroundColor: colors.overlayLight }]}> 
                <IconSymbol name={iconName as any} size={20} color={colors.icon} />
              </View>
              <ThemedText type="default" style={styles.label}>{label}</ThemedText>
            </View>
            {selected === choice ? <IconSymbol name="check" size={18} color={colors.primary} /> : <ThemedText type="default">{''}</ThemedText>}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    width: '100%',
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowNoBorder: {
    borderBottomWidth: 0,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginLeft: 12,
    fontSize: 16,
  },
});
