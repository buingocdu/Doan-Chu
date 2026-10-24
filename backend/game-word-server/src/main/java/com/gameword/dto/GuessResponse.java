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
    private Long gameId;
    private Long wordId;
    private Integer wordLength;
    // So chu cai cua tung tieng trong tu ghep, vd VUIMUNG -> [3, 4]
    private List<Integer> partLengths;
    private String guess;
    private Integer attempt;
    private Integer maxAttempts;
    private Boolean correct;
    private Boolean gameOver;
    private List<CellResult> cells;
    private Integer score;
    private String message;
    // Dap an, chi co gia tri khi gameOver = true
    private String answer;
}
