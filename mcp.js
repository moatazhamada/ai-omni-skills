import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { watch } from 'node:fs';
import { scanSkills, readSkillBody } from './lib/skills.js';
import { logUse } from './lib/usage.js';

export async function startMcp(config) {
  let skills = scanSkills(config);

  const server = new Server(
    { name: config.mcpServerName, version: '0.1.0' },
    { capabilities: { tools: {}, prompts: { listChanged: true } } }
  );

  function notifyPromptListChanged() {
    try {
      if (typeof server.sendPromptListChanged === 'function') {
        server.sendPromptListChanged();
      } else {
        server.notification('notifications/prompts/list_changed');
      }
    } catch (err) {
      console.error('Failed to send prompt list changed notification:', err);
    }
  }

  function rescanSkills() {
    skills = scanSkills(config);
    notifyPromptListChanged();
  }

  let debounce;
  function scheduleRescan() {
    clearTimeout(debounce);
    debounce = setTimeout(rescanSkills, 300);
  }

  for (const rawPath of config.skillPaths ?? []) {
    try {
      watch(rawPath, { recursive: false }, () => scheduleRescan());
    } catch (err) {
      console.error(`Failed to watch ${rawPath}:`, err);
    }
  }

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'list_skills',
        description: 'List all available skills (name + description + repo).',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      },
      {
        name: 'read_skill',
        description: 'Return the full SKILL.md body for a skill by name. Call this before acting on a task a skill covers.',
        inputSchema: {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: ['name'],
          additionalProperties: false,
        },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    if (name === 'list_skills') {
      const text = JSON.stringify(
        skills.map((s) => ({ name: s.name, description: s.description, repo: s.repo })),
        null,
        2
      );
      return { content: [{ type: 'text', text }] };
    }

    if (name === 'read_skill') {
      const skillName = args?.name;
      const skill = skills.find((s) => s.name === skillName);
      if (!skill) {
        return {
          content: [{ type: 'text', text: `Unknown skill: ${skillName}` }],
          isError: true,
        };
      }
      logUse(config, skillName);
      const body = readSkillBody(skill);
      return { content: [{ type: 'text', text: body }] };
    }

    return {
      content: [{ type: 'text', text: `Unknown tool: ${name}` }],
      isError: true,
    };
  });

  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: skills.map((s) => ({ name: s.name, description: s.description })),
  }));

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const name = request.params.name;
    const skill = skills.find((s) => s.name === name);
    if (!skill) {
      throw new Error(`Unknown skill: ${name}`);
    }
    logUse(config, name);
    const body = readSkillBody(skill);
    return {
      description: skill.description,
      messages: [{ role: 'user', content: { type: 'text', text: body } }],
    };
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
