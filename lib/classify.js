import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  symlinkSync,
} from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import readline from 'node:readline';
import { expandTilde } from './config.js';

function absPath(p) {
  if (p == null) return null;
  const expanded = expandTilde(p);
  return isAbsolute(expanded) ? expanded : join(process.cwd(), expanded);
}

const INSTRUCTION_NAMES = [
  'AGENTS.md',
  'CLAUDE.md',
  'GEMINI.md',
  'CODEX.md',
  'KIMI.md',
  'CURSOR.md',
  '.cursorrules',
  '.cursor-rules',
  'cursor-rules.md',
  'ai-instructions.md',
  'instructions.md',
];

const INSTRUCTION_DENYLIST = [
  /acme-corp|example-project|demo-company|sample-client|test-enterprise|internal-tool|proprietary-lib/i,
  /\b[A-Z]{2,}-\d+\b/, // Ticket IDs like ABC-123
  /sk-[A-Za-z0-9]{12,}|ghp_[A-Za-z0-9]+|AKIA[0-9A-Z]{12}|-----BEGIN|-----END/i,
  /(internal|corp|vpn|staging|prod|dev|qa)\./i,
  /\b(internal|confidential|proprietary|restricted|classified|private|secret)\b/i,
  /TODO.*internal|FIXME.*internal|HACK.*internal|XXX.*internal/i,
  /(?:api|app|auth|cdn|db|git|jenkins|nexus|registry|repo|svn|wiki)\.(?:internal|corp|local|private)/i,
  /private repo|private repository|company repo|employer/i,
  /\b(?:PROJECT|CODE|SECRET|KEY|TOKEN|PWD|PASS|AUTH|CRED|CERT)_?\w*=\s*["'][^"']+["']/i,
];

function scanInstructionText(text) {
  const hits = [];
  for (const re of INSTRUCTION_DENYLIST) {
    const m = text.match(re);
    if (m) hits.push(`${re.toString()} matched "${m[0]}"`);
  }
  return hits;
}

function isInstructionFile(name) {
  const lower = name.toLowerCase();
  return INSTRUCTION_NAMES.some((n) => lower === n.toLowerCase());
}

