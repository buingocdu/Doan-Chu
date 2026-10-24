package com.gameword.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GuessRequest {
    private Long gameId;
    private Long wordId;
    private String guess;
    private Long userId;
}
