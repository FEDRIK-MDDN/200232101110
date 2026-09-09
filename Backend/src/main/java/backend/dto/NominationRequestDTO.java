package backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NominationRequestDTO {

    @NotNull(message = "Officer ID is required")
    private Long officerId;

    @NotNull(message = "Training Programme ID is required")
    private Long trainingProgrammeId;

    @NotNull(message = "Nominating Department ID is required")
    private Long nominatingDepartmentId;
}
