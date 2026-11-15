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
        + "where u.id = s.userId and s.imageId = :imageId and s.rows = :rows and s.cols = :cols "
        + "group by s.userId, u.username order by min(s.durationMs) asc, s.userId asc")
    List<Object[]> bestPerUser(@Param("imageId") Long imageId, @Param("rows") int rows,
                               @Param("cols") int cols, Pageable pageable);

    @Query("select min(s.durationMs) from PuzzleScore s where s.userId = :userId and s.imageId = :imageId "
        + "and s.rows = :rows and s.cols = :cols")
    Long bestOf(@Param("userId") Long userId, @Param("imageId") Long imageId,
                @Param("rows") int rows, @Param("cols") int cols);

    // So nguoi choi co ket qua tot nhat nhanh hon moc nay
    @Query(value = "select count(*) from (select user_id from puzzle_scores "
        + "where image_id = :imageId and piece_rows = :rows and piece_cols = :cols "
        + "group by user_id having min(duration_ms) < :durationMs) t", nativeQuery = true)
    long countFasterUsers(@Param("imageId") Long imageId, @Param("rows") int rows,
                          @Param("cols") int cols, @Param("durationMs") long durationMs);
}
