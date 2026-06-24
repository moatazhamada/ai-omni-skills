import { SkillConfig } from '../domain/skill-config';
import { ToolCompiler } from './tool-compiler';
import { CompiledSkillOutput } from './tool-compiler';
import { SupportedTool } from '../domain/supported-tool';
export declare class GeminiCompiler implements ToolCompiler {
    readonly targetTool = SupportedTool.GEMINI;
    private readonly markdownCompiler;
    compile(skillConfig: SkillConfig, skillBody: string): CompiledSkillOutput;
    private buildJsonMetadata;
}
//# sourceMappingURL=gemini-compiler.d.ts.map