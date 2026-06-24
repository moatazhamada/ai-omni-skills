import { SupportedTool } from '../domain/supported-tool';
import { SkillConfig } from '../domain/skill-config';
import { ToolCompiler } from './tool-compiler';
import { CompiledSkillOutput } from './tool-compiler';
export declare function getCompilerForTool(targetTool: SupportedTool): ToolCompiler;
export declare function compileSkillForTool(skillConfig: SkillConfig, skillBody: string, targetTool: SupportedTool): CompiledSkillOutput;
//# sourceMappingURL=compiler-factory.d.ts.map