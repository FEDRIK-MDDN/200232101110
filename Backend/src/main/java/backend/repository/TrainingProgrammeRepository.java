package backend.repository;

import backend.model.TrainingProgramme;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TrainingProgrammeRepository extends JpaRepository<TrainingProgramme, Long> {
    List<TrainingProgramme> findByTrainingDateAfter(LocalDate date);
    List<TrainingProgramme> findByTitleContainingIgnoreCase(String keyword);
}
