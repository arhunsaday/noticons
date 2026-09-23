// Notion's own surface tokens, read from the product rather than invented, so
// the panel reads as part of the icon popup instead of a guest inside it.
export const SURFACE = {
  light: {
    bg: 'rgb(255,255,255)',
    ink: 'rgb(55,53,47)',
    muted: 'rgba(55,53,47,.65)',
    faint: 'rgba(55,53,47,.45)',
    hover: 'rgba(55,53,47,.06)',
    active: 'rgba(55,53,47,.16)',
    line: 'rgba(55,53,47,.09)',
    field: 'rgba(242,241,238,.6)',
    inset: 'rgba(15,15,15,.1)',
    shadow: 'rgba(15,15,15,.05) 0 0 0 1px, rgba(15,15,15,.1) 0 3px 6px, rgba(15,15,15,.2) 0 9px 24px',
    danger: 'rgb(235,87,87)'
  },
  dark: {
    bg: 'rgb(37,37,37)',
    ink: 'rgba(255,255,255,.81)',
    muted: 'rgba(255,255,255,.46)',
    faint: 'rgba(255,255,255,.28)',
    hover: 'rgba(255,255,255,.055)',
    active: 'rgba(255,255,255,.1)',
    line: 'rgba(255,255,255,.094)',
    field: 'rgba(255,255,255,.055)',
    inset: 'rgba(255,255,255,.075)',
    shadow: 'rgba(15,15,15,.1) 0 0 0 1px, rgba(15,15,15,.2) 0 3px 6px, rgba(15,15,15,.4) 0 9px 24px',
    danger: 'rgb(255,115,105)'
  }
};

export const BLUE = 'rgb(35,131,226)';

/**
 * Notion's text palette, which is what its own page icons are tinted with.
 * Offering exactly these means a monochrome icon matches the heading colours a
 * page already uses; a free colour well is still available underneath.
 */
export const INK_COLORS = [
  { id: 'default', name: 'Default', light: '#37352F', dark: '#D4D4D4' },
  { id: 'gray', name: 'Gray', light: '#787774', dark: '#9B9B9B' },
  { id: 'brown', name: 'Brown', light: '#9F6B53', dark: '#BA856F' },
  { id: 'orange', name: 'Orange', light: '#D9730D', dark: '#C77D48' },
  { id: 'yellow', name: 'Yellow', light: '#CB912F', dark: '#CA9849' },
  { id: 'green', name: 'Green', light: '#448361', dark: '#529E72' },
  { id: 'blue', name: 'Blue', light: '#337EA9', dark: '#5E87C9' },
  { id: 'purple', name: 'Purple', light: '#9065B0', dark: '#9D68D3' },
  { id: 'pink', name: 'Pink', light: '#C14C8A', dark: '#D15796' },
  { id: 'red', name: 'Red', light: '#D44C47', dark: '#DF5452' }
];

export function defaultInk(dark) {
  return dark ? INK_COLORS[0].dark : INK_COLORS[0].light;
}

/** The palette entry a hex belongs to, so the swatch grid can show what is on. */
export function inkName(hex, dark) {
  const match = INK_COLORS.find(c => (dark ? c.dark : c.light).toLowerCase() === String(hex).toLowerCase());
  return match ? match.name : 'Custom';
}
