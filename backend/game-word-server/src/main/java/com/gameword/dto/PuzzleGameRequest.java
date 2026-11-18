package com.gameword.dto;

import lombok.Data;

// Tao game: anh trong kho + luoi hang x cot. title de trong thi lay theo ten anh
@Data
public class PuzzleGameRequest {
    private String title;
    private Long imageId;
    private Integer rows;
    private Integer cols;
    // Khong gui thi dung mac dinh (puzzle.default-snap-percent)
    private Integer snapPercent;
}
