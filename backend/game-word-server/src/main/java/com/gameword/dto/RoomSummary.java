package com.gameword.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

// Muc trong danh sach "Phong cua toi"; updatedAt: epoch ms
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomSummary {
    private String code;
    private String status;
    private String gameType;
    private Long hostId;
    private String hostName;
    private Long memberCount;
    private Long updatedAt;
}
