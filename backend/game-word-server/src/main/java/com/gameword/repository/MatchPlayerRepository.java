package com.gameword.repository;

import com.gameword.model.MatchPlayer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MatchPlayerRepository extends JpaRepository<MatchPlayer, Long> {
    List<MatchPlayer> findByMatchIdOrderByTurnOrderAsc(Long matchId);

    Optional<MatchPlayer> findByMatchIdAndUserId(Long matchId, Long userId);
}
