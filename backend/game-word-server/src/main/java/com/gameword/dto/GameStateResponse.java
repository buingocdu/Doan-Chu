package com.gameword.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

// Trang thai van dang choi do, dung de khoi phuc sau khi reload trang
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameStateResponse {
    private Long gameId;
    private Long wordId;
    private Integer wordLength;
    private List<Integer> partLengths;
    private Integer maxAttempts;
    private Integer attempt;
    // Cac luot da doan theo thu tu, moi luot la danh sach o (chu co dau + mau)
    private List<List<CellResult>> rows;
}
