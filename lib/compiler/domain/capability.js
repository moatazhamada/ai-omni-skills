export var Capability;
(function (Capability) {
    Capability["FILE_SYSTEM_READ"] = "file_system_read";
    Capability["FILE_SYSTEM_WRITE"] = "file_system_write";
    Capability["GIT_DIFF_INSPECT"] = "git_diff_inspect";
    Capability["GIT_HISTORY_READ"] = "git_history_read";
    Capability["RUN_UNIT_TESTS"] = "run_unit_tests";
    Capability["RUN_INTEGRATION_TESTS"] = "run_integration_tests";
    Capability["SHELL_EXECUTION"] = "shell_execution";
    Capability["NETWORK_ACCESS"] = "network_access";
    Capability["DATABASE_READ"] = "database_read";
    Capability["DATABASE_WRITE"] = "database_write";
    Capability["WEB_SEARCH"] = "web_search";
    Capability["CODE_SEARCH"] = "code_search";
})(Capability || (Capability = {}));
const ALL_CAPABILITIES = Object.values(Capability);
export function isCapability(value) {
    return typeof value === 'string' && ALL_CAPABILITIES.includes(value);
}
export function requireCapability(value, context) {
    if (!isCapability(value)) {
        throw new Error(`Expected a valid capability in ${context}, received: ${String(value)}. ` +
            `Allowed values: ${ALL_CAPABILITIES.join(', ')}.`);
    }
    return value;
}
//# sourceMappingURL=capability.js.map