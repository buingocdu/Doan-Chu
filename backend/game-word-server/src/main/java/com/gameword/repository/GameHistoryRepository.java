package com.gameword.repository;

import com.gameword.model.GameHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GameHistoryRepository extends JpaRepository<GameHistory, Long> {
    List<GameHistory> findByUserIdOrderByPlayedAtDesc(Long userId);

    List<GameHistory> findByWordId(Long wordId);

    List<GameHistory> findByGameIdAndAttemptGreaterThanOrderByAttemptAsc(Long gameId, Integer attempt);

    // Ban ghi bat dau cua van co hoat dong gan nhat (bat dau hoac doan) cua nguoi dung
    @Query(value = """
        SELECT s.* FROM game_histories s
        WHERE s.user_id = :userId AND s.attempt = 0
        ORDER BY (SELECT MAX(g.played_at) FROM game_histories g WHERE g.id = s.id OR g.game_id = s.id) DESC, s.id DESC
        LIMIT 1
        """, nativeQuery = true)
    Optional<GameHistory> findLatestStart(@Param("userId") Long userId);

    @Query("SELECT h FROM GameHistory h WHERE h.userId = :userId AND h.correct = true")
    List<GameHistory> findCorrectByUserId(@Param("userId") Long userId);
}
