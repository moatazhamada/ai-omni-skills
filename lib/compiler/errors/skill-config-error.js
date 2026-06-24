export class SkillConfigError extends Error {
    constructor(message) {
        super(message);
        this.name = 'SkillConfigError';
        Object.setPrototypeOf(this, SkillConfigError.prototype);
    }
}
export class FrontmatterParseError extends SkillConfigError {
    constructor(message) {
        super(`Frontmatter parse error: ${message}`);
        this.name = 'FrontmatterParseError';
        Object.setPrototypeOf(this, FrontmatterParseError.prototype);
    }
}
export class YamlParseError extends FrontmatterParseError {
    constructor(message) {
        super(`Invalid YAML: ${message}`);
        this.name = 'YamlParseError';
        Object.setPrototypeOf(this, YamlParseError.prototype);
    }
}
export class ValidationError extends SkillConfigError {
    constructor(message) {
        super(`Validation error: ${message}`);
        this.name = 'ValidationError';
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}
//# sourceMappingURL=skill-config-error.js.map