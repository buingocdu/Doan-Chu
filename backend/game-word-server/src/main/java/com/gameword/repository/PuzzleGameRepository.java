package com.gameword.repository;

import com.gameword.model.PuzzleGame;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PuzzleGameRepository extends JpaRepository<PuzzleGame, Long> {

    List<PuzzleGame> findAllByOrderByCreatedAtDescIdDesc();

    // Game dang hien va anh cua no cung dang hien
    @Query("select g from PuzzleGame g where g.active = true and exists "
        + "(select 1 from PuzzleImage i where i.id = g.imageId and i.active = true) "
        + "order by g.createdAt desc, g.id desc")
    List<PuzzleGame> findPlayable();
}
