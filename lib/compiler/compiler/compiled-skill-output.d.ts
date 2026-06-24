import { SupportedTool } from '../domain/supported-tool';
export interface CompiledSkillOutput {
    readonly targetTool: SupportedTool;
    readonly markdownContent: string;
    readonly structuredMetadata?: Record<string, unknown>;
}
//# sourceMappingURL=compiled-skill-output.d.ts.map