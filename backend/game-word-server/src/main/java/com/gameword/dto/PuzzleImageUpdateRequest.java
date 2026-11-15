package com.gameword.dto;

import lombok.Data;

@Data
public class PuzzleImageUpdateRequest {
    // null = giu nguyen
    private String title;
    private Boolean active;
}
