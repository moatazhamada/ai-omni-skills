import { Capability } from './capability';
export interface OptionalCapability {
    readonly capability: Capability;
    readonly fallback: string;
}
export declare function isOptionalCapability(value: unknown): value is OptionalCapability;
export declare function optionalCapabilityFromUnknown(value: unknown): OptionalCapability;
//# sourceMappingURL=optional-capability.d.ts.map