package backend.service;

import backend.dto.NominationRequestDTO;
import backend.dto.NominationResponseDTO;
import backend.exception.DuplicateNominationException;
import backend.exception.ResourceNotFoundException;
import backend.model.Department;
import backend.model.Nomination;
import backend.model.NominationStatus;
import backend.model.Officer;
import backend.model.TrainingProgramme;
import backend.repository.DepartmentRepository;
import backend.repository.NominationRepository;
import backend.repository.OfficerRepository;
import backend.repository.TrainingProgrammeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NominationService {

    private final NominationRepository nominationRepository;
    private final OfficerRepository officerRepository;
    private final TrainingProgrammeRepository trainingProgrammeRepository;
    private final DepartmentRepository departmentRepository;

    /**
     * Submit a new nomination.
     *
     * Rules (Task 2):
     * 1. Duplicate check — an officer cannot be nominated more than once for the same programme.
     * 2. If confirmed seats < maxParticipants → status = CONFIRMED.
     * 3. Otherwise → status = WAITLISTED (nomination is accepted, not rejected).
     */
    @Transactional
    public NominationResponseDTO submitNomination(NominationRequestDTO request) {

        // 1. Resolve officer
        Officer officer = officerRepository.findById(request.getOfficerId())
                .orElseThrow(() -> new ResourceNotFoundException("Officer", request.getOfficerId()));

        // 2. Resolve training programme
        TrainingProgramme programme = trainingProgrammeRepository.findById(request.getTrainingProgrammeId())
                .orElseThrow(() -> new ResourceNotFoundException("Training Programme", request.getTrainingProgrammeId()));

        // 3. Resolve nominating department
        Department nominatingDept = departmentRepository.findById(request.getNominatingDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department", request.getNominatingDepartmentId()));

        // 4. DUPLICATE CHECK — service layer (first line of defence)
        boolean isDuplicate = nominationRepository.existsByOfficerIdAndTrainingProgrammeId(
                officer.getId(), programme.getId());
        if (isDuplicate) {
            throw new DuplicateNominationException(officer.getFullName(), programme.getTitle());
        }

        // 5. Determine status based on current CONFIRMED count vs capacity
        long confirmedCount = nominationRepository.countByTrainingProgrammeIdAndStatus(
                programme.getId(), NominationStatus.CONFIRMED);

        NominationStatus status = (confirmedCount < programme.getMaxParticipants())
                ? NominationStatus.CONFIRMED
                : NominationStatus.WAITLISTED;

        // 6. Save nomination with determined status
        Nomination nomination = Nomination.builder()
                .officer(officer)
                .trainingProgramme(programme)
                .nominatingDepartment(nominatingDept)
                .status(status)
                .build();

        Nomination saved = nominationRepository.save(nomination);
        return mapToResponse(saved, programme.getId());
    }

    /**
     * Check if an officer is already nominated for a programme (without saving).
     */
    public boolean checkDuplicate(Long officerId, Long programmeId) {
        return nominationRepository.existsByOfficerIdAndTrainingProgrammeId(officerId, programmeId);
    }

    /**
     * Get all nominations for a specific training programme.
     */
    public List<NominationResponseDTO> getNominationsByProgramme(Long programmeId) {
        trainingProgrammeRepository.findById(programmeId)
                .orElseThrow(() -> new ResourceNotFoundException("Training Programme", programmeId));

        return nominationRepository.findByTrainingProgrammeId(programmeId)
                .stream()
                .map(n -> mapToResponse(n, programmeId))
                .collect(Collectors.toList());
    }

    /**
     * Get all nominations by a specific officer.
     */
    public List<NominationResponseDTO> getNominationsByOfficer(Long officerId) {
        officerRepository.findById(officerId)
                .orElseThrow(() -> new ResourceNotFoundException("Officer", officerId));

        return nominationRepository.findByOfficerId(officerId)
                .stream()
                .map(n -> mapToResponse(n, n.getTrainingProgramme().getId()))
                .collect(Collectors.toList());
    }

    /**
     * Get all nominations (for coordinator view).
     */
    public List<NominationResponseDTO> getAllNominations() {
        return nominationRepository.findAll()
                .stream()
                .map(n -> mapToResponse(n, n.getTrainingProgramme().getId()))
                .collect(Collectors.toList());
    }

    /**
     * Cancel / delete a nomination.
     *
     * Rules (Task 2):
     * - If the cancelled nomination was CONFIRMED, automatically promote the first
     *   WAITLISTED nomination for the same programme (ordered by nominatedAt ASC).
     * - If the cancelled nomination was WAITLISTED, simply remove it — no promotion needed.
     */
    @Transactional
    public void cancelNomination(Long nominationId) {
        Nomination nomination = nominationRepository.findById(nominationId)
                .orElseThrow(() -> new ResourceNotFoundException("Nomination", nominationId));

        Long programmeId = nomination.getTrainingProgramme().getId();
        boolean wasConfirmed = nomination.getStatus() == NominationStatus.CONFIRMED;

        // Delete the nomination
        nominationRepository.delete(nomination);
        nominationRepository.flush(); // ensure delete is committed before promotion query

        // If a confirmed seat was freed, promote the next person on the waiting list
        if (wasConfirmed) {
            List<Nomination> waitlist = nominationRepository
                    .findByTrainingProgrammeIdAndStatusOrderByNominatedAtAsc(
                            programmeId, NominationStatus.WAITLISTED);

            if (!waitlist.isEmpty()) {
                Nomination nextInLine = waitlist.get(0);
                nextInLine.setStatus(NominationStatus.CONFIRMED);
                nominationRepository.save(nextInLine);
            }
        }
    }

    // -------------------------------------------------------------------------
    // Mapping helper
    // -------------------------------------------------------------------------

    /**
     * Map entity → response DTO.
     * Also calculates the waitlist position (1-based) for WAITLISTED nominations.
     */
    private NominationResponseDTO mapToResponse(Nomination nomination, Long programmeId) {
        Integer waitlistPosition = null;

        if (nomination.getStatus() == NominationStatus.WAITLISTED) {
            // Fetch all WAITLISTED nominations for this programme in arrival order
            List<Nomination> waitlist = nominationRepository
                    .findByTrainingProgrammeIdAndStatusOrderByNominatedAtAsc(
                            programmeId, NominationStatus.WAITLISTED);

            // Find this nomination's 1-based position in the queue
            for (int i = 0; i < waitlist.size(); i++) {
                if (waitlist.get(i).getId().equals(nomination.getId())) {
                    waitlistPosition = i + 1;
                    break;
                }
            }
        }

        return NominationResponseDTO.builder()
                .nominationId(nomination.getId())
                .officerId(nomination.getOfficer().getId())
                .officerEmployeeId(nomination.getOfficer().getEmployeeId())
                .officerFullName(nomination.getOfficer().getFullName())
                .trainingProgrammeId(nomination.getTrainingProgramme().getId())
                .trainingProgrammeTitle(nomination.getTrainingProgramme().getTitle())
                .trainingDate(nomination.getTrainingProgramme().getTrainingDate().toString())
                .nominatingDepartmentId(nomination.getNominatingDepartment().getId())
                .nominatingDepartmentName(nomination.getNominatingDepartment().getName())
                .nominatedAt(nomination.getNominatedAt())
                .status(nomination.getStatus().name())
                .waitlistPosition(waitlistPosition)
                .build();
    }
}
