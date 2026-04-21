import { MaterialIcons } from '@expo/vector-icons';

import { ICON_SYMBOLS, IconSymbolName } from './icon-symbol-map';

interface IconSymbolProps {
   name: IconSymbolName;
   size?: number;
   color: string;
   style?: any;
}

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: Readonly<IconSymbolProps>) {
  const iconName = ICON_SYMBOLS[name] ?? 'help';

  return <MaterialIcons name={iconName.material} size={size} color={color} style={style} />;
}
