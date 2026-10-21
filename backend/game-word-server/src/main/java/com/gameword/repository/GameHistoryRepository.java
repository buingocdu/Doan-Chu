package com.gameword.repository;

import com.gameword.model.GameHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GameHistoryRepository extends JpaRepository<GameHistory, Long> {
    List<GameHistory> findByUserIdOrderByPlayedAtDesc(Long userId);

    List<GameHistory> findByWordId(Long wordId);

    @Query("SELECT h FROM GameHistory h WHERE h.userId = :userId AND h.correct = true")
    List<GameHistory> findCorrectByUserId(@Param("userId") Long userId);
}
