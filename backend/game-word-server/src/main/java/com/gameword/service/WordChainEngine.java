package com.gameword.service;

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

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.function.Consumer;
import java.util.stream.Collectors;

// Noi tu theo luot: tieng dau = tieng cuoi cua tu truoc; sai / tu da dung / het gio bi loai,
// nguoi cuoi cung con lai thang (DOC-007 muc 3.3)
@Component
class WordChainEngine implements MatchEngine {

    private final WordRepository wordRepository;
    private final RoomMatchRepository matchRepository;
    private final MatchPlayerRepository playerRepository;
    private final MatchMoveRepository moveRepository;
    private final UserService userService;
    private final RoomConfig roomConfig;

    WordChainEngine(WordRepository wordRepository, RoomMatchRepository matchRepository,
                    MatchPlayerRepository playerRepository, MatchMoveRepository moveRepository,
                    UserService userService, RoomConfig roomConfig) {
        this.wordRepository = wordRepository;
        this.matchRepository = matchRepository;
        this.playerRepository = playerRepository;
        this.moveRepository = moveRepository;
        this.userService = userService;
        this.roomConfig = roomConfig;
    }

    @Override
    public GameType type() {
        return GameType.WORD_CHAIN;
    }

    @Override
    public void start(RoomMatch match, List<Long> playerIds, Consumer<String> announce) {
        List<Long> order = new ArrayList<>(playerIds);
        Collections.shuffle(order);
        for (int i = 0; i < order.size(); i++) {
            playerRepository.save(MatchPlayer.builder()
                .matchId(match.getId())
                .userId(order.get(i))
                .turnOrder(i)
                .eliminated(false)
                .attempts(0)
                .build());
        }
        Word first = wordRepository.findRandomChainStart()
            .orElseThrow(() -> new RuntimeException("No words available"));
        String word = normalize(first.getPhrase());
        moveRepository.save(MatchMove.builder()
            .matchId(match.getId())
            .content(word)
            .correct(true)
            .createdAt(match.getStartedAt())
            .build());
        match.setLastWord(word);
        match.setCurrentUserId(order.get(0));
        match.setTurnDeadline(match.getStartedAt().plusSeconds(roomConfig.getChainTurnSeconds()));
        matchRepository.save(match);
        announce.accept("Bắt đầu Nối từ! Từ mở đầu: \"" + word + "\". Mỗi lượt " + roomConfig.getChainTurnSeconds()
            + " giây. Lượt đầu tiên: " + userService.getUser(order.get(0)).getUsername() + ".");
    }

    public void play(RoomMatch match, Long userId, String rawWord, Consumer<String> announce) {
        if (!userId.equals(match.getCurrentUserId())) {
            throw new RuntimeException("Not your turn");
        }
        String word = normalize(rawWord);
        String[] syllables = word.split(" ");
        if (word.isEmpty() || syllables.length != 2) {
            throw new RuntimeException("Word must have 2 syllables");
        }
        String required = lastSyllable(match.getLastWord());
        if (!syllables[0].equals(required)) {
            throw new RuntimeException("Word must start with: " + required);
        }
        MatchPlayer player = playerRepository.findByMatchIdAndUserId(match.getId(), userId)
            .orElseThrow(() -> new RuntimeException("Not a player in this match"));
        String name = userService.getUser(userId).getUsername();
        if (moveRepository.existsByMatchIdAndContent(match.getId(), word)) {
            eliminate(match, player, MatchPlayer.USED_WORD,
                name + " bị loại: \"" + word + "\" đã được dùng trong ván.", announce);
            return;
        }
        if (!wordRepository.existsByPhraseAndActiveTrue(word)) {
            eliminate(match, player, MatchPlayer.INVALID_WORD,
                name + " bị loại: \"" + word + "\" không có trong từ điển.", announce);
            return;
        }
        player.setAttempts(player.getAttempts() + 1);
        playerRepository.save(player);
        moveRepository.save(MatchMove.builder()
            .matchId(match.getId())
            .userId(userId)
            .content(word)
            .correct(true)
            .createdAt(LocalDateTime.now())
            .build());
        match.setLastWord(word);
        advanceFrom(match, player.getTurnOrder(), alivePlayers(match));
        matchRepository.save(match);
    }

