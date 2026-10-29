package com.gameword.service;

import com.gameword.model.Word;
import com.gameword.repository.WordRepository;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class WordServiceRandomTest {

    private static Word word(long id, int level) {
        Word w = new Word();
        w.setId(id);
        w.setValue("NGOINHA");
        w.setLevel(level);
        return w;
    }

    // Kho gia: cap 1 co 1 tu, cap 5 co rat nhieu tu; boc deu tren ca kho thi cap 1 hau nhu khong bao gio ra
    private static WordRepository repo(Map<Integer, Word> oneWordPerLevel) {
        return (WordRepository) Proxy.newProxyInstance(WordRepository.class.getClassLoader(),
            new Class<?>[] {WordRepository.class}, (proxy, method, args) -> switch (method.getName()) {
                case "findActiveLevels" -> List.copyOf(oneWordPerLevel.keySet());
                case "findRandomByLevelNotIn" -> {
                    Word w = oneWordPerLevel.get((Integer) args[0]);
                    @SuppressWarnings("unchecked") List<Long> excluded = (List<Long>) args[1];
                    yield w == null || excluded.contains(w.getId()) ? Optional.empty() : Optional.of(w);
                }
                case "findRandomNotIn" -> Optional.of(oneWordPerLevel.values().iterator().next());
                default -> throw new UnsupportedOperationException(method.getName());
            });
    }

    @Test
    void everyLevelHasEqualChance() {
        Map<Integer, Word> words = new HashMap<>();
        for (int level = 1; level <= 5; level++) {
            words.put(level, word(level, level));
        }
        WordService service = new WordService(repo(words));

        Map<Integer, Integer> counts = new HashMap<>();
        int runs = 5000;
        for (int i = 0; i < runs; i++) {
            counts.merge(service.getRandomWord(List.of()).getLevel(), 1, Integer::sum);
        }
        // Ky vong 1000 moi cap do; 800-1200 la du rong de khong lac do ngau nhien
        for (int level = 1; level <= 5; level++) {
            int c = counts.getOrDefault(level, 0);
            assertTrue(c > 800 && c < 1200, "cap " + level + " ra " + c + "/" + runs);
        }
    }

    @Test
    void exhaustedLevelFallsBackToAnotherLevel() {
        WordService service = new WordService(repo(Map.of(1, word(10, 1), 2, word(20, 2))));
        for (int i = 0; i < 50; i++) {
            assertEquals(2, service.getRandomWord(List.of(10L)).getLevel());
        }
    }
}
