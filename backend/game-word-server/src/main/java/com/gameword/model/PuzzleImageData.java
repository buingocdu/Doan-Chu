package com.gameword.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "puzzle_image_data")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PuzzleImageData {
    @Id
    @Column(name = "image_id")
    private Long imageId;

    @Column(nullable = false, columnDefinition = "bytea")
    private byte[] data;
}
