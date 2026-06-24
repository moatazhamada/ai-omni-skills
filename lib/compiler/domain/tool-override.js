import { isCapability } from './capability.js';
import { SupportedTool, isSupportedTool } from './supported-tool.js';
export function toolOverridesFromUnknown(value) {
    if (value === undefined) {
        return { overrides: [] };
    }
    if (typeof value !== 'object' || value === null) {
        throw new Error(`Expected "toolOverrides" to be an object, received: ${String(value)}.`);
    }
    const record = value;
    const overrides = [];
    for (const [toolName, toolValue] of Object.entries(record)) {
        if (!isSupportedTool(toolName)) {
            throw new Error(`Unsupported tool name in "toolOverrides": ${toolName}. ` +
                `Allowed tools: ${Object.values(SupportedTool).join(', ')}.`);
        }
        overrides.push(parseToolOverride(toolName, toolValue));
    }
    return { overrides };
}
function parseToolOverride(targetTool, value) {
    if (typeof value !== 'object' || value === null) {
        throw new Error(`Expected tool override for "${targetTool}" to be an object, received: ${String(value)}.`);
    }
    const record = value;
    return {
        targetTool,
        prependInstructions: parseOptionalString(record.prependInstructions, `toolOverrides.${targetTool}.prependInstructions`),
        disabledCapabilities: parseDisabledCapabilities(record.disabledCapabilities, targetTool),
        stopConditions: parseStringArray(record.stopConditions, `toolOverrides.${targetTool}.stopConditions`),
        requireUserConfirmationFor: parseStringArray(record.requireUserConfirmationFor, `toolOverrides.${targetTool}.requireUserConfirmationFor`),
    };
}
function parseOptionalString(value, context) {
    if (value === undefined) {
        return undefined;
    }
    if (typeof value !== 'string') {
        throw new Error(`Expected "${context}" to be a string, received: ${String(value)}.`);
    }
    return value;
}
function parseDisabledCapabilities(value, targetTool) {
    if (value === undefined) {
        return [];
    }
    if (!Array.isArray(value)) {
        throw new Error(`Expected "toolOverrides.${targetTool}.disabledCapabilities" to be an array, received: ${String(value)}.`);
    }
    return value.map((capabilityValue, index) => {
        if (!isCapability(capabilityValue)) {
            throw new Error(`Invalid capability in toolOverrides.${targetTool}.disabledCapabilities[${index}]: ${String(capabilityValue)}.`);
        }
        return capabilityValue;
    });
}
function parseStringArray(value, context) {
    if (value === undefined) {
        return [];
    }
    if (!Array.isArray(value)) {
        throw new Error(`Expected "${context}" to be an array, received: ${String(value)}.`);
    }
    return value.map((item, index) => {
        if (typeof item !== 'string' || item.length === 0) {
            throw new Error(`Expected "${context}[${index}]" to be a non-empty string, received: ${String(item)}.`);
        }
        return item;
    });
}
//# sourceMappingURL=tool-override.js.map