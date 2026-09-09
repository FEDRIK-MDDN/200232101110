package backend.dto;

import backend.model.EligibilityRuleType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request body for creating a new eligibility rule on a programme.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EligibilityRuleRequestDTO {
    private EligibilityRuleType ruleType;
    private String ruleValue;
    private String description;
}
