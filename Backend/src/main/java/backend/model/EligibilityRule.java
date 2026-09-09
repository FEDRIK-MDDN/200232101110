package backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Task 3 — Eligibility Rule
 *
 * One row = one rule attached to one training programme.
 * Rules are evaluated by EligibilityService at nomination time.
 *
 * ruleValue encoding per type:
 *   DEPARTMENT_RESTRICTION  → "1,3,7"          (comma-separated dept IDs)
 *   GRADE_REQUIREMENT       → "Grade 3"        (exact grade string)
 *   MIN_YEARS_OF_SERVICE    → "5"              (integer, min years)
 *   COOLDOWN_MONTHS         → "12"             (integer, month window)
 */
@Entity
@Table(name = "eligibility_rules")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EligibilityRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "training_programme_id", nullable = false)
    private TrainingProgramme trainingProgramme;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private EligibilityRuleType ruleType;

    /**
     * Encoded value whose meaning depends on ruleType (see class javadoc).
     */
    @Column(nullable = false, length = 500)
    private String ruleValue;

    /**
     * Human-readable label shown in the UI and in violation messages.
     */
    @Column(nullable = false, length = 300)
    private String description;

    /** Soft-disable a rule without deleting it. */
    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;
}
