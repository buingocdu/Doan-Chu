package com.gameword.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.util.List;

// Trang thai van theo goc nhin nguoi xem. Thoi gian la epoch ms (so voi RoomStateResponse.serverTime)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MatchStateDto {
    private Long id;
    private String gameType;
    private String status;
    private Long winnerId;
    private String winnerName;
    private Long startedAt;
    private List<MatchPlayerDto> players;

    // Dua doan chu
    private Long endsAt;
    private Integer wordLength;
    private List<Integer> partLengths;
    private Integer maxAttempts;
    /** Cac luot doan cua nguoi xem (co chu) */
    private List<List<CellResult>> myRows;
    /** Chi co khi van ket thuc */
    private String answer;
    private String definition;

    // Noi tu
    private Long currentUserId;
    private Long turnDeadline;
    /** Tieng ma tu tiep theo phai bat dau */
    private String requiredSyllable;
    /** Toi da 50 tu gan nhat, cu truoc */
    private List<ChainWordDto> chain;
}
