import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import postcss from 'postcss';

// Check the actual CSS tokens, including tinted states and hover buttons.
const css = postcss.parse(readFileSync(new URL('../src/app/globals.css', import.meta.url), 'utf8'));
const luminance = (hex) => {
  const channels = hex.slice(1).match(/../g).map((part) => {
    const value = parseInt(part, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels.reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
};
const ratio = (a, b) => {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
};
let checks = 0;
let minimumText = Infinity;
for (const theme of ['light', 'dark']) {
  const tokens = {};
  css.walkRules(`html[data-a11y="colorblind"].${theme}`, (rule) => {
    rule.walkDecls((declaration) => { tokens[declaration.prop] = declaration.value; });
  });
  const surfaces = theme === 'light' ? ['#ffffff', '#f2f4f8', '#f1f5f9'] : ['#000000', '#171717', '#262626'];
  for (const kind of ['blue', 'success', 'warning', 'error', 'secondary']) {
    const token = (role) => {
      const value = tokens[`--cv-${kind}-${role}`];
      assert.match(value ?? '', /^#[0-9a-f]{6}$/i, `Missing ${theme} ${kind} ${role}`);
      return value;
    };
    for (const background of [...surfaces, token('soft')]) {
      const contrast = ratio(token('text'), background);
      assert(contrast >= 4.5, `${theme} ${kind}: text contrast ${contrast.toFixed(2)} on ${background}`);
      minimumText = Math.min(minimumText, contrast);
      checks++;
    }
    for (const role of ['solid', 'hover']) {
      const contrast = ratio('#ffffff', token(role));
      assert(contrast >= 4.5, `${theme} ${kind} ${role}: white text contrast ${contrast.toFixed(2)}`);
      minimumText = Math.min(minimumText, contrast);
      checks++;
    }
    for (const background of [...surfaces, token('soft')]) {
      assert(ratio(token('border'), background) >= 3, `${theme} ${kind}: state border contrast below 3:1`);
      checks++;
    }
  }
}
console.log(`${checks} contrast checks passed. Minimum text contrast: ${minimumText.toFixed(2)}:1.`);
