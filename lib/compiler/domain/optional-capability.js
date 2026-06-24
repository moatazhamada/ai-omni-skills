import { isCapability } from './capability.js';
export function isOptionalCapability(value) {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    const record = value;
    return (isCapability(record.capability) &&
        typeof record.fallback === 'string' &&
        record.fallback.length > 0);
}
export function optionalCapabilityFromUnknown(value) {
    if (typeof value !== 'object' || value === null) {
        throw new Error(`Expected an optional capability object, received: ${String(value)}.`);
    }
    const record = value;
    if (!isCapability(record.capability)) {
        throw new Error(`Optional capability is missing a valid "capability" field.`);
    }
    if (typeof record.fallback !== 'string' || record.fallback.length === 0) {
        throw new Error(`Optional capability "${record.capability}" is missing a non-empty "fallback" string.`);
    }
    return {
        capability: record.capability,
        fallback: record.fallback,
    };
}
//# sourceMappingURL=optional-capability.js.map