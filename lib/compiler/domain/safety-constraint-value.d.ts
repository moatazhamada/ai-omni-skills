export declare enum SafetyConstraintValue {
    ENABLED = "enabled",
    DISABLED = "disabled"
}
export declare function isSafetyConstraintValue(value: unknown): value is SafetyConstraintValue;
export declare function requireSafetyConstraintValue(value: unknown, context: string): SafetyConstraintValue;
//# sourceMappingURL=safety-constraint-value.d.ts.map