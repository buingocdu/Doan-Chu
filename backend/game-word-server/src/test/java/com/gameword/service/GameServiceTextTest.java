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
    void withoutToneKeepsLetterMarks() {
        assertEquals('A', GameService.withoutTone('á'));
        assertEquals('Ă', GameService.withoutTone('Ặ'));
        assertEquals('Â', GameService.withoutTone('Ấ'));
        assertEquals('Ê', GameService.withoutTone('Ề'));
        assertEquals('Ô', GameService.withoutTone('Ổ'));
        assertEquals('Ơ', GameService.withoutTone('Ỡ'));
        assertEquals('Ư', GameService.withoutTone('Ự'));
        assertEquals('Đ', GameService.withoutTone('đ'));
    }

    @Test
    void sameLetterWrongToneAtSamePositionIsBlue() {
        // Ố so voi Ô, Á so voi À: dung chu cai, chi sai dau thanh
        assertEquals("GGUGGGU", colors("ngối nhá", "NGÔI NHÀ"));
        assertEquals("GGUGG", colors("đượng", "ĐƯỜNG"));
    }

    @Test
    void differentVowelLetterIsNotBlue() {
        // O khac Ô, A khac Ă/Â, E khac Ê, U khac Ư: khong phai sai dau ma la sai chu
        assertEquals("GGXGGGU", colors("ngoi nha", "NGÔI NHÀ"));
        assertEquals("X", colors("ă", "Â"));
        assertEquals("X", colors("a", "Ấ"));
        assertEquals("X", colors("ê", "É"));
        assertEquals("X", colors("ơ", "Ộ"));
        assertEquals("XGGG", colors("uờng", "ƯỜNG"));
        // D va Đ la hai chu cai khac nhau
        assertEquals("XGGGG", colors("dường", "ĐƯỜNG"));
    }

    @Test
    void letterElsewhereIsYellowAndEachTargetLetterCountsOnce() {
        // N o vi tri 1 va 2 bi doi cho: ca hai deu co trong tu -> vang
        assertEquals("YYGGGGU", colors("gnôi nha", "NGÔI NHÀ"));
        // H duy nhat cua dap an da xanh o vi tri 6 -> H o vi tri 1 la xam
        assertEquals("XGGGGGU", colors("hgôi nha", "NGÔI NHÀ"));
        // Ố o sai vi tri van tinh vang (bo qua dau thanh), O thi khong vi O khac Ô
        assertEquals("YXXXGGU", colors("ốxxx nhá", "NGÔI NHÀ"));
        assertEquals("XXXXGGU", colors("oxxx nhá", "NGÔI NHÀ"));
        // A o vi tri cua Â khong duoc vang nho chinh o do
        assertEquals("GXX", colors("cax", "CÂY"));
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
