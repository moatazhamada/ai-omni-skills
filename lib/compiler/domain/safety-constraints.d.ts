import { SafetyConstraintValue } from './safety-constraint-value';
export interface SafetyConstraints {
    readonly fileSystemWrite?: SafetyConstraintValue;
    readonly networkAccess?: SafetyConstraintValue;
    readonly shellExecution?: SafetyConstraintValue;
    readonly databaseWrite?: SafetyConstraintValue;
    readonly requireUserConfirmationFor: ReadonlyArray<string>;
}
export declare function safetyConstraintsFromUnknown(value: unknown): SafetyConstraints;
//# sourceMappingURL=safety-constraints.d.ts.map