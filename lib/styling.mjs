import { seasonalPalettes } from '../public/seasonal-palettes.js';
export { seasonalPalettes };
export const genderDirections = { unspecified: 'No gender preference; offer varied, gender-inclusive styling.', woman: 'User selected Woman: favour womenswear styling and garment cuts, including trousers, denim, skirts, shirts and knits as appropriate.', man: 'User selected Man: favour menswear styling and garment cuts, especially trousers, denim, shirts and knits.', nonbinary: 'User selected Non-binary: offer gender-inclusive styling without assuming masculine or feminine presentation.' };
// App-authored styling interpretations. Reference notes: STYLING_REFERENCES.md.
export const styleDirections = {
  stockholm: { label: 'Stockholm', brief: 'Understated, polished ease: relaxed pleated tailoring, straight denim, fine knits, crisp poplin. Use the selected seasonal palette for colour. Balance volume with a clean line; avoid making every look tight, cropped or formal.' },
  copenhagen: { label: 'Copenhagen', brief: 'Playful but wearable: easy proportions, a crisp stripe or one unexpected colour relationship. Choose the colour relationship from the selected seasonal palette. Use one expressive element; do not add random saturated colours or clash multiple busy prints.' },
};
// Approximate garment swatches, not measurements of the uploaded garment.
const swatches = { 'light blue':'#A8C3D0', 'powder blue':'#A8C3D0', blue:'#7194AF', indigo:'#293F63', navy:'#263852', ink:'#263852', cream:'#E7DDC4', ivory:'#EEE7D4', ecru:'#E9E2D2', stone:'#C9C2B2', white:'#F4F2ED', black:'#24262B', charcoal:'#4F5052', grey:'#92938F', gray:'#92938F', olive:'#747653', sage:'#A6AD91', 'butter yellow':'#E8D89D', yellow:'#E8D89D', 'dusty rose':'#CBABB0', pink:'#CBABB0', chocolate:'#554038', espresso:'#44362F', brown:'#775744', burgundy:'#703F4C', rust:'#A75435', red:'#A95345', green:'#747653', purple:'#8F7D91', lilac:'#B5A2BA', beige:'#D5C5AA' };
export function colourSwatch(name) {
  const value = String(name || '').toLowerCase().trim();
  if (Object.hasOwn(swatches, value)) return swatches[value];
  const matches = Object.keys(swatches).filter(key => new RegExp('(^|[^a-z])' + key + '([^a-z]|$)').test(value));
  // Do not pretend a multicoloured garment is one measured colour.
  const values = [...new Set(matches.map(key => swatches[key]))];
  return values.length === 1 ? values[0] : null;
}
export function colourStory(original, item) {
  return [{ label: original.colour, hex: colourSwatch(original.colour), role: 'Your item' },
    { label: item.colour, hex: item.colour_hex || item.fill || colourSwatch(item.colour), role: 'Suggested pairing' }];
}
export function stylingPrompt(confirmed, analysis, allowed, occasion, direction, season = 'auto', gender = 'unspecified') {
  const directions = direction === 'mixed' ? Object.entries(styleDirections) : [[direction, styleDirections[direction]]];
  return [
    'Act as a discerning wardrobe stylist. Recommend up to three genuinely distinct, wearable top-and-bottom outfits around this exact existing garment.',
    'User-confirmed attributes are authoritative, including corrections: ' + JSON.stringify(confirmed) + '. Original photo analysis for context only: ' + JSON.stringify(analysis),
    'Occasion: ' + (occasion || 'everyday') + '. Requested direction: ' + direction + '.',
    ...directions.map(([id, style]) => id + ': ' + style.brief),
    direction === 'mixed' ? 'For three looks, aim for one quiet Stockholm look, one playful Copenhagen look and a third refined alternative. Assign an honest style_id to each.' : 'Every look must follow the requested style_id, but vary the garment, colour relationship and silhouette.',
    'Seasonal colour reference: use the user-supplied spring, summer, autumn and winter chart. Selected palette: ' + season + '. Available palettes (approximate screen hex): ' + JSON.stringify(season === 'auto' ? seasonalPalettes : { [season]: seasonalPalettes[season] }) + '. The seasonal palette takes priority over city styling. Follow its direction and exclusions. Choose the closest harmonious catalogue colours within this palette. Use only compatible grounding neutrals; a neutral is not an excuse to ignore the season. If the catalogue has only one or two suitable pieces, return fewer outfits instead of adding an off-palette choice. Never claim a seasonal skin analysis or infer a personal colour season. Include palette_id for the chosen listed palette in each outfit.',
    genderDirections[gender] + ' This is an explicit clothing preference, not a body or fit claim. Do not infer gender from the photo. Colours are available to every gender.',
    'Start from the actual confirmed garment colour; never recolour the user item to force a palette. For a patterned original, ground it with a solid that echoes a visible colour or a quiet neutral. Reserve a suggested stripe for an original it can complement. Treat black, navy and denim as intentional choices, not automatic defaults.',
    'A voluminous original needs a considered counter-shape; a compact top can work with relaxed wide trousers. Match the occasion and materials. No body, sizing or physical-fit assumptions. No accessories, shoes, extra layers, brands or invented product availability.',
    'Select only complementary item IDs from this illustrative catalogue: ' + JSON.stringify(allowed.map(({id,description,colour,pattern,category,design}) => ({id,description,colour,pattern,category,design}))) + '.',
    'Before answering, check each choice: does it respect the original, suit the occasion, create a deliberate colour relationship, and differ meaningfully from the other looks? Return one or two if a third is weak.',
    'Give a short editorial look name. Each explanation must cite the original colour/pattern AND a concrete silhouette/material relationship; avoid empty phrases such as timeless pairing, balances the colour, elevates the look. Under 35 words. styling_tip is one practical garment-only suggestion, under 20 words, without changing the garment or inventing features.',
    'Return JSON: {"outfits":[{"catalogue_item_id":"valid ID","style_id":"stockholm|copenhagen","palette_id":"listed seasonal palette ID","name":"short look name","explanation":"specific reason","styling_tip":"practical suggestion","confidence":0.0}]}. Do not return image URLs.'
  ].join('\n');
}
