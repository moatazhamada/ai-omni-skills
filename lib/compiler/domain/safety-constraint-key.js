export var SafetyConstraintKey;
(function (SafetyConstraintKey) {
    SafetyConstraintKey["FILE_SYSTEM_WRITE"] = "fileSystemWrite";
    SafetyConstraintKey["NETWORK_ACCESS"] = "networkAccess";
    SafetyConstraintKey["SHELL_EXECUTION"] = "shellExecution";
    SafetyConstraintKey["DATABASE_WRITE"] = "databaseWrite";
    SafetyConstraintKey["REQUIRE_USER_CONFIRMATION_FOR"] = "requireUserConfirmationFor";
})(SafetyConstraintKey || (SafetyConstraintKey = {}));
const ALL_SAFETY_CONSTRAINT_KEYS = Object.values(SafetyConstraintKey);
export function isSafetyConstraintKey(value) {
    return typeof value === 'string' && ALL_SAFETY_CONSTRAINT_KEYS.includes(value);
}
//# sourceMappingURL=safety-constraint-key.js.map