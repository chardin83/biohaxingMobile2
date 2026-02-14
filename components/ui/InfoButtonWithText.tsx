import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';

interface InfoButtonWithTextProps {
  infoTextKey: string;
  children?: React.ReactNode; // t.ex. progressbar
  style?: object;
}

export const InfoButtonWithText: React.FC<InfoButtonWithTextProps> = ({
  infoTextKey,
  children,
  style,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation(['common']);
  const [show, setShow] = React.useState(false);

  return (
    <View style={style}>
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarWrap}>{children}</View>
        <Pressable
          onPress={() => setShow(s => !s)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={[
            styles.infoButton,
            { borderColor: colors.accentStrong },
          ]}
        >
          <ThemedText type="explainer" style={[styles.infoButtonText, { color: colors.accentStrong }]}>ⓘ</ThemedText>
        </Pressable>
      </View>
      {show && (
        <View style={styles.infoTextWrap}>
          <ThemedText type="explainer" style={styles.infoText}>
            {t(infoTextKey)}
          </ThemedText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  progressBarContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 0,
  },
  progressBarWrap: {
    width: '100%',
  },
  infoButton: {
    position: 'absolute',
    right: 30,
    top: '50%',
    marginTop: -11, // half of button height to center vertically
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoButtonText: {
    fontWeight: '700',
    fontSize: 12,
  },
  infoTextWrap: {
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
});