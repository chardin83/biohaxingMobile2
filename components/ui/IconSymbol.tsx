import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

import AIChatIcon from './AIChatIcon';
import { ICON_SYMBOLS, IconSymbolName } from './icon-symbol-map';

interface IconSymbolProps {
  name: IconSymbolName;
  size?: number;
  color: string;
  style?: any;
}

export function IconSymbol({ name, size = 24, color, style }: Readonly<IconSymbolProps>) {
  if (name === 'aiChat') return <AIChatIcon size={size} color={color} style={style} />;

  const iconName = ICON_SYMBOLS[name];

  if (iconName && 'materialCommunity' in iconName) {
    return (
      <MaterialCommunityIcons accessible={false} importantForAccessibility="no" name={iconName.materialCommunity} size={size} color={color} style={style} />
    );
  }

  return <MaterialIcons accessible={false} importantForAccessibility="no" name={iconName?.material ?? 'help'} size={size} color={color} style={style} />;
}
