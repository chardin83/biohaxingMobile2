import { MaterialIcons } from '@expo/vector-icons';

import { ICON_SYMBOLS, IconSymbolName } from './icon-symbol-map';

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string;
  style?: any;
}) {
  const iconName = ICON_SYMBOLS[name] ?? 'help';

  return <MaterialIcons name={iconName.material} size={size} color={color} style={style} />;
}
