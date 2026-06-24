export var SkillScope;
(function (SkillScope) {
    SkillScope["GENERAL"] = "general";
    SkillScope["PROJECT_SPECIFIC"] = "project-specific";
    SkillScope["EMPLOYER_SPECIFIC"] = "employer-specific";
    SkillScope["PROJECT_LOCAL"] = "project-local";
})(SkillScope || (SkillScope = {}));
const ALL_SKILL_SCOPES = Object.values(SkillScope);
export function isSkillScope(value) {
    return typeof value === 'string' && ALL_SKILL_SCOPES.includes(value);
}
export function skillScopeFromUnknown(value) {
    if (!isSkillScope(value)) {
        throw new Error(`Expected a valid skill scope, received: ${String(value)}. ` +
            `Allowed values: ${ALL_SKILL_SCOPES.join(', ')}.`);
    }
    return value;
}
export function inferSkillScopeFromPath(skillFilePath) {
    const normalizedPath = skillFilePath.replace(/\\/g, '/');
    if (normalizedPath.includes('/projects/')) {
        return SkillScope.PROJECT_SPECIFIC;
    }
    if (normalizedPath.includes('/employers/')) {
        return SkillScope.EMPLOYER_SPECIFIC;
    }
    return SkillScope.GENERAL;
}
//# sourceMappingURL=skill-scope.js.map