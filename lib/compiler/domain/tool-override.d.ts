import { Capability } from './capability';
import { SupportedTool } from './supported-tool';
export interface ToolOverride {
    readonly targetTool: SupportedTool;
    readonly prependInstructions?: string;
    readonly disabledCapabilities: ReadonlyArray<Capability>;
    readonly stopConditions: ReadonlyArray<string>;
    readonly requireUserConfirmationFor: ReadonlyArray<string>;
}
export interface ToolOverrides {
    readonly overrides: ReadonlyArray<ToolOverride>;
}
export declare function toolOverridesFromUnknown(value: unknown): ToolOverrides;
//# sourceMappingURL=tool-override.d.ts.map