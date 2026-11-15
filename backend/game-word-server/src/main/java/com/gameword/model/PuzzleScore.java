package com.gameword.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "puzzle_scores")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PuzzleScore {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "image_id", nullable = false)
    private Long imageId;

    @Column(name = "piece_rows", nullable = false)
    private Integer rows;

    @Column(name = "piece_cols", nullable = false)
    private Integer cols;

    @Column(name = "duration_ms", nullable = false)
    private Long durationMs;

    @Column(nullable = false)
    private Integer moves;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
