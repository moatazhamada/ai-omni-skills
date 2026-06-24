import { ExecutionBoundary } from './execution-boundary';
import { SkillScope } from './skill-scope';
import { ToolOverrides } from './tool-override';
export interface SkillConfig {
    readonly skillName: string;
    readonly version: string;
    readonly description: string;
    readonly scope: SkillScope;
    readonly executionBoundary: ExecutionBoundary;
    readonly toolOverrides: ToolOverrides;
}
export interface SkillConfigParseOptions {
    readonly filePath?: string;
    readonly defaultScope?: SkillScope;
}
export declare function skillConfigFromUnknown(value: unknown, options?: SkillConfigParseOptions): SkillConfig;
//# sourceMappingURL=skill-config.d.ts.map