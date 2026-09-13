#!/usr/bin/env node
// The one command that rebuilds the whole catalogue from data/sources.json:
// promotes reviewed Commons files, merchant products/collections and local images into
// data/catalogue-items.json + public/catalogue/real/, then regenerates the contact sheet
// and the import report. Safe to re-run any time — every step is cache-based and additive.
// Discovery (finding NEW Commons candidates to review) is a separate, explicit step:
// `npm run catalogue:discover`.
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
function run(script, args = []) {
  console.log(`\n=== ${script} ${args.join(' ')} ===`);
  execFileSync('node', [path.join(dir, script), ...args], { stdio: 'inherit' });
}

run('fetch-commons.mjs', ['import']);
run('import-merchant.mjs');
run('import-local.mjs');
run('contact-sheet.mjs');
run('report.mjs');
