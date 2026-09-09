package backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.util.List;

/**
 * Thrown when an officer does not meet one or more eligibility rules
 * for a training programme (Task 3).
 * Returns HTTP 422 Unprocessable Entity.
 */
@ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
public class IneligibleOfficerException extends RuntimeException {

    private final List<String> violations;

    public IneligibleOfficerException(String officerName, String programmeName, List<String> violations) {
        super("Officer '" + officerName + "' is not eligible for '" + programmeName + "': " +
              String.join("; ", violations));
        this.violations = violations;
    }

    public List<String> getViolations() {
        return violations;
    }
}
