import { existsSync, lstatSync, readFileSync, readlinkSync, realpathSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { expandTilde } from './config.js';
import { scanSkills } from './skills.js';

function absPath(p) {
  if (p == null) return null;
  const expanded = expandTilde(p);
  return expanded.startsWith('/') ? expanded : join(process.cwd(), expanded);
}

function resolveDestPaths(config) {
  let publicPath = absPath(config.publicPath);
  let privatePath = absPath(config.privatePath);

  if (!publicPath && config.skillPaths) {
    const paths = config.skillPaths.map(absPath).filter(Boolean);
    if (paths.length >= 2) {
      publicPath = paths[0];
      privatePath = privatePath || paths[1];
    }
  }
  if (!privatePath && config.skillPaths) {
    const paths = config.skillPaths.map(absPath).filter(Boolean);
    if (paths.length >= 1) {
      privatePath = paths[paths.length - 1];
    }
  }

  return { publicPath, privatePath };
}

function checkSymlink(linkPath, label) {
  const issues = [];
  if (!existsSync(linkPath)) {
    issues.push(`  ${label}: ${linkPath} — MISSING`);
    return issues;
  }
  const stat = lstatSync(linkPath);
  if (!stat.isSymbolicLink()) {
    issues.push(`  ${label}: ${linkPath} — NOT A SYMLINK (regular file/dir)`);
    return issues;
  }
  let target;
  try {
    target = readlinkSync(linkPath);
  } catch {
    issues.push(`  ${label}: ${linkPath} — CANNOT READ SYMLINK`);
    return issues;
  }
  const resolved = resolve(dirname(linkPath), target);
  if (!existsSync(resolved)) {
    issues.push(`  ${label}: ${linkPath} -> ${target} — BROKEN (target missing)`);
  }
  return issues;
}

function checkToolDir(toolName, tool, config) {
  const issues = [];

  // Check instruction file
  if (tool.instructionFile) {
    const f = absPath(tool.instructionFile);
    if (f) {
      issues.push(...checkSymlink(f, `${toolName} instructionFile`));
    }
  }

  // Check skills directory
  if (tool.skillsDir) {
    const dir = absPath(tool.skillsDir);
    if (dir && existsSync(dir)) {
      let entries;
      try {
        entries = readdirSync(dir, { withFileTypes: true });
      } catch {
        entries = [];
      }
      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue;
        const entryPath = join(dir, entry.name);
        if (entry.isSymbolicLink()) {
          let target;
          try {
            target = readlinkSync(entryPath);
          } catch {
            issues.push(`  ${toolName} skill "${entry.name}": cannot read symlink`);
            continue;
          }
          const resolved = resolve(dir, target);
          const isOurs = config.skillPaths?.some((sp) => {
            const absSp = absPath(sp);
            return resolved.startsWith(absSp);
          });
          if (!existsSync(resolved)) {
            issues.push(`  ${toolName} skill "${entry.name}": BROKEN SYMLINK -> ${target}`);
          } else if (!isOurs) {
            issues.push(`  ${toolName} skill "${entry.name}": FOREIGN SYMLINK -> ${target}`);
          }
        }
      }
    }
  }

  return issues;
}

