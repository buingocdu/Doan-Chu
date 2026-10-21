package com.gameword.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GuessResponse {
    private Long wordId;
    private Integer wordLength;
    private String guess;
    private Integer attempt;
    private Integer maxAttempts;
    private Boolean correct;
    private Boolean gameOver;
    private List<CellResult> cells;
    private Integer score;
    private String message;
}
