package com.gameword.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

// Mot van choi trong phong (bang matches)
@Entity
@Table(name = "matches")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomMatch {
    public static final String PLAYING = "PLAYING";
    public static final String FINISHED = "FINISHED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_id", nullable = false)
    private Long roomId;

    @Column(name = "game_type", nullable = false, length = 20)
    private String gameType;

    @Column(nullable = false, length = 20)
    private String status;

    // Dua doan chu: tu chung cua van
    @Column(name = "word_id")
    private Long wordId;

    // null khi van ket thuc khong co nguoi thang
    @Column(name = "winner_id")
    private Long winnerId;

    // Noi tu: nguoi dang toi luot va han chot
    @Column(name = "current_user_id")
    private Long currentUserId;

    @Column(name = "turn_deadline")
    private LocalDateTime turnDeadline;

    // Dua doan chu: het gio van
    @Column(name = "ends_at")
    private LocalDateTime endsAt;

    // Noi tu: tu hop le gan nhat (chu thuong co dau)
    @Column(name = "last_word")
    private String lastWord;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    public boolean isPlaying() {
        return PLAYING.equals(status);
    }
}
