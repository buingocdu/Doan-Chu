package com.gameword.service;

import com.gameword.dto.LeaderboardEntry;
import com.gameword.model.User;
import com.gameword.repository.UserRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class LeaderboardService {

    private final UserRepository userRepository;

    public LeaderboardService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<LeaderboardEntry> getLeaderboard() {
        List<User> users = userRepository.findAll(Sort.by(Sort.Direction.DESC, "totalScore"));
        List<LeaderboardEntry> entries = new java.util.ArrayList<>();
        int rank = 1;
        for (User u : users) {
            if (u.getGamesPlayed() > 0) {
                entries.add(LeaderboardEntry.builder()
                    .userId(u.getId())
                    .username(u.getUsername())
                    .totalScore(u.getTotalScore())
                    .gamesPlayed(u.getGamesPlayed())
                    .gamesWon(u.getGamesWon())
                    .rank(rank)
                    .build());
                rank++;
            }
        }
        return entries;
    }
}
