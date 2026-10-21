package com.gameword.service;

import com.gameword.dto.GuessResponse;
import com.gameword.dto.GuessRequest;
import com.gameword.dto.WordResponse;
import com.gameword.model.GameHistory;
import com.gameword.repository.GameHistoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class HistoryService {

    private final GameHistoryRepository historyRepository;

    public HistoryService(GameHistoryRepository historyRepository) {
        this.historyRepository = historyRepository;
    }

    public List<GameHistory> getHistoryByUser(Long userId) {
        return historyRepository.findByUserIdOrderByPlayedAtDesc(userId);
    }

    public List<GameHistory> getCorrectByUser(Long userId) {
        return historyRepository.findCorrectByUserId(userId);
    }

    public List<Object[]> getExcludedWordIds(Long userId) {
        List<GameHistory> histories = historyRepository.findByUserIdOrderByPlayedAtDesc(userId);
        return histories.stream()
            .map(h -> new Object[]{h.getWordId()})
            .collect(Collectors.toList());
    }
}
