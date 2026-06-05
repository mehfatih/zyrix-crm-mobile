#!/usr/bin/env node
/**
 * Guard: fail if any source file hardcodes `USE_MOCKS = true` again.
 *
 * Mock serving must be gated solely through `src/config/runtime.ts`
 * (driven by EXPO_PUBLIC_USE_MOCKS, default false). A re-introduced
 * literal would ship demo data into release builds — exactly the issue
 * AUDIT_MOBILE_2026-06.md flagged. Run via `npm run check:mocks`.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(process.cwd(), 'src');
const NEEDLE = /\bUSE_MOCKS\s*=\s*true\b/;
const ALLOW = path.join('src', 'config', 'runtime.ts'); // doc comment only

/** @type {string[]} */
const offenders = [];

const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry.name)) continue;
    const relFromCwd = path.relative(process.cwd(), full);
    if (relFromCwd === ALLOW) continue;
    const text = fs.readFileSync(full, 'utf8');
    text.split(/\r?\n/).forEach((line, i) => {
      // Ignore comment lines so doc references don't trip the guard.
      const trimmed = line.trim();
      if (trimmed.startsWith('*') || trimmed.startsWith('//')) return;
      if (NEEDLE.test(line)) offenders.push(`${relFromCwd}:${i + 1}: ${trimmed}`);
    });
  }
};

walk(ROOT);

if (offenders.length) {
  console.error('check:mocks FAILED — hardcoded `USE_MOCKS = true` found:');
  offenders.forEach((o) => console.error('  ' + o));
  console.error('\nGate mocks through src/config/runtime.ts (EXPO_PUBLIC_USE_MOCKS) instead.');
  process.exit(1);
}
console.log('check:mocks OK — no hardcoded USE_MOCKS = true in src/.');
