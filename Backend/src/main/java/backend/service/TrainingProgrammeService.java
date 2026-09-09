package backend.service;

import backend.exception.ResourceNotFoundException;
import backend.model.Department;
import backend.model.TrainingProgramme;
import backend.repository.DepartmentRepository;
import backend.repository.TrainingProgrammeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TrainingProgrammeService {

    private final TrainingProgrammeRepository trainingProgrammeRepository;
    private final DepartmentRepository departmentRepository;

    public List<TrainingProgramme> getAllProgrammes() {
        return trainingProgrammeRepository.findAll();
    }

    public TrainingProgramme getProgrammeById(Long id) {
        return trainingProgrammeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Training Programme", id));
    }

    public List<TrainingProgramme> searchByTitle(String keyword) {
        return trainingProgrammeRepository.findByTitleContainingIgnoreCase(keyword);
    }

    public TrainingProgramme createProgramme(TrainingProgramme programme, List<Long> targetDepartmentIds) {
        if (targetDepartmentIds != null && !targetDepartmentIds.isEmpty()) {
            Set<Department> departments = targetDepartmentIds.stream()
                    .map(deptId -> departmentRepository.findById(deptId)
                            .orElseThrow(() -> new ResourceNotFoundException("Department", deptId)))
                    .collect(Collectors.toSet());
            programme.setTargetDepartments(departments);
        }
        return trainingProgrammeRepository.save(programme);
    }

    public TrainingProgramme updateProgramme(Long id, TrainingProgramme updated, List<Long> targetDepartmentIds) {
        TrainingProgramme existing = getProgrammeById(id);
        existing.setTitle(updated.getTitle());
        existing.setTrainingDate(updated.getTrainingDate());
        existing.setVenue(updated.getVenue());
        existing.setTrainerName(updated.getTrainerName());
        existing.setMaxParticipants(updated.getMaxParticipants());

        if (targetDepartmentIds != null) {
            Set<Department> departments = targetDepartmentIds.stream()
                    .map(deptId -> departmentRepository.findById(deptId)
                            .orElseThrow(() -> new ResourceNotFoundException("Department", deptId)))
                    .collect(Collectors.toSet());
            existing.setTargetDepartments(departments);
        }
        return trainingProgrammeRepository.save(existing);
    }

    public void deleteProgramme(Long id) {
        TrainingProgramme existing = getProgrammeById(id);
        trainingProgrammeRepository.delete(existing);
    }
}
