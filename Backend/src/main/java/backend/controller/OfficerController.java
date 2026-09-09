package backend.controller;

import backend.dto.ApiResponse;
import backend.model.Officer;
import backend.service.OfficerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/officers")
@RequiredArgsConstructor
public class OfficerController {

    private final OfficerService officerService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Officer>>> getAllOfficers() {
        List<Officer> officers = officerService.getAllOfficers();
        return ResponseEntity.ok(ApiResponse.success("Officers retrieved successfully", officers));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Officer>> getOfficerById(@PathVariable Long id) {
        Officer officer = officerService.getOfficerById(id);
        return ResponseEntity.ok(ApiResponse.success("Officer retrieved successfully", officer));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<ApiResponse<Officer>> getOfficerByEmployeeId(@PathVariable String employeeId) {
        Officer officer = officerService.getOfficerByEmployeeId(employeeId);
        return ResponseEntity.ok(ApiResponse.success("Officer retrieved successfully", officer));
    }

    @GetMapping("/department/{departmentId}")
    public ResponseEntity<ApiResponse<List<Officer>>> getOfficersByDepartment(@PathVariable Long departmentId) {
        List<Officer> officers = officerService.getOfficersByDepartment(departmentId);
        return ResponseEntity.ok(ApiResponse.success("Officers retrieved successfully", officers));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Officer>> createOfficer(@RequestBody Officer officer) {
        Officer created = officerService.createOfficer(officer);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Officer created successfully", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Officer>> updateOfficer(
            @PathVariable Long id,
            @RequestBody Officer officer) {
        Officer updated = officerService.updateOfficer(id, officer);
        return ResponseEntity.ok(ApiResponse.success("Officer updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteOfficer(@PathVariable Long id) {
        officerService.deleteOfficer(id);
        return ResponseEntity.ok(ApiResponse.success("Officer deleted successfully", null));
    }
}
