package backend.controller;

import backend.dto.ApiResponse;
import backend.dto.EligibilityResult;
import backend.dto.EligibilityRuleRequestDTO;
import backend.dto.EligibilityRuleResponseDTO;
import backend.service.EligibilityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Task 3 — Eligibility REST endpoints
 *
 * GET  /api/eligibility/check?officerId=&programmeId=  → check eligibility
 * GET  /api/eligibility/rules/{programmeId}             → list rules
 * POST /api/eligibility/rules/{programmeId}             → add rule
 * DELETE /api/eligibility/rules/{ruleId}                → remove rule
 */
@RestController
@RequestMapping("/api/eligibility")
@RequiredArgsConstructor
public class EligibilityController {

    private final EligibilityService eligibilityService;

    /**
     * Check whether an officer meets all eligibility rules for a programme.
     * Used by the frontend before showing the Submit button.
     */
    @GetMapping("/check")
    public ResponseEntity<ApiResponse<EligibilityResult>> checkEligibility(
            @RequestParam Long officerId,
            @RequestParam Long programmeId) {
        EligibilityResult result = eligibilityService.checkEligibility(officerId, programmeId);
        String message = result.isEligible()
                ? "Officer is eligible for this programme."
                : "Officer does not meet eligibility requirements.";
        return ResponseEntity.ok(ApiResponse.success(message, result));
    }

    /**
     * Get all eligibility rules configured for a training programme.
     */
    @GetMapping("/rules/{programmeId}")
    public ResponseEntity<ApiResponse<List<EligibilityRuleResponseDTO>>> getRules(
            @PathVariable Long programmeId) {
        List<EligibilityRuleResponseDTO> rules = eligibilityService.getRulesForProgramme(programmeId);
        return ResponseEntity.ok(ApiResponse.success("Eligibility rules retrieved", rules));
    }

    /**
     * Add a new eligibility rule to a training programme.
     */
    @PostMapping("/rules/{programmeId}")
    public ResponseEntity<ApiResponse<EligibilityRuleResponseDTO>> addRule(
            @PathVariable Long programmeId,
            @RequestBody EligibilityRuleRequestDTO request) {
        EligibilityRuleResponseDTO rule = eligibilityService.addRule(programmeId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Eligibility rule added successfully", rule));
    }

    /**
     * Delete an eligibility rule.
     */
    @DeleteMapping("/rules/{ruleId}")
    public ResponseEntity<ApiResponse<Void>> deleteRule(@PathVariable Long ruleId) {
        eligibilityService.deleteRule(ruleId);
        return ResponseEntity.ok(ApiResponse.success("Eligibility rule deleted", null));
    }
}
