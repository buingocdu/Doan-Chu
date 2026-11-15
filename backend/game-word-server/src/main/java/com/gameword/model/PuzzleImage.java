package com.gameword.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// Anh trong kho ghep hinh. Noi dung anh o PuzzleImageData de danh sach khong tai theo du lieu anh
@Entity
@Table(name = "puzzle_images")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PuzzleImage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(name = "content_type", nullable = false)
    private String contentType;

    @Column(nullable = false)
    private Integer width;

    @Column(nullable = false)
    private Integer height;

    @Column(name = "size_bytes", nullable = false)
    private Integer sizeBytes;

    // false = admin an anh khoi nguoi choi (khong xoa)
    @Column(nullable = false)
    private Boolean active;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
