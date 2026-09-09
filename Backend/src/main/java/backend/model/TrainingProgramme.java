package backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "training_programmes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrainingProgramme {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false)
    private LocalDate trainingDate;

    @Column(nullable = false, length = 200)
    private String venue;

    @Column(nullable = false, length = 150)
    private String trainerName;

    @Column(nullable = false)
    private Integer maxParticipants;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "programme_target_departments",
            joinColumns = @JoinColumn(name = "programme_id"),
            inverseJoinColumns = @JoinColumn(name = "department_id")
    )
    @Builder.Default
    private Set<Department> targetDepartments = new HashSet<>();
}
