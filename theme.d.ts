import type { AppTheme } from "./app/theme/AppTheme"; // <-- justera sökväg

declare module "@react-navigation/native" {
  export function useTheme(): AppTheme;
}