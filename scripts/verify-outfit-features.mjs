// Explicit live check: invokes configured providers and can use API credits.
// Successful cached outputs are reused; failures are never retried automatically.
import fs from 'node:fs/promises';
import path from 'node:path';
import { loadEnv, validateImage } from '../server.mjs';
import { createGenerationService } from '../lib/generation.mjs';
import { createProductSearch } from '../lib/product-search.mjs';
import { digest, pairingContext, publicImageURL } from '../lib/pairings.mjs';
import { catalogue } from '../data/catalogue.mjs';

const file = process.argv[2];
const garmentOnly = file === '--garment-only';
const description = garmentOnly ? 'No original photo sent; garment image check only.' : process.argv[3];
if (!file || !description) throw new Error('Usage: node scripts/verify-outfit-features.mjs --garment-only OR /path/to/consented.jpg "Visible original garment description"');
const env = loadEnv();
const type = { '.png': 'png', '.jpg': 'jpeg', '.jpeg': 'jpeg', '.webp': 'webp' }[path.extname(file).toLowerCase()];
if (!garmentOnly && !type) throw new Error('Use a JPG, PNG or WebP.');
const image = garmentOnly ? '' : validateImage(`data:image/${type};base64,${(await fs.readFile(file)).toString('base64')}`);
const context = pairingContext({ image_hash: digest(image), confirmed: { category: 'top', colour: 'as in reference', pattern: 'as in reference', description } }, catalogue.find(item => item.id === 'indigo-jeans'));
const generation = createGenerationService({ env });
const report = { checked_at: new Date().toISOString(), kind: 'live-provider-check', pairing_id: context.pairing_id, original_description: description, checks: {} };
await fs.mkdir('test-results', { recursive: true });
async function record() { await fs.writeFile('test-results/outfit-live-results.json', JSON.stringify(report, null, 2)); }
async function generate(kind, enabled) {
  if (!enabled) { report.checks[kind] = { status: 'blocked', reason: `Missing image API key` }; await record(); return; }
  let state = await generation.start(kind, context, { ...(kind === 'preview' ? { image } : {}) });
  const deadline = Date.now() + 4 * 60000;
  while (['pending', 'processing'].includes(state[kind].status) && Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    state = await generation.state(context);
    console.log(`${kind}: ${state[kind].status}`);
  }
  report.checks[kind] = state[kind];
  await record();
}
try {
  const imagesConfigured = Boolean(env.IMAGE_API_KEY || env.OPENAI_API_KEY || env.VISION_MODEL_API_KEY);
  await generate('image', imagesConfigured);
  if (!garmentOnly) await generate('preview', imagesConfigured);
  else report.checks.preview = { status: 'blocked', reason: 'Pending explicit approval to send the original verification photo to OpenAI.' };
  if (process.argv.includes('--skip-search')) report.checks.search = { status: 'blocked', reason: 'Live shopping check omitted: credential-use approval pending.' };
  else if (env.SERPAPI_API_KEY) {
    const state = await generation.state(context);
    report.checks.search = await createProductSearch({ env }).search({ attributes: context.attributes, imageUrl: publicImageURL(env.PUBLIC_ASSET_ORIGIN, state.image.asset_url) });
  } else report.checks.search = { status: 'blocked', reason: 'Missing SERPAPI_API_KEY' };
  await record();
  console.log(JSON.stringify(report, null, 2));
} finally { await generation.close(); }
