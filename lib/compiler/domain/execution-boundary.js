import { requireCapability } from './capability.js';
import { optionalCapabilityFromUnknown } from './optional-capability.js';
import { safetyConstraintsFromUnknown } from './safety-constraints.js';
export function executionBoundaryFromUnknown(value) {
    if (typeof value !== 'object' || value === null) {
        throw new Error(`Expected an "executionBoundary" object, received: ${String(value)}.`);
    }
    const record = value;
    return {
        requiredCapabilities: parseRequiredCapabilities(record.requiredCapabilities),
        optionalCapabilities: parseOptionalCapabilities(record.optionalCapabilities),
        safetyConstraints: parseSafetyConstraints(record.safetyConstraints),
        stopConditions: parseStopConditions(record.stopConditions),
    };
}
function parseSafetyConstraints(value) {
    try {
        return safetyConstraintsFromUnknown(value ?? {});
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(message);
    }
}
function parseRequiredCapabilities(value) {
    if (value === undefined) {
        return [];
    }
    if (!Array.isArray(value)) {
        throw new Error(`Expected "requiredCapabilities" to be an array, received: ${String(value)}.`);
    }
    return value.map((capabilityValue, index) => requireCapability(capabilityValue, `requiredCapabilities[${index}]`));
}
function parseOptionalCapabilities(value) {
    if (value === undefined) {
        return [];
    }
    if (!Array.isArray(value)) {
        throw new Error(`Expected "optionalCapabilities" to be an array, received: ${String(value)}.`);
    }
    return value.map((optionalCapabilityValue, index) => {
        try {
            return optionalCapabilityFromUnknown(optionalCapabilityValue);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Invalid optionalCapabilities[${index}]: ${message}`);
        }
    });
}
function parseStopConditions(value) {
    if (value === undefined) {
        return [];
    }
    if (!Array.isArray(value)) {
        throw new Error(`Expected "stopConditions" to be an array, received: ${String(value)}.`);
    }
    return value.map((stopCondition, index) => {
        if (typeof stopCondition !== 'string' || stopCondition.length === 0) {
            throw new Error(`Expected stopConditions[${index}] to be a non-empty string, received: ${String(stopCondition)}.`);
        }
        return stopCondition;
    });
}
//# sourceMappingURL=execution-boundary.js.map