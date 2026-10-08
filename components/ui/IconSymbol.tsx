import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

import { ICON_SYMBOLS, IconSymbolName } from './icon-symbol-map';

interface IconSymbolProps {
  name: IconSymbolName;
  size?: number;
  color: string;
  style?: any;
}

export function IconSymbol({ name, size = 24, color, style }: Readonly<IconSymbolProps>) {
  const iconName = ICON_SYMBOLS[name];

  if (iconName && 'materialCommunity' in iconName) {
    return <MaterialCommunityIcons name={iconName.materialCommunity} size={size} color={color} style={style} />;
  }

  return <MaterialIcons name={iconName?.material ?? 'help'} size={size} color={color} style={style} />;
}
