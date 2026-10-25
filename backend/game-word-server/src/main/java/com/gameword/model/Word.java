package com.gameword.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Entity
@Table(name = "words", uniqueConstraints = {
        @UniqueConstraint(name = "uk_words_phrase", columnNames = "phrase")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Word {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String value;

    @Column(nullable = false)
    private String part1;

    @Column(nullable = false)
    private String part2;

    // Tu co dau, vd "máy tính"; null voi tu cu khong co trong tu dien
    @Column
    private String phrase;

    // Giai nghia (Wiktionary tieng Viet, CC BY-SA 4.0); nhieu nghia cach nhau boi xuong dong
    @Column(length = 1000)
    private String definition;

    @Column(nullable = false)
    private Integer level;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
