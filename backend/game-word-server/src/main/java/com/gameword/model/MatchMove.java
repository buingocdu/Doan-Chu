package com.gameword.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Entity
@Table(name = "match_moves")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MatchMove {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "match_id", nullable = false)
    private Long matchId;

    // null = tu mo dau do server dua ra (noi tu)
    @Column(name = "user_id")
    private Long userId;

    // Dua doan chu: cum doan co dau ("VUI MỪNG"); noi tu: tu chu thuong ("máy tính")
    @Column(nullable = false)
    private String content;

    // Dua doan chu: mau tung o "GREEN,BLACK,..." nhu game_histories
    @Column
    private String result;

    @Column(nullable = false)
    private Boolean correct;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
