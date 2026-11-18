package com.gameword.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

// Diem giam deu theo luot doan dung: luot 1 = max, luot cuoi = min
class GameScoreTest {

    @Test
    void sixAttemptsScoreFrom100DownTo10() {
        int[] expected = {100, 82, 64, 46, 28, 10};
        for (int attempt = 1; attempt <= 6; attempt++) {
            assertEquals(expected[attempt - 1], GameService.computeScore(attempt, 6, 10, 100), "luot " + attempt);
        }
    }

    @Test
    void tenAttemptsKeepTheOldScale() {
        for (int attempt = 1; attempt <= 10; attempt++) {
            assertEquals(110 - attempt * 10, GameService.computeScore(attempt, 10, 10, 100), "luot " + attempt);
        }
    }

    @Test
    void scoreStaysInsideTheConfiguredRange() {
        assertEquals(100, GameService.computeScore(0, 6, 10, 100));
        assertEquals(10, GameService.computeScore(50, 6, 10, 100));
        assertEquals(100, GameService.computeScore(1, 1, 10, 100));
    }
}
