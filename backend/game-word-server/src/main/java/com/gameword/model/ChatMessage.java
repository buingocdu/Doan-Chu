package com.gameword.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

// Tin nhan phong (roomId != null) hoac tin nhan rieng (recipientId != null)
@Entity
@Table(name = "chat_messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {
    public static final String TEXT = "TEXT";
    // Tin do server sinh: vao/roi phong, bi loai, nguoi thang (senderId = null)
    public static final String SYSTEM = "SYSTEM";
    // Loi moi vao phong gui qua tin nhan rieng; content = ma phong
    public static final String ROOM_INVITE = "ROOM_INVITE";

    public static final int MAX_LENGTH = 500;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_id")
    private Long roomId;

    @Column(name = "sender_id")
    private Long senderId;

    @Column(name = "recipient_id")
    private Long recipientId;

    @Column(nullable = false, length = 20)
    private String type;

    @Column(nullable = false, length = MAX_LENGTH)
    private String content;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    // Tin nhan rieng: thoi diem nguoi nhan da doc
    @Column(name = "read_at")
    private LocalDateTime readAt;
}
