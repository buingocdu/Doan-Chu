package com.gameword.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

// Goi y Dua doan chu: chu cai (co dau) cua dap an tai vi tri index
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HintDto {
    private Integer index;
    private String letter;
}
