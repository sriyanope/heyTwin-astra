// Explicit live verification: one authored reference, one 2D preview and one text-to-parameters 3D job.
// Uses configured OpenAI credits. No shopping or Meshy requests; no automatic paid retries.
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { loadEnv } from '../server.mjs';
import { createGenerationService } from '../lib/generation.mjs';
import { digest, pairingContext } from '../lib/pairings.mjs';
import { catalogue } from '../data/catalogue.mjs';

const env = loadEnv();
if (env.MODEL_3D_PROVIDER === 'meshy') throw new Error('This check requires the OpenAI 3D provider.');
const directory = path.resolve('test-results/terra-live');
await fs.mkdir(directory, { recursive: true });
const original = await sharp('public/catalogue/blue-shirt.svg').png().toBuffer();
await fs.writeFile(path.join(directory, 'reference-blue-shirt.png'), original);
const image = `data:image/png;base64,${original.toString('base64')}`;
const context = pairingContext({ image_hash: digest(image), confirmed: {
  category: 'top', colour: 'light blue', pattern: 'solid',
  description: 'Light blue short-sleeve collared button-front shirt with a chest pocket and straight silhouette.',
} }, catalogue.find(item => item.id === 'indigo-jeans'));
const requests = [];
const generation = createGenerationService({ env, fetchImpl: async (url, options) => {
  const body = JSON.parse(options.body);
  const entry = { endpoint: new URL(url).pathname, model: body.model, image_model: body.tools?.[0]?.model };
  requests.push(entry);
  const response = await fetch(url, options);
  entry.http_status = response.status;
  if (!response.ok) {
    const error = await response.clone().json().catch(() => ({}));
    // Only a code, never raw provider messages, credentials or reference bytes.
    const code = error.error?.code;
    if (typeof code === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(code)) entry.error_code = code;
  }
  console.log(JSON.stringify(entry));
  return response;
} });
const report = { checked_at: new Date().toISOString(), reference: 'Authored public/catalogue/blue-shirt.svg', pairing_id: context.pairing_id, checks: {}, requests };
try {
  for (const kind of ['preview', 'model']) await generation.start(kind, context, kind === 'preview' ? { image } : {});
  const deadline = Date.now() + 210000;
  let previous = '';
  while (Date.now() < deadline) {
    const state = await generation.state(context);
    report.checks = { preview: state.preview, model: state.model };
    await fs.writeFile(path.join(directory, 'report.json'), JSON.stringify(report, null, 2));
    const status = JSON.stringify(Object.fromEntries(Object.entries(report.checks).map(([k,v]) => [k,v.status])));
    if (status !== previous) { console.log(status); previous = status; }
    if (Object.values(report.checks).every(job => !['pending','processing'].includes(job.status))) break;
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  for (const [kind, job] of Object.entries(report.checks)) {
    if (job.status !== 'succeeded') { process.exitCode = 1; continue; }
    const asset = await generation.asset(job.asset_url.split('/').at(-1));
    await fs.writeFile(path.join(directory, kind === 'preview' ? 'neutral-2d.png' : 'neutral-3d.glb'), asset.data);
  }
  console.log(JSON.stringify(report, null, 2));
} finally { await generation.close(); }
