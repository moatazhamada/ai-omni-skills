import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import { DEFAULT_CONFIG } from './default-config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function findUserConfigPath() {
  const envPath = process.env.SKILLS_CONFIG;
  if (envPath && existsSync(envPath)) {
    return realpathSync(envPath);
  }

  const userPath = join(os.homedir(), '.config', 'skills', 'config.json');
  if (existsSync(userPath)) {
    return realpathSync(userPath);
  }

  return null;
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

  const userConfigPath = findUserConfigPath();
  if (userConfigPath) {
    _resolvedPath = userConfigPath;
    return _resolvedPath;
  }

  return null;
}

export function loadConfig() {
  const resolvedConfigPath = configPath();
  if (resolvedConfigPath) {
    const raw = readFileSync(resolvedConfigPath, 'utf8');
    return expandValue(JSON.parse(raw));
  }

  console.warn(
    'using embedded default config — copy config.example.json to ~/.config/skills/config.json'
  );
  return expandValue(structuredClone(DEFAULT_CONFIG));
}
