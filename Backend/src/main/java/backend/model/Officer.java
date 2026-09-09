package backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "officers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Officer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String employeeId;

    @Column(nullable = false, length = 100)
    private String fullName;

    @Column(length = 150)
    private String email;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "department_id")
    private Department department;

    /**
     * Task 3 — officer's grade/designation (e.g. "Grade 3", "Senior Executive").
     * Used by GRADE_REQUIREMENT eligibility rules.
     */
    @Column(length = 100)
    private String grade;

    /**
     * Task 3 — number of completed years of service.
     * Used by MIN_YEARS_OF_SERVICE eligibility rules.
     */
    @Column
    private Integer yearsOfService;
}
