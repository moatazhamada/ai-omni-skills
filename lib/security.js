import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { homedir } from 'node:os';

const SKILLSPECTOR_PATHS = [
  'skillspector',
  join(homedir(), '.local', 'bin', 'skillspector'),
  '/usr/local/bin/skillspector',
  '/usr/bin/skillspector',
];

export function findSkillSpector() {
  for (const path of SKILLSPECTOR_PATHS) {
    try {
      execSync(`which ${path}`, { stdio: 'ignore' });
      return path;
    } catch {
      continue;
    }
  }
  return null;
}

export function isSkillSpectorInstalled() {
  return findSkillSpector() !== null;
}

export function getSkillSpectorVersion() {
  const path = findSkillSpector();
  if (!path) return null;
  try {
    const output = execSync(`${path} --version`, { encoding: 'utf8', timeout: 5000 });
    return output.trim();
  } catch {
    return null;
  }
}

export function runSkillSpectorScan(targetPath, options = {}) {
  const path = findSkillSpector();
  if (!path) {
    console.error('❌ SkillSpector not found.');
    console.log('');
    console.log('🔒 NVIDIA SkillSpector — Security Scanner for AI Skills');
    console.log('   Detects 64 vulnerability patterns across 16 categories');
    console.log('   (prompt injection, data exfiltration, privilege escalation, etc.)');
    console.log('');
    console.log('Install:');
    console.log('  git clone https://github.com/NVIDIA/skillspector.git');
    console.log('  cd skillspector');
    console.log('  python3 -m venv .venv && source .venv/bin/activate');
    console.log('  pip install -e .');
    console.log('');
    console.log('Or via Docker:');
    console.log('  docker run --rm -v "$PWD:/scan" ghcr.io/nvidia/skillspector scan /scan');
    console.log('');
    console.log('📎 https://github.com/NVIDIA/skillspector');
    return null;
  }

  const args = ['scan', targetPath];
  if (options.noLLM) args.push('--no-llm');
  if (options.format) args.push('--format', options.format);
  if (options.output) args.push('--output', options.output);
  if (options.verbose) args.push('-V');

  try {
    const output = execSync(`${path} ${args.join(' ')}`, {
      encoding: 'utf8',
      timeout: 120000,
      stdio: 'pipe',
    });
    return output;
  } catch (err) {
    if (err.stdout) return err.stdout;
    if (err.stderr) return err.stderr;
    return err.message;
  }
}

export function showSecurityStatus() {
  const path = findSkillSpector();
  if (path) {
    const version = getSkillSpectorVersion();
    console.log('✅ NVIDIA SkillSpector is installed');
    if (version) console.log(`   Version: ${version}`);
    console.log(`   Path: ${path}`);
    console.log('');
    console.log('Usage:');
    console.log('  omni-skills security scan           # Scan all skills');
    console.log('  omni-skills security scan --dir ./  # Scan specific directory');
    console.log('  omni-skills security scan --no-llm   # Static analysis only (faster)');
  } else {
    console.log('⚠️  NVIDIA SkillSpector is not installed');
    console.log('');
    console.log('🔒 Why install it?');
    console.log('   • Scans AI skills for 64 vulnerability patterns');
    console.log('   • Detects prompt injection, data exfiltration, malware');
    console.log('   • 26.1% of skills contain vulnerabilities (research-backed)');
    console.log('');
    console.log('Install:');
    console.log('  git clone https://github.com/NVIDIA/skillspector.git');
    console.log('  cd skillspector');
    console.log('  python3 -m venv .venv && source .venv/bin/activate');
    console.log('  pip install -e .');
    console.log('');
    console.log('Or use Docker:');
    console.log('  docker run --rm -v "$PWD:/scan" ghcr.io/nvidia/skillspector scan /scan');
    console.log('');
    console.log('📎 https://github.com/NVIDIA/skillspector');
  }
}

export function showSecurityBanner() {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  🔒 NVIDIA SkillSpector — Security for AI Skills');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('Research shows 26.1% of skills contain vulnerabilities.');
  console.log('SkillSpector detects 64 patterns across 16 categories:');
  console.log('  • Prompt injection, data exfiltration, privilege escalation');
  console.log('  • Supply chain attacks, malware, credential harvesting');
  console.log('  • Excessive agency, tool misuse, system prompt leakage');
  console.log('');
  console.log('📎 https://github.com/NVIDIA/skillspector');
  console.log('');
}
