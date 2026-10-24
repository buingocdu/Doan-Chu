package com.gameword.service;

import com.gameword.dto.CellResult;
import com.gameword.dto.GameStateResponse;
import com.gameword.dto.GuessRequest;
import com.gameword.dto.GuessResponse;
import com.gameword.dto.WordResponse;
import com.gameword.model.GameHistory;
import com.gameword.model.Word;
import com.gameword.repository.GameHistoryRepository;
import com.gameword.repository.WordRepository;
import com.gameword.config.GameConfig;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class GameService {

    private final WordRepository wordRepository;
    private final GameHistoryRepository historyRepository;
    private final WordService wordService;
    private final GameConfig gameConfig;
    private final UserService userService;

    public GameService(WordRepository wordRepository, GameHistoryRepository historyRepository,
                       WordService wordService, GameConfig gameConfig, UserService userService) {
        this.wordRepository = wordRepository;
        this.historyRepository = historyRepository;
        this.wordService = wordService;
        this.gameConfig = gameConfig;
        this.userService = userService;
    }

    public GuessResponse startGame(Long userId, List<Long> excludedIds) {
        WordResponse wr = wordService.getRandomWord(excludedIds);
        Word word = wordRepository.findById(wr.getId())
            .orElseThrow(() -> new RuntimeException("Word not found"));

        // Ban ghi bat dau van (attempt = 0); id cua no la gameId
        GameHistory start = historyRepository.save(GameHistory.builder()
            .userId(userId)
            .wordId(word.getId())
            .guess("")
            .result("")
            .attempt(0)
            .correct(false)
            .build());
        start.setGameId(start.getId());

        return GuessResponse.builder()
            .gameId(start.getId())
            .wordId(word.getId())
            .wordLength(word.getValue().length())
            .partLengths(partLengths(word))
            .guess("")
            .attempt(0)
            .maxAttempts(gameConfig.getMaxAttempts())
            .correct(false)
            .gameOver(false)
            .cells(Collections.emptyList())
            .score(null)
            .message("Bat dau choi. Ban co " + gameConfig.getMaxAttempts() + " lan doan.")
            .build();
    }

    public Optional<GameStateResponse> currentGame(Long userId, Long gameId) {
        int maxAttempts = gameConfig.getMaxAttempts();
        Optional<GameHistory> start;
        if (userId != null) {
            start = historyRepository.findLatestStart(userId);
        } else if (gameId != null) {
            start = historyRepository.findById(gameId)
                .filter(h -> h.getAttempt() == 0 && h.getUserId() == null);
        } else {
            return Optional.empty();
        }
        if (start.isEmpty()) {
            return Optional.empty();
        }
        Word word = wordRepository.findById(start.get().getWordId()).orElse(null);
        if (word == null) {
            return Optional.empty();
        }
        List<GameHistory> guesses = historyRepository
            .findByGameIdAndAttemptGreaterThanOrderByAttemptAsc(start.get().getId(), 0);
        // Van da thang hoac het luot thi khong khoi phuc
        if (guesses.size() >= maxAttempts || guesses.stream().anyMatch(GameHistory::getCorrect)) {
            return Optional.empty();
        }
        return Optional.of(GameStateResponse.builder()
            .gameId(start.get().getId())
            .wordId(word.getId())
            .wordLength(word.getValue().length())
            .partLengths(partLengths(word))
            .maxAttempts(maxAttempts)
            .attempt(guesses.size())
            .rows(guesses.stream().map(GameService::toCells).collect(Collectors.toList()))
            .build());
    }

    // Dung lai cac o cua mot luot da luu: guess "LƯU HÀNH" + result "GREEN,BLUE,..."
    static List<CellResult> toCells(GameHistory h) {
        List<Character> letters = displayLetters(h.getGuess());
        String[] colors = h.getResult().split(",");
        List<CellResult> cells = new ArrayList<>(colors.length);
        for (int i = 0; i < colors.length; i++) {
            cells.add(CellResult.builder()
                .index(i)
                .letter(i < letters.size() ? letters.get(i) : ' ')
                .color(colors[i])
                .label(COLOR_LABELS.get(colors[i]))
                .build());
        }
        return cells;
    }

    public GuessResponse makeGuess(GuessRequest request, Long userId) {
        GameHistory start = request.getGameId() == null ? null
            : historyRepository.findById(request.getGameId()).orElse(null);
        if (start == null || start.getAttempt() != 0 || !Objects.equals(start.getUserId(), userId)) {
            throw new RuntimeException("Game not found");
        }
        Word word = wordRepository.findById(start.getWordId())
            .orElseThrow(() -> new RuntimeException("Word not found"));

        String target = word.getValue().toUpperCase();
        // Nguoi choi gui ca cum tu co dau, vd "TIẾNG ANH": cham diem tren chu khong dau, hien thi giu dau
        String rawGuess = request.getGuess() == null ? "" : request.getGuess().trim();
        List<Character> shown = displayLetters(rawGuess);
        String guess = shown.stream().map(c -> baseLetter(c)).collect(Collectors.joining());
        List<Integer> parts = partLengths(word);
        String phrase = formatPhrase(shown, parts);
        int maxAttempts = gameConfig.getMaxAttempts();

        List<GameHistory> guesses = historyRepository
            .findByGameIdAndAttemptGreaterThanOrderByAttemptAsc(start.getId(), 0);
        boolean alreadyWon = guesses.stream().anyMatch(GameHistory::getCorrect);
        if (alreadyWon || guesses.size() >= maxAttempts) {
            return GuessResponse.builder()
                .gameId(start.getId())
                .wordId(word.getId())
                .wordLength(target.length())
                .partLengths(partLengths(word))
                .guess(phrase)
                .attempt(guesses.size())
                .maxAttempts(maxAttempts)
                .correct(alreadyWon)
                .gameOver(true)
                .cells(Collections.emptyList())
                .score(null)
                .message("Van choi da ket thuc. Tu dung la: " + answerOf(word))
                .answer(answerOf(word))
                .build();
        }
        if (guess.length() != target.length()) {
            throw new RuntimeException("Tu doan phai co " + target.length() + " ki tu");
        }
        // Neu nguoi choi tach tieng bang dau cach thi so chu cua tung tieng phai khop
        if (rawGuess.contains(" ")) {
            List<Integer> typedParts = Arrays.stream(rawGuess.split("\\s+"))
                .map(p -> displayLetters(p).size())
                .filter(n -> n > 0)
                .collect(Collectors.toList());
            if (!typedParts.equals(parts)) {
                throw new RuntimeException("Tu doan phai gom " + parts.size() + " tieng: "
                    + parts.stream().map(String::valueOf).collect(Collectors.joining(" + ")) + " chu cai");
            }
        }

        int attempt = guesses.size() + 1;
        // So tung chu co dau theo vi tri: "NGÔI NHÀ" -> [N,G,Ô,I,N,H,À]
        List<Character> targetLetters = targetLetters(word);
        List<CellResult> cells = evaluateGuess(shown, targetLetters);
        boolean correct = shown.equals(targetLetters);

        historyRepository.save(GameHistory.builder()
            .gameId(start.getId())
            .userId(userId)
            .wordId(word.getId())
            .guess(phrase)
            .result(cells.stream().map(CellResult::getColor).collect(Collectors.joining(",")))
            .attempt(attempt)
            .correct(correct)
            .build());

        Integer score = null;
        String message;
        boolean gameOver = false;
        if (correct) {
            score = computeScore(attempt);
            message = "Chuan! Ban doan dung tai lan thu " + attempt + ". Duoc cong " + score + " diem.";
            gameOver = true;
            if (userId != null) {
                userService.addScore(userId, score);
            }
        } else if (attempt >= maxAttempts) {
            gameOver = true;
            message = "Het luot doan. Tu dung la: " + answerOf(word);
            if (userId != null) {
                userService.incrementPlayed(userId);
            }
        } else {
            message = "Sai. Con " + (maxAttempts - attempt) + " lan doan.";
        }

        return GuessResponse.builder()
            .gameId(start.getId())
            .wordId(word.getId())
            .wordLength(target.length())
            .partLengths(parts)
            .guess(phrase)
            .attempt(attempt)
            .maxAttempts(maxAttempts)
            .correct(correct)
            .gameOver(gameOver)
            .cells(cells)
            .score(score)
            .message(message)
            .answer(gameOver ? answerOf(word) : null)
            .build();
    }

    /**
     * Cham tung o (moi chu cai co dau la mot o), moi chu cua dap an chi duoc tinh cho mot o:
     * 1. GREEN  - dung chu va dung dau tai vi tri do (Ô = Ô)
     * 2. BLUE   - cung vi tri, dung chu goc nhung sai dau (O/Ố so voi Ô, D so voi Đ)
     * 3. YELLOW - chu goc co trong tu o vi tri khac chua duoc tinh
     * 4. BLACK  - con lai
     */
    static List<CellResult> evaluateGuess(List<Character> guess, List<Character> target) {
        int n = target.size();
        String[] colors = new String[n];
        boolean[] used = new boolean[n];

        for (int i = 0; i < n; i++) {
            if (i < guess.size() && guess.get(i).equals(target.get(i))) {
                colors[i] = "GREEN";
                used[i] = true;
            }
        }
        for (int i = 0; i < n; i++) {
            if (colors[i] == null && i < guess.size()
                    && baseLetter(guess.get(i)).equals(baseLetter(target.get(i)))) {
                colors[i] = "BLUE";
                used[i] = true;
            }
        }
        for (int i = 0; i < n; i++) {
            if (colors[i] != null) {
                continue;
            }
            colors[i] = "BLACK";
            if (i >= guess.size()) {
                continue;
            }
            String base = baseLetter(guess.get(i));
            for (int j = 0; j < n; j++) {
                if (!used[j] && baseLetter(target.get(j)).equals(base)) {
                    colors[i] = "YELLOW";
                    used[j] = true;
                    break;
                }
            }
        }

        List<CellResult> results = new ArrayList<>(n);
        for (int i = 0; i < n; i++) {
            results.add(CellResult.builder()
                .index(i)
                .letter(i < guess.size() ? guess.get(i) : ' ')
                .color(colors[i])
                .label(COLOR_LABELS.get(colors[i]))
                .build());
        }
        return results;
    }

    private static final Map<String, String> COLOR_LABELS = Map.of(
        "GREEN", "xanh la", "BLUE", "xanh duong", "YELLOW", "vang", "BLACK", "den");

    // Chu cai co dau cua dap an; tu cu khong co phrase (hoac phrase khong khop do dai) thi dung value khong dau
    private List<Character> targetLetters(Word word) {
        if (word.getPhrase() != null) {
            List<Character> letters = displayLetters(word.getPhrase());
            if (letters.size() == word.getValue().length()) {
                return letters;
            }
        }
        return displayLetters(word.getValue());
    }

    // Tach chu cai (in hoa, giu dau tieng Viet), bo dau cach va ky tu khac: "Tiếng anh" -> [T,I,Ế,N,G,A,N,H]
    static List<Character> displayLetters(String raw) {
        String nfc = Normalizer.normalize(raw, Normalizer.Form.NFC).toUpperCase(Locale.ROOT);
        List<Character> letters = new ArrayList<>();
        for (char c : nfc.toCharArray()) {
            if (!baseLetter(c).isEmpty()) {
                letters.add(c);
            }
        }
        return letters;
    }

    // Chu cai goc khong dau A-Z, "" neu khong phai chu cai: Ế -> E, Đ -> D
    static String baseLetter(char c) {
        if (c == 'Đ' || c == 'đ') {
            return "D";
        }
        String base = Normalizer.normalize(String.valueOf(c), Normalizer.Form.NFD)
            .replaceAll("\\p{M}", "")
            .toUpperCase(Locale.ROOT);
        return base.length() == 1 && base.charAt(0) >= 'A' && base.charAt(0) <= 'Z' ? base : "";
    }

    // Ghep chu hien thi theo tung tieng: [T,I,Ế,N,G,A,N,H] + [5,3] -> "TIẾNG ANH"
    static String formatPhrase(List<Character> letters, List<Integer> parts) {
        StringBuilder sb = new StringBuilder();
        int index = 0;
        for (int len : parts) {
            if (index >= letters.size()) {
                break;
            }
            if (sb.length() > 0) {
                sb.append(' ');
            }
            for (int i = 0; i < len && index < letters.size(); i++) {
                sb.append(letters.get(index++));
            }
        }
        while (index < letters.size()) {
            sb.append(letters.get(index++));
        }
        return sb.toString();
    }

    // Dap an hien thi: tu co dau in hoa ("MÁY TÍNH"); tu cu khong co phrase thi tach theo tieng ("CHO MON")
    private String answerOf(Word word) {
        if (word.getPhrase() != null && !word.getPhrase().isBlank()) {
            return word.getPhrase().trim().toUpperCase(Locale.ROOT);
        }
        return formatPhrase(displayLetters(word.getValue()), partLengths(word));
    }

    private List<Integer> partLengths(Word word) {
        String value = word.getValue();
        if (word.getPart1() != null && word.getPart2() != null
                && (word.getPart1() + word.getPart2()).equalsIgnoreCase(value)) {
            return List.of(word.getPart1().length(), word.getPart2().length());
        }
        return List.of(value.length());
    }

    private Integer computeScore(int attempt) {
        return computeScore(attempt, gameConfig.getMaxAttempts(), gameConfig.getScoreMin(), gameConfig.getScoreMax());
    }

    // Diem giam deu theo luot doan dung toan bo cum tu: mac dinh (10 luot, 10-100) -> lan 1 = 100, lan 2 = 90, ..., lan 10 = 10
    static int computeScore(int attempt, int maxAttempts, int scoreMin, int scoreMax) {
        if (maxAttempts <= 1) {
            return scoreMax;
        }
        double step = (double) (scoreMax - scoreMin) / (maxAttempts - 1);
        int score = (int) Math.round(scoreMax - (attempt - 1) * step);
        return Math.max(scoreMin, Math.min(scoreMax, score));
    }
}