    // Moi lan goi xu ly toi da 1 lan het gio; luot ke tiep tinh tu bay gio (tranh loai lien hoan khi khong ai poll)
    @Override
    public void tick(RoomMatch match, LocalDateTime now, Consumer<String> announce) {
        if (!match.isPlaying() || match.getTurnDeadline() == null || now.isBefore(match.getTurnDeadline())) {
            return;
        }
        playerRepository.findByMatchIdAndUserId(match.getId(), match.getCurrentUserId()).ifPresent(p ->
            eliminate(match, p, MatchPlayer.TIMEOUT,
                userService.getUser(p.getUserId()).getUsername() + " hết giờ và bị loại.", announce));
    }

    @Override
    public void forfeit(RoomMatch match, Long userId, Consumer<String> announce) {
        playerRepository.findByMatchIdAndUserId(match.getId(), userId)
            .filter(p -> !p.getEliminated())
            .ifPresent(p -> eliminate(match, p, MatchPlayer.LEFT,
                userService.getUser(userId).getUsername() + " rời phòng và bị loại.", announce));
    }

    @Override
    public LocalDateTime nextDeadline(RoomMatch match) {
        return match.isPlaying() ? match.getTurnDeadline() : null;
    }

    private void eliminate(RoomMatch match, MatchPlayer player, String reason, String message,
                           Consumer<String> announce) {
        player.setEliminated(true);
        player.setEliminatedReason(reason);
        playerRepository.save(player);
        announce.accept(message);

        List<MatchPlayer> alive = alivePlayers(match);
        if (alive.size() <= 1) {
            match.setStatus(RoomMatch.FINISHED);
            match.setWinnerId(alive.isEmpty() ? null : alive.get(0).getUserId());
            match.setFinishedAt(LocalDateTime.now());
            match.setCurrentUserId(null);
            match.setTurnDeadline(null);
            if (!alive.isEmpty()) {
                announce.accept(userService.getUser(alive.get(0).getUserId()).getUsername()
                    + " là người cuối cùng còn lại và chiến thắng!");
            }
        } else if (player.getUserId().equals(match.getCurrentUserId())) {
            advanceFrom(match, player.getTurnOrder(), alive);
        }
        matchRepository.save(match);
    }

    // Chuyen luot cho nguoi con choi ke tiep sau turnOrder (vong lai dau danh sach)
    private void advanceFrom(RoomMatch match, int turnOrder, List<MatchPlayer> alive) {
        MatchPlayer next = alive.stream()
            .filter(p -> p.getTurnOrder() > turnOrder)
            .findFirst()
            .orElse(alive.get(0));
        match.setCurrentUserId(next.getUserId());
        match.setTurnDeadline(LocalDateTime.now().plusSeconds(roomConfig.getChainTurnSeconds()));
    }

    private List<MatchPlayer> alivePlayers(RoomMatch match) {
        return playerRepository.findByMatchIdOrderByTurnOrderAsc(match.getId()).stream()
            .filter(p -> !p.getEliminated())
            .collect(Collectors.toList());
    }

    // Chu thuong, NFC, gop khoang trang: " Tính  Toán " -> "tính toán" (khop cot words.phrase)
    static String normalize(String raw) {
        if (raw == null) {
            return "";
        }
        return Normalizer.normalize(raw, Normalizer.Form.NFC)
            .toLowerCase(Locale.ROOT)
            .strip()
            .replaceAll("\\s+", " ");
    }

    static String lastSyllable(String word) {
        if (word == null || word.isBlank()) {
            return "";
        }
        String[] parts = word.split(" ");
        return parts[parts.length - 1];
    }
}
