package com.gameword.dto;

import lombok.Data;

// null = giu nguyen. Doi duoc do tu dong khop; khong doi duoc luoi vi se lam sai bang xep hang; muon doi thi tao game moi
@Data
public class PuzzleGameUpdateRequest {
    private String title;
    private Boolean active;
    private Integer snapPercent;
}
