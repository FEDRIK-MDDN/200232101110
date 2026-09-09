package backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class DuplicateNominationException extends RuntimeException {
    public DuplicateNominationException(String officerName, String programmeName) {
        super("Officer '" + officerName + "' is already nominated for the training programme '" + programmeName + "'.");
    }
}
