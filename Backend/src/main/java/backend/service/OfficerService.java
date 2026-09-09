package backend.service;

import backend.exception.ResourceNotFoundException;
import backend.model.Department;
import backend.model.Officer;
import backend.repository.DepartmentRepository;
import backend.repository.OfficerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OfficerService {

    private final OfficerRepository officerRepository;
    private final DepartmentRepository departmentRepository;

    public List<Officer> getAllOfficers() {
        return officerRepository.findAll();
    }

    public Officer getOfficerById(Long id) {
        return officerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Officer", id));
    }

    public Officer getOfficerByEmployeeId(String employeeId) {
        return officerRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Officer", "employeeId", employeeId));
    }

    public List<Officer> getOfficersByDepartment(Long departmentId) {
        return officerRepository.findByDepartmentId(departmentId);
    }

    public Officer createOfficer(Officer officer) {
        return officerRepository.save(officer);
    }

    public Officer updateOfficer(Long id, Officer updated) {
        Officer existing = getOfficerById(id);
        existing.setFullName(updated.getFullName());
        existing.setEmail(updated.getEmail());
        existing.setEmployeeId(updated.getEmployeeId());
        existing.setGrade(updated.getGrade());
        existing.setYearsOfService(updated.getYearsOfService());
        if (updated.getDepartment() != null && updated.getDepartment().getId() != null) {
            Department dept = departmentRepository.findById(updated.getDepartment().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department", updated.getDepartment().getId()));
            existing.setDepartment(dept);
        } else {
            existing.setDepartment(null);
        }
        return officerRepository.save(existing);
    }

    public void deleteOfficer(Long id) {
        Officer existing = getOfficerById(id);
        officerRepository.delete(existing);
    }
}
