import { TFunction } from 'i18next';
import React, { useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, View } from 'react-native';
import Markdown from 'react-native-markdown-display';

import { Colors } from '@/app/theme/Colors';
import ImagePickerButton from '@/components/ImagePickerButton';
import { ThemedModal } from '@/components/ThemedModal';
import { ThemedText } from '@/components/ThemedText';
import AppBox from '@/components/ui/AppBox';

interface AnalysisModalProps {
  visible: boolean;
  onClose: () => void;
  t: TFunction;
  prompt: string;
  onConfirm?: () => void;
  description?: string;
  supplement?: string;
  analyzeFn: (file: {
    uri?: string;
    name?: string;
    type?: string;
    file_base64?: string;
    mime?: string;
  }) => Promise<any>;
}

const AnalysisModal: React.FC<AnalysisModalProps> = ({
  visible,
  onClose,
  t,
  onConfirm,
  description,
  supplement,
  analyzeFn,
}) => {
  const [gptAnalysis, setGptAnalysis] = useState<string | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);

  const handleAnalysis = async (file: {
    uri: string;
    name?: string;
    type?: string;
    file_base64?: string;
    mime?: string;
  }) => {
    try {
      setLoadingAnalysis(true);
      setGptAnalysis(null);
      setImageUri(file.uri ?? null);

      // Nu anropar modalen bara analyzeFn som ligger i details och får tillbaka { output, preview? } eller en string
      const result = await analyzeFn({
        uri: file.uri,
        name: file.name,
        type: file.type,
        file_base64: (file as any).file_base64,
        mime: (file as any).mime,
      });

      console.log('[FileAnalysisModal] analyzeFn returned:', result);

      if (!result) {
        setGptAnalysis(t('common:goalDetails.noAnswer'));
        return;
      }

      if (typeof result === 'string') {
        setGptAnalysis(result);
        return;
      }

      // förväntar { output: string, preview?: string }
      if (result.output) {
        setImageUri(result.preview ?? file.uri ?? null);
        setGptAnalysis(result.output);
        return;
      }

      // fallback
      setGptAnalysis(typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result));
    } catch (err) {
      console.error('❌ Analysis failed:', err);
      setGptAnalysis(t('common:goalDetails.analysisError'));
    } finally {
      setLoadingAnalysis(false);
    }
  };

  return (
    <ThemedModal
      visible={visible}
      title={`${t('common:goalDetails.analysisTitle')} ${supplement ?? t('common:goalDetails.defaultTitle')}`}
      onClose={() => {
        setGptAnalysis(null);
        setImageUri(null);
        onClose();
      }}
      onSave={gptAnalysis?.includes('✅') ? onConfirm : undefined}
      onSecondarySave={undefined}
      okLabel={gptAnalysis?.includes('✅') ? t('common:goalDetails.start') : ''}
      ok2Label={undefined}
    >
      {imageUri && (
        <Image
          source={{ uri: imageUri }}
          style={{
            width: 200,
            height: 200,
            alignSelf: 'center',
            marginBottom: 10,
            borderRadius: 10,
          }}
        />
      )}

      {loadingAnalysis ? (
        <View style={{ alignItems: 'center', padding: 20 }}>
          <ActivityIndicator size="large" color={Colors.dark.primary} />
          <Text style={{ color: Colors.dark.textLight, marginTop: 10 }}>{t('common:goalDetails.loading')}</Text>
        </View>
      ) : gptAnalysis ? (
        <AppBox title="🧠 Analys">
          <ScrollView style={{ maxHeight: 300 }}>
            <Markdown
              style={{
                body: { color: Colors.dark.text },
                heading1: { color: Colors.dark.primary, fontSize: 18, marginBottom: 8 },
                bullet_list: { paddingLeft: 10 },
              }}
            >
              {gptAnalysis}
            </Markdown>
          </ScrollView>
        </AppBox>
      ) : (
        <>
          <ThemedText style={{ textAlign: 'center', color: Colors.dark.textLight, marginBottom: 12 }}>
            {description ?? t('common:goalDetails.selectFileBody')}
          </ThemedText>

          <ImagePickerButton
            onImageSelected={handleAnalysis}
            isLoading={loadingAnalysis}
            label={t('common:imagePicker.title')}
          />
        </>
      )}
    </ThemedModal>
  );
};

export default AnalysisModal;
