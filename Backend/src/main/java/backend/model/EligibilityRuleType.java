package backend.model;

/**
 * Task 3 — Eligibility Rule Engine
 *
 * Each enum value represents one type of eligibility check that can be
 * attached to a training programme.  Adding a new rule type in future
 * requires only:
 *   1. A new constant here, and
 *   2. A corresponding evaluation branch in EligibilityService.
 * No schema changes are needed.
 */
public enum EligibilityRuleType {

    /**
     * Officer's home department must appear in the comma-separated list
     * of department IDs stored in ruleValue.
     * ruleValue example: "1,3,7"
     */
    DEPARTMENT_RESTRICTION,

    /**
     * Officer's grade field must equal the value stored in ruleValue
     * (case-insensitive).
     * ruleValue example: "Grade 3"
     */
    GRADE_REQUIREMENT,

    /**
     * Officer's yearsOfService must be >= the integer stored in ruleValue.
     * ruleValue example: "5"
     */
    MIN_YEARS_OF_SERVICE,

    /**
     * Officer must not have a CONFIRMED nomination for the same programme
     * within the last N months (N is stored in ruleValue).
     * ruleValue example: "12"
     */
    COOLDOWN_MONTHS
}
