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


export function installSkillSpector(method = 'pip') {
  console.log('🔒 Installing NVIDIA SkillSpector...');
  console.log('');

  const installDir = join(homedir(), '.local', 'skillspector');

  // Check if SkillSpector is already installed
  if (findSkillSpector()) {
    const version = getSkillSpectorVersion();
    console.log('✅ NVIDIA SkillSpector is already installed');
    if (version) console.log(`   Version: ${version}`);
    console.log('');
    console.log('To update, uninstall first or clone manually:');
    console.log('  rm -rf ' + installDir);
    console.log('  omni-skills security install ' + method);
    return;
  }

  // Check if install directory already exists (partial install)
  if (existsSync(installDir)) {
    console.log('⚠️  Install directory already exists: ' + installDir);
    console.log('');
    console.log('To reinstall:');
    console.log('  rm -rf ' + installDir);
    console.log('  omni-skills security install ' + method);
    return;
  }

  // Check prerequisites before installing
  function checkPrereq(name, command) {
    try {
      execSync(command, { stdio: 'ignore' });
      return true;
    } catch {
      console.log(`❌ ${name} is not installed or not in PATH`);
      return false;
    }
  }

  try {
    switch (method) {
      case 'pip': {
        console.log('Method: pip (Python)');
        console.log('');

        const hasGit = checkPrereq('git', 'git --version');
        const hasPython = checkPrereq('python3', 'python3 --version');
        if (!hasGit || !hasPython) {
          console.log('');
          console.log('Please install the missing prerequisites:');
          if (!hasGit) console.log('  • git: https://git-scm.com/downloads');
          if (!hasPython) console.log('  • python3: https://www.python.org/downloads/');
          console.log('');
          console.log('Then run: omni-skills security install pip');
          return;
        }

        console.log('  git clone https://github.com/NVIDIA/skillspector.git ' + installDir);
        execSync(`git clone https://github.com/NVIDIA/skillspector.git ${installDir}`, { stdio: 'inherit' });
        console.log('  cd ' + installDir + ' && python3 -m venv .venv');
        execSync('python3 -m venv .venv', { cwd: installDir, stdio: 'inherit' });
        // Activate venv and install
        const activateScript = process.platform === 'win32' ? '.venv\\Scripts\\activate' : '.venv/bin/activate';
        console.log('  source ' + activateScript + ' && pip install -e .');
        execSync(`bash -c "source ${activateScript} && pip install -e ."`, { cwd: installDir, stdio: 'inherit' });
        console.log('');
        console.log('✅ SkillSpector installed to ' + installDir);
        console.log('   Add to PATH: export PATH="$HOME/.local/skillspector/.venv/bin:$PATH"');
        break;
      }
      case 'docker': {
        console.log('Method: Docker');
        console.log('');

        const hasDocker = checkPrereq('docker', 'docker --version');
        if (!hasDocker) {
          console.log('');
          console.log('Please install Docker first:');
          console.log('  • Docker: https://docs.docker.com/get-docker/');
          console.log('');
          console.log('Then run: omni-skills security install docker');
          return;
        }

        console.log('  docker pull ghcr.io/nvidia/skillspector');
        execSync('docker pull ghcr.io/nvidia/skillspector', { stdio: 'inherit' });
        console.log('');
        console.log('✅ SkillSpector Docker image pulled');
        console.log('   Use: docker run --rm -v "$PWD:/scan" ghcr.io/nvidia/skillspector scan /scan');
        break;
      }
      default: {
        console.log('Methods: pip, docker');
        console.log('  omni-skills security install pip');
        console.log('  omni-skills security install docker');
      }
    }
  } catch (err) {
    console.error('❌ Installation failed:', err.message);
    console.log('   Try manual installation:');
    console.log('   https://github.com/NVIDIA/skillspector');
  }
}

export function showInstallInstructions() {
  console.log('');
  console.log('🔒 NVIDIA SkillSpector Installation Options');
  console.log('');
  console.log('Option 1: pip (requires Python 3.12+)');
  console.log('  git clone https://github.com/NVIDIA/skillspector.git ~/.local/skillspector');
  console.log('  cd ~/.local/skillspector');
  console.log('  python3 -m venv .venv && source .venv/bin/activate');
  console.log('  pip install -e .');
  console.log('');
  console.log('Option 2: Docker');
  console.log('  docker pull ghcr.io/nvidia/skillspector');
  console.log('  docker run --rm -v "$PWD:/scan" ghcr.io/nvidia/skillspector scan /scan');
  console.log('');
  console.log('Or run: omni-skills security install pip');
  console.log('');
}

export function showScheduleHelp() {
  console.log('');
  console.log('🔒 Periodic Security Scanning');
  console.log('');
  console.log('Add to your crontab for weekly scans:');
  console.log('');
  console.log('  # Edit crontab');
  console.log('  crontab -e');
  console.log('');
  console.log('  # Weekly scan (Sundays at 9:17 AM)');
  console.log('  17 9 * * 0 omni-skills security scan --no-llm');
  console.log('');
  console.log('Or use your system scheduler:');
  console.log('  macOS: launchd');
  console.log('  Linux: systemd timer or cron');
  console.log('  Windows: Task Scheduler');
  console.log('');
}
