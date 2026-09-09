package backend.repository;

import backend.model.Nomination;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NominationRepository extends JpaRepository<Nomination, Long> {

    // Core duplicate check: is this officer already nominated for this programme?
    boolean existsByOfficerIdAndTrainingProgrammeId(Long officerId, Long trainingProgrammeId);

    // Get all nominations for a specific programme
    List<Nomination> findByTrainingProgrammeId(Long trainingProgrammeId);

    // Get all nominations by a specific officer
    List<Nomination> findByOfficerId(Long officerId);

    // Get existing nomination for officer + programme (useful for showing details)
    Optional<Nomination> findByOfficerIdAndTrainingProgrammeId(Long officerId, Long trainingProgrammeId);

    // Count nominations for a programme (to check max participants)
    long countByTrainingProgrammeId(Long trainingProgrammeId);

    // Get nominations by nominating department for a programme
    List<Nomination> findByTrainingProgrammeIdAndNominatingDepartmentId(Long programmeId, Long departmentId);
}
