import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import React, { forwardRef, useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, View } from 'react-native';

import { BarcodeProduct, getProductByBarcode } from '@/services/openFoodFacts';

import { ThemedText } from '../ThemedText';
import AppButton from '../ui/AppButton';
import { useBottomSheetDesign } from '../ui/BottomSheetDesign';
import LabeledInput from '../ui/LabeledInput';

interface BarcodeScannerBottomSheetProps {
  onProductFound: (product: BarcodeProduct) => void;
}

const BarcodeScannerBottomSheet = forwardRef<BottomSheetModal, BarcodeScannerBottomSheetProps>(({ onProductFound }, ref) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const sheetDesign = useBottomSheetDesign(colors);
  const [manualBarcode, setManualBarcode] = useState('');

  const [permission, requestPermission] = useCameraPermissions();

  const [hasScanned, setHasScanned] = useState(false);

  const scanningRef = useRef(false);

  const submitBarcode = useCallback(
    async (barcode: string) => {
      const normalizedBarcode = barcode.trim();

      if (!normalizedBarcode || scanningRef.current) {
        return;
      }

      scanningRef.current = true;
      setHasScanned(true);

      try {
        const product = await getProductByBarcode(normalizedBarcode);

        if (!product) {
          Alert.alert(t('nutritionLogger.barcodeScanner.productNotFoundTitle'), t('nutritionLogger.barcodeScanner.productNotFoundMessage'));

          scanningRef.current = false;
          setHasScanned(false);
          return;
        }

        onProductFound(product);
      } catch (error) {
        console.error('Barcode lookup failed:', error);

        Alert.alert(t('nutritionLogger.barcodeScanner.lookupFailedTitle'), t('nutritionLogger.barcodeScanner.lookupFailedMessage'));

        scanningRef.current = false;
        setHasScanned(false);
      }
    },
    [onProductFound, t]
  );

  const handleBarcodeScanned = useCallback(
    async (result: BarcodeScanningResult) => {
      await submitBarcode(result.data);
    },
    [submitBarcode]
  );

  const handleDismiss = () => {
    scanningRef.current = false;
    setHasScanned(false);
    setManualBarcode('');
  };

  const handleManualBarcode = () => {
    submitBarcode(manualBarcode);
  };

  if (!permission) {
    return null;
  }

  return (
    <BottomSheetModal
      ref={ref}
      enablePanDownToClose
      enableDynamicSizing
      backgroundStyle={sheetDesign.backgroundStyle}
      handleComponent={sheetDesign.handleComponent}
      onDismiss={handleDismiss}
    >
      <BottomSheetView style={styles.content}>
        <View style={styles.header}>
          <ThemedText type="title2">{t('nutritionLogger.barcodeScanner.title')}</ThemedText>

          <ThemedText type="caption" style={{ color: colors.textMuted }}>
            {t('nutritionLogger.barcodeScanner.description')}
          </ThemedText>
        </View>

        {!permission.granted ? (
          <View style={styles.permission}>
            <ThemedText type="default" style={styles.permissionText}>
              {t('nutritionLogger.barcodeScanner.cameraPermission')}
            </ThemedText>

            <AppButton
              title={t('nutritionLogger.barcodeScanner.allowCamera')}
              onPress={() => {
                requestPermission().catch(console.error);
              }}
            />
          </View>
        ) : (
          <>
            <View style={styles.cameraContainer}>
              <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                autofocus="on"
                barcodeScannerSettings={{
                  barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'],
                }}
                onBarcodeScanned={hasScanned ? undefined : handleBarcodeScanned}
              />

              <View pointerEvents="none" style={styles.scannerOverlay}>
                <View
                  style={[
                    styles.scannerFrame,
                    {
                      borderColor: colors.accentStrong,
                    },
                  ]}
                />
              </View>
            </View>
            <View style={styles.manualSection}>
              <ThemedText type="caption" style={{ color: colors.textMuted }}>
                {t('nutritionLogger.barcodeScanner.manualDescription')}
              </ThemedText>

              <LabeledInput
                label={t('nutritionLogger.barcodeScanner.barcode')}
                value={manualBarcode}
                onChangeText={setManualBarcode}
                keyboardType="number-pad"
                returnKeyType="search"
                onSubmitEditing={handleManualBarcode}
                placeholder={t('nutritionLogger.barcodeScanner.barcodePlaceholder')}
              />

              <AppButton
                title={t('nutritionLogger.barcodeScanner.search')}
                onPress={handleManualBarcode}
                disabled={!manualBarcode.trim() || hasScanned}
                variant="secondary"
              />
            </View>
          </>
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
});

BarcodeScannerBottomSheet.displayName = 'BarcodeScannerBottomSheet';

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
    gap: 20,
  },
  header: {
    alignItems: 'center',
    gap: 4,
  },
  cameraContainer: {
    width: '100%',
    height: 300,
    borderRadius: 16,
    overflow: 'hidden',
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerFrame: {
    width: '82%',
    height: 120,
    borderWidth: 2,
    borderRadius: 12,
  },
  permission: {
    gap: 16,
    paddingVertical: 24,
  },
  permissionText: {
    textAlign: 'center',
  },
  manualSection: {
    gap: 12,
  },
});

export default BarcodeScannerBottomSheet;
