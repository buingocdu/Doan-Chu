package com.gameword.dto;

import java.util.List;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

// Nguoi choi trong van. colorRows: mau tung luot doan (khong co chu) de doi thu khong thay dap an
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MatchPlayerDto {
    private Long userId;
    private String username;
    private Boolean eliminated;
    private String eliminatedReason;
    private Integer attempts;
    private Boolean solved;
    private List<List<String>> colorRows;
}
