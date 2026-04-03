import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleProp, ViewStyle } from 'react-native';

import AppButton from './ui/AppButton';

interface ImagePickerButtonProps {
  // now returns a local file descriptor instead of base64
  onImageSelected: (file: { uri: string; name: string; type: string }) => void;
  isLoading?: boolean;
  label?: string;
  style?: StyleProp<ViewStyle>;
}

const ImagePickerButton: React.FC<ImagePickerButtonProps> = ({
  onImageSelected,
  isLoading = false,
  label = 'Välj bild',
  style,
}) => {
  const { t } = useTranslation();

  const handlePick = async (fromCamera: boolean) => {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    const granted = (permission as any).granted ?? (permission as any).status === 'granted';
    if (!granted) {
      Alert.alert(t('permissions.title'), t('permissions.message'));
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({
          base64: false,
          quality: 0.45,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          base64: false,
          quality: 0.45,
        });

    if (!result.canceled && result.assets?.length) {
      const image = result.assets[0];
      const uri = image.uri;
      // try common fields for filename/mime
      const name =
        (image as any).fileName ??
        (image as any).name ??
        (uri ? uri.split('/').pop() : undefined) ??
        `photo_${Date.now()}.jpg`;
      const mimeType = (image as any).mimeType;
      let type = 'image/jpeg';
      if (typeof mimeType === 'string' && mimeType.trim().length > 0) {
        type = mimeType;
      } else if ((image as any).type && typeof (image as any).type === 'string') {
        type = (image as any).type;
      }

      onImageSelected({ uri, name, type });
    }
  };

  const showOptions = () => {
    Alert.alert(t('imagePicker.title'), undefined, [
      {
        text: t('imagePicker.takePhoto'),
        onPress: () => {
          handlePick(true).catch(console.error);
        },
      },
      {
        text: t('imagePicker.chooseFromLibrary'),
        onPress: () => {
          handlePick(false).catch(console.error);
        },
      },
      {
        text: t('general.cancel'),
        style: 'cancel',
      },
    ]);
  };

  return (
    <AppButton
      title={isLoading ? t('dayEdit.analyzing') : label}
      onPress={showOptions}
      disabled={isLoading}
      variant="primary"
      icon="camera"
      style={style}
      glow
    />
  );
};

export default ImagePickerButton;
