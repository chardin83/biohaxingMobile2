export const ICON_SYMBOLS = {
  'pencil': {
    sf: 'pencil',
    material: 'edit',
  },
  'dashboard': {
    sf: 'rectangle.grid.2x2.fill',
    material: 'dashboard',
  },
  'house.fill': {
    sf: 'house.fill',
    material: 'home',
  },
  'paperplane.fill': {
    sf: 'paperplane.fill',
    material: 'send',
  },
  'chevron.left.forwardslash.chevron.right': {
    sf: 'chevron.left.forwardslash.chevron.right',
    material: 'code',
  },
  'chevron.right': {
    sf: 'chevron.right',
    material: 'chevron-right',
  },
  'chevron.left': {
    sf: 'chevron.left',
    material: 'chevron-left',
  },
  'calendar': {
    sf: 'calendar',
    material: 'calendar-today',
  },
  'clock': {
    sf: 'clock',
    material: 'schedule',
  },
  'alarm': {
    sf: 'alarm',
    material: 'alarm',
  },
  'checklist': {
    sf: 'checklist',
    material: 'checklist',
  },
  'trash': {
    sf: 'trash',
    material: 'delete-sweep',
  },
  'bell.fill': {
    sf: 'bell.fill',
    material: 'notifications-active',
  },
  'bell.slash': {
    sf: 'bell.slash',
    material: 'notifications-off',
  },
  'target': {
    sf: 'target',
    material: 'emoji-events',
  },
  'chat': {
    sf: 'bubble.left.and.bubble.right.fill',
    material: 'chat',
  },
  'expandMore': {
    sf: 'chevron.down', // valfritt SF-symbolnamn
    material: 'expand-more',
  },
  'search': {
    sf: 'magnifyingglass',
    material: 'search',
  },
  'camera': {
    sf: 'camera',
    material: 'photo-camera',
  },
  'flame': {
    sf: 'flame',
    material: 'whatshot',
  },
  'fiber': {
    sf: 'heart.fill',
    material: 'grain',
  },
  'protein': {
    sf: 'dumbbell',
    material: 'fitness-center',
  },
  'carbs': {
    sf: 'leaf',
    material: 'restaurant',
  },
  'fat': {
    sf: 'drop',
    material: 'opacity',
  },
  'polyphenol': {
    sf: 'flask',
    material: 'science',
  },
  'mineral': {
    sf: 'sparkles',
    material: 'diamond',
  },
  'vitamin': {
    sf: 'sun.max.fill',
    material: 'wb-sunny',
  },
  'pill': {
    sf: 'pills.fill',
    material: 'medication',
  },
  'microbiome': {
    sf: 'circle.grid.cross',
    material: 'bubble-chart',
  },
  'chart': {
    sf: 'chart.xyaxis.line',
    material: 'insights',
  },
} as const;

export type IconSymbolName = keyof typeof ICON_SYMBOLS;