export async function runDoctor(config) {
  const issues = [];
  const { publicPath, privatePath } = resolveDestPaths(config);

  console.log('=== Skills Doctor ===\n');

  // 1. Config check
  console.log('[config]');
  if (!config.skillPaths || config.skillPaths.length === 0) {
    issues.push('  skillPaths is empty — no skills will be found');
  } else {
    for (const sp of config.skillPaths) {
      const p = absPath(sp);
      if (!existsSync(p)) {
        issues.push(`  skillPaths entry missing: ${p}`);
      } else {
        console.log(`  ✓ ${p}`);
      }
    }
  }
  if (!config.sharedFile) {
    issues.push('  sharedFile not configured');
  } else if (!existsSync(absPath(config.sharedFile))) {
    issues.push(`  sharedFile missing: ${absPath(config.sharedFile)}`);
  } else {
    console.log(`  ✓ sharedFile: ${absPath(config.sharedFile)}`);
  }
  console.log('');

  // 2. Symlink check for instruction files
  const expectedRegularModes = ['import', 'claude-import', 'opencode-instructions', 'continue-instructions', 'zed-instructions', 'aider-config', 'tabby-config', 'pearai-config', 'void-config', 'claude-desktop-config', 'claude-json', 'gemini-json', 'codex-toml', 'opencode'];
  console.log('[instruction files]');
  for (const [toolName, tool] of Object.entries(config.tools ?? {})) {
    if (tool.instructionFile) {
      const f = absPath(tool.instructionFile);
      if (!f) continue;
      if (!existsSync(f)) {
        issues.push(`  ${toolName}: ${f} — MISSING`);
      } else if (lstatSync(f).isSymbolicLink()) {
        const target = readlinkSync(f);
        const resolved = resolve(dirname(f), target);
        if (!existsSync(resolved)) {
          issues.push(`  ${toolName}: ${f} -> ${target} — BROKEN`);
        } else {
          console.log(`  ✓ ${toolName}: ${f} -> ${target}`);
        }
      } else if (expectedRegularModes.includes(tool.instructionMode)) {
        console.log(`  ✓ ${toolName}: ${f} — regular file (expected for ${tool.instructionMode})`);
      } else {
        console.log(`  ⚠ ${toolName}: ${f} — regular file (expected symlink)`);
      }
    }
  }
  console.log('');

  // 3. Skills directory check
  console.log('[skills directories]');
  for (const [toolName, tool] of Object.entries(config.tools ?? {})) {
    if (!tool.skillsDir) continue;
    const dirs = Array.isArray(tool.skillsDir) ? tool.skillsDir : [tool.skillsDir];
    for (const dirTemplate of dirs) {
      const dir = absPath(dirTemplate);
      if (!dir || !existsSync(dir)) {
        issues.push(`  ${toolName}: skillsDir missing: ${dir}`);
        continue;
      }
      let entries;
      try {
        entries = readdirSync(dir, { withFileTypes: true });
      } catch {
        issues.push(`  ${toolName}: cannot read skillsDir: ${dir}`);
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
        const resolved = resolve(dir, target);
        if (!existsSync(resolved)) {
          broken++;
        } else {
          const isOurs = config.skillPaths?.some((sp) => {
            const absSp = absPath(sp);
            return resolved.startsWith(absSp);
          });
          if (!isOurs) foreign++;
          else ok++;
        }
      }
      const status = [];
      if (ok) status.push(`${ok} OK`);
      if (broken) status.push(`${broken} BROKEN`);
      if (foreign) status.push(`${foreign} foreign`);
      console.log(`  ${toolName}: ${status.join(', ') || 'empty'}`);
      if (broken) issues.push(`  ${toolName}: ${broken} broken skill symlinks`);
    }
  }
  console.log('');

  // 4. Index check
  console.log('[indexes]');
  for (const targetDir of config.indexTargets ?? []) {
    const p = absPath(targetDir);
    const indexPath = join(p, 'INDEX.md');
    if (!existsSync(indexPath)) {
      issues.push(`  INDEX.md missing: ${indexPath}`);
    } else {
      console.log(`  ✓ ${indexPath}`);
    }
  }
  const sharedFile = absPath(config.sharedFile);
  if (sharedFile && !existsSync(sharedFile)) {
    issues.push(`  SHARED.md missing: ${sharedFile}`);
  } else if (sharedFile) {
    console.log(`  ✓ SHARED.md: ${sharedFile}`);
  }
  console.log('');

  // 5. Skills scan
  console.log('[skills]');
  try {
    const skills = scanSkills(config);
    console.log(`  ✓ ${skills.length} skills found`);
    const publicSkills = skills.filter((s) => s.isPublic);
    const privateSkills = skills.filter((s) => !s.isPublic);
    console.log(`    ${publicSkills.length} public, ${privateSkills.length} private`);
  } catch (err) {
    issues.push(`  Skills scan failed: ${err.message}`);
  }
  console.log('');

  // 6. Security check (SkillSpector)
  console.log('[security]');
  const { isSkillSpectorInstalled, findSkillSpector } = await import('./security.js');
  if (isSkillSpectorInstalled()) {
    const path = findSkillSpector();
    console.log(`  ✓ NVIDIA SkillSpector installed (${path})`);
    console.log('    Run `omni-skills security scan` to check skills for vulnerabilities');
  } else {
    console.log('  ⚠ NVIDIA SkillSpector not installed (optional)');
    console.log('    Detects 64 vulnerability patterns in AI skills');
    console.log('    Install: https://github.com/NVIDIA/skillspector');
  }
  console.log('');

  // Summary
  if (issues.length === 0) {
    console.log('✓ All checks passed. The skills ecosystem is healthy.');
  } else {
    console.log(`✗ Found ${issues.length} issue(s):`);
    for (const issue of issues) {
      console.log(issue);
    }
    console.log('\nRun `omni-skills sync all` to fix most symlink issues.');
  }
}
