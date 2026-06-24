export declare enum SafetyConstraintKey {
    FILE_SYSTEM_WRITE = "fileSystemWrite",
    NETWORK_ACCESS = "networkAccess",
    SHELL_EXECUTION = "shellExecution",
    DATABASE_WRITE = "databaseWrite",
    REQUIRE_USER_CONFIRMATION_FOR = "requireUserConfirmationFor"
}
export declare function isSafetyConstraintKey(value: unknown): value is SafetyConstraintKey;
//# sourceMappingURL=safety-constraint-key.d.ts.map