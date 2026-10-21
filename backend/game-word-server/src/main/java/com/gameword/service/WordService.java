package com.gameword.service;

import com.gameword.dto.WordResponse;
import com.gameword.model.Word;
import com.gameword.repository.WordRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class WordService {

    private final WordRepository wordRepository;

    public WordService(WordRepository wordRepository) {
        this.wordRepository = wordRepository;
    }

    public WordResponse getRandomWord(List<Long> excludedIds) {
        Optional<Word> word = wordRepository.findRandomNotIn(excludedIds);
        if (word.isEmpty()) {
            word = wordRepository.findRandomNotIn(List.of());
        }
        Word w = word.orElseThrow(() -> new RuntimeException("No words available"));
        return WordResponse.builder()
            .id(w.getId())
            .value(w.getValue())
            .wordLength(w.getValue().length())
            .level(w.getLevel())
            .maxAttempts(null)
            .build();
    }

    public WordResponse getRandomWordByLevel(Integer level, List<Long> excludedIds) {
        Optional<Word> word = wordRepository.findRandomByLevelNotIn(level, excludedIds);
        if (word.isEmpty()) {
            word = wordRepository.findRandomByLevelNotIn(level, List.of());
        }
        Word w = word.orElseThrow(() -> new RuntimeException("No words available for level " + level));
        return WordResponse.builder()
            .id(w.getId())
            .value(w.getValue())
            .wordLength(w.getValue().length())
            .level(w.getLevel())
            .maxAttempts(null)
            .build();
    }

    public List<Word> getAllActiveWords() {
        return wordRepository.findByActiveTrueOrderByLevelAscIdAsc();
    }

    public Word getWord(Long id) {
        return wordRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Word not found"));
    }
}
