package backend.controller;

import backend.dto.ApiResponse;
import backend.model.Department;
import backend.service.DepartmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentService departmentService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Department>>> getAllDepartments() {
        List<Department> departments = departmentService.getAllDepartments();
        return ResponseEntity.ok(ApiResponse.success("Departments retrieved successfully", departments));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Department>> getDepartmentById(@PathVariable Long id) {
        Department department = departmentService.getDepartmentById(id);
        return ResponseEntity.ok(ApiResponse.success("Department retrieved successfully", department));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Department>> createDepartment(@RequestBody Department department) {
        Department created = departmentService.createDepartment(department);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Department created successfully", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Department>> updateDepartment(
            @PathVariable Long id,
            @RequestBody Department department) {
        Department updated = departmentService.updateDepartment(id, department);
        return ResponseEntity.ok(ApiResponse.success("Department updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDepartment(@PathVariable Long id) {
        departmentService.deleteDepartment(id);
        return ResponseEntity.ok(ApiResponse.success("Department deleted successfully", null));
    }
}
