package com.gameword.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

// createdAt: epoch ms. type: TEXT / SYSTEM / ROOM_INVITE (content = ma phong)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageDto {
    private Long id;
    private String type;
    private Long senderId;
    private String senderName;
    private Long recipientId;
    private String content;
    private Long createdAt;
}
