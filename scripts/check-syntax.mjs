import { spawnSync } from 'node:child_process';
import { readdir } from 'node:fs/promises';
const files = ['server.mjs', ...await readdir('lib').then(names => names.filter(name => name.endsWith('.mjs')).map(name => `lib/${name}`)), ...await readdir('public').then(names => names.filter(name => name.endsWith('.js')).map(name => `public/${name}`))];
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log(`Syntax checked ${files.length} application modules.`);
