import { SkillConfig } from '../domain/skill-config';
export interface ParsedSkillMarkdown {
    readonly config: SkillConfig;
    readonly body: string;
    readonly hasFrontmatter: boolean;
}
export interface ParseSkillMarkdownOptions {
    readonly filePath?: string;
}
export declare function parseSkillMarkdown(skillMarkdownContent: string, options?: ParseSkillMarkdownOptions): ParsedSkillMarkdown;
//# sourceMappingURL=frontmatter-parser.d.ts.map