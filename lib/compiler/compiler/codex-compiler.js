import { computeDisabledCapabilities, getToolOverrideForTool, } from './shared/constraint-renderer.js';
import { SupportedTool } from '../domain/supported-tool.js';
import { MarkdownCompiler } from './markdown-compiler.js';
export class CodexCompiler {
    targetTool = SupportedTool.CODEX;
    markdownCompiler = new MarkdownCompiler(this.targetTool);
    compile(skillConfig, skillBody) {
        const toolOverride = getToolOverrideForTool(skillConfig, this.targetTool);
        const markdownOutput = this.markdownCompiler.compile(skillConfig, skillBody);
        const tomlMetadata = this.buildTomlMetadata(skillConfig, toolOverride);
        return {
            ...markdownOutput,
            structuredMetadata: {
                toml: tomlMetadata,
            },
        };
    }
    buildTomlMetadata(skillConfig, toolOverride) {
        const disabledCapabilities = computeDisabledCapabilities(skillConfig, toolOverride ?? undefined);
        const stopConditions = [
            ...skillConfig.executionBoundary.stopConditions,
            ...(toolOverride?.stopConditions ?? []),
        ];
        const requireUserConfirmationFor = [
            ...skillConfig.executionBoundary.safetyConstraints.requireUserConfirmationFor,
            ...(toolOverride?.requireUserConfirmationFor ?? []),
        ];
        return `[omni-skills.${skillConfig.skillName}]
version = "${skillConfig.version}"
scope = "${skillConfig.scope}"
required_capabilities = [${skillConfig.executionBoundary.requiredCapabilities
            .map(capability => `"${capability}"`)
            .join(', ')}]
disabled_capabilities = [${disabledCapabilities.map(capability => `"${capability}"`).join(', ')}]
require_confirmation = [${requireUserConfirmationFor
            .map(item => `"${item}"`)
            .join(', ')}]
stop_conditions = [${stopConditions.map(condition => `"${condition}"`).join(', ')}]
`;
    }
}
//# sourceMappingURL=codex-compiler.js.map