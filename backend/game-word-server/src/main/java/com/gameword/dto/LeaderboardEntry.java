package com.gameword.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaderboardEntry {
    private Long userId;
    private String username;
    private Integer totalScore;
    private Integer gamesPlayed;
    private Integer gamesWon;
    private Integer rank;
}
