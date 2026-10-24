package com.gameword.service;

import org.junit.jupiter.api.Test;

import com.gameword.dto.CellResult;

import java.util.List;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;

class GameServiceTextTest {

    @Test
    void displayLettersKeepsVietnameseMarksAndDropsSpaces() {
        assertEquals(List.of('T', 'I', 'Ế', 'N', 'G', 'A', 'N', 'H'), GameService.displayLetters("Tiếng anh"));
        assertEquals(List.of('Đ', 'Ư', 'Ờ', 'N', 'G'), GameService.displayLetters(" đường! "));
    }

    @Test
    void baseLetterRemovesMarks() {
        assertEquals("E", GameService.baseLetter('Ế'));
        assertEquals("D", GameService.baseLetter('Đ'));
        assertEquals("U", GameService.baseLetter('Ữ'));
        assertEquals("", GameService.baseLetter(' '));
        assertEquals("", GameService.baseLetter('1'));
    }

    @Test
    void formatPhraseSplitsByParts() {
        assertEquals("TIẾNG ANH", GameService.formatPhrase(GameService.displayLetters("tiếnganh"), List.of(5, 3)));
        assertEquals("TIẾ", GameService.formatPhrase(GameService.displayLetters("tiế"), List.of(5, 3)));
    }

    // Ky hieu: G = xanh la, U = xanh duong (blue), Y = vang, X = xam (black)
    private static String colors(String guess, String target) {
        return GameService.evaluateGuess(GameService.displayLetters(guess), GameService.displayLetters(target))
            .stream()
            .map(c -> switch (c.getColor()) {
                case "GREEN" -> "G";
                case "BLUE" -> "U";
                case "YELLOW" -> "Y";
                default -> "X";
            })
            .collect(Collectors.joining());
    }

    @Test
    void exactMatchWithMarksIsAllGreen() {
        assertEquals("GGGGGGG", colors("ngôi nhà", "NGÔI NHÀ"));
    }

    @Test
    void sameLetterWrongMarkAtSamePositionIsBlue() {
        // O so voi Ô, A so voi À: dung chu goc, sai dau
        assertEquals("GGUGGGU", colors("ngoi nha", "NGÔI NHÀ"));
        assertEquals("GGUGGGU", colors("ngối nhá", "NGÔI NHÀ"));
        // D so voi Đ cung la sai dau
        assertEquals("UGGGG", colors("dường", "ĐƯỜNG"));
    }

    @Test
    void letterElsewhereIsYellowAndEachTargetLetterCountsOnce() {
        // N o vi tri 1 va 2 bi doi cho: ca hai deu co trong tu -> vang
        assertEquals("YYUGGGU", colors("gnoi nha", "NGÔI NHÀ"));
        // H duy nhat cua dap an da xanh o vi tri 6 -> H o vi tri 1 la xam
        assertEquals("XGUGGGU", colors("hgoi nha", "NGÔI NHÀ"));
        // Ô o sai vi tri van tinh vang theo chu goc
        assertEquals("YXXXGGU", colors("ôxxx nha", "NGÔI NHÀ").replace("XXX", "XXX"));
    }

    @Test
    void wrongMarkDoesNotWin() {
        assertEquals(false, GameService.displayLetters("ngoi nha").equals(GameService.displayLetters("NGÔI NHÀ")));
        assertEquals(true, GameService.displayLetters("Ngôi nhà").equals(GameService.displayLetters("NGÔI NHÀ")));
    }

    @Test
    void scoreDropsTenPointsPerAttempt() {
        assertEquals(100, GameService.computeScore(1, 10, 10, 100));
        assertEquals(90, GameService.computeScore(2, 10, 10, 100));
        assertEquals(50, GameService.computeScore(6, 10, 10, 100));
        assertEquals(10, GameService.computeScore(10, 10, 10, 100));
    }
}
