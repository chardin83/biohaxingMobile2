// Utility to compute blur tint/intensity from a color string
export type BlurTint = 'light' | 'dark';

function parseColorToRgb(c: string): [number, number, number] | null {
  try {
    // tidigare: const m = c.match(/^#?([a-f\d]{3}|[a-f\d]{6})$/i);
    const re = /^#?([a-f\d]{3}|[a-f\d]{6})$/i;
    const m = re.exec(c);
    if (m) {
      const hex = m[1];
      if (hex.length === 3) {
        const r = Number.parseInt(hex[0] + hex[0], 16);
        const g = Number.parseInt(hex[1] + hex[1], 16);
        const b = Number.parseInt(hex[2] + hex[2], 16);
        return [r, g, b];
      } else {
        const r = Number.parseInt(hex.substring(0, 2), 16);
        const g = Number.parseInt(hex.substring(2, 4), 16);
        const b = Number.parseInt(hex.substring(4, 6), 16);
        return [r, g, b];
      }
    }
  } catch {
    // ignore
  }
  return null;
}

function luminanceFromRgb([r, g, b]: [number, number, number]) {
  const srgb = [r, g, b].map(v => v / 255).map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

export function getBlurSettings(color: string): { tint: BlurTint; intensity: number } {
  const rgb = parseColorToRgb(String(color ?? ''));
  const lum = rgb ? luminanceFromRgb(rgb) : 1;
  const tint: BlurTint = lum < 0.45 ? 'dark' : 'light';
  const intensity = lum < 0.45 ? 40 : 20;
  return { tint, intensity };
}
