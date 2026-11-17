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
    // Doi moi khi anh duoc xoay/cat (tang theo PuzzleImage.version): frontend gan vao dia chi anh de trinh duyet khong dung ban cu trong cache
    private Integer imageVersion;
    private Integer rows;
    private Integer cols;
    private Boolean active;
    private LocalDateTime createdAt;
}
