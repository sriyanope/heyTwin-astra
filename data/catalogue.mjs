// Original heyTwin vector illustrations; no third-party imagery or retailer catalogue.
export const catalogue = [
  { id: 'cream-trousers', category: 'bottom', colour: 'cream', pattern: 'solid', description: 'Cream wide-leg trousers', shape: 'wide', fill: '#e3d7bd' },
  { id: 'indigo-jeans', category: 'bottom', colour: 'indigo', pattern: 'solid', description: 'Indigo straight-leg jeans', shape: 'straight', fill: '#405976' },
  { id: 'olive-trousers', category: 'bottom', colour: 'olive', pattern: 'solid', description: 'Olive tapered trousers', shape: 'taper', fill: '#79816a' },
  { id: 'black-skirt', category: 'bottom', colour: 'black', pattern: 'solid', description: 'Black A-line midi skirt', shape: 'skirt', fill: '#383a3c' },
  { id: 'white-shirt', category: 'top', colour: 'white', pattern: 'solid', description: 'White relaxed collared shirt', shape: 'shirt', fill: '#f8f6ef' },
  { id: 'black-knit', category: 'top', colour: 'black', pattern: 'solid', description: 'Black short-sleeve knit top', shape: 'tee', fill: '#383a3c' },
  { id: 'blue-shirt', category: 'top', colour: 'light blue', pattern: 'solid', description: 'Light blue collared shirt', shape: 'shirt', fill: '#a8c3d0' },
  { id: 'rust-tee', category: 'top', colour: 'rust', pattern: 'solid', description: 'Rust relaxed cotton T-shirt', shape: 'tee', fill: '#b86b50' }
].map(item => ({ ...item, image_ref: `/catalogue/${item.id}.svg` }));
