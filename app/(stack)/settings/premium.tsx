import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, Platform, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import AppButton from '@/components/ui/AppButton';
import { Card } from '@/components/ui/Card';
import Container from '@/components/ui/Container';
import { IconSymbol } from '@/components/ui/IconSymbol';
import PremiumOffer from '@/components/ui/PremiumOffer';
import { PREMIUM } from '@/constants/Premium';

export default function PremiumSettingsPage() {
  const { t } = useTranslation('common');
  const { colors } = useTheme();
  const manageSubscription = async () => {
    const url = Platform.OS === 'ios'
      ? 'https://apps.apple.com/account/subscriptions'
      : 'https://play.google.com/store/account/subscriptions';
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(t('premium.premium'), t('premium.manageUnavailable'));
    }
  };
  return (
    <Container background="default" showBackButton>
      {PREMIUM ? (
        <Card>
          <View style={styles.member}>
            <IconSymbol name="crown" size={32} color={colors.premium} />
            <ThemedText type="title2">{t('premium.premium')}</ThemedText>
            <ThemedText>{t('premium.activeSubscription')}</ThemedText>
            <AppButton title={t('premium.cancelSubscription')} onPress={manageSubscription} />
            <ThemedText type="explainer">{t('premium.cancelExplainer')}</ThemedText>
          </View>
        </Card>
      ) : <PremiumOffer />}
    </Container>
  );
}

const styles = StyleSheet.create({ member: { gap: 16 } });
