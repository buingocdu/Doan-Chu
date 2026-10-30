package com.gameword.service;

import com.gameword.config.RoomConfig;
import com.gameword.model.GameType;
import com.gameword.model.MatchPlayer;
import com.gameword.model.RoomMatch;
import com.gameword.model.User;
import com.gameword.repository.MatchMoveRepository;
import com.gameword.repository.MatchPlayerRepository;
import com.gameword.repository.RoomMatchRepository;
import com.gameword.repository.WordRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class WordChainEngineTest {

    private WordRepository wordRepository;
    private MatchMoveRepository moveRepository;
    private WordChainEngine engine;
    private RoomMatch match;
    private List<MatchPlayer> players;
    private final List<String> announced = new ArrayList<>();

    @BeforeEach
    void setUp() {
        wordRepository = mock(WordRepository.class);
        moveRepository = mock(MatchMoveRepository.class);
        MatchPlayerRepository playerRepository = mock(MatchPlayerRepository.class);
        UserService userService = mock(UserService.class);
        when(userService.getUser(anyLong())).thenAnswer(inv ->
            User.builder().id(inv.getArgument(0)).username("u" + inv.getArgument(0)).build());
        engine = new WordChainEngine(wordRepository, mock(RoomMatchRepository.class), playerRepository,
            moveRepository, userService, new RoomConfig());

        players = new ArrayList<>();
        for (long id = 1; id <= 3; id++) {
            players.add(MatchPlayer.builder().matchId(9L).userId(id).turnOrder((int) id - 1)
                .eliminated(false).attempts(0).build());
        }
        when(playerRepository.findByMatchIdOrderByTurnOrderAsc(9L)).thenReturn(players);
        when(playerRepository.findByMatchIdAndUserId(eq(9L), anyLong())).thenAnswer(inv ->
            players.stream().filter(p -> p.getUserId().equals(inv.getArgument(1))).findFirst());
        match = RoomMatch.builder().id(9L).gameType(GameType.WORD_CHAIN.name()).status(RoomMatch.PLAYING)
            .lastWord("máy tính").currentUserId(1L).turnDeadline(LocalDateTime.now().plusSeconds(20))
            .startedAt(LocalDateTime.now()).build();
    }

    @Test
    void normalizeMatchesDictionaryFormat() {
        assertEquals("tính toán", WordChainEngine.normalize("  Tính   TOÁN "));
        assertEquals("tính", WordChainEngine.lastSyllable("máy tính"));
    }

    @Test
    void validWordPassesTurnToNextPlayer() {
        when(wordRepository.existsByPhraseAndActiveTrue("tính toán")).thenReturn(true);
        engine.play(match, 1L, "Tính toán", announced::add);
        assertEquals("tính toán", match.getLastWord());
        assertEquals(2L, match.getCurrentUserId());
        assertTrue(announced.isEmpty());
    }

    @Test
    void formatErrorsDoNotEliminate() {
        assertThrows(RuntimeException.class, () -> engine.play(match, 2L, "tính toán", announced::add));
        assertThrows(RuntimeException.class, () -> engine.play(match, 1L, "tính", announced::add));
        RuntimeException ex = assertThrows(RuntimeException.class,
            () -> engine.play(match, 1L, "toán học", announced::add));
        assertEquals("Word must start with: tính", ex.getMessage());
        assertTrue(players.stream().noneMatch(MatchPlayer::getEliminated));
    }

    @Test
    void unknownOrUsedWordEliminatesPlayer() {
        engine.play(match, 1L, "tính abc", announced::add);
        assertTrue(players.get(0).getEliminated());
        assertEquals(MatchPlayer.INVALID_WORD, players.get(0).getEliminatedReason());
        assertEquals(2L, match.getCurrentUserId());

        when(moveRepository.existsByMatchIdAndContent(9L, "tính toán")).thenReturn(true);
        engine.play(match, 2L, "tính toán", announced::add);
        assertEquals(MatchPlayer.USED_WORD, players.get(1).getEliminatedReason());
        // Con 1 nguoi -> thang
        assertEquals(RoomMatch.FINISHED, match.getStatus());
        assertEquals(3L, match.getWinnerId());
    }

    @Test
    void timeoutEliminatesCurrentPlayerOnly() {
        match.setTurnDeadline(LocalDateTime.now().minusSeconds(1));
        engine.tick(match, LocalDateTime.now(), announced::add);
        assertEquals(MatchPlayer.TIMEOUT, players.get(0).getEliminatedReason());
        assertFalse(players.get(1).getEliminated());
        assertEquals(2L, match.getCurrentUserId());
        assertTrue(match.getTurnDeadline().isAfter(LocalDateTime.now()));

        // Chua den han thi khong lam gi
        engine.tick(match, LocalDateTime.now(), announced::add);
        assertFalse(players.get(1).getEliminated());
    }

    @Test
    void turnSkipsEliminatedPlayersAndWraps() {
        players.get(1).setEliminated(true);
        when(wordRepository.existsByPhraseAndActiveTrue(anyString())).thenReturn(true);
        engine.play(match, 1L, "tính toán", announced::add);
        assertEquals(3L, match.getCurrentUserId());
        engine.play(match, 3L, "toán học", announced::add);
        assertEquals(1L, match.getCurrentUserId());
        verify(moveRepository, times(2)).save(any());
        assertEquals(Optional.of("học"), Optional.of(WordChainEngine.lastSyllable(match.getLastWord())));
    }
}
