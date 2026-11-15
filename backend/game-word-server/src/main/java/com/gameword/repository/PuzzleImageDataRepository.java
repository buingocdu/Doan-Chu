package com.gameword.repository;

import com.gameword.model.PuzzleImageData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PuzzleImageDataRepository extends JpaRepository<PuzzleImageData, Long> {
}
