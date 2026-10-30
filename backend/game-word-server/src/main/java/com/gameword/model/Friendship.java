package com.gameword.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Entity
@Table(name = "friendships", uniqueConstraints = {
        @UniqueConstraint(name = "uk_friendships_pair", columnNames = {"requester_id", "addressee_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Friendship {
    public static final String PENDING = "PENDING";
    public static final String ACCEPTED = "ACCEPTED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "requester_id", nullable = false)
    private Long requesterId;

    @Column(name = "addressee_id", nullable = false)
    private Long addresseeId;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    public Long otherUserId(Long userId) {
        return requesterId.equals(userId) ? addresseeId : requesterId;
    }
}
