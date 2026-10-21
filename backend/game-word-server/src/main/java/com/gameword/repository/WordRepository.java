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
    Optional<Word> findByValue(String value);

    List<Word> findByActiveTrueOrderByLevelAscIdAsc();

    @Query("SELECT w FROM Word w WHERE w.active = true AND w.id NOT IN :excludedIds ORDER BY RANDOM()")
    Optional<Word> findRandomNotIn(@Param("excludedIds") List<Long> excludedIds);

    @Query("SELECT w FROM Word w WHERE w.active = true AND w.level = :level AND w.id NOT IN :excludedIds ORDER BY RANDOM()")
    Optional<Word> findRandomByLevelNotIn(@Param("level") Integer level, @Param("excludedIds") List<Long> excludedIds);

    boolean existsByValue(String value);
}
