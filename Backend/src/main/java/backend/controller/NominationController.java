package backend.controller;

import backend.dto.ApiResponse;
import backend.dto.NominationRequestDTO;
import backend.dto.NominationResponseDTO;
import backend.service.NominationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/nominations")
@RequiredArgsConstructor
public class NominationController {

    private final NominationService nominationService;

    /**
     * POST /api/nominations
     * Submit a new nomination. Returns 409 if officer is already nominated for this programme.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<NominationResponseDTO>> submitNomination(
            @Valid @RequestBody NominationRequestDTO request) {
        NominationResponseDTO response = nominationService.submitNomination(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Nomination submitted successfully", response));
    }

    /**
     * GET /api/nominations
     * Get all nominations (coordinator view).
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<NominationResponseDTO>>> getAllNominations() {
        List<NominationResponseDTO> nominations = nominationService.getAllNominations();
        return ResponseEntity.ok(ApiResponse.success("All nominations retrieved", nominations));
    }

    /**
     * GET /api/nominations/programme/{programmeId}
     * Get all nominations for a specific training programme.
     */
    @GetMapping("/programme/{programmeId}")
    public ResponseEntity<ApiResponse<List<NominationResponseDTO>>> getNominationsByProgramme(
            @PathVariable Long programmeId) {
        List<NominationResponseDTO> nominations = nominationService.getNominationsByProgramme(programmeId);
        return ResponseEntity.ok(ApiResponse.success(
                "Nominations for programme retrieved successfully", nominations));
    }

    /**
     * GET /api/nominations/officer/{officerId}
     * Get all training programmes an officer has been nominated for.
     */
    @GetMapping("/officer/{officerId}")
    public ResponseEntity<ApiResponse<List<NominationResponseDTO>>> getNominationsByOfficer(
            @PathVariable Long officerId) {
        List<NominationResponseDTO> nominations = nominationService.getNominationsByOfficer(officerId);
        return ResponseEntity.ok(ApiResponse.success(
                "Nominations for officer retrieved successfully", nominations));
    }

    /**
     * GET /api/nominations/check-duplicate?officerId=1&programmeId=2
     * Check if an officer is already nominated for a programme (pre-check before submission).
     */
    @GetMapping("/check-duplicate")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> checkDuplicate(
            @RequestParam Long officerId,
            @RequestParam Long programmeId) {
        boolean isDuplicate = nominationService.checkDuplicate(officerId, programmeId);
        String message = isDuplicate
                ? "Officer is already nominated for this programme."
                : "No duplicate found. Officer can be nominated.";
        return ResponseEntity.ok(ApiResponse.success(message, Map.of("isDuplicate", isDuplicate)));
    }

    /**
     * DELETE /api/nominations/{id}
     * Cancel / remove a nomination.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> cancelNomination(@PathVariable Long id) {
        nominationService.cancelNomination(id);
        return ResponseEntity.ok(ApiResponse.success("Nomination cancelled successfully", null));
    }
}
