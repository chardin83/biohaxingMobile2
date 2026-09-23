import { useTheme } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import ImagePickerButton from '../ImagePickerButton';
import ImageThumbnailWithDelete from '../ImageThumbnailWithDelete';
import { ThemedModal } from '../ThemedModal';
import { ThemedText } from '../ThemedText';
import LabeledInput from '../ui/LabeledInput';
import Notice from '../ui/Notice';

export type SelectedImageFile = {
  uri: string;
  name: string;
  type: string;
};

interface PackagingAnalysisModalProps {
  visible: boolean;
  initialMealImage: SelectedImageFile | null;
  isAnalyzing: boolean;
  onClose: () => void;
  onAnalyze: (mealFile: SelectedImageFile, mealDescription: string, ingredientFile: SelectedImageFile | null) => void;
}

const PackagingAnalysisModal: React.FC<PackagingAnalysisModalProps> = ({ visible, initialMealImage, isAnalyzing, onClose, onAnalyze }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [mealImage, setMealImage] = useState<SelectedImageFile | null>(null);
  const [mealDescription, setMealDescription] = useState('');
  const [ingredientListImage, setIngredientListImage] = useState<SelectedImageFile | null>(null);

  useEffect(() => {
    if (!visible) return;
    setMealImage(initialMealImage);
    setMealDescription('');
    setIngredientListImage(null);
  }, [visible, initialMealImage]);

  const handleClose = () => {
    onClose();
  };

  const handleAnalyze = () => {
    if (!mealImage || isAnalyzing) return;
    onAnalyze(mealImage, mealDescription.trim(), ingredientListImage);
  };

  return (
    <ThemedModal
      visible={visible}
      title={t('nutritionLogger.packageFlowAnalyze')}
      onClose={handleClose}
      onSave={handleAnalyze}
      onSaveDisabled={!mealImage || isAnalyzing}
      onSaveGlow
      okLabel={t('nutritionLogger.packageFlowAnalyze')}
    >
      {isAnalyzing ? (
        <View style={styles.analyzingContainer}>
          <ActivityIndicator size="large" color={colors.accentDefault} />
          <ThemedText type="defaultSemiBold" style={styles.analyzingTitle}>
            {t('nutritionLogger.analysisInProgress')}
          </ThemedText>
          <Notice variant="info" title={t('nutritionLogger.analysisInProgress')} message={t('nutritionLogger.analysisDoNotCloseApp')} />
        </View>
      ) : (
        <View style={styles.content}>
          {mealImage ? (
            <ImageThumbnailWithDelete
              uri={mealImage.uri}
              onPress={() => setMealImage(null)}
              accessibilityLabel={t('nutritionLogger.packageFlowRemoveMealImage')}
              width={180}
              height={120}
              borderRadius={12}
              badgeSize={30}
              badgeIconSize={16}
            />
          ) : (
            <ImagePickerButton
              onImageSelected={setMealImage}
              isLoading={false}
              label={t('nutritionLogger.packageFlowAddMealImage')}
              style={styles.pickerButton}
            />
          )}
          <LabeledInput
            label={t('nutritionLogger.packageFlowDescriptionLabel')}
            placeholder={t('nutritionLogger.packageFlowDescriptionPlaceholder')}
            value={mealDescription}
            isOptional
            onChangeText={setMealDescription}
            multilineInput
            autoCapitalize="sentences"
            autoCorrect={false}
            containerStyle={styles.descriptionInput}
          />
          <View
            style={[
              styles.ingredientBox,
              {
                borderColor: colors.secondary,
                backgroundColor: colors.secondaryBackground,
              },
            ]}
          >
            <ThemedText
              type="caption"
              style={[
                styles.ingredientBoxTitle,
                {
                  color: colors.textMuted,
                  backgroundColor: colors.secondaryBackground,
                },
              ]}
            >
              {t('nutritionLogger.packageFlowTitle')}
            </ThemedText>
            {ingredientListImage ? (
              <ImageThumbnailWithDelete
                uri={ingredientListImage.uri}
                onPress={() => setIngredientListImage(null)}
                accessibilityLabel={t('nutritionLogger.packageFlowRemoveIngredientImage')}
              />
            ) : (
              <>
                <ImagePickerButton
                  onImageSelected={setIngredientListImage}
                  isLoading={false}
                  label={t('nutritionLogger.packageFlowAddIngredientImage')}
                  buttonVariant="secondary"
                  style={styles.pickerButton}
                />
                <ThemedText type="explainer" style={styles.hint}>
                  {t('nutritionLogger.packageFlowHint')}
                </ThemedText>
              </>
            )}
          </View>
        </View>
      )}
    </ThemedModal>
  );
};

const styles = StyleSheet.create({
  content: {
    width: '100%',
    alignItems: 'stretch',
    gap: 12,
  },
  analyzingContainer: {
    width: '100%',
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  analyzingTitle: {
    textAlign: 'center',
  },
  analyzingInfoBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  analyzingInfoText: {
    flex: 1,
    lineHeight: 18,
  },
  ingredientBox: {
    width: '100%',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 14,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingTop: 20,
    paddingBottom: 12,
    gap: 10,
    alignItems: 'stretch',
    position: 'relative',
  },
  ingredientBoxTitle: {
    position: 'absolute',
    top: -9,
    left: 12,
    paddingHorizontal: 6,
    textAlign: 'left',
  },
  pickerButton: {
    marginTop: 4,
  },
  descriptionInput: {
    marginTop: 2,
  },
  hint: {
    textAlign: 'center',
    opacity: 0.75,
  },
});

export default PackagingAnalysisModal;
