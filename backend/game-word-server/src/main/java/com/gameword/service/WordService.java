package com.gameword.service;

import com.gameword.dto.WordResponse;
import com.gameword.model.Word;
import com.gameword.repository.WordRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;

@Service
@Transactional(readOnly = true)
public class WordService {

    private final WordRepository wordRepository;

    public WordService(WordRepository wordRepository) {
        this.wordRepository = wordRepository;
    }

    // Boc ngau nhien cap do truoc (moi cap do co xac suat nhu nhau) roi moi boc tu trong cap do do.
    // Boc deu tren ca kho thi gan nhu chi ra cap 4-5 (khoang 95% so tu).
    public WordResponse getRandomWord(List<Long> excludedIds) {
        List<Integer> levels = new ArrayList<>(wordRepository.findActiveLevels());
        Collections.shuffle(levels, ThreadLocalRandom.current());
        // Cap do da choi het tu (nam trong excludedIds) thi thu cap do khac
        for (Integer level : levels) {
            Optional<Word> word = wordRepository.findRandomByLevelNotIn(level, nonEmpty(excludedIds));
            if (word.isPresent()) {
                return toResponse(word.get());
            }
        }
        Word w = wordRepository.findRandomNotIn(nonEmpty(List.of()))
            .orElseThrow(() -> new RuntimeException("No words available"));
        return toResponse(w);
    }

    public WordResponse getRandomWordByLevel(Integer level, List<Long> excludedIds) {
        Optional<Word> word = wordRepository.findRandomByLevelNotIn(level, nonEmpty(excludedIds));
        if (word.isEmpty()) {
            word = wordRepository.findRandomByLevelNotIn(level, nonEmpty(List.of()));
        }
        Word w = word.orElseThrow(() -> new RuntimeException("No words available for level " + level));
        return toResponse(w);
    }

    public Word getWord(Long id) {
        return wordRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Word not found"));
    }

    private WordResponse toResponse(Word w) {
        return WordResponse.builder()
            .id(w.getId())
            .value(w.getValue())
            .phrase(w.getPhrase())
            .wordLength(w.getValue().length())
            .level(w.getLevel())
            .maxAttempts(null)
            .build();
    }

    // Toi da so tu loai tru gui tu client (endpoint cong khai): danh sach qua dai lam truy van NOT IN rat nang
    static final int MAX_EXCLUDED = 200;

    // Rong -> [-1] (NOT IN () khong hop le); qua dai -> giu cac tu choi gan nhat (cuoi danh sach)
    static List<Long> nonEmpty(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of(-1L);
        }
        return ids.size() > MAX_EXCLUDED ? ids.subList(ids.size() - MAX_EXCLUDED, ids.size()) : ids;
    }
}
