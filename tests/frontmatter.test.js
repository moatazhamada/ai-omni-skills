import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseFrontmatter } from '../lib/frontmatter.js';

describe('frontmatter.js', () => {
  it('parses a standard YAML block', () => {
    const { data, content } = parseFrontmatter(
      '---\nname: test-skill\ndescription: A test skill\n---\n\n# Body\n'
    );
    assert.strictEqual(data.name, 'test-skill');
    assert.strictEqual(data.description, 'A test skill');
    assert.strictEqual(content.trim(), '# Body');
  });

  it('parses nested lists used by workflows', () => {
    const { data } = parseFrontmatter(
      '---\nname: wf\nsteps:\n  - first-skill\n  - second-skill\n---\nbody\n'
    );
    assert.deepStrictEqual(data.steps, ['first-skill', 'second-skill']);
  });

  it('returns the whole text when no front matter is present', () => {
    const { data, content } = parseFrontmatter('# Just markdown\n');
    assert.deepStrictEqual(data, {});
    assert.strictEqual(content, '# Just markdown\n');
  });

  it('handles an empty front-matter block', () => {
    const { data } = parseFrontmatter('---\n---\nbody\n');
    assert.deepStrictEqual(data, {});
  });

  it('falls back to a flat scan for malformed YAML', () => {
    const { data } = parseFrontmatter(
      '---\nname: broken\ndescription: a colon: inside value\n---\nbody\n'
    );
    assert.strictEqual(data.name, 'broken');
    assert.ok(String(data.description).includes('colon'));
  });
});
