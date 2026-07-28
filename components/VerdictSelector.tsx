  import { Ionicons } from '@expo/vector-icons';
  import { useTheme } from '@react-navigation/native';
  import type { ComponentProps } from 'react';
  import { useTranslation } from 'react-i18next';
  import { Pressable, StyleSheet, Text, View } from 'react-native';

  import AppBox from '@/components/ui/AppBox';
  import { POSITIVE_VERDICTS, VerdictValue } from '@/types/verdict';

  type Props = Readonly<{
    currentVerdict?: VerdictValue | string | null;
    onVerdictPress: (verdict: VerdictValue) => void;
  }>;

  const ICON_SIZE = 36;
  const favoriteVerdicts = new Set(POSITIVE_VERDICTS);

  const OPTION_ORDER: { key: VerdictValue; iconName: ComponentProps<typeof Ionicons>['name']; labelKey: string }[] = [
    { key: VerdictValue.StartNow, iconName: 'play-circle-outline', labelKey: 'verdictStartNow' }, // I'll try this
    { key: VerdictValue.Interested, iconName: 'repeat-outline', labelKey: 'verdictAlreadyDoing' }, // Already doing it
    { key: VerdictValue.AlreadyWorks, iconName: 'checkmark-circle-outline', labelKey: 'verdictAlreadyWorks' }, // Already tried, it worked
    { key: VerdictValue.TestedFailed, iconName: 'close-circle-outline', labelKey: 'verdictTestedFailed' }, // Didn't work
    { key: VerdictValue.NotInterested, iconName: 'remove-circle-outline', labelKey: 'verdictNotInterested' }, // Not for me
  ];

  export default function VerdictSelector({ currentVerdict, onVerdictPress }: Props) {
    const { t } = useTranslation();
    const { colors } = useTheme();

    return (
      <AppBox title={t('common:tipDetails.verdict')}>
        {OPTION_ORDER.map(option => {
          const isSelected = currentVerdict === option.key || currentVerdict === option.key.toString();
          const leadsToFavorite = favoriteVerdicts.has(option.key);
          return (
            <Pressable
              key={option.key}
              style={[styles.optionRow, { backgroundColor: isSelected ? colors.accentWeak : colors.accentVeryWeak, borderColor: isSelected ? colors.accentDefault : colors.accentWeak }]}
              onPress={() => onVerdictPress(option.key)}
            >
              <View style={styles.left}> 
                <View style={[styles.iconBox, { backgroundColor: colors.background }]}> 
                  <Ionicons name={option.iconName} size={ICON_SIZE} color={colors.primary} />
                </View>
                <View style={styles.textWrap}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.title, { color: colors.primary }]}>{t(`common:tipDetails.${option.labelKey}`)}</Text>
                    {leadsToFavorite ? <Ionicons name="star" size={14} color={colors.primary} style={styles.favoriteStar} /> : null}
                  </View>
                </View>
              </View>
              <Text style={[styles.right, { color: colors.primary }]}>{isSelected ? '✓' : '○'}</Text>
            </Pressable>
          );
        })}
      </AppBox>
    );
  }

  const styles = StyleSheet.create({
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 12,
      marginBottom: 10,
      borderRadius: 12,
      borderWidth: 1,
    },
    left: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconBox: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    textWrap: {
      maxWidth: '75%',
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
    },
    favoriteStar: {
      marginLeft: 6,
    },
    right: {
      fontSize: 16,
      fontWeight: '700',
    },
  });