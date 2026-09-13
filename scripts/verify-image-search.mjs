// Checks an already generated, isolated white shirt. Never uploads an original photo
// or creates images/models. Uses one cached-or-live vision check and Shopping search.
import fs from 'node:fs/promises';
import { loadEnv, createProvider } from '../server.mjs';
import { createSearchProfile } from '../lib/search-profile.mjs';
import { createProductSearch } from '../lib/product-search.mjs';
import { createGenerationService } from '../lib/generation.mjs';
import { pairingContext } from '../lib/pairings.mjs';
import { catalogue } from '../data/catalogue.mjs';

const env = loadEnv();
const generation = createGenerationService({ env, fetchImpl: async () => { throw new Error('Generation disabled in this check.'); } });
try {
  const context = pairingContext({ image_hash: 'verification', confirmed: { category: 'bottom', colour: 'blue', pattern: 'solid', description: 'Blue denim shorts' } }, catalogue.find(item => item.id === 'white-shirt'));
  const state = (await generation.state(context)).image;
  if (state.status !== 'succeeded') throw new Error('A cached white-shirt image is required; this script never generates one.');
  const asset = await generation.asset(state.asset_url.split('/').pop());
  const started = Date.now();
  const profile = await createSearchProfile({ provider: createProvider(env), model: `${env.VISION_MODEL || ''}:${env.VISION_API_URL || env.VISION_MODEL_BASE_URL || ''}` }).resolve({ attributes: context.attributes, asset });
  const result = await createProductSearch({ env }).search({ attributes: profile.attributes });
  const report = { checked_at: new Date().toISOString(), elapsed_ms: Date.now() - started, asset_url: state.asset_url, profile, result };
  await fs.mkdir('verification/product-search', { recursive: true });
  await fs.writeFile('verification/product-search/image-search.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (profile.basis !== 'generated_image' || profile.attributes.sleeves !== 'long sleeve' || result.status !== 'succeeded') process.exitCode = 1;
} finally { await generation.close(); }
