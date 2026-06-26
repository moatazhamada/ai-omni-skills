import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, readlinkSync, renameSync, symlinkSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { expandTilde } from './config.js';
import { scanSkills } from './skills.js';
import { scanSkillText } from './sensitive.js';

function absPath(p) {
  if (p == null) return null;
  const expanded = expandTilde(p);
  return isAbsolute(expanded) ? expanded : join(process.cwd(), expanded);
}

function resolvePublicPath(config) {
  // New format: single skillsPath
  let skillsPath = absPath(config.skillsPath);
  if (skillsPath) return skillsPath;

  // Old format
  let publicPath = absPath(config.publicPath);
  if (!publicPath && config.skillPaths) {
    const paths = config.skillPaths.map(absPath).filter(Boolean);
    if (paths.length >= 1) {
      publicPath = paths[0];
    }
  }
  return publicPath;
}

function isRealLocalSkill(entryPath, name, knownNames) {
  if (knownNames.has(name)) return false;
  try {
    const stat = lstatSync(entryPath);
    if (!stat.isDirectory()) return false;
  } catch {
    return false;
  }
  return existsSync(join(entryPath, 'SKILL.md'));
}

export async function checkSkills(config, { move = false, dryRun = false } = {}) {
  const skills = scanSkills(config);
  const knownNames = new Set(skills.map((s) => s.name));
  const publicPath = resolvePublicPath(config);

  if (move && !publicPath) {
    console.error('Error: publicPath not configured. Cannot move skills without a destination.');
    console.error('Add "publicPath" to your config.json or ensure skillPaths has at least one entry.');
    process.exit(1);
  }


  for (const [toolName, tool] of Object.entries(config.tools ?? {})) {
    if (tool.skillsDir == null) continue;
    const skillsDirs = Array.isArray(tool.skillsDir) ? tool.skillsDir : [tool.skillsDir];

    for (const rawDir of skillsDirs) {
      const skillsDir = absPath(rawDir);
      if (!skillsDir) {
        console.log(`[${toolName}] skillsDir unresolved: ${rawDir}`);
        continue;
      }
      if (!existsSync(skillsDir)) {
        console.log(`[${toolName}] skillsDir missing: ${skillsDir}`);
        continue;
      }

      let entries;
      try {
        entries = readdirSync(skillsDir, { withFileTypes: true });
      } catch (err) {
        console.error(`[${toolName}] cannot read ${skillsDir}: ${err.message}`);
        continue;
      }

      for (const entry of entries) {
        const name = entry.name;
        if (name.startsWith('.')) continue;
        const entryPath = join(skillsDir, name);

        if (entry.isSymbolicLink()) {
          let linkTarget;
          try {
            linkTarget = readlinkSync(entryPath);
          } catch {
            linkTarget = null;
          }
          const resolved = linkTarget ? resolve(skillsDir, linkTarget) : null;
          const isOurs = resolved && config.skillPaths.some((sp) => resolved.startsWith(absPath(sp)));

          if (!existsSync(entryPath)) {
            console.log(`[${toolName}] dangling symlink: ${name} -> ${linkTarget}`);
          } else if (!isOurs) {
            console.log(`[${toolName}] foreign symlink: ${name} -> ${linkTarget}`);
          }
          continue;
        }

        if (!entry.isDirectory()) continue;

        if (!isRealLocalSkill(entryPath, name, knownNames)) continue;

        const skillMd = join(entryPath, 'SKILL.md');
        let text = '';
        try {
          text = readFileSync(skillMd, 'utf8');
        } catch {
          continue;
        }
        const hits = scanSkillText(text);
        const looksPrivate = hits.length > 0;

        console.log(`[${toolName}] local skill: ${name}`);
        console.log(`  path: ${entryPath}`);
        console.log(`  looksPrivate: ${looksPrivate}`);
        for (const h of hits) console.log(`  deny hit: ${h}`);

        if (move) {
          if (looksPrivate) {
            console.log(`  -> REVIEW (looks private) — left in place; run \`skills init\``);
            continue;
          }

          const destDir = join(publicPath, name);
          if (existsSync(destDir)) {
            console.log(`  -> SKIP: destination already exists ${destDir}`);
            continue;
          }

          if (dryRun) {
            console.log(`  -> would move ${entryPath} -> ${destDir} and replace with symlink`);
            continue;
          }

          mkdirSync(dirname(destDir), { recursive: true });
          renameSync(entryPath, destDir);
          symlinkSync(destDir, entryPath);
          console.log(`  -> moved to ${destDir} and symlinked back`);
        }
      }
    }
  }
}
