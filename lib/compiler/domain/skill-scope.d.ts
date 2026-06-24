export declare enum SkillScope {
    GENERAL = "general",
    PROJECT_SPECIFIC = "project-specific",
    EMPLOYER_SPECIFIC = "employer-specific",
    PROJECT_LOCAL = "project-local"
}
export declare function isSkillScope(value: unknown): value is SkillScope;
export declare function skillScopeFromUnknown(value: unknown): SkillScope;
export declare function inferSkillScopeFromPath(skillFilePath: string): SkillScope;
//# sourceMappingURL=skill-scope.d.ts.map