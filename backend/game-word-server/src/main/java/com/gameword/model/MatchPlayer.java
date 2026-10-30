package com.gameword.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Entity
@Table(name = "match_players", uniqueConstraints = {
        @UniqueConstraint(name = "uk_match_players", columnNames = {"match_id", "user_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MatchPlayer {
    // Ly do bi loai / dung choi
    public static final String TIMEOUT = "TIMEOUT";
    public static final String INVALID_WORD = "INVALID_WORD";
    public static final String USED_WORD = "USED_WORD";
    public static final String OUT_OF_ATTEMPTS = "OUT_OF_ATTEMPTS";
    public static final String LEFT = "LEFT";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "match_id", nullable = false)
    private Long matchId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    // Thu tu luot (noi tu); dua doan chu dung de sap xep hien thi
    @Column(name = "turn_order", nullable = false)
    private Integer turnOrder;

    @Column(nullable = false)
    private Boolean eliminated;

    @Column(name = "eliminated_reason", length = 20)
    private String eliminatedReason;

    // Dua doan chu: so luot da doan
    @Column(nullable = false)
    private Integer attempts;

    @Column(name = "solved_at")
    private LocalDateTime solvedAt;
}
