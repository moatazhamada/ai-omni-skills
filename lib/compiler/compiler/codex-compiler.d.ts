import { SkillConfig } from '../domain/skill-config';
import { ToolCompiler } from './tool-compiler';
import { CompiledSkillOutput } from './tool-compiler';
import { SupportedTool } from '../domain/supported-tool';
export declare class CodexCompiler implements ToolCompiler {
    readonly targetTool = SupportedTool.CODEX;
    private readonly markdownCompiler;
    compile(skillConfig: SkillConfig, skillBody: string): CompiledSkillOutput;
}
//# sourceMappingURL=codex-compiler.d.ts.map
