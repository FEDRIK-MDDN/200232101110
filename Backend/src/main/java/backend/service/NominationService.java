package backend.service;

import backend.dto.NominationRequestDTO;
import backend.dto.NominationResponseDTO;
import backend.exception.DuplicateNominationException;
import backend.exception.ResourceNotFoundException;
import backend.model.Department;
import backend.model.Nomination;
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
     * Enforces duplicate prevention: an officer cannot be nominated
     * more than once for the same training programme.
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

        // 4. DUPLICATE CHECK - Service layer (first line of defence)
        boolean isDuplicate = nominationRepository.existsByOfficerIdAndTrainingProgrammeId(
                officer.getId(), programme.getId());

        if (isDuplicate) {
            throw new DuplicateNominationException(officer.getFullName(), programme.getTitle());
        }

        // 5. Check max participants not exceeded
        long currentCount = nominationRepository.countByTrainingProgrammeId(programme.getId());
        if (currentCount >= programme.getMaxParticipants()) {
            throw new IllegalStateException(
                    "Training programme '" + programme.getTitle() + "' has reached its maximum capacity of "
                            + programme.getMaxParticipants() + " participants.");
        }

        // 6. Save nomination
        Nomination nomination = Nomination.builder()
                .officer(officer)
                .trainingProgramme(programme)
                .nominatingDepartment(nominatingDept)
                .build();

        Nomination saved = nominationRepository.save(nomination);
        return mapToResponse(saved);
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
        // Validate programme exists
        trainingProgrammeRepository.findById(programmeId)
                .orElseThrow(() -> new ResourceNotFoundException("Training Programme", programmeId));

        return nominationRepository.findByTrainingProgrammeId(programmeId)
                .stream()
                .map(this::mapToResponse)
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
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get all nominations (for coordinator view).
     */
    public List<NominationResponseDTO> getAllNominations() {
        return nominationRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Cancel / delete a nomination.
     */
    @Transactional
    public void cancelNomination(Long nominationId) {
        Nomination nomination = nominationRepository.findById(nominationId)
                .orElseThrow(() -> new ResourceNotFoundException("Nomination", nominationId));
        nominationRepository.delete(nomination);
    }

    // Map entity → response DTO
    private NominationResponseDTO mapToResponse(Nomination nomination) {
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
                .build();
    }
}
