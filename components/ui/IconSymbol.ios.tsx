import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SymbolView } from 'expo-symbols';
import { StyleProp, ViewStyle } from 'react-native';

import { ICON_SYMBOLS, IconSymbolName } from './icon-symbol-map';

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight = 'regular',
}:  Readonly<{
  name: IconSymbolName;
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
  weight?: 'regular' | 'bold';
}>) {
  const definition = ICON_SYMBOLS[name];
  if (definition && 'useMaterialCommunityOnIOS' in definition && definition.useMaterialCommunityOnIOS) {
    return <MaterialCommunityIcons name={definition.materialCommunity} size={size} color={color} style={style} />;
  }
  const sfName = definition?.sf ?? 'questionmark.circle';

  return (
    <SymbolView
      name={sfName}
      weight={weight}
      tintColor={color}
      resizeMode="scaleAspectFit"
      style={[{ width: size, height: size }, style]}
    />
  );
}
