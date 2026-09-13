#!/usr/bin/env node
// Builds the import report: accepted/skipped/duplicate/failed per run, category counts,
// and remaining gaps vs. the ~20 top / ~20 bottom target. Writes JSON + Markdown.
import path from 'node:path';
import fs from 'node:fs';
import { dataDir, cacheDir, loadJson, loadItems, loadRunLogs } from './lib.mjs';
import { catalogue } from '../../data/catalogue.mjs';

const TARGET_PER_CATEGORY = 20;

function tally(events) {
  const counts = { accepted: 0, skipped: 0, duplicate: 0, failed: 0 };
  for (const event of events || []) counts[event.outcome] = (counts[event.outcome] || 0) + 1;
  return counts;
}

function lastRunPerName(logs) {
  const byName = new Map();
  for (const run of logs) byName.set(run.name, run); // logs are appended in order, so the last write wins
  return [...byName.values()];
}

function main() {
  const items = loadItems();
  const logs = loadRunLogs();
  const recentRuns = lastRunPerName(logs);
  const candidates = loadJson(path.join(cacheDir, 'commons', 'candidates.json'), []);

  const active = catalogue; // illustrations + approved, on-disk-verified real items (see data/catalogue.mjs)
  const realActive = items.filter(i => i.review_status === 'approved' && i.active !== false);
  const needsReview = items.filter(i => i.review_status === 'needs_review');
  const rejectedItems = items.filter(i => i.review_status === 'rejected');
  const pendingCandidates = candidates.filter(c => c.status === 'pending_review');
  const rejectedCandidates = candidates.filter(c => c.status === 'rejected');

  const byCategory = { top: active.filter(i => i.category === 'top').length, bottom: active.filter(i => i.category === 'bottom').length };
  const bySubcategory = {};
  for (const item of items) if (item.subcategory) bySubcategory[item.subcategory] = (bySubcategory[item.subcategory] || 0) + 1;

  const report = {
    generated_at: new Date().toISOString(),
    active_catalogue: { total: active.length, illustrations: active.length - realActive.length, real_photos: realActive.length, by_category: byCategory, target_per_category: TARGET_PER_CATEGORY, gap: { top: Math.max(0, TARGET_PER_CATEGORY - byCategory.top), bottom: Math.max(0, TARGET_PER_CATEGORY - byCategory.bottom) } },
    by_subcategory: bySubcategory,
    needs_review_items: needsReview.length,
    rejected_items: rejectedItems.length,
    commons_candidates_pending_review: pendingCandidates.length,
    commons_candidates_auto_rejected: rejectedCandidates.length,
    runs: recentRuns.map(run => ({ name: run.name, finished_at: run.finished_at, ...tally(run.events) })),
  };

  const jsonPath = path.join(dataDir, 'catalogue-report.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2) + '\n');

  const lines = [];
  lines.push('# Catalogue import report', '', `Generated ${report.generated_at}`, '');
  lines.push('## Active catalogue (feeding live recommendations)', '');
  lines.push(`- Total: **${report.active_catalogue.total}** (${report.active_catalogue.real_photos} real photos, ${report.active_catalogue.illustrations} original illustrations)`);
  lines.push(`- Tops: **${byCategory.top}** / target ${TARGET_PER_CATEGORY} (gap: ${report.active_catalogue.gap.top})`);
  lines.push(`- Bottoms: **${byCategory.bottom}** / target ${TARGET_PER_CATEGORY} (gap: ${report.active_catalogue.gap.bottom})`, '');
  if (Object.keys(bySubcategory).length) {
    lines.push('## Subcategory counts (imported real photos)', '');
    for (const [sub, count] of Object.entries(bySubcategory).sort((a, b) => b[1] - a[1])) lines.push(`- ${sub}: ${count}`);
    lines.push('');
  }
  lines.push('## Review queue', '');
  lines.push(`- Imported items awaiting review (in catalogue-items.json but not yet approved): ${needsReview.length}`);
  lines.push(`- Rejected items (kept for audit, excluded from the app): ${rejectedItems.length}`);
  lines.push(`- Commons candidates awaiting a promote/reject decision: ${pendingCandidates.length} — see data/catalogue-cache/commons/review.html`);
  lines.push(`- Commons candidates auto-rejected (no reuse-permitting licence, or a page/image fetch failed): ${rejectedCandidates.length}`, '');
  lines.push('## Most recent run per importer', '');
  lines.push('| Importer | Finished | Accepted | Skipped | Duplicate | Failed |', '|---|---|---|---|---|---|');
  for (const run of report.runs) lines.push(`| ${run.name} | ${run.finished_at} | ${run.accepted} | ${run.skipped} | ${run.duplicate} | ${run.failed} |`);
  if (!report.runs.length) lines.push('| _(no importer has run yet)_ | | | | | |');
  lines.push('', '## Remaining gaps', '');
  if (report.active_catalogue.gap.top === 0 && report.active_catalogue.gap.bottom === 0) lines.push('- None — both categories are at or above target.');
  else {
    if (report.active_catalogue.gap.top) lines.push(`- Need ${report.active_catalogue.gap.top} more tops to reach the ${TARGET_PER_CATEGORY}-item target.`);
    if (report.active_catalogue.gap.bottom) lines.push(`- Need ${report.active_catalogue.gap.bottom} more bottoms to reach the ${TARGET_PER_CATEGORY}-item target.`);
  }
  const mdPath = path.join(dataDir, 'catalogue-report.md');
  fs.writeFileSync(mdPath, lines.join('\n') + '\n');

  console.log(`Wrote ${jsonPath}`);
  console.log(`Wrote ${mdPath}`);
  console.log(`\nActive catalogue: ${report.active_catalogue.total} items (${byCategory.top} tops, ${byCategory.bottom} bottoms)`);
}

main();
