import assert from 'node:assert/strict';
import test from 'node:test';
import { PALETTES, layoutFor, contrastRatio, MIN_TOUCH_SIZE } from './design.ts';

for (const [id, p] of Object.entries(PALETTES)) {
  test(`${id}: every enabled text/surface pairing meets WCAG AA normal-text contrast`, () => {
    const pairs = [
      [p.ink, p.paper], [p.muted, p.paper], [p.ink, p.soft], [p.muted, p.soft],
      [p.primary, p.paper], [p.primary, p.soft], [p.primary, p.surface], [p.ink, p.surface],
      [p.ink, p.selected], [p.primary, p.selected], [p.onPrimary, p.primary],
      [p.noticeInk, p.notice],
    ];
    for (const [fg, bg] of pairs) assert.ok(contrastRatio(fg, bg) >= 4.5, `${fg} on ${bg}: ${contrastRatio(fg, bg)}`);
  });
  test(`${id}: card boundaries and selected boundaries remain distinguishable`, () => {
    assert.ok(contrastRatio(p.line, p.surface) >= 3);
    assert.ok(contrastRatio(p.primary, p.selected) >= 3);
  });
}
test('contrast math matches white/black reference and is symmetric', () => {
  assert.equal(contrastRatio('#FFFFFF', '#000000'), 21);
  assert.equal(contrastRatio('#000000', '#FFFFFF'), 21);
  assert.equal(contrastRatio('#FFFFFF', '#FFFFFF'), 1);
});
test('responsive card math fits phones, landscape, tablets, split views and large text', () => {
  for (const width of [280, 320, 360, 375, 390, 414, 480, 520, 568, 667, 740, 768, 820, 1024, 1180, 1366]) {
    for (const fontScale of [1, 1.3, 1.6, 2, 2.5, 3]) {
      for (const inset of [0, 24, 59]) {
        const l = layoutFor(width, fontScale, inset, inset);
        assert.ok(l.columns >= 1 && l.columns <= 4);
        assert.ok(l.cardWidth > MIN_TOUCH_SIZE);
        assert.ok(l.cardWidth * l.columns + (l.columns - 1) * 12 <= l.contentWidth + 0.001);
        if (l.columns > 1) assert.ok(l.cardWidth >= 146 * fontScale);
      }
    }
  }
});
test('large text reduces column count and tablet content has bounded line width', () => {
  assert.equal(layoutFor(320, 2).columns, 1);
  assert.equal(layoutFor(1366).columns, 4);
  assert.equal(layoutFor(1366).contentWidth, 1060);
  assert.ok(layoutFor(820, 3).columns < layoutFor(820, 1).columns);
});
