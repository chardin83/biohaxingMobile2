import { useTheme } from '@react-navigation/native';
import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { IconSymbol } from './ui/IconSymbol';

type ImageThumbnailWithDeleteProps = {
  uri: string;
  onPress: () => void;
  accessibilityLabel: string;
  width?: number;
  height?: number;
  borderRadius?: number;
  badgeSize?: number;
  badgeIconSize?: number;
};

const ImageThumbnailWithDelete: React.FC<ImageThumbnailWithDeleteProps> = ({
  uri,
  onPress,
  accessibilityLabel,
  width = 180,
  height = 180,
  borderRadius = 14,
  badgeSize = 32,
  badgeIconSize = 18,
}) => {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.thumbnailPressable,
        {
          width,
          height,
          borderRadius,
          borderColor: colors.borderLight,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Image source={{ uri }} style={styles.thumbnailImage} resizeMode="cover" />
      <View
        style={[
          styles.thumbnailTrashBadge,
          {
            width: badgeSize,
            height: badgeSize,
            borderTopLeftRadius: borderRadius,
            borderBottomRightRadius: borderRadius,
            borderColor: colors.surfaceRedBorder,
            backgroundColor: colors.surfaceRed,
          },
        ]}
        pointerEvents="none"
      >
        <IconSymbol name="trash" size={badgeIconSize} color="white" />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  thumbnailPressable: {
    alignSelf: 'center',
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailTrashBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ImageThumbnailWithDelete;
