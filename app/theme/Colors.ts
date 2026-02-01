const tintColorLight = '#0a7ea4';
const tintColorDark = '#00FFFF'; // anpassad till din accentfärg

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    primary: '#00FFFF',
    secondary: '#122033',
    border: '#013255',
    borderLight: '#008FB3',
    progressBar: '#0269B0',
    textLight: '#ccc',
    textWhite: '#fff',
    checkmark: '#C3FF00',
    buttonGlow: '#00ffffcc',
    buttonTextGlow: '#00ffff88',

    //copied from dark mode for consistency
    assistantBubble: '#E0E0E0',
    delete: '#FF3B30',
    error: '#FF3B30',
    readinessRed: 'rgba(255,120,100,0.95)', // Lägg till denna rad
    checkmarkMeal: '#00FFC8',
    checkmarkSupplement: '#C3FF00',
    accentWeak: 'rgba(120,255,220,0.18)',

    textSecondary: 'rgba(255,255,255,0.85)', // Secondary text
    textTertiary: 'rgba(255,255,255,0.7)', // Tertiary text
    textMuted: 'rgba(255,255,255,0.5)', // Muted/disabled text
    textWeak: 'rgba(255,255,255,0.1)', // Very weak/borders
       // Neutral overlays
    overlayLight: 'rgba(255,255,255,0.1)',

    accentDefault: 'rgba(120,255,220,0.6)',
    accentMedium: 'rgba(120,255,220,0.4)',
    accentStrong: 'rgba(120,255,220,0.95)',
     accentVeryWeak: 'rgba(120,255,220,0.05)',

     successColor: 'rgba(255,215,0,1)',

    cardActive: '#223B50',

    // Gradients
    gradients: {
      sunrise: {
        colors: ['#0B1021', '#1F3150', '#FF8E53'],
        locations1: [0, 0.7, 1],
        locations2: [0, 0.5, 1],
        locations3: [0, 0.3, 1],
        start: { x: 0.5, y: 0.35 },
        end: { x: 0.5, y: 1 },
      },
      sunriseUp: {
        colors: ['#FF8E53', '#FFD580', '#FFF5E1'],
        locations: [0, 0.6, 1],
        start: { x: 0.3, y: 1 },
        end: { x: 0.5, y: 0.2 },
      },
    },
    cardBackground: 'rgba(255,255,255,0.06)', // Transparent card bakgrund
    cardBorder: 'rgba(255,215,100,0.18)', // Transparent card border
    cardTitle: 'rgba(255,255,255,0.85)',

    successDefault: 'rgba(255,215,0,0.6)',
    successWeak: 'rgba(255,215,0,0.08)',

        // Warm/Red variants
    warmDefault: 'rgba(255,100,100,0.5)',
    warmWeak: 'rgba(255,100,100,0.05)',

    gold: 'rgba(255,215,100,0.95)',
    goldSoft: 'rgba(255,215,100,0.75)',
    surfaceRed: 'rgba(255,100,100,0.12)',
    surfaceRedBorder: 'rgba(255,100,100,0.3)',
    surfaceGreen: 'rgba(100,255,150,0.12)',
    surfaceGreenBorder: 'rgba(100,255,150,0.3)',
  },
  dark: {
    text: '#ECEDEE',
    background: '#001326',
    tint: tintColorDark,
    icon: '#00FFFF',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    primary: '#32D1A6',
    secondary: '#122033',
    border: '#013255',
    borderLight: 'rgba(255,255,255,0.10)',
    progressBar: '#0269B0',

    textWhite: '#fff',
    checkmarkMeal: '#00FFC8',
    checkmarkSupplement: '#C3FF00',
    buttonGlow: '#00ffffcc',
    buttonTextGlow: '#00ffff88',
    assistantBubble: '#2C2C2C',
    delete: '#FF3B30',
    error: '#FF3B30',
    readinessRed: 'rgba(255,120,100,0.95)', // Lägg till denna rad

    // Core colors
    accentColor: 'rgba(120,255,220,1)', // Cyan - primary accent
    warmColor: 'rgba(255,100,100,1)', // Red - sympathetic/stress
    successColor: 'rgba(255,215,0,1)', // Gold - relevant/success
    infoColor: 'rgba(120,200,255,1)', // Blue - information

    // Text variants
    textPrimary: 'rgba(255,255,255,0.95)', // Strong text
    textSecondary: 'rgba(255,255,255,0.85)', // Secondary text
    textTertiary: 'rgba(255,255,255,0.7)', // Tertiary text
    textLight: '#ccc',
    textMuted: 'rgba(255,255,255,0.5)', // Muted/disabled text
    textWeak: 'rgba(255,255,255,0.1)', // Very weak/borders


    // Accent opacity variants
    accentStrong: 'rgba(120,255,220,0.95)',
    accentDefault: 'rgba(120,255,220,0.6)',
    accentMedium: 'rgba(120,255,220,0.4)',
    accentWeak: 'rgba(120,255,220,0.18)',
    accentVeryWeak: 'rgba(120,255,220,0.05)',

    // Neutral overlays
    overlayLight: 'rgba(255,255,255,0.1)',

    // Warm/Red variants
    warmDefault: 'rgba(255,100,100,0.5)',
    warmWeak: 'rgba(255,100,100,0.05)',

    // Success/Gold variants
    successDefault: 'rgba(255,215,0,0.6)',
    successWeak: 'rgba(255,215,0,0.08)',

    // Info/Blue variants
    infoDefault: 'rgba(120,200,255,0.5)',
    infoWeak: 'rgba(120,200,255,0.06)',

    cardActive: '#223B50',

    // Gradients
    gradients: {
      sunrise: {
        colors: ['#0B1021', '#1F3150', '#FF8E53'],
        locations1: [0, 0.7, 1],
        locations2: [0, 0.5, 1],
        locations3: [0, 0.3, 1],
        start: { x: 0.5, y: 0.35 },
        end: { x: 0.5, y: 1 },
      },
      sunriseUp: {
        colors: ['#FF8E53', '#FFD580', '#FFF5E1'],
        locations: [0, 0.6, 1],
        start: { x: 0.3, y: 1 },
        end: { x: 0.5, y: 0.2 },
      },
    },
    cardBackground: 'rgba(255,255,255,0.06)', // Transparent card bakgrund
    cardBorder: 'rgba(255,215,100,0.18)', // Transparent card border
    cardTitle: 'rgba(255,255,255,0.85)',
    checkmark: '',
    
    gold: 'rgba(255,215,100,0.95)',
    goldSoft: 'rgba(255,215,100,0.75)',
    surfaceRed: 'rgba(255,100,100,0.12)',
    surfaceRedBorder: 'rgba(255,100,100,0.3)',
    surfaceGreen: 'rgba(100,255,150,0.12)',
    surfaceGreenBorder: 'rgba(100,255,150,0.3)',
  },
};