function findInstructionFiles(root, results = [], currentDepth = 0, maxDepth = 3) {
  if (currentDepth > maxDepth) return results;
  const absRoot = absPath(root);
  if (!absRoot || !existsSync(absRoot)) return results;

  const skipDirs = new Set([
    'node_modules', '.git', 'vendor', 'build', 'dist', '.next', '.vercel',
    'coverage', '.turbo', '.cache', 'out', 'target', '.gradle', '.idea',
    '.vscode', '.claude', '.codex', '.kimi', '.gemini', '.cursor', '.kilocode',
    'bin', 'obj', 'tmp', 'temp', '.swc', '.parcel-cache', '.nuxt', '.output',
  ]);

  let entries;
  try {
    entries = readdirSync(absRoot, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;

    if (entry.isDirectory()) {
      if (skipDirs.has(entry.name)) continue;
      findInstructionFiles(join(absRoot, entry.name), results, currentDepth + 1, maxDepth);
    } else if (entry.isFile() && isInstructionFile(entry.name)) {
      results.push(join(absRoot, entry.name));
    }
  }

  return results;
}

function ask(rl, text) {
  return new Promise((resolve) => rl.question(text, resolve));
}

function resolveDestPaths(config) {
  // New format: single skillsPath
  let skillsPath = config.skillsPath ? absPath(config.skillsPath) : null;
  if (skillsPath) {
    return { publicPath: skillsPath, privatePath: skillsPath };
  }

  // Old format: separate public/private paths
  let publicPath = config.publicPath ? absPath(config.publicPath) : null;
  let privatePath = config.privatePath ? absPath(config.privatePath) : null;

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

export async function classifyInstructions(config, scanPath, { dryRun = false, depth = 3 } = {}) {
  const { publicPath, privatePath } = resolveDestPaths(config);

  if (!privatePath) {
    console.error('Error: Could not determine a destination path from config.');
    console.error('Please add "privatePath" (and optionally "publicPath") to your config.json,');
    console.error('or ensure "skillPaths" has at least one entry.');
    process.exit(1);
  }

  const scanRoot = scanPath ? absPath(scanPath) : process.cwd();
  if (!scanRoot || !existsSync(scanRoot)) {
    console.error(`Error: scan path does not exist: ${scanRoot}`);
    process.exit(1);
  }

  console.log(`Scanning for instruction files in: ${scanRoot}`);
  console.log(`Max depth: ${depth}`);
  if (publicPath) console.log(`Public store:  ${publicPath}`);
  console.log(`Private store: ${privatePath}`);
  console.log('');

  const files = findInstructionFiles(scanRoot, [], 0, depth);
  if (files.length === 0) {
    console.log('No instruction files found.');
    return;
  }

  console.log(`Found ${files.length} instruction file(s).\n`);

  const isTty = process.stdin.isTTY && process.stdout.isTTY;
  const interactive = !dryRun && isTty;

  let rl;
  if (interactive) {
    rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  }

  for (const file of files) {
    const fileName = file.split('/').pop();
    console.log(`--- ${fileName} ---`);
    console.log(`path: ${file}`);

    let text = '';
    try {
      text = readFileSync(file, 'utf8');
    } catch {
      console.log('  (could not read file)');
      continue;
    }

    const lines = text.split('\n');
    const sample = lines.slice(0, 150).join('\n');
    const hits = scanInstructionText(sample);
    const looksPrivate = hits.length > 0;

    console.log(`lines: ${lines.length}`);
    console.log(`recommendation: ${looksPrivate ? 'private' : 'public'}`);
    if (hits.length) {
      console.log('sensitive hits:');
      for (const h of hits) console.log(`  - ${h}`);
    }

    const resolved = resolve(file);
    const inPublic = publicPath && resolved.startsWith(publicPath);
    const inPrivate = privatePath && resolved.startsWith(privatePath);
    if (inPublic || inPrivate) {
      console.log(`  already in canonical store (${inPublic ? 'public' : 'private'})\n`);
      continue;
    }

    let decision = looksPrivate ? 'private' : 'public';
    if (interactive) {
      const promptText = publicPath
        ? `[p]ublic / [v] private / [s]kip (default: ${decision}): `
        : `[v] private / [s]kip (default: private): `;
      const answer = await ask(rl, promptText);
      const a = answer.trim().toLowerCase();
      if (a === 'p') decision = 'public';
      else if (a === 'v') decision = 'private';
      else if (a === 's') decision = 'skip';
      else if (a) decision = 'skip';
      if (!publicPath && decision === 'public') {
        console.log('  publicPath not configured; moving to private');
        decision = 'private';
      }
    } else {
      console.log(`(non-interactive / dry-run: using recommendation ${decision})`);
    }

    if (decision === 'skip') {
      console.log('  skipped\n');
      continue;
    }

    const destRoot = decision === 'public' ? publicPath : privatePath;
    const projectsDir = join(destRoot, 'projects');
    const destDir = join(projectsDir, fileName.replace(/\.md$/, '').toLowerCase());
    const destFile = join(destDir, fileName);

    if (existsSync(destDir)) {
      console.log(`  skip: destination already exists ${destDir}\n`);
      continue;
    }

    if (dryRun) {
      console.log(`  would move ${file} -> ${destFile} and replace source with symlink\n`);
      continue;
    }

    mkdirSync(destDir, { recursive: true });
    renameSync(file, destFile);
    symlinkSync(destFile, file);
    console.log(`  moved to ${destFile} and symlinked back\n`);
  }

  if (rl) rl.close();

  console.log('Done. Run `skills index` and `skills sync all` to update.');
}
