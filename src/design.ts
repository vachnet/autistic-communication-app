export const PALETTES = {
  sage: { name: 'เขียวอ่อน', ink: '#173C39', muted: '#425C57', primary: '#146B5C', paper: '#F4F7F2', surface: '#FAFCF8', soft: '#E3EEE6', selected: '#E6F3DF', line: '#748A80', onPrimary: '#FFFFFF', notice: '#FFF0CF', noticeInk: '#69480E' },
  sand: { name: 'ครีมอุ่น', ink: '#42352B', muted: '#665649', primary: '#765236', paper: '#F7F2E9', surface: '#FFFAF1', soft: '#EEE3D3', selected: '#F4DFC0', line: '#93816D', onPrimary: '#FFFFFF', notice: '#FFF0CF', noticeInk: '#69480E' },
  slate: { name: 'ฟ้าเทา', ink: '#263B4A', muted: '#475E6D', primary: '#365F7D', paper: '#EFF3F6', surface: '#F9FBFD', soft: '#E0E8F0', selected: '#D5E5F4', line: '#7B8D9C', onPrimary: '#FFFFFF', notice: '#FFF0CF', noticeInk: '#69480E' },
} as const;
export type PaletteId = keyof typeof PALETTES;
export type Palette = { [K in keyof typeof PALETTES.sage]: string };
export const MIN_TOUCH_SIZE = 48;

/** Use actual content width, including safe-area insets and text scaling. */
export function layoutFor(width: number, fontScale = 1, insetLeft = 0, insetRight = 0) {
  const scale = Number.isFinite(fontScale) ? Math.max(1, fontScale) : 1;
  const available = Math.max(1, Math.min(1100, width - insetLeft - insetRight));
  const padding = available < 360 ? 12 : 20;
  const contentWidth = Math.max(1, available - padding * 2);
  const minCardWidth = 146 * scale;
  const columns = Math.max(1, Math.min(4, Math.floor((contentWidth + 12) / (minCardWidth + 12))));
  return { padding, contentWidth, columns, cardWidth: (contentWidth - 12 * (columns - 1)) / columns };
}

export function contrastRatio(a: string, b: string) {
  const luminance = (hex: string) => {
    const [r, g, blue] = [1, 3, 5].map(i => {
      const v = parseInt(hex.slice(i, i + 2), 16) / 255;
      return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * blue;
  };
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}
