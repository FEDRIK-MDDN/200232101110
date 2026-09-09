package backend.controller;

import backend.dto.ApiResponse;
import backend.model.TrainingProgramme;
import backend.service.TrainingProgrammeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/programmes")
@RequiredArgsConstructor
public class TrainingProgrammeController {

    private final TrainingProgrammeService trainingProgrammeService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TrainingProgramme>>> getAllProgrammes() {
        List<TrainingProgramme> programmes = trainingProgrammeService.getAllProgrammes();
        return ResponseEntity.ok(ApiResponse.success("Programmes retrieved successfully", programmes));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TrainingProgramme>> getProgrammeById(@PathVariable Long id) {
        TrainingProgramme programme = trainingProgrammeService.getProgrammeById(id);
        return ResponseEntity.ok(ApiResponse.success("Programme retrieved successfully", programme));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<TrainingProgramme>>> searchByTitle(@RequestParam String keyword) {
        List<TrainingProgramme> results = trainingProgrammeService.searchByTitle(keyword);
        return ResponseEntity.ok(ApiResponse.success("Search results", results));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TrainingProgramme>> createProgramme(
            @RequestBody TrainingProgramme programme,
            @RequestParam(required = false) List<Long> departmentIds) {
        TrainingProgramme created = trainingProgrammeService.createProgramme(programme, departmentIds);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Training programme created successfully", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TrainingProgramme>> updateProgramme(
            @PathVariable Long id,
            @RequestBody TrainingProgramme programme,
            @RequestParam(required = false) List<Long> departmentIds) {
        TrainingProgramme updated = trainingProgrammeService.updateProgramme(id, programme, departmentIds);
        return ResponseEntity.ok(ApiResponse.success("Training programme updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProgramme(@PathVariable Long id) {
        trainingProgrammeService.deleteProgramme(id);
        return ResponseEntity.ok(ApiResponse.success("Training programme deleted successfully", null));
    }
}
