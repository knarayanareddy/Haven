// ─── Haven Icon Mapping ───
// Maps semantic icon names to MaterialCommunityIcons glyph names.
// All navigation, tab, and category icons use outline style for consistency.

export const havenIcons = {
  home: 'home-outline',
  pills: 'pill',
  shield: 'shield-outline',
  family: 'account-group-outline',
  microphone: 'microphone-outline',
  calendar: 'calendar-outline',
  compass: 'compass-outline',
  neighbourhood: 'home-group',
  hospital: 'hospital-box-outline',
  clipboard: 'clipboard-text-outline',
  document: 'file-document-edit-outline',
  alert: 'alert-outline',
  stethoscope: 'stethoscope',
  lock: 'lock-outline',
  location: 'map-marker-outline',
  brain: 'brain',
  chart: 'chart-bar',
  heart: 'heart-outline',
  chat: 'chat-outline',
  checkCircle: 'check-circle-outline',
  video: 'video-outline',
  handshake: 'handshake-outline',
  phone: 'phone-outline',
  book: 'book-open-variant',
  moon: 'moon-waning-crescent',
  emergency: 'alarm-light-outline',
  settings: 'cog-outline',
  more: 'dots-horizontal',
} as const;

export type HavenIconName = keyof typeof havenIcons;
