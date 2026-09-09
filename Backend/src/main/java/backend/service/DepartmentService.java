package backend.service;

import backend.exception.ResourceNotFoundException;
import backend.model.Department;
import backend.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

    public List<Department> getAllDepartments() {
        return departmentRepository.findAll();
    }

    public Department getDepartmentById(Long id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department", id));
    }

    public Department createDepartment(Department department) {
        return departmentRepository.save(department);
    }

    public Department updateDepartment(Long id, Department updated) {
        Department existing = getDepartmentById(id);
        existing.setName(updated.getName());
        return departmentRepository.save(existing);
    }

    public void deleteDepartment(Long id) {
        Department existing = getDepartmentById(id);
        departmentRepository.delete(existing);
    }
}
