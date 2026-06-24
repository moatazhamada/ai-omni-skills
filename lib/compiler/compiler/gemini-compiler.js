import { computeDisabledCapabilities, getToolOverrideForTool, } from './shared/constraint-renderer.js';
import { SupportedTool } from '../domain/supported-tool.js';
import { MarkdownCompiler } from './markdown-compiler.js';
export class GeminiCompiler {
    targetTool = SupportedTool.GEMINI;
    markdownCompiler = new MarkdownCompiler(this.targetTool);
    compile(skillConfig, skillBody) {
        const toolOverride = getToolOverrideForTool(skillConfig, this.targetTool);
        const markdownOutput = this.markdownCompiler.compile(skillConfig, skillBody);
        const jsonMetadata = this.buildJsonMetadata(skillConfig, toolOverride);
        return {
            ...markdownOutput,
            structuredMetadata: {
                json: jsonMetadata,
            },
        };
    }
    buildJsonMetadata(skillConfig, toolOverride) {
        const disabledCapabilities = computeDisabledCapabilities(skillConfig, toolOverride ?? undefined);
        const stopConditions = [
            ...skillConfig.executionBoundary.stopConditions,
            ...(toolOverride?.stopConditions ?? []),
        ];
        const requireUserConfirmationFor = [
            ...skillConfig.executionBoundary.safetyConstraints.requireUserConfirmationFor,
            ...(toolOverride?.requireUserConfirmationFor ?? []),
        ];
        return {
            omniSkills: {
                skillName: skillConfig.skillName,
                version: skillConfig.version,
                scope: skillConfig.scope,
                executionBoundary: {
                    requiredCapabilities: skillConfig.executionBoundary.requiredCapabilities,
                    disabledCapabilities,
                    requireUserConfirmationFor,
                    stopConditions,
                },
            },
        };
    }
}
//# sourceMappingURL=gemini-compiler.js.map