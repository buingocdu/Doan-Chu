package com.gameword.service;

import com.gameword.config.GameConfig;
import com.gameword.config.RoomConfig;
import com.gameword.model.GameType;
import com.gameword.model.MatchPlayer;
import com.gameword.model.RoomMatch;
import com.gameword.model.User;
import com.gameword.model.Word;
import com.gameword.repository.MatchMoveRepository;
import com.gameword.repository.MatchPlayerRepository;
import com.gameword.repository.RoomMatchRepository;
import com.gameword.repository.WordRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class WordGuessEngineTest {

    private WordGuessEngine engine;
    private RoomMatch match;
    private List<MatchPlayer> players;
    private final List<String> announced = new ArrayList<>();

    @BeforeEach
    void setUp() {
        WordService wordService = mock(WordService.class);
        when(wordService.getWord(5L)).thenReturn(Word.builder().id(5L).value("VUIMUNG").part1("VUI").part2("MUNG")
            .phrase("vui mừng").level(1).active(true).build());
        MatchPlayerRepository playerRepository = mock(MatchPlayerRepository.class);
        UserService userService = mock(UserService.class);
        when(userService.getUser(anyLong())).thenAnswer(inv ->
            User.builder().id(inv.getArgument(0)).username("u" + inv.getArgument(0)).build());
        GameConfig gameConfig = new GameConfig();
        gameConfig.setMaxAttempts(2);
        engine = new WordGuessEngine(wordService, mock(WordRepository.class), mock(RoomMatchRepository.class),
            playerRepository, mock(MatchMoveRepository.class), userService, gameConfig, new RoomConfig());

        players = new ArrayList<>();
        for (long id = 1; id <= 2; id++) {
            players.add(MatchPlayer.builder().matchId(9L).userId(id).turnOrder((int) id - 1)
                .eliminated(false).attempts(0).build());
        }
        when(playerRepository.findByMatchIdOrderByTurnOrderAsc(9L)).thenReturn(players);
        when(playerRepository.findByMatchIdAndUserId(eq(9L), anyLong())).thenAnswer(inv ->
            players.stream().filter(p -> p.getUserId().equals(inv.getArgument(1))).findFirst());
        match = RoomMatch.builder().id(9L).gameType(GameType.WORD_GUESS.name()).status(RoomMatch.PLAYING)
            .wordId(5L).startedAt(LocalDateTime.now()).endsAt(LocalDateTime.now().plusMinutes(5)).build();
    }

    @Test
    void firstCorrectGuessWins() {
        engine.guess(match, 2L, "vui chơi", announced::add);
        assertTrue(match.isPlaying());
        engine.guess(match, 1L, "VUI MỪNG", announced::add);
        assertEquals(RoomMatch.FINISHED, match.getStatus());
        assertEquals(1L, match.getWinnerId());
        assertTrue(announced.get(announced.size() - 1).contains("VUI MỪNG"));
    }

    @Test
    void formatErrorDoesNotCostAnAttempt() {
        assertThrows(RuntimeException.class, () -> engine.guess(match, 1L, "vui", announced::add));
        assertEquals(0, players.get(0).getAttempts());
    }

    @Test
    void allOutOfAttemptsEndsWithoutWinner() {
        for (long id = 1; id <= 2; id++) {
            engine.guess(match, id, "vui chơi", announced::add);
            engine.guess(match, id, "vui chơi", announced::add);
        }
        assertEquals(RoomMatch.FINISHED, match.getStatus());
        assertNull(match.getWinnerId());
        assertThrows(RuntimeException.class, () -> engine.guess(match, 1L, "vui mừng", announced::add));
    }

    @Test
    void timeLimitEndsMatch() {
        engine.tick(match, LocalDateTime.now(), announced::add);
        assertTrue(match.isPlaying());
        engine.tick(match, match.getEndsAt(), announced::add);
        assertEquals(RoomMatch.FINISHED, match.getStatus());
        assertNull(match.getWinnerId());
    }
}
