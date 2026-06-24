import { SkillConfig } from '../domain/skill-config';
import { ToolCompiler } from './tool-compiler';
import { CompiledSkillOutput } from './compiled-skill-output';
import { SupportedTool } from '../domain/supported-tool';
export declare class KimiCompiler implements ToolCompiler {
    readonly targetTool = SupportedTool.KIMI;
    compile(skillConfig: SkillConfig, skillBody: string): CompiledSkillOutput;
}
//# sourceMappingURL=kimi-compiler.d.ts.map