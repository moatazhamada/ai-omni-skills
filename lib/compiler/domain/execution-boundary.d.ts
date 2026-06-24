import { Capability } from './capability';
import { OptionalCapability } from './optional-capability';
import { SafetyConstraints } from './safety-constraints';
export interface ExecutionBoundary {
    readonly requiredCapabilities: ReadonlyArray<Capability>;
    readonly optionalCapabilities: ReadonlyArray<OptionalCapability>;
    readonly safetyConstraints: SafetyConstraints;
    readonly stopConditions: ReadonlyArray<string>;
}
export declare function executionBoundaryFromUnknown(value: unknown): ExecutionBoundary;
//# sourceMappingURL=execution-boundary.d.ts.map