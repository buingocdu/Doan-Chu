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
public class PuzzleImageDto {
    private Long id;
    private String title;
    private Integer width;
    private Integer height;
    private Integer sizeBytes;
    private Boolean active;
    private LocalDateTime createdAt;
}
