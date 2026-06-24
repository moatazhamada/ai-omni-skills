import { SafetyConstraintKey, } from './safety-constraint-key.js';
import { requireSafetyConstraintValue, } from './safety-constraint-value.js';
const BOOLEAN_SAFETY_CONSTRAINT_KEYS = [
    SafetyConstraintKey.FILE_SYSTEM_WRITE,
    SafetyConstraintKey.NETWORK_ACCESS,
    SafetyConstraintKey.SHELL_EXECUTION,
    SafetyConstraintKey.DATABASE_WRITE,
];
export function safetyConstraintsFromUnknown(value) {
    if (typeof value !== 'object' || value === null) {
        throw new Error(`Expected a "safetyConstraints" object, received: ${String(value)}.`);
    }
    const record = value;
    return {
        fileSystemWrite: parseBooleanConstraint(record.fileSystemWrite, SafetyConstraintKey.FILE_SYSTEM_WRITE),
        networkAccess: parseBooleanConstraint(record.networkAccess, SafetyConstraintKey.NETWORK_ACCESS),
        shellExecution: parseBooleanConstraint(record.shellExecution, SafetyConstraintKey.SHELL_EXECUTION),
        databaseWrite: parseBooleanConstraint(record.databaseWrite, SafetyConstraintKey.DATABASE_WRITE),
        requireUserConfirmationFor: parseRequireUserConfirmationFor(record.requireUserConfirmationFor),
    };
}
function parseBooleanConstraint(value, key) {
    if (value === undefined) {
        return undefined;
    }
    return requireSafetyConstraintValue(value, `safetyConstraints.${key}`);
}
function parseRequireUserConfirmationFor(value) {
    if (value === undefined) {
        return [];
    }
    if (!Array.isArray(value)) {
        throw new Error(`Expected "requireUserConfirmationFor" to be an array, received: ${String(value)}.`);
    }
    return value.map((confirmationKey, index) => {
        if (typeof confirmationKey !== 'string' || confirmationKey.length === 0) {
            throw new Error(`Expected requireUserConfirmationFor[${index}] to be a non-empty string, received: ${String(confirmationKey)}.`);
        }
        return confirmationKey;
    });
}
//# sourceMappingURL=safety-constraints.js.map