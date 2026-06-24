import { SkillConfig } from '../../domain/skill-config';
import { SupportedTool } from '../../domain/supported-tool';
import { ToolOverride } from '../../domain/tool-override';
export declare function getToolOverrideForTool(skillConfig: SkillConfig, targetTool: SupportedTool): ToolOverride | null;
export interface RenderedConstraints {
    readonly requiredCapabilities: string;
    readonly disabledCapabilities: string;
    readonly confirmationRequirements: string;
    readonly stopConditions: string;
    readonly scopeNotice: string;
}
export declare function renderConstraints(skillConfig: SkillConfig, toolOverride?: ToolOverride): RenderedConstraints;
export declare function computeDisabledCapabilities(skillConfig: SkillConfig, toolOverride?: ToolOverride): string[];
//# sourceMappingURL=constraint-renderer.d.ts.map