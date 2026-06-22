#!/usr/bin/env node
/**
 * Verification script for the skills ecosystem.
 * Run this after any major change or before committing.
 *
 * Usage: node verify.js
 */

import { existsSync, lstatSync, readlinkSync, readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { loadConfig } from './lib/config.js';
import { scanSkills } from './lib/skills.js';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

let passCount = 0;
let failCount = 0;

function pass(msg) {
  passCount++;
  console.log(`${GREEN}✓${RESET} ${msg}`);
}

function fail(msg) {
  failCount++;
  console.log(`${RED}✗${RESET} ${msg}`);
}

function warn(msg) {
  console.log(`${YELLOW}⚠${RESET} ${msg}`);
}

function absPath(p) {
  if (p == null) return null;
  const expanded = p.replace(/^~/, process.env.HOME || process.env.USERPROFILE || '~');
  return expanded.startsWith('/') ? expanded : join(process.cwd(), expanded);
}

// ============================================================================
// TESTS
// ============================================================================

console.log('=== Skills Ecosystem Verification ===\n');

// 1. Config loads
console.log('--- Config ---');
let config;
try {
  config = loadConfig();
  pass('Config loads successfully');
} catch (e) {
  fail(`Config load failed: ${e.message}`);
  process.exit(1);
}

// 2. Skill paths exist
console.log('\n--- Skill Paths ---');
for (const sp of config.skillPaths || []) {
  const p = absPath(sp);
  if (p && existsSync(p)) {
    pass(`skillPath exists: ${sp}`);
  } else {
    fail(`skillPath missing: ${sp}`);
  }
}

// 3. Skills are scannable
console.log('\n--- Skills Scan ---');
let skills;
try {
  skills = scanSkills(config);
  pass(`scanSkills found ${skills.length} skills`);
} catch (e) {
  fail(`scanSkills failed: ${e.message}`);
  skills = [];
}

// 4. No duplicate skill names
console.log('\n--- Duplicate Check ---');
const names = skills.map(s => s.name);
const dups = names.filter((n, i) => names.indexOf(n) !== i);
if (dups.length === 0) {
  pass('No duplicate skill names');
} else {
  fail(`Duplicate skill names: ${[...new Set(dups)].join(', ')}`);
}

// 5. Every skill has a valid file
console.log('\n--- Skill File Check ---');
let missingFiles = 0;
for (const skill of skills) {
  if (!skill.file || !existsSync(skill.file)) {
    fail(`Skill "${skill.name}" has missing file: ${skill.file}`);
    missingFiles++;
  }
}
if (missingFiles === 0) {
  pass('All skills have valid files');
}

// 6. SHARED.md exists
console.log('\n--- SHARED.md ---');
const sharedFile = absPath(config.sharedFile);
if (sharedFile && existsSync(sharedFile)) {
  pass('SHARED.md exists');
} else {
  fail('SHARED.md missing');
}

// 7. Instruction file symlinks
console.log('\n--- Instruction Files ---');
for (const [toolName, tool] of Object.entries(config.tools || {})) {
  if (!tool.instructionFile) continue;
  const f = absPath(tool.instructionFile);
  if (!f) continue;
  if (!existsSync(f)) {
    fail(`${toolName}: instruction file missing: ${f}`);
  } else if (lstatSync(f).isSymbolicLink()) {
    let target;
    try {
      target = readlinkSync(f);
    } catch {
      fail(`${toolName}: cannot read symlink`);
      continue;
    }
    // Handle absolute vs relative symlinks
    const resolved = target.startsWith('/') ? target : join(dirname(f), target);
    if (existsSync(resolved)) {
      pass(`${toolName}: symlink valid`);
    } else {
      fail(`${toolName}: broken symlink -> ${target} (resolved: ${resolved})`);
    }
  } else if (toolName === 'claude') {
    // Claude uses @import, not symlink
    pass(`${toolName}: regular file (expected for @import)`);
  } else {
    warn(`${toolName}: regular file (not symlink)`);
  }
}

// 8. Skills directories
console.log('\n--- Skills Directories ---');
for (const [toolName, tool] of Object.entries(config.tools || {})) {
  if (!tool.skillsDir) continue;
  const dir = absPath(tool.skillsDir);
  if (!dir || !existsSync(dir)) {
    fail(`${toolName}: skillsDir missing: ${dir}`);
    continue;
  }
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    fail(`${toolName}: cannot read skillsDir: ${dir}`);
    continue;
  }
  let broken = 0;
  let foreign = 0;
  let ok = 0;
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const entryPath = join(dir, entry.name);
    if (!entry.isSymbolicLink()) continue;
    let target;
    try {
      target = readlinkSync(entryPath);
    } catch {
      broken++;
      continue;
    }
    // Handle absolute vs relative symlinks
    const resolved = target.startsWith('/') ? target : join(dir, target);
    if (!existsSync(resolved)) {
      broken++;
    } else {
      const isOurs = (config.skillPaths || []).some((sp) => {
        const absSp = absPath(sp);
        return resolved.startsWith(absSp);
      });
      if (!isOurs) foreign++;
      else ok++;
    }
  }
  if (broken === 0 && foreign === 0) {
    pass(`${toolName}: ${ok} skills, all healthy`);
  } else {
    fail(`${toolName}: ${ok} OK, ${broken} broken, ${foreign} foreign`);
  }
}

// 9. MCP configs have skills server
console.log('\n--- MCP Configurations ---');
for (const [toolName, tool] of Object.entries(config.tools || {})) {
  if (!tool.mcp) continue;
  const f = absPath(tool.mcp.file);
  if (!f || !existsSync(f)) {
    fail(`${toolName}: MCP config missing: ${f}`);
    continue;
  }
  try {
    const content = readFileSync(f, 'utf8');
    if (content.includes('skills')) {
      pass(`${toolName}: MCP config has skills server`);
    } else {
      fail(`${toolName}: MCP config missing skills server`);
    }
  } catch (e) {
    fail(`${toolName}: cannot read MCP config: ${e.message}`);
  }
}

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\n' + '='.repeat(60));
if (failCount === 0) {
  console.log(`${GREEN}ALL CHECKS PASSED${RESET} (${passCount} passed)`);
} else {
  console.log(`${RED}FAILED${RESET}: ${failCount} failure(s), ${passCount} passed`);
  process.exit(1);
}
