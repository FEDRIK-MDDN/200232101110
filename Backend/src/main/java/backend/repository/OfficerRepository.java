package backend.repository;

import backend.model.Officer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OfficerRepository extends JpaRepository<Officer, Long> {
    Optional<Officer> findByEmployeeId(String employeeId);
    boolean existsByEmployeeId(String employeeId);
    List<Officer> findByDepartmentId(Long departmentId);
}
