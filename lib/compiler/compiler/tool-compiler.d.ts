import { SkillConfig } from '../domain/skill-config';
import { SupportedTool } from '../domain/supported-tool';
export interface CompiledSkillOutput {
    readonly targetTool: SupportedTool;
    readonly markdownContent: string;
    readonly structuredMetadata?: Record<string, unknown>;
}
export interface ToolCompiler {
    readonly targetTool: SupportedTool;
    compile(skillConfig: SkillConfig, skillBody: string): CompiledSkillOutput;
}
//# sourceMappingURL=tool-compiler.d.ts.map