export var SafetyConstraintValue;
(function (SafetyConstraintValue) {
    SafetyConstraintValue["ENABLED"] = "enabled";
    SafetyConstraintValue["DISABLED"] = "disabled";
})(SafetyConstraintValue || (SafetyConstraintValue = {}));
const ALL_SAFETY_CONSTRAINT_VALUES = Object.values(SafetyConstraintValue);
export function isSafetyConstraintValue(value) {
    return typeof value === 'string' && ALL_SAFETY_CONSTRAINT_VALUES.includes(value);
}
export function requireSafetyConstraintValue(value, context) {
    if (!isSafetyConstraintValue(value)) {
        throw new Error(`Expected "enabled" or "disabled" in ${context}, received: ${String(value)}.`);
    }
    return value;
}
//# sourceMappingURL=safety-constraint-value.js.map