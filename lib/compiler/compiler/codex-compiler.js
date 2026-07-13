import { SupportedTool } from '../domain/supported-tool.js';
import { MarkdownCompiler } from './markdown-compiler.js';
export class CodexCompiler {
    targetTool = SupportedTool.CODEX;
    markdownCompiler = new MarkdownCompiler(this.targetTool);
    compile(skillConfig, skillBody) {
        const markdownOutput = this.markdownCompiler.compile(skillConfig, skillBody);
        const frontmatter = `---\nname: ${JSON.stringify(skillConfig.skillName)}\ndescription: ${JSON.stringify(skillConfig.description)}\n---\n\n`;
        return {
            ...markdownOutput,
            markdownContent: frontmatter + markdownOutput.markdownContent,
        };
    }
}
//# sourceMappingURL=codex-compiler.js.map
