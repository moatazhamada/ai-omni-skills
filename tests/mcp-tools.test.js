import { describe, it } from 'node:test';
import assert from 'node:assert';
import { TOOL_DEFINITIONS } from '../mcp.js';

const HINTS = ['readOnlyHint', 'destructiveHint', 'idempotentHint', 'openWorldHint'];

describe('mcp.js tool definitions', () => {
  it('advertises list_skills and read_skill', () => {
    assert.deepStrictEqual(
      TOOL_DEFINITIONS.map((tool) => tool.name),
      ['list_skills', 'read_skill']
    );
  });

  it('declares all four MCP hints as booleans on every tool', () => {
    for (const tool of TOOL_DEFINITIONS) {
      for (const hint of HINTS) {
        assert.strictEqual(
          typeof tool.annotations?.[hint],
          'boolean',
          tool.name + ' is missing a boolean ' + hint
        );
      }
    }
  });

  it('marks both tools read-only and non-destructive', () => {
    for (const tool of TOOL_DEFINITIONS) {
      assert.strictEqual(tool.annotations.readOnlyHint, true, tool.name);
      assert.strictEqual(tool.annotations.destructiveHint, false, tool.name);
      assert.strictEqual(tool.annotations.openWorldHint, false, tool.name);
    }
  });

  it('read_skill requires a string name argument', () => {
    const readSkill = TOOL_DEFINITIONS.find((tool) => tool.name === 'read_skill');
    assert.deepStrictEqual(readSkill.inputSchema.required, ['name']);
    assert.strictEqual(readSkill.inputSchema.properties.name.type, 'string');
  });
});
