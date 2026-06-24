export declare enum Capability {
    FILE_SYSTEM_READ = "file_system_read",
    FILE_SYSTEM_WRITE = "file_system_write",
    GIT_DIFF_INSPECT = "git_diff_inspect",
    GIT_HISTORY_READ = "git_history_read",
    RUN_UNIT_TESTS = "run_unit_tests",
    RUN_INTEGRATION_TESTS = "run_integration_tests",
    SHELL_EXECUTION = "shell_execution",
    NETWORK_ACCESS = "network_access",
    DATABASE_READ = "database_read",
    DATABASE_WRITE = "database_write",
    WEB_SEARCH = "web_search",
    CODE_SEARCH = "code_search"
}
export declare function isCapability(value: unknown): value is Capability;
export declare function requireCapability(value: unknown, context: string): Capability;
//# sourceMappingURL=capability.d.ts.map