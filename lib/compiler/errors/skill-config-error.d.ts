export declare class SkillConfigError extends Error {
    constructor(message: string);
}
export declare class FrontmatterParseError extends SkillConfigError {
    constructor(message: string);
}
export declare class YamlParseError extends FrontmatterParseError {
    constructor(message: string);
}
export declare class ValidationError extends SkillConfigError {
    constructor(message: string);
}
//# sourceMappingURL=skill-config-error.d.ts.map