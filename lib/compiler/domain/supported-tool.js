export var SupportedTool;
(function (SupportedTool) {
    SupportedTool["CLAUDE"] = "claude";
    SupportedTool["CURSOR"] = "cursor";
    SupportedTool["KIMI"] = "kimi";
    SupportedTool["CODEX"] = "codex";
    SupportedTool["GEMINI"] = "gemini";
    SupportedTool["OPEN_CODE"] = "opencode";
    SupportedTool["KILO_CODE"] = "kilocode";
})(SupportedTool || (SupportedTool = {}));
const ALL_SUPPORTED_TOOLS = Object.values(SupportedTool);
export function isSupportedTool(value) {
    return typeof value === 'string' && ALL_SUPPORTED_TOOLS.includes(value);
}
//# sourceMappingURL=supported-tool.js.map