package com.gameword.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Entity
@Table(name = "game_histories")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "word_id", nullable = false)
    private Long wordId;

    @Column(nullable = false)
    private String guess;

    @Column(nullable = false)
    private String result;

    @Column(nullable = false)
    private Integer attempt;

    @Column(nullable = false)
    private Boolean correct;

    @Column(name = "played_at")
    private LocalDateTime playedAt;

    @PrePersist
    protected void onCreate() {
        playedAt = LocalDateTime.now();
    }
}
