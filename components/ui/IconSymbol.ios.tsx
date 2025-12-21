import { SymbolView } from "expo-symbols";
import { ICON_SYMBOLS, IconSymbolName } from "./icon-symbol-map";
import { StyleProp, ViewStyle } from "react-native";

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight = "regular",
}: {
  name: IconSymbolName;
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
  weight?: "regular" | "bold";
}) {
  const sfName = ICON_SYMBOLS[name]?.sf ?? "questionmark.circle";

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
