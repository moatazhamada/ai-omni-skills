import * as path from 'node:path';
import * as yaml from 'js-yaml';
import { skillConfigFromUnknown, } from '../domain/skill-config.js';
import { FrontmatterParseError, YamlParseError, } from '../errors/skill-config-error.js';
export function parseSkillMarkdown(skillMarkdownContent, options = {}) {
    const trimmedContent = skillMarkdownContent.trimStart();
    if (!trimmedContent.startsWith('---')) {
        return {
            ...buildZeroConfigFallback(skillMarkdownContent, options),
            hasFrontmatter: false,
        };
    }
    const frontmatterEndIndex = trimmedContent.indexOf('\n---', 3);
    if (frontmatterEndIndex === -1) {
        throw new FrontmatterParseError('YAML frontmatter is missing a closing "---" delimiter.');
    }
    const frontmatterYaml = trimmedContent.slice(3, frontmatterEndIndex).trim();
    const bodyStartIndex = frontmatterEndIndex + 4;
    const body = trimmedContent.slice(bodyStartIndex).replace(/^\n+/, '');
    const normalizedYaml = normalizeLegacyFrontmatter(frontmatterYaml);
    const parsedYaml = parseYamlFrontmatter(normalizedYaml);
    const config = skillConfigFromUnknown(parsedYaml, {
        filePath: options.filePath,
    });
    return { config, body, hasFrontmatter: true };
}
function inferSkillNameFromPath(filePath) {
    if (filePath === undefined || filePath.length === 0) {
        return 'unknown-skill';
    }
    const directoryName = path.basename(path.dirname(filePath));
    if (directoryName.length === 0 || directoryName === '.') {
        return path.basename(filePath, path.extname(filePath));
    }
    return directoryName;
}
function buildZeroConfigFallback(skillMarkdownContent, options) {
    const inferredSkillName = inferSkillNameFromPath(options.filePath);
    const fallbackFrontmatter = {
        skillName: inferredSkillName,
        version: '0.0.0',
        description: 'No description provided.',
    };
    const config = skillConfigFromUnknown(fallbackFrontmatter, {
        filePath: options.filePath,
        defaultScope: undefined,
    });
    return { config, body: skillMarkdownContent, hasFrontmatter: false };
}
function normalizeLegacyFrontmatter(frontmatterYaml) {
    return frontmatterYaml.replace(/^version:\s*(\d+(?:\.\d+)?)\s*$/gim, 'version: "$1"');
}
function parseYamlFrontmatter(frontmatterYaml) {
    if (frontmatterYaml.length === 0) {
        throw new YamlParseError('YAML frontmatter block is empty.');
    }
    try {
        return yaml.load(frontmatterYaml, { schema: yaml.JSON_SCHEMA });
    }
    catch {
        return parseLegacyFrontmatterKeyValues(frontmatterYaml);
    }
}
function parseLegacyFrontmatterKeyValues(frontmatterYaml) {
    const record = {};
    for (const line of frontmatterYaml.split('\n')) {
        const trimmedLine = line.trim();
        if (trimmedLine.length === 0 || trimmedLine.startsWith('#'))
            continue;
        const separatorIndex = trimmedLine.indexOf(':');
        if (separatorIndex <= 0)
            continue;
        const key = trimmedLine.slice(0, separatorIndex).trim();
        const rawValue = trimmedLine.slice(separatorIndex + 1).trim();
        if (rawValue.length === 0) {
            record[key] = undefined;
            continue;
        }
        const unquotedValue = rawValue.replace(/^["'](.*)["']$/, '$1');
        record[key] = unquotedValue;
    }
    return record;
}
//# sourceMappingURL=frontmatter-parser.js.map