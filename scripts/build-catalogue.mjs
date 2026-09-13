import { writeFileSync } from 'node:fs';
import { catalogue } from '../lib/catalogue.mjs';
for (const item of catalogue.filter(item => item.image_type === 'illustration')) {
  let shape;
  if (item.category === 'top') {
    shape = `<path d="M106 80 L148 66 Q160 82 172 66 L214 80 L253 155 L218 172 L204 136 L211 318 Q160 329 109 318 L116 136 L102 172 L67 155 Z"/>`;
    shape += item.shape === 'shirt' ? `<path d="M148 66 L139 96 L160 117 L181 96 L172 66 M160 83 V322" fill="none"/><path d="M178 131 H198 V159 Q188 168 178 159 Z" fill="none"/><g fill="#6b7270" stroke="none"><circle cx="166" cy="137" r="2"/><circle cx="166" cy="175" r="2"/><circle cx="166" cy="213" r="2"/><circle cx="166" cy="251" r="2"/><circle cx="166" cy="289" r="2"/></g>` : `<path d="M144 72 Q160 108 176 72 M117 309 Q160 317 204 309" fill="none"/>`;
  } else if (item.shape === 'skirt') {
    shape = `<path d="M115 67 H205 L251 317 Q160 341 69 317 Z"/><path d="M115 81 H205 M135 84 L112 316 M185 84 L208 316" fill="none"/>`;
  } else {
    const ends = item.shape === 'wide' ? [77, 147, 173, 243] : item.shape === 'taper' ? [107, 144, 176, 213] : [91, 145, 175, 229];
    shape = `<path d="M106 67 H214 L${ends[3]} 329 H${ends[2]} L160 170 L${ends[1]} 329 H${ends[0]} Z"/><path d="M107 83 H213 M160 84 V139 L150 150 M112 88 Q114 117 143 118 M208 88 Q206 117 177 118 M124 72 V89 M195 72 V89" fill="none"/><circle cx="166" cy="75" r="2" fill="#746f65"/>`;
  }
  if (item.category === 'top' && /long sleeves/.test(item.design?.details || '')) shape = shape.replace('L253 155 L218 172 L204 136', 'L270 285 L232 298 L204 136').replace('L116 136 L102 172 L67 155', 'L116 136 L88 298 L50 285');
  const stripe = item.pattern === 'striped' ? '<defs><pattern id="stripes" width="13" height="13" patternUnits="userSpaceOnUse"><rect width="13" height="13" fill="'+item.fill+'"/><rect width="2" height="13" fill="#263852"/></pattern></defs>' : '';
  const fill = stripe ? 'url(#stripes)' : item.fill;
  writeFileSync(new URL(`../public${item.image_ref}`, import.meta.url), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 400" role="img" aria-label="Illustration: ${item.description}"><title>${item.description} — illustrative</title><ellipse cx="160" cy="355" rx="89" ry="9" fill="#28251d" opacity=".07"/>${stripe}<g fill="${fill}" stroke="#55584f" stroke-width="1.5" stroke-linejoin="round">${shape}</g></svg>`);
}
