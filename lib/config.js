import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));

function findExampleConfig() {
  return join(__dirname, '..', 'config.example.json');
}

function findUserConfig() {
  return join(os.homedir(), '.config', 'skills', 'config.json');
}

export function expandTilde(p) {
  if (typeof p !== 'string') return p;
  if (p === '~' || p.startsWith('~/')) {
    return join(os.homedir(), p.slice(1));
  }
  return p;
}

function expandValue(v) {
  if (typeof v === 'string') return expandTilde(v);
  if (Array.isArray(v)) return v.map(expandValue);
  if (v && typeof v === 'object') {
    const out = {};
    for (const [k, val] of Object.entries(v)) {
      out[k] = expandValue(val);
    }
    return out;
  }
  return v;
}

let _resolvedPath = null;

export function configPath() {
  if (_resolvedPath) return _resolvedPath;

  const envPath = process.env.SKILLS_CONFIG;
  if (envPath && existsSync(envPath)) {
    _resolvedPath = realpathSync(envPath);
    return _resolvedPath;
  }

  const userPath = findUserConfig();
  if (existsSync(userPath)) {
    _resolvedPath = realpathSync(userPath);
    return _resolvedPath;
  }

  const examplePath = findExampleConfig();
  console.warn(`using example config — copy it to ~/.config/skills/config.json`);
  _resolvedPath = realpathSync(examplePath);
  return _resolvedPath;
}

export function loadConfig() {
  const path = configPath();
  const raw = readFileSync(path, 'utf8');
  return expandValue(JSON.parse(raw));
}
