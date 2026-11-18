package com.gameword.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// Game ghep hinh do admin tao san: 1 anh trong kho + luoi hang x cot co dinh
@Entity
@Table(name = "puzzle_games")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PuzzleGame {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(name = "image_id", nullable = false)
    private Long imageId;

    @Column(name = "piece_rows", nullable = false)
    private Integer rows;

    @Column(name = "piece_cols", nullable = false)
    private Integer cols;

    // Do tu dong khop vao khung/vao manh ke, tinh bang phan tram canh ngan cua o (2-20, mac dinh 8)
    @Column(name = "snap_percent", nullable = false)
    private Integer snapPercent;

    // false = admin an game khoi nguoi choi
    @Column(nullable = false)
    private Boolean active;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
