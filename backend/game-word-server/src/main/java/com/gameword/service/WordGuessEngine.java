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

import com.gameword.dto.HintDto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;
import java.util.function.Consumer;

// Dua doan chu: moi nguoi doan cung mot tu, doc lap; nguoi dau tien doan dung thang (DOC-007 muc 3.2).
// Che do lan luot (turnBased): ca phong doan chung mot bang theo thu tu, dung chung room.turn-max-attempts luot;
// het luot thi chuyen nguoi (khong mat luot chung); doan ra thi ca phong cung thang.
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
        int duration = match.getDurationSeconds() != null ? match.getDurationSeconds() : roomConfig.getGuessTimeSeconds();
        match.setEndsAt(match.getStartedAt().plusSeconds(duration));
        boolean turnBased = Boolean.TRUE.equals(match.getTurnBased());
        List<Long> order = new ArrayList<>(playerIds);
        if (turnBased) {
            Collections.shuffle(order);
            match.setCurrentUserId(order.get(0));
            match.setTurnDeadline(match.getStartedAt().plusSeconds(roomConfig.getTurnSeconds()));
        }
        matchRepository.save(match);
        for (int i = 0; i < order.size(); i++) {
            playerRepository.save(MatchPlayer.builder()
                .matchId(match.getId())
                .userId(order.get(i))
                .turnOrder(i)
                .eliminated(false)
                .attempts(0)
                .build());
        }
        String hintText = Boolean.TRUE.equals(match.getHints())
            ? ", cứ " + roomConfig.getHintIntervalSeconds() + " giây lộ thêm 1 chữ cái gợi ý" : "";
        if (turnBased) {
            announce.accept("Bắt đầu Đoán chữ lần lượt! Từ gồm " + GameService.partLengths(word).size()
                + " tiếng, cả phòng chung " + roomConfig.getTurnMaxAttempts() + " lượt, mỗi lượt "
                + roomConfig.getTurnSeconds() + " giây, " + duration / 60 + " phút" + hintText
                + ". Lượt đầu tiên: " + userService.getUser(order.get(0)).getUsername() + ".");
            return;
        }
        announce.accept("Bắt đầu Đua đoán chữ! Từ gồm " + GameService.partLengths(word).size() + " tiếng, mỗi người "
            + gameConfig.getMaxAttempts() + " lượt, " + duration / 60 + " phút" + hintText
            + ". Ai đoán đúng trước sẽ thắng.");
    }

    public void guess(RoomMatch match, Long userId, String rawGuess, Consumer<String> announce) {
        MatchPlayer player = playerRepository.findByMatchIdAndUserId(match.getId(), userId)
            .orElseThrow(() -> new RuntimeException("Not a player in this match"));
        if (Boolean.TRUE.equals(match.getTurnBased())) {
            guessInTurn(match, player, rawGuess, announce);
            return;
        }
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

    // Lan luot: dung luot cua minh; luot thu turn-max-attempts ma sai thi ca phong thua
    private void guessInTurn(RoomMatch match, MatchPlayer player, String rawGuess, Consumer<String> announce) {
        if (!player.getUserId().equals(match.getCurrentUserId())) {
            throw new RuntimeException("Not your turn");
        }
        Word word = wordService.getWord(match.getWordId());
        GameService.GuessEvaluation evaluation = GameService.evaluate(word, rawGuess);
        LocalDateTime now = LocalDateTime.now();

        player.setAttempts(player.getAttempts() + 1);
        moveRepository.save(MatchMove.builder()
            .matchId(match.getId())
            .userId(player.getUserId())
            .content(evaluation.phrase())
            .result(evaluation.colors())
            .correct(evaluation.correct())
            .createdAt(now)
            .build());

        List<MatchPlayer> players = playerRepository.findByMatchIdOrderByTurnOrderAsc(match.getId());
        int used = players.stream()
            .mapToInt(p -> p.getUserId().equals(player.getUserId()) ? player.getAttempts() : p.getAttempts())
            .sum();
        int max = roomConfig.getTurnMaxAttempts();
        String name = userService.getUser(player.getUserId()).getUsername();
        if (evaluation.correct()) {
            player.setSolvedAt(now);
            playerRepository.save(player);
            finish(match, player.getUserId(), now);
            announce.accept(name + " đoán đúng ở lượt " + used + "/" + max + ". Cả phòng chiến thắng! Đáp án: "
                + GameService.answerOf(word) + ".");
            return;
        }
        playerRepository.save(player);
        if (used >= max) {
            finish(match, null, now);
            announce.accept("Đã dùng hết " + max + " lượt chung, cả phòng chưa đoán ra. Đáp án: "
                + GameService.answerOf(word) + ".");
            return;
        }
        advanceTurn(match, player.getTurnOrder(), players);
        matchRepository.save(match);
    }

    // Chuyen luot cho nguoi con choi ke tiep sau turnOrder (vong lai dau danh sach)
    private void advanceTurn(RoomMatch match, int turnOrder, List<MatchPlayer> players) {
        List<MatchPlayer> active = players.stream().filter(p -> !p.getEliminated()).toList();
        MatchPlayer next = active.stream()
            .filter(p -> p.getTurnOrder() > turnOrder)
            .findFirst()
            .orElse(active.get(0));
        match.setCurrentUserId(next.getUserId());
        match.setTurnDeadline(LocalDateTime.now().plusSeconds(roomConfig.getTurnSeconds()));
    }

    // Moi lan goi xu ly 1 su kien: het gio van, hoac (lan luot) het gio luot -> chuyen nguoi, khong mat luot chung
    @Override
    public void tick(RoomMatch match, LocalDateTime now, Consumer<String> announce) {
        if (!match.isPlaying()) {
            return;
        }
        if (match.getEndsAt() != null && !now.isBefore(match.getEndsAt())) {
            finish(match, null, now);
            announce.accept("Hết giờ! " + (Boolean.TRUE.equals(match.getTurnBased()) ? "Cả phòng chưa đoán ra" : "Không ai đoán ra")
                + ". Đáp án: " + GameService.answerOf(wordService.getWord(match.getWordId())) + ".");
            return;
        }
        if (Boolean.TRUE.equals(match.getTurnBased()) && match.getTurnDeadline() != null
            && !now.isBefore(match.getTurnDeadline())) {
            List<MatchPlayer> players = playerRepository.findByMatchIdOrderByTurnOrderAsc(match.getId());
            players.stream().filter(p -> p.getUserId().equals(match.getCurrentUserId())).findFirst().ifPresent(p -> {
                advanceTurn(match, p.getTurnOrder(), players);
                matchRepository.save(match);
                announce.accept(userService.getUser(p.getUserId()).getUsername() + " hết giờ, chuyển lượt cho "
                    + userService.getUser(match.getCurrentUserId()).getUsername() + ".");
            });
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
                // Lan luot: nguoi dang toi luot roi phong thi chuyen luot ngay
                if (match.isPlaying() && Boolean.TRUE.equals(match.getTurnBased())
                    && userId.equals(match.getCurrentUserId())) {
                    advanceTurn(match, p.getTurnOrder(), playerRepository.findByMatchIdOrderByTurnOrderAsc(match.getId()));
                    matchRepository.save(match);
                }
            });
    }

    @Override
    public LocalDateTime nextDeadline(RoomMatch match) {
        if (!match.isPlaying()) {
            return null;
        }
        LocalDateTime turn = match.getTurnDeadline();
        return turn != null && Boolean.TRUE.equals(match.getTurnBased()) && turn.isBefore(match.getEndsAt())
            ? turn : match.getEndsAt();
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
        match.setCurrentUserId(null);
        match.setTurnDeadline(null);
        matchRepository.save(match);
    }

    // Goi y sau elapsed giay: moi interval giay lo them 1 chu cai, toi da (so chu - 1) de van con phai doan.
    // Thu tu vi tri xao tron co dinh theo id van, nen moi nguoi va moi lan tai lai deu thay giong nhau.
    static List<HintDto> hintsAt(long matchId, List<Character> letters, long elapsedSeconds, int interval) {
        int count = (int) Math.max(0, Math.min(elapsedSeconds / interval, letters.size() - 1));
        List<Integer> order = new ArrayList<>();
        for (int i = 0; i < letters.size(); i++) {
            order.add(i);
        }
        Collections.shuffle(order, new Random(matchId));
        List<Integer> shown = new ArrayList<>(order.subList(0, count));
        Collections.sort(shown);
        List<HintDto> hints = new ArrayList<>(count);
        for (int i : shown) {
            hints.add(new HintDto(i, String.valueOf(letters.get(i))));
        }
        return hints;
    }
}
