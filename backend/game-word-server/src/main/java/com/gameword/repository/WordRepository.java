package com.gameword.repository;

import com.gameword.model.Word;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WordRepository extends JpaRepository<Word, Long> {
    // excludedIds khong duoc rong (NOT IN () khong hop le) - WordService truyen [-1] khi khong loai tru
    @Query(value = "SELECT * FROM words w WHERE w.active = true AND w.id NOT IN (:excludedIds) ORDER BY RANDOM() LIMIT 1",
           nativeQuery = true)
    Optional<Word> findRandomNotIn(@Param("excludedIds") List<Long> excludedIds);

    @Query(value = "SELECT * FROM words w WHERE w.active = true AND w.level = :level AND w.id NOT IN (:excludedIds) ORDER BY RANDOM() LIMIT 1",
           nativeQuery = true)
    Optional<Word> findRandomByLevelNotIn(@Param("level") Integer level, @Param("excludedIds") List<Long> excludedIds);

    @Query("SELECT DISTINCT w.level FROM Word w WHERE w.active = true")
    List<Integer> findActiveLevels();

}
