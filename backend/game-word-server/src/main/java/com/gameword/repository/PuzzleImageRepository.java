package com.gameword.repository;

import com.gameword.model.PuzzleImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PuzzleImageRepository extends JpaRepository<PuzzleImage, Long> {
    List<PuzzleImage> findByActiveTrueOrderByCreatedAtDescIdDesc();

    List<PuzzleImage> findAllByOrderByCreatedAtDescIdDesc();
}
