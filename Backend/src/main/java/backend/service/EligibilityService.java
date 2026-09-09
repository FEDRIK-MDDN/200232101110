package backend.service;

import backend.dto.EligibilityResult;
import backend.dto.EligibilityRuleRequestDTO;
import backend.dto.EligibilityRuleResponseDTO;
import backend.exception.ResourceNotFoundException;
import backend.model.EligibilityRule;
import backend.model.EligibilityRuleType;
import backend.model.Nomination;
import backend.model.NominationStatus;
import backend.model.Officer;
import backend.model.TrainingProgramme;
import backend.repository.EligibilityRuleRepository;
import backend.repository.NominationRepository;
import backend.repository.OfficerRepository;
import backend.repository.TrainingProgrammeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Task 3 — Eligibility Rule Engine
 *
 * Evaluates all active eligibility rules attached to a training programme
 * against a given officer and returns a result with any violations.
 *
 * Extensibility: to add a new rule type, add a constant to EligibilityRuleType
 * and a corresponding 'case' branch in evaluateRule(). No schema change needed.
 */
@Service
@RequiredArgsConstructor
public class EligibilityService {

    private final EligibilityRuleRepository ruleRepository;
    private final OfficerRepository officerRepository;
    private final TrainingProgrammeRepository programmeRepository;
    private final NominationRepository nominationRepository;

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    /**
     * Check whether an officer satisfies all active eligibility rules for a
     * training programme.
     *
     * @return EligibilityResult with eligible=true (no violations) or
     *         eligible=false plus a list of human-readable violation messages.
     */
    public EligibilityResult checkEligibility(Long officerId, Long programmeId) {
        Officer officer = officerRepository.findById(officerId)
                .orElseThrow(() -> new ResourceNotFoundException("Officer", officerId));
        TrainingProgramme programme = programmeRepository.findById(programmeId)
                .orElseThrow(() -> new ResourceNotFoundException("Training Programme", programmeId));

        List<EligibilityRule> rules =
                ruleRepository.findByTrainingProgrammeIdAndActiveTrue(programmeId);

        List<String> violations = new ArrayList<>();
        for (EligibilityRule rule : rules) {
            String violation = evaluateRule(rule, officer, programme);
            if (violation != null) {
                violations.add(violation);
            }
        }

        return EligibilityResult.builder()
                .eligible(violations.isEmpty())
                .violations(violations)
                .build();
    }

    /**
     * Get all eligibility rules for a programme (active + inactive, for the UI).
     */
    public List<EligibilityRuleResponseDTO> getRulesForProgramme(Long programmeId) {
        programmeRepository.findById(programmeId)
                .orElseThrow(() -> new ResourceNotFoundException("Training Programme", programmeId));
        return ruleRepository.findByTrainingProgrammeId(programmeId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    /**
     * Add a new eligibility rule to a programme.
     */
    @Transactional
    public EligibilityRuleResponseDTO addRule(Long programmeId, EligibilityRuleRequestDTO request) {
        TrainingProgramme programme = programmeRepository.findById(programmeId)
                .orElseThrow(() -> new ResourceNotFoundException("Training Programme", programmeId));

        EligibilityRule rule = EligibilityRule.builder()
                .trainingProgramme(programme)
                .ruleType(request.getRuleType())
                .ruleValue(request.getRuleValue())
                .description(request.getDescription())
                .active(true)
                .build();

        return mapToResponse(ruleRepository.save(rule));
    }

    /**
     * Delete an eligibility rule by ID.
     */
    @Transactional
    public void deleteRule(Long ruleId) {
        EligibilityRule rule = ruleRepository.findById(ruleId)
                .orElseThrow(() -> new ResourceNotFoundException("Eligibility Rule", ruleId));
        ruleRepository.delete(rule);
    }

    // -------------------------------------------------------------------------
    // Rule Evaluators — add new case here when a new EligibilityRuleType is added
    // -------------------------------------------------------------------------

    /**
     * Evaluate a single rule against an officer.
     *
     * @return null if the officer passes the rule, or a violation message string if they fail.
     */
    private String evaluateRule(EligibilityRule rule, Officer officer, TrainingProgramme programme) {
        return switch (rule.getRuleType()) {

            case DEPARTMENT_RESTRICTION -> {
                // ruleValue: comma-separated department IDs, e.g. "1,3,7"
                if (officer.getDepartment() == null) {
                    yield "Officer has no department assigned. This programme requires department: " + rule.getDescription();
                }
                Set<Long> allowedIds = Arrays.stream(rule.getRuleValue().split(","))
                        .map(String::trim)
                        .map(Long::parseLong)
                        .collect(Collectors.toSet());
                if (!allowedIds.contains(officer.getDepartment().getId())) {
                    yield "Officer's department '" + officer.getDepartment().getName() +
                          "' is not eligible. Rule: " + rule.getDescription();
                }
                yield null;
            }

            case GRADE_REQUIREMENT -> {
                // ruleValue: required grade string, e.g. "Grade 3"
                if (officer.getGrade() == null || officer.getGrade().isBlank()) {
                    yield "Officer has no grade assigned. Required: " + rule.getRuleValue();
                }
                if (!officer.getGrade().trim().equalsIgnoreCase(rule.getRuleValue().trim())) {
                    yield "Officer's grade '" + officer.getGrade() +
                          "' does not meet requirement: " + rule.getDescription();
                }
                yield null;
            }

            case MIN_YEARS_OF_SERVICE -> {
                // ruleValue: minimum integer years, e.g. "5"
                int minYears = Integer.parseInt(rule.getRuleValue().trim());
                if (officer.getYearsOfService() == null) {
                    yield "Officer's years of service is not recorded. Minimum required: " + minYears + " years.";
                }
                if (officer.getYearsOfService() < minYears) {
                    yield "Officer has " + officer.getYearsOfService() +
                          " year(s) of service. Minimum required: " + minYears + " years.";
                }
                yield null;
            }

            case COOLDOWN_MONTHS -> {
                // ruleValue: cooldown window in months, e.g. "12"
                int months = Integer.parseInt(rule.getRuleValue().trim());
                LocalDateTime cutoff = LocalDateTime.now().minusMonths(months);

                // Check if officer has any CONFIRMED nomination for the same programme
                // within the cooldown window
                boolean recentlyAttended = nominationRepository.findByOfficerId(officer.getId())
                        .stream()
                        .filter(n -> n.getTrainingProgramme().getId().equals(programme.getId()))
                        .filter(n -> n.getStatus() == NominationStatus.CONFIRMED)
                        .anyMatch(n -> n.getNominatedAt().isAfter(cutoff));

                if (recentlyAttended) {
                    yield "Officer already participated in this programme within the last " +
                          months + " months. Rule: " + rule.getDescription();
                }
                yield null;
            }
        };
    }

    // -------------------------------------------------------------------------
    // Mapping helper
    // -------------------------------------------------------------------------

    private EligibilityRuleResponseDTO mapToResponse(EligibilityRule rule) {
        return EligibilityRuleResponseDTO.builder()
                .id(rule.getId())
                .trainingProgrammeId(rule.getTrainingProgramme().getId())
                .ruleType(rule.getRuleType())
                .ruleValue(rule.getRuleValue())
                .description(rule.getDescription())
                .active(rule.isActive())
                .build();
    }
}
