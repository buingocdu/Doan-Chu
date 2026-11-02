package com.gameword.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameTypeRequest {
    private String gameType;
    /** Dua doan chu: thoi gian van, 5 hoac 10 phut (null = mac dinh) */
    private Integer minutes;
    /** Dua doan chu: bat goi y chu cai */
    private Boolean hints;
}
