package com.gameword.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PuzzleGameDto {
    private Long id;
    private String title;
    private Long imageId;
    // Kich thuoc anh de frontend dung ti le khung ghep
    private Integer width;
    private Integer height;
    private Integer rows;
    private Integer cols;
    private Boolean active;
    private LocalDateTime createdAt;
}
