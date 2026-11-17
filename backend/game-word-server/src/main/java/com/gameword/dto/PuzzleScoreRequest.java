package com.gameword.dto;

import lombok.Data;

@Data
public class PuzzleScoreRequest {
    private Long gameId;
    private Long durationMs;
    private Integer moves;
}
