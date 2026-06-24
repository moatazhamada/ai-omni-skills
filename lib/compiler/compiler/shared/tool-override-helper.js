"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getToolOverrideForTool = getToolOverrideForTool;
function getToolOverrideForTool(skillConfig, targetTool) {
    const foundOverride = skillConfig.toolOverrides.overrides.find(override => override.targetTool === targetTool);
    return foundOverride ?? null;
}
//# sourceMappingURL=tool-override-helper.js.map