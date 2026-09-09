package backend.dto;

import backend.model.EligibilityRuleType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for an eligibility rule (safe to expose to the frontend).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EligibilityRuleResponseDTO {
    private Long id;
    private Long trainingProgrammeId;
    private EligibilityRuleType ruleType;
    private String ruleValue;
    private String description;
    private boolean active;
}
