import { SkillConfig } from '../domain/skill-config';
import { SupportedTool } from '../domain/supported-tool';
import { ToolCompiler } from './tool-compiler';
import { CompiledSkillOutput } from './tool-compiler';
export declare class MarkdownCompiler implements ToolCompiler {
    readonly targetTool: SupportedTool;
    constructor(targetTool: SupportedTool);
    compile(skillConfig: SkillConfig, skillBody: string): CompiledSkillOutput;
    private renderToolOverrideSection;
}
//# sourceMappingURL=markdown-compiler.d.ts.map