package com.gameword.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Entity
@Table(name = "rooms", uniqueConstraints = {
        @UniqueConstraint(name = "uk_rooms_code", columnNames = "code")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Room {
    public static final String WAITING = "WAITING";
    public static final String PLAYING = "PLAYING";
    public static final String CLOSED = "CLOSED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 8)
    private String code;

    @Column(name = "host_id", nullable = false)
    private Long hostId;

    // GameType.WORD_GUESS / WORD_CHAIN: che do chon gan nhat
    @Column(name = "game_type", nullable = false, length = 20)
    private String gameType;

    @Column(nullable = false, length = 20)
    private String status;

    // Van dang choi hoac van vua ket thuc (de hien ket qua)
    @Column(name = "current_match_id")
    private Long currentMatchId;

    // Tang moi khi phong thay doi (thanh vien, nuoc di, chat); client gui lai de polling re
    @Column(nullable = false)
    private Long version;

    // Han su kien hen gio gan nhat cua van dang choi (het luot noi tu / het gio doan chu)
    @Column(name = "deadline_at")
    private LocalDateTime deadlineAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
