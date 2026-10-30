package com.gameword.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.util.List;

// Trang thai phong. changed = false: phong chua doi tu version client gui len, chi co version + serverTime
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RoomStateResponse {
    private String code;
    private String status;
    private String gameType;
    private Long hostId;
    private Long version;
    private Boolean changed;
    /** Gio server (epoch ms) de client dong bo dong ho dem nguoc */
    private Long serverTime;
    private List<RoomMemberDto> members;
    /** Van dang choi hoac van vua ket thuc; null neu phong chua choi van nao */
    private MatchStateDto match;
    /** Tin nhan moi sau afterMessageId (hoac 50 tin gan nhat) */
    private List<ChatMessageDto> messages;
}
