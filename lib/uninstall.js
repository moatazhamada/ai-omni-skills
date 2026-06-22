import { existsSync, rmSync, unlinkSync, lstatSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import readline from 'node:readline';
import { expandTilde } from './config.js';

function absPath(p) {
  if (p == null) return null;
  const expanded = expandTilde(p);
  return expanded.startsWith('/') ? expanded : join(process.cwd(), expanded);
}

function ask(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

export async function uninstall(config) {
  const isTty = process.stdin.isTTY && process.stdout.isTTY;
  const rl = isTty ? readline.createInterface({ input: process.stdin, output: process.stdout }) : null;

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  ⚠️  Omni Skills Uninstall');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('This will remove:');
  console.log('  • Symlinks from AI tool directories');
  console.log('  • MCP server configurations');
  console.log('  • Hooks and assets');
  console.log('  • ~/.config/skills/config.json');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  let deleteSkills = false;
  if (isTty) {
    const skillsPath = config.skillsPath || (config.skillPaths ? config.skillPaths[0] : null);
    if (skillsPath) {
      const answer = await ask(rl, `\n🔴 DELETE SKILLS DIRECTORY?\n   Location: ${skillsPath}\n   This contains ALL your skills and cannot be undone!\n   Delete? [y/N] (default: NO): `);
      deleteSkills = answer.trim().toLowerCase() === 'y' || answer.trim().toLowerCase() === 'yes';
    }
  }

  console.log('');
  console.log('Removing toolkit integrations...');

  // Remove symlinks from tool directories
  for (const [toolName, tool] of Object.entries(config.tools ?? {})) {
    // Remove instruction file symlink
    if (tool.instructionFile) {
      const f = absPath(tool.instructionFile);
      if (f && existsSync(f) && lstatSync(f).isSymbolicLink()) {
        try {
          unlinkSync(f);
          console.log(`  ✓ Removed ${toolName} instruction symlink`);
        } catch (err) {
          console.log(`  ⚠️  Could not remove ${toolName} instruction symlink`);
        }
      }
    }

    // Remove skill directory symlinks
    if (tool.skillsDir) {
      const dirs = Array.isArray(tool.skillsDir) ? tool.skillsDir : [tool.skillsDir];
      for (const dirTemplate of dirs) {
        const dir = absPath(dirTemplate);
        if (!dir || !existsSync(dir)) continue;
        try {
          const entries = require('node:fs').readdirSync(dir, { withFileTypes: true });
          for (const entry of entries) {
            if (entry.isSymbolicLink()) {
              const entryPath = join(dir, entry.name);
              try {
                unlinkSync(entryPath);
              } catch {
                // ignore
              }
            }
          }
          console.log(`  ✓ Removed ${toolName} skill symlinks`);
        } catch {
          // ignore
        }
      }
    }

    // Remove MCP config entries
    if (tool.mcp?.file) {
      const mcpFile = absPath(tool.mcp.file);
      if (mcpFile && existsSync(mcpFile)) {
        try {
          let content = readFileSync(mcpFile, 'utf8');
          const serverName = config.mcpServerName || 'omni-skills';
          // Simple removal for JSON files
          if (mcpFile.endsWith('.json')) {
            const data = JSON.parse(content);
            if (data.mcpServers?.[serverName]) {
              delete data.mcpServers[serverName];
              require('node:fs').writeFileSync(mcpFile, JSON.stringify(data, null, 2));
              console.log(`  ✓ Removed ${toolName} MCP config`);
            }
          }
        } catch {
          // ignore
        }
      }
    }
  }

  // Remove config file
  const configDir = absPath('~/.config/skills');
  const configPath = join(configDir, 'config.json');
  if (existsSync(configPath)) {
    try {
      rmSync(configPath);
      console.log('  ✓ Removed ~/.config/skills/config.json');
    } catch {
      console.log('  ⚠️  Could not remove config.json');
    }
  }

  console.log('');

  if (deleteSkills) {
    const skillsPath = config.skillsPath || (config.skillPaths ? config.skillPaths[0] : null);
    if (skillsPath) {
      const abs = absPath(skillsPath);
      if (abs && existsSync(abs)) {
        try {
          rmSync(abs, { recursive: true, force: true });
          console.log(`🔴 Deleted skills directory: ${skillsPath}`);
        } catch {
          console.log(`⚠️  Could not delete skills directory: ${skillsPath}`);
          console.log('   Delete manually: rm -rf ' + skillsPath);
        }
      }
    }
  } else {
    const skillsPath = config.skillsPath || (config.skillPaths ? config.skillPaths[0] : null);
    if (skillsPath) {
      console.log(`✅ Your skills are SAFE at: ${skillsPath}`);
      console.log('   They are still in the git repo. Reinstall omni-skills anytime and run:');
      console.log('     omni-skills setup');
      console.log('     omni-skills sync all');
    }
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Uninstall complete');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('To reinstall:');
  console.log('  npm install -g ai-omni-skills@latest');
  console.log('  omni-skills setup');
  console.log('  omni-skills sync all');
  console.log('');

  if (rl) rl.close();
}
