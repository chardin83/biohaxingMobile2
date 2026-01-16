export const ICON_SYMBOLS = {
  "pencil": {
    sf: "pencil",
    material: "edit",
  },
  "dashboard": {
    sf: "rectangle.grid.2x2.fill",
    material: "dashboard",
  },
  "house.fill": {
    sf: "house.fill",
    material: "home",
  },
  "paperplane.fill": {
    sf: "paperplane.fill",
    material: "send",
  },
  "chevron.left.forwardslash.chevron.right": {
    sf: "chevron.left.forwardslash.chevron.right",
    material: "code",
  },
  "chevron.right": {
    sf: "chevron.right",
    material: "chevron-right",
  },
  "calendar": {
    sf: "calendar",
    material: "calendar-today",
  },
  "clock": {
    sf: "clock",
    material: "schedule",
  },
  "checklist": {
    sf: "checklist",
    material: "checklist",
  },
  "trash": {
    sf: "trash",
    material: "delete-sweep",
  },
  "bell.fill": {
    sf: "bell.fill",
    material: "notifications-active",
  },
  "bell.slash": {
    sf: "bell.slash",
    material: "notifications-off",
  },
  "target": {
    sf: "target",
    material: "emoji-events",
  },
  chat: {
    sf: "bubble.left.and.bubble.right.fill",
    material: "chat",
  },
  "expandMore": {
  sf: "chevron.down", // valfritt SF-symbolnamn
  material: "expand-more",
},
} as const;

export type IconSymbolName = keyof typeof ICON_SYMBOLS;
