import { SkillConfig } from '../domain/skill-config';
import { ToolCompiler } from './tool-compiler';
import { CompiledSkillOutput } from './compiled-skill-output';
import { SupportedTool } from '../domain/supported-tool';
export declare class CursorCompiler implements ToolCompiler {
    readonly targetTool = SupportedTool.CURSOR;
    compile(skillConfig: SkillConfig, skillBody: string): CompiledSkillOutput;
}
//# sourceMappingURL=cursor-compiler.d.ts.map