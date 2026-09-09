package backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "nominations",
        uniqueConstraints = {
                // DB-level duplicate prevention: same officer cannot be nominated
                // for the same programme more than once (regardless of department)
                @UniqueConstraint(
                        name = "uk_officer_programme",
                        columnNames = {"officer_id", "training_programme_id"}
                )
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Nomination {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "officer_id", nullable = false)
    private Officer officer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "training_programme_id", nullable = false)
    private TrainingProgramme trainingProgramme;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "nominating_department_id", nullable = false)
    private Department nominatingDepartment;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime nominatedAt = LocalDateTime.now();

    /**
     * Whether this nomination is confirmed (within capacity) or on the waiting list.
     * Stored as a plain VARCHAR so it is human-readable in the DB.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private NominationStatus status = NominationStatus.CONFIRMED;
}
