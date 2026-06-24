import { Capability } from './capability.js';
import { executionBoundaryFromUnknown } from './execution-boundary.js';
import { SafetyConstraintKey } from './safety-constraint-key.js';
import { SafetyConstraintValue } from './safety-constraint-value.js';
import { SkillScope, skillScopeFromUnknown, inferSkillScopeFromPath, } from './skill-scope.js';
import { toolOverridesFromUnknown } from './tool-override.js';
import { ValidationError } from '../errors/skill-config-error.js';
export function skillConfigFromUnknown(value, options = {}) {
    if (typeof value !== 'object' || value === null) {
        throw new ValidationError(`Expected a frontmatter object, received: ${String(value)}.`);
    }
    const record = value;
    const skillConfig = {
        skillName: parseSkillName(record),
        version: parseVersion(record),
        description: parseDescription(record),
        scope: parseScope(record, options),
        executionBoundary: parseExecutionBoundary(record.executionBoundary),
        toolOverrides: parseToolOverrides(record.toolOverrides),
    };
    validateCapabilitySafetyConsistency(skillConfig);
    validateToolOverrideConsistency(skillConfig);
    return skillConfig;
}
function parseSkillName(record) {
    const skillName = record.skillName ?? record.name;
    if (typeof skillName !== 'string' || skillName.length === 0) {
        throw new ValidationError(`Expected "skillName" (or legacy "name") to be a non-empty string.`);
    }
    return skillName;
}
function parseVersion(record) {
    const rawVersion = record.version ?? '0.0.0';
    const version = typeof rawVersion === 'number' ? String(rawVersion) : rawVersion;
    if (typeof version !== 'string' || version.length === 0) {
        throw new ValidationError(`Expected "version" to be a non-empty string or number, received: ${String(version)}.`);
    }
    return version;
}
function parseDescription(record) {
    const description = record.description ?? 'No description provided.';
    if (typeof description !== 'string') {
        throw new ValidationError(`Expected "description" to be a string, received: ${String(description)}.`);
    }
    return description;
}
function parseScope(record, options) {
    if (record.scope !== undefined) {
        try {
            return skillScopeFromUnknown(record.scope);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            throw new ValidationError(message);
        }
    }
    if (options.defaultScope !== undefined) {
        return options.defaultScope;
    }
    if (options.filePath !== undefined) {
        return inferSkillScopeFromPath(options.filePath);
    }
    return SkillScope.GENERAL;
}
function parseExecutionBoundary(value) {
    try {
        return executionBoundaryFromUnknown(value ?? {});
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new ValidationError(message);
    }
}
function parseToolOverrides(value) {
    try {
        return toolOverridesFromUnknown(value);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new ValidationError(message);
    }
}
const CAPABILITY_SAFETY_REQUIREMENTS = [
    {
        capability: Capability.FILE_SYSTEM_WRITE,
        requiredConstraintKey: SafetyConstraintKey.FILE_SYSTEM_WRITE,
        requiredValue: SafetyConstraintValue.ENABLED,
    },
    {
        capability: Capability.NETWORK_ACCESS,
        requiredConstraintKey: SafetyConstraintKey.NETWORK_ACCESS,
        requiredValue: SafetyConstraintValue.ENABLED,
    },
    {
        capability: Capability.SHELL_EXECUTION,
        requiredConstraintKey: SafetyConstraintKey.SHELL_EXECUTION,
        requiredValue: SafetyConstraintValue.ENABLED,
    },
    {
        capability: Capability.DATABASE_WRITE,
        requiredConstraintKey: SafetyConstraintKey.DATABASE_WRITE,
        requiredValue: SafetyConstraintValue.ENABLED,
    },
];
function validateCapabilitySafetyConsistency(skillConfig) {
    const safetyConstraints = skillConfig.executionBoundary.safetyConstraints;
    for (const requirement of CAPABILITY_SAFETY_REQUIREMENTS) {
        const hasRequiredCapability = skillConfig.executionBoundary.requiredCapabilities.includes(requirement.capability);
        const actualValue = getSafetyConstraintValue(safetyConstraints, requirement.requiredConstraintKey);
        if (hasRequiredCapability && actualValue === SafetyConstraintValue.DISABLED) {
            throw new ValidationError(`Required capability "${requirement.capability}" conflicts with safety constraint ` +
                `"${requirement.requiredConstraintKey}: disabled". ` +
                `Either remove the capability or enable the constraint.`);
        }
    }
}
function validateToolOverrideConsistency(skillConfig) {
    const requiredCapabilities = skillConfig.executionBoundary.requiredCapabilities;
    for (const toolOverride of skillConfig.toolOverrides.overrides) {
        for (const disabledCapability of toolOverride.disabledCapabilities) {
            if (requiredCapabilities.includes(disabledCapability)) {
                throw new ValidationError(`Tool override for "${toolOverride.targetTool}" disables capability ` +
                    `"${disabledCapability}", but it is listed as a required capability.`);
            }
        }
    }
}
function getSafetyConstraintValue(safetyConstraints, key) {
    switch (key) {
        case SafetyConstraintKey.FILE_SYSTEM_WRITE:
            return safetyConstraints.fileSystemWrite;
        case SafetyConstraintKey.NETWORK_ACCESS:
            return safetyConstraints.networkAccess;
        case SafetyConstraintKey.SHELL_EXECUTION:
            return safetyConstraints.shellExecution;
        case SafetyConstraintKey.DATABASE_WRITE:
            return safetyConstraints.databaseWrite;
        default:
            return undefined;
    }
}
//# sourceMappingURL=skill-config.js.map