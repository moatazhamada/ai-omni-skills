import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';

export function logUse(config, name) {
  try {
    const logPath = config.usageLog;
    if (!logPath) return;
    mkdirSync(dirname(logPath), { recursive: true });
    const line = JSON.stringify({ t: new Date().toISOString(), skill: name }) + '\n';
    appendFileSync(logPath, line);
  } catch {
    // Telemetry must never break skill loading.
  }
}

export function aggregate(config) {
  const map = {};
  if (!config.usageLog || !existsSync(config.usageLog)) return map;

  let text;
  try {
    text = readFileSync(config.usageLog, 'utf8');
  } catch {
    return map;
  }

  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    let rec;
    try {
      rec = JSON.parse(line);
    } catch {
      continue;
    }
    if (!rec || typeof rec.skill !== 'string') continue;
    const entry = map[rec.skill] ?? { count: 0, last: rec.t };
    entry.count += 1;
    if (rec.t && rec.t > entry.last) entry.last = rec.t;
    map[rec.skill] = entry;
  }

  return map;
}
