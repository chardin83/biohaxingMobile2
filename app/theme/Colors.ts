const tintColorLight = '#0a7ea4';
const tintColorDark = '#00FFFF'; // anpassad till din accentfärg

export const Colors = {
  light: {
    text: '#11181C',
    background: 'rgba(248,245,240,1)',
    modalBackground: 'rgba(255,250,240,1)',
    tint: tintColorLight,
    //tabIconDefault: '#687076',
    //tabIconSelected: tintColorLight,
    primary: '#1FAE9E',
    secondary: 'rgba(17,24,28,0.35)',
    secondaryBackground: '#F7FAFC',
    border: 'rgba(255,184,80,0.28)',
    borderLight: 'rgba(233, 7, 14, 0.08)',
    progressBar: '#FFB300',
    icon: '#FFB300',
    iconBackground: '#FFF3DD',
    iconBorder:'rgba(233, 7, 14, 0.08)',

    textWhite: '#fff',
    checkmarkMeal: '#2EC4B6',//'#00FFC8',
    checkmarkSupplement: '#8EDB6D',//'#CBEA3C',
    xp:'#CBEA3C',

    buttonGlowBackground: 'rgba(31, 174, 158, 0.18)',
    buttonGlow: 'rgba(31, 174, 158, 0.85)',
    buttonTextGlow: 'rgba(31, 174, 158, 0.6)',
    assistantBubble: '#73CEC0',
    userBubble: '#EEE6DA',
    delete: '#FF3B30',
    error: '#FF3B30',
    readinessRed: 'rgba(255,120,100,0.95)',

    // Core colors
    accentColor: 'rgba(0,191,174,1)', // Cyan - primary accent
    warmColor: 'rgba(255,100,100,1)', // Red - sympathetic/stress
    successColor: 'rgba(255,215,0,1)', // Gold - relevant/success
    infoColor: 'rgba(0,150,255,1)', // Blue - information

    // Text variants
    textPrimary: 'rgba(17,24,28,0.95)', // Strong text
    textSecondary: 'rgba(17,24,28,0.85)', // Secondary text
    textTertiary: 'rgba(17,24,28,0.7)', // Tertiary text
    textLight: 'rgba(17,24,28,0.6)', // Light gray text
    textMuted: 'rgba(17,24,28,0.5)', // Muted/disabled text
    textWeak: 'rgba(17,24,28,0.1)', // Very weak/borders

    // Accent opacity variants
    accentStrong: 'rgba(0,191,174,0.95)',
    accentDefault: 'rgba(0,191,174,0.6)',
    accentMedium: 'rgba(0,191,174,0.4)',
    accentWeak: 'rgba(0,191,174,0.18)',
    accentVeryWeak: 'rgba(0,191,174,0.05)',

    // Neutral overlays
    overlayLight: 'rgba(0,0,0,0.04)',

    // Warm/Red variants
    warmDefault: 'rgba(255,100,100,0.15)',
    warmWeak: 'rgba(255,100,100,0.05)',

    // Success/Gold variants
    successDefault: 'rgba(255,215,0,0.3)',
    successWeak: 'rgba(255,215,0,0.08)',

    // Info/Blue variants
    infoDefault: 'rgba(0,150,255,0.2)',
    infoWeak: 'rgba(0,150,255,0.06)',

    cardActive: '#E6FFFA',

    // Gradients
    gradients: {
      sunrise: {
        colors: ['#FFF9F0', '#FFE9C7', '#FFD08A', '#FFE3B5','#FFF6E5',],
        locations1: [0, 0.7, 1],
        locations2: [0, 0.5, 1],
        locations3: [0, 0.3, 1],
        start: { x: 0.5, y: 0 },
        end: { x: 0.5, y: 1 },
      },
      sunriseUp: {
        colors: ['#FF8E53', '#FFD580', '#FFF5E1'],
        locations: [0, 0.6, 1],
        start: { x: 0.3, y: 1 },
        end: { x: 0.5, y: 0.2 },
      },
    },
    cardBackground: 'rgba(252, 239, 225, 0.6)', // Transparent card bakgrund
    cardBorder: 'rgba(255,190,120,0.45)', // Transparent card border
    cardTitle: 'rgba(17,24,28,0.85)',
    //checkmark: '#C3FF00',

    goldenGlowButtonText: '#2e2a26',
    goldenGlowButtonBackground: 'rgba(255, 246, 231, 0.92)',
    goldenGlowButtonGlow: 'rgba(255, 170, 60, 0.9)',

    gold: 'rgba(255,215,100,0.95)',
    goldSoft: 'rgba(255,215,100,0.75)',
    surfaceRed: 'rgba(217, 83, 79, 0.12)',
    surfaceRedBorder: 'rgba(217, 83, 79, 0.9)',
    surfaceGreen: 'rgba(60, 179, 113, 0.12)',
    surfaceGreenBorder: 'rgba(60, 179, 113, 0.95)',

     area: {
      energy: 'rgba(255,191,0, 0.95)', // gold
      mind: 'rgba(0,191,174,0.95)',     // accentStrong
      sleep: '#32D1A6',                 // primary
      nervousSystem: 'rgba(120,170,255,0.95)',    // lugn blå (tidigare röd)
      strength: 'rgba(255,120,100,0.95)',   // tomato
      digestiveHealth: 'rgba(170,220,120,0.95)',  // grön (unik)
      cardio: 'rgba(255,140,180,0.95)',           // rosa (unik)
      immuneSystem: 'rgba(120,220,220,0.95)',     // turkos (unik)
      // Lägg till fler områden vid behov
    },
    goldGradient: [
      '#C99700', // mörk guld
      '#FFD700', // klassisk guld
      '#FFB300', // djupare guld
    ],
    showAllAccent: 'rgba(199, 121, 36, 0.95)',
  },
  dark: {
     area: {
      energy: 'rgba(255,215,100,0.95)', // gold
      mind: 'rgba(0,191,174,0.95)',     // accentStrong
      sleep: '#1FAE9E',                 // primary
      nervousSystem: 'rgba(120,170,255,0.95)', // lugn blå
      strength: 'rgba(255,120,100,0.95)',   // tomato
      digestiveHealth: 'rgba(170,220,120,0.95)',  // grön (unik)
      cardio: 'rgba(255,140,180,0.95)',           // rosa (unik)
      immuneSystem: 'rgba(120,220,220,0.95)',     // turkos (unik)
    },
    text: '#ECEDEE',
    background: '#001326',
    modalBackground: '#122033',
    tint: tintColorDark,
    icon: '#2fe0c5',
    iconBackground: '#0f2f33',
    iconBorder:'rgba(47, 224, 197, 0.35)',
    //tabIconDefault: '#9BA1A6',
    //tabIconSelected: tintColorDark,
    primary: '#32D1A6',
    secondary: 'rgba(255,255,255,0.5)',
    secondaryBackground: '#122033',
    border: '#013255',
    borderLight: 'rgba(255,255,255,0.10)',
    progressBar: '#0269B0',

    textWhite: '#fff',
    checkmarkMeal: '#00FFC8',
    checkmarkSupplement: '#C3FF00',
    xp:'#B6F000',
    buttonGlowBackground: 'rgba(4,26,34,0.2)',
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
    //checkmark: '',
    goldenGlowButtonText: '#fff7e6',
    goldenGlowButtonBackground: 'rgba(11, 16, 33, 0.9)',
    goldenGlowButtonGlow: 'rgba(255, 180, 80, 0.8)',
    
    gold: 'rgba(255,215,100,0.95)',
    goldSoft: 'rgba(255,215,100,0.75)',
    surfaceRed: 'rgba(255,100,100,0.12)',
    surfaceRedBorder: 'rgba(255,100,100,0.3)',
    surfaceGreen: 'rgba(100,255,150,0.12)',
    surfaceGreenBorder: 'rgba(100,255,150,0.3)',

     goldGradient: [
      'rgba(255, 180, 80, 0.8)', // mörk guld
      '#C99700', // mörk guld (nederst)
      '#FFFBEA', // nästan vit (överst)
    ],
  },
};
