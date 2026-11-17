package com.gameword.dto;

import lombok.Data;

// Sua anh trong kho: xoay (do, theo chieu kim dong ho) roi cat theo ti le 0..1 cua anh sau khi xoay.
// asCopy = true thi luu thanh anh moi (title tuy chon), giu nguyen anh goc.
@Data
public class PuzzleImageEditRequest {
    private Integer degrees;
    private Double cropX;
    private Double cropY;
    private Double cropWidth;
    private Double cropHeight;
    private Boolean asCopy;
    private String title;
}
