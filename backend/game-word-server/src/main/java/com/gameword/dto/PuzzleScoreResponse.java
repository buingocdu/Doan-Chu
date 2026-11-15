package com.gameword.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PuzzleScoreResponse {
    // Hang cua nguoi choi (theo ket qua tot nhat) trong cung anh va do kho
    private Integer rank;
    private Long bestMs;
    // true khi luot nay la ky luc ca nhan moi
    private Boolean personalBest;
}
