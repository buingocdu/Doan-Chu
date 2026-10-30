package com.gameword.service;

import com.gameword.config.GameConfig;
import com.gameword.config.RoomConfig;
import com.gameword.model.GameType;
import com.gameword.model.MatchMove;
import com.gameword.model.MatchPlayer;
import com.gameword.model.RoomMatch;
import com.gameword.model.Word;
import com.gameword.repository.MatchMoveRepository;
import com.gameword.repository.MatchPlayerRepository;
import com.gameword.repository.RoomMatchRepository;
import com.gameword.repository.WordRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.function.Consumer;

// Dua doan chu: moi nguoi doan cung mot tu, doc lap; nguoi dau tien doan dung thang (DOC-007 muc 3.2)
@Component
class WordGuessEngine implements MatchEngine {

    private final WordService wordService;
    private final WordRepository wordRepository;
    private final RoomMatchRepository matchRepository;
    private final MatchPlayerRepository playerRepository;
    private final MatchMoveRepository moveRepository;
    private final UserService userService;
    private final GameConfig gameConfig;
    private final RoomConfig roomConfig;

    WordGuessEngine(WordService wordService, WordRepository wordRepository, RoomMatchRepository matchRepository,
                    MatchPlayerRepository playerRepository, MatchMoveRepository moveRepository,
                    UserService userService, GameConfig gameConfig, RoomConfig roomConfig) {
        this.wordService = wordService;
        this.wordRepository = wordRepository;
        this.matchRepository = matchRepository;
        this.playerRepository = playerRepository;
        this.moveRepository = moveRepository;
        this.userService = userService;
        this.gameConfig = gameConfig;
        this.roomConfig = roomConfig;
    }

    @Override
    public GameType type() {
        return GameType.WORD_GUESS;
    }

    @Override
    public void start(RoomMatch match, List<Long> playerIds, Consumer<String> announce) {
        Word word = wordService.getWord(wordService.getRandomWord(List.of()).getId());
        match.setWordId(word.getId());
        match.setEndsAt(match.getStartedAt().plusSeconds(roomConfig.getGuessTimeSeconds()));
        matchRepository.save(match);
        for (int i = 0; i < playerIds.size(); i++) {
            playerRepository.save(MatchPlayer.builder()
                .matchId(match.getId())
                .userId(playerIds.get(i))
                .turnOrder(i)
                .eliminated(false)
                .attempts(0)
                .build());
        }
        announce.accept("Bắt đầu Đua đoán chữ! Từ gồm " + GameService.partLengths(word).size() + " tiếng, mỗi người "
            + gameConfig.getMaxAttempts() + " lượt, " + roomConfig.getGuessTimeSeconds() / 60
            + " phút. Ai đoán đúng trước sẽ thắng.");
    }

    public void guess(RoomMatch match, Long userId, String rawGuess, Consumer<String> announce) {
        MatchPlayer player = playerRepository.findByMatchIdAndUserId(match.getId(), userId)
            .orElseThrow(() -> new RuntimeException("Not a player in this match"));
        if (player.getEliminated() || player.getSolvedAt() != null) {
            throw new RuntimeException("No attempts left");
        }
        Word word = wordService.getWord(match.getWordId());
        GameService.GuessEvaluation evaluation = GameService.evaluate(word, rawGuess);
        LocalDateTime now = LocalDateTime.now();

        player.setAttempts(player.getAttempts() + 1);
        moveRepository.save(MatchMove.builder()
            .matchId(match.getId())
            .userId(userId)
            .content(evaluation.phrase())
            .result(evaluation.colors())
            .correct(evaluation.correct())
            .createdAt(now)
            .build());

        String name = userService.getUser(userId).getUsername();
        if (evaluation.correct()) {
            player.setSolvedAt(now);
            playerRepository.save(player);
            finish(match, userId, now);
            announce.accept(name + " đoán đúng sau " + player.getAttempts() + " lượt và chiến thắng! Đáp án: "
                + GameService.answerOf(word) + ".");
            return;
        }
        if (player.getAttempts() >= gameConfig.getMaxAttempts()) {
            player.setEliminated(true);
            player.setEliminatedReason(MatchPlayer.OUT_OF_ATTEMPTS);
            announce.accept(name + " đã hết lượt đoán.");
        }
        playerRepository.save(player);
        finishIfNobodyLeft(match, word, now, announce);
    }

    @Override
    public void tick(RoomMatch match, LocalDateTime now, Consumer<String> announce) {
        if (match.isPlaying() && match.getEndsAt() != null && !now.isBefore(match.getEndsAt())) {
            finish(match, null, now);
            announce.accept("Hết giờ! Không ai đoán ra. Đáp án: "
                + GameService.answerOf(wordService.getWord(match.getWordId())) + ".");
        }
    }

    @Override
    public void forfeit(RoomMatch match, Long userId, Consumer<String> announce) {
        playerRepository.findByMatchIdAndUserId(match.getId(), userId)
            .filter(p -> !p.getEliminated() && p.getSolvedAt() == null)
            .ifPresent(p -> {
                p.setEliminated(true);
                p.setEliminatedReason(MatchPlayer.LEFT);
                playerRepository.save(p);
                finishIfNobodyLeft(match, wordService.getWord(match.getWordId()), LocalDateTime.now(), announce);
            });
    }

    @Override
    public LocalDateTime nextDeadline(RoomMatch match) {
        return match.isPlaying() ? match.getEndsAt() : null;
    }

    // Tat ca da het luot / bo cuoc ma chua ai dung -> van ket thuc khong co nguoi thang
    private void finishIfNobodyLeft(RoomMatch match, Word word, LocalDateTime now, Consumer<String> announce) {
        boolean anyoneLeft = playerRepository.findByMatchIdOrderByTurnOrderAsc(match.getId()).stream()
            .anyMatch(p -> !p.getEliminated() && p.getSolvedAt() == null);
        if (!anyoneLeft && match.isPlaying()) {
            finish(match, null, now);
            announce.accept("Không ai đoán ra. Đáp án: " + GameService.answerOf(word) + ".");
        }
    }

    private void finish(RoomMatch match, Long winnerId, LocalDateTime now) {
        match.setStatus(RoomMatch.FINISHED);
        match.setWinnerId(winnerId);
        match.setFinishedAt(now);
        matchRepository.save(match);
    }
}
