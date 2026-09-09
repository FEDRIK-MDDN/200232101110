package backend.repository;

import backend.model.EligibilityRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EligibilityRuleRepository extends JpaRepository<EligibilityRule, Long> {

    /** All active rules for a programme (used during eligibility check). */
    List<EligibilityRule> findByTrainingProgrammeIdAndActiveTrue(Long programmeId);

    /** All rules for a programme (used in management UI, includes inactive). */
    List<EligibilityRule> findByTrainingProgrammeId(Long programmeId);
}
