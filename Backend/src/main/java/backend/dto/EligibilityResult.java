package backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Result of an eligibility check for one officer against one programme.
 *
 * eligible   = true  → officer may be nominated
 * eligible   = false → officer is blocked; violations explains why
 * violations = list of human-readable rule violation messages
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EligibilityResult {
    private boolean eligible;
    private List<String> violations;
}
