import { SafetyConstraintValue } from '../../domain/safety-constraint-value.js';
import { SkillScope } from '../../domain/skill-scope.js';
export function getToolOverrideForTool(skillConfig, targetTool) {
    const foundOverride = skillConfig.toolOverrides.overrides.find(override => override.targetTool === targetTool);
    return foundOverride ?? null;
}
export function renderConstraints(skillConfig, toolOverride) {
    return {
        requiredCapabilities: renderRequiredCapabilities(skillConfig),
        disabledCapabilities: renderDisabledCapabilities(skillConfig, toolOverride),
        confirmationRequirements: renderConfirmationRequirements(skillConfig, toolOverride),
        stopConditions: renderStopConditions(skillConfig, toolOverride),
        scopeNotice: renderScopeNotice(skillConfig),
    };
}
export function computeDisabledCapabilities(skillConfig, toolOverride) {
    const safetyConstraints = skillConfig.executionBoundary.safetyConstraints;
    const disabled = [];
    if (safetyConstraints.fileSystemWrite === SafetyConstraintValue.DISABLED) {
        disabled.push('file_system_write');
    }
    if (safetyConstraints.networkAccess === SafetyConstraintValue.DISABLED) {
        disabled.push('network_access');
    }
    if (safetyConstraints.shellExecution === SafetyConstraintValue.DISABLED) {
        disabled.push('shell_execution');
    }
    if (safetyConstraints.databaseWrite === SafetyConstraintValue.DISABLED) {
        disabled.push('database_write');
    }
    const toolOverrideDisabledCapabilities = toolOverride?.disabledCapabilities.map(capability => capability.toString()) ?? [];
    return [...disabled, ...toolOverrideDisabledCapabilities];
}
function renderRequiredCapabilities(skillConfig) {
    const capabilities = skillConfig.executionBoundary.requiredCapabilities;
    if (capabilities.length === 0) {
        return 'None declared.';
    }
    return capabilities.map(capability => `- ${capability}`).join('\n');
}
function renderDisabledCapabilities(skillConfig, toolOverride) {
    const disabled = computeDisabledCapabilities(skillConfig, toolOverride);
    if (disabled.length === 0) {
        return 'None declared.';
    }
    return disabled.map(capability => `- ${humanReadableDisabledCapability(capability)}`).join('\n');
}
function humanReadableDisabledCapability(capability) {
    switch (capability) {
        case 'file_system_write':
            return 'File system write operations are disabled.';
        case 'network_access':
            return 'Network access is disabled.';
        case 'shell_execution':
            return 'Shell command execution is disabled.';
        case 'database_write':
            return 'Database write operations are disabled.';
        default:
            return `${capability} is disabled.`;
    }
}
function renderConfirmationRequirements(skillConfig, toolOverride) {
    const globalConfirmations = skillConfig.executionBoundary.safetyConstraints.requireUserConfirmationFor;
    const overrideConfirmations = toolOverride?.requireUserConfirmationFor ?? [];
    const confirmations = [...globalConfirmations, ...overrideConfirmations];
    if (confirmations.length === 0) {
        return 'None declared.';
    }
    return confirmations.map(confirmation => `- ${confirmation}`).join('\n');
}
function renderStopConditions(skillConfig, toolOverride) {
    const globalStopConditions = skillConfig.executionBoundary.stopConditions;
    const overrideStopConditions = toolOverride?.stopConditions ?? [];
    const stopConditions = [...globalStopConditions, ...overrideStopConditions];
    if (stopConditions.length === 0) {
        return 'None declared.';
    }
    return stopConditions.map(condition => `- ${condition}`).join('\n');
}
function renderScopeNotice(skillConfig) {
    switch (skillConfig.scope) {
        case SkillScope.PROJECT_SPECIFIC:
            return 'This skill is project-specific. Only invoke it in the context of its designated project.';
        case SkillScope.EMPLOYER_SPECIFIC:
            return 'This skill is employer-specific. Only invoke it in the context of its designated employer project.';
        case SkillScope.PROJECT_LOCAL:
            return 'This skill operates on project-local files. Invoke it only from the root of a project repository that contains the expected project-local files.';
        case SkillScope.GENERAL:
        default:
            return 'This skill is general-purpose and may be invoked in any context.';
    }
}
//# sourceMappingURL=constraint-renderer.js.map