import { SupportedTool } from '../domain/supported-tool.js';
import { MarkdownCompiler } from './markdown-compiler.js';
import { CodexCompiler } from './codex-compiler.js';
import { GeminiCompiler } from './gemini-compiler.js';
const COMPILER_REGISTRY = {
    [SupportedTool.CLAUDE]: new MarkdownCompiler(SupportedTool.CLAUDE),
    [SupportedTool.CURSOR]: new MarkdownCompiler(SupportedTool.CURSOR),
    [SupportedTool.KIMI]: new MarkdownCompiler(SupportedTool.KIMI),
    [SupportedTool.CODEX]: new CodexCompiler(),
    [SupportedTool.GEMINI]: new GeminiCompiler(),
    [SupportedTool.OPEN_CODE]: new MarkdownCompiler(SupportedTool.OPEN_CODE),
    [SupportedTool.KILO_CODE]: new MarkdownCompiler(SupportedTool.KILO_CODE),
};
export function getCompilerForTool(targetTool) {
    const compiler = COMPILER_REGISTRY[targetTool];
    if (compiler === undefined) {
        throw new Error(`No compiler registered for tool: ${targetTool}`);
    }
    return compiler;
}
export function compileSkillForTool(skillConfig, skillBody, targetTool) {
    const compiler = getCompilerForTool(targetTool);
    return compiler.compile(skillConfig, skillBody);
}
//# sourceMappingURL=compiler-factory.js.map