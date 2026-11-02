package com.gameword.service;

import com.gameword.dto.HintDto;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class WordGuessEngineHintTest {

    private static final List<Character> NGOI_NHA = GameService.displayLetters("NGÔI NHÀ");

    @Test
    void oneMoreLetterEvery30Seconds() {
        assertEquals(0, WordGuessEngine.hintsAt(7, NGOI_NHA, 29, 30).size());
        assertEquals(1, WordGuessEngine.hintsAt(7, NGOI_NHA, 30, 30).size());
        assertEquals(3, WordGuessEngine.hintsAt(7, NGOI_NHA, 95, 30).size());
    }

    @Test
    void hintsShowCorrectLetterAtItsPositionAndNeverTheWholeWord() {
        List<HintDto> hints = WordGuessEngine.hintsAt(7, NGOI_NHA, 600, 30);
        // 7 chu cai: lo toi da 6, con lai 1 chu de doan
        assertEquals(NGOI_NHA.size() - 1, hints.size());
        for (HintDto h : hints) {
            assertEquals(String.valueOf(NGOI_NHA.get(h.getIndex())), h.getLetter());
        }
    }

    @Test
    void sameMatchAlwaysRevealsSamePositionsInSameOrder() {
        List<HintDto> two = WordGuessEngine.hintsAt(42, NGOI_NHA, 60, 30);
        List<HintDto> three = WordGuessEngine.hintsAt(42, NGOI_NHA, 90, 30);
        assertEquals(two, WordGuessEngine.hintsAt(42, NGOI_NHA, 60, 30));
        assertTrue(three.containsAll(two));
    }
}
