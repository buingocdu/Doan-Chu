package com.gameword.dto;

import lombok.Data;

// Xoay anh theo chieu kim dong ho: 90, 180, 270 (hoac -90 = xoay trai)
@Data
public class PuzzleRotateRequest {
    private Integer degrees;
}
