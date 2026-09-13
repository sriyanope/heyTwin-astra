// Original heyTwin vector illustrations. Always available so the app and its tests never
// depend on the imported photo catalogue being present.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const illustrations = [
  { id: 'cream-trousers', category: 'bottom', colour: 'cream', pattern: 'solid', description: 'Cream wide-leg trousers', shape: 'wide', fill: '#e3d7bd' },
  { id: 'indigo-jeans', category: 'bottom', colour: 'indigo', pattern: 'solid', description: 'Indigo straight-leg jeans', shape: 'straight', fill: '#405976' },
  { id: 'olive-trousers', category: 'bottom', colour: 'olive', pattern: 'solid', description: 'Olive tapered trousers', shape: 'taper', fill: '#79816a' },
  { id: 'black-skirt', category: 'bottom', colour: 'black', pattern: 'solid', description: 'Black A-line midi skirt', shape: 'skirt', fill: '#383a3c' },
  { id: 'white-shirt', category: 'top', colour: 'white', pattern: 'solid', description: 'White relaxed collared shirt', shape: 'shirt', fill: '#f8f6ef' },
  { id: 'black-knit', category: 'top', colour: 'black', pattern: 'solid', description: 'Black short-sleeve knit top', shape: 'tee', fill: '#383a3c' },
  { id: 'blue-shirt', category: 'top', colour: 'light blue', pattern: 'solid', description: 'Light blue collared shirt', shape: 'shirt', fill: '#a8c3d0' },
  { id: 'rust-tee', category: 'top', colour: 'rust', pattern: 'solid', description: 'Rust relaxed cotton T-shirt', shape: 'tee', fill: '#b86b50' }
].map(item => ({ ...item, image_ref: `/catalogue/${item.id}.svg`, image_type: 'illustration', source_name: 'heyTwin (original illustration)' }));

// Real, sourced photos collected by scripts/catalogue/*.mjs (see CATALOGUE.md). Only items
// a human has reviewed and approved (review_status "approved", active !== false) are fed
// into live recommendations — see data/catalogue-items.json for the full record set,
// including anything still needs_review or rejected, which stays out of this list.
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const itemsPath = path.join(root, 'data', 'catalogue-items.json');
let realItems = [];
try {
  const records = JSON.parse(fs.readFileSync(itemsPath, 'utf8'));
  realItems = records
    .filter(item => item.review_status === 'approved' && item.active !== false)
    .filter(item => fs.existsSync(path.join(root, item.image_local || '')))
    .map(item => ({
      id: item.id, category: item.category, colour: item.colour_primary || '', pattern: item.pattern || 'solid',
      description: item.description || item.name, image_ref: item.image_ref, image_type: item.image_type, source_name: item.source_name,
    }));
} catch { /* no imported catalogue yet — illustrations alone still power the demo */ }

export const catalogue = [...illustrations, ...realItems];
