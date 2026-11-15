package com.gameword.dto;

import lombok.Data;

@Data
public class PuzzleScoreRequest {
    private Long imageId;
    private Integer rows;
    private Integer cols;
    private Long durationMs;
    private Integer moves;
}
