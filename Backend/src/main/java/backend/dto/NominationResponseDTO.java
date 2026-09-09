package backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NominationResponseDTO {
    private Long nominationId;
    private Long officerId;
    private String officerEmployeeId;
    private String officerFullName;
    private Long trainingProgrammeId;
    private String trainingProgrammeTitle;
    private String trainingDate;
    private Long nominatingDepartmentId;
    private String nominatingDepartmentName;
    private LocalDateTime nominatedAt;
    /** "CONFIRMED" or "WAITLISTED" */
    private String status;
    /** 1-based position in the waiting list; null when status is CONFIRMED */
    private Integer waitlistPosition;
}

