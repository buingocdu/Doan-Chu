package com.gameword.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PuzzleRankEntry {
    private Integer rank;
    private Long userId;
    private String username;
    private Long durationMs;
}
