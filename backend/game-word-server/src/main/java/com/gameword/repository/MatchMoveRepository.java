package com.gameword.repository;

import com.gameword.model.MatchMove;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MatchMoveRepository extends JpaRepository<MatchMove, Long> {
    List<MatchMove> findByMatchIdOrderByIdAsc(Long matchId);

    // Noi tu: 50 tu gan nhat de hien thi
    List<MatchMove> findTop50ByMatchIdOrderByIdDesc(Long matchId);

    // Noi tu: tu da dung trong van
    boolean existsByMatchIdAndContent(Long matchId, String content);
}
