package com.gameword.repository;

import com.gameword.model.PuzzleScore;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PuzzleScoreRepository extends JpaRepository<PuzzleScore, Long> {

    // Moi nguoi chi tinh ket qua tot nhat: [userId, username, durationMs]
    @Query("select s.userId, u.username, min(s.durationMs) from PuzzleScore s, User u "
        + "where u.id = s.userId and s.gameId = :gameId "
        + "group by s.userId, u.username order by min(s.durationMs) asc, s.userId asc")
    List<Object[]> bestPerUser(@Param("gameId") Long gameId, Pageable pageable);

    @Query("select min(s.durationMs) from PuzzleScore s where s.userId = :userId and s.gameId = :gameId")
    Long bestOf(@Param("userId") Long userId, @Param("gameId") Long gameId);

    // So nguoi choi co ket qua tot nhat nhanh hon moc nay
    @Query(value = "select count(*) from (select user_id from puzzle_scores where game_id = :gameId "
        + "group by user_id having min(duration_ms) < :durationMs) t", nativeQuery = true)
    long countFasterUsers(@Param("gameId") Long gameId, @Param("durationMs") long durationMs);
}
