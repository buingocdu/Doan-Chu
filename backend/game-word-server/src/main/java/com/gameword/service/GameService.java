package com.gameword.service;

import com.gameword.dto.CellResult;
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

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class GameService {

    private final WordRepository wordRepository;
    private final GameHistoryRepository historyRepository;
    private final WordService wordService;
    private final GameConfig gameConfig;

    public GameService(WordRepository wordRepository, GameHistoryRepository historyRepository,
                       WordService wordService, GameConfig gameConfig) {
        this.wordRepository = wordRepository;
        this.historyRepository = historyRepository;
        this.wordService = wordService;
        this.gameConfig = gameConfig;
    }

    public GuessResponse startGame(Long userId, List<Long> excludedIds) {
        WordResponse wr = wordService.getRandomWord(excludedIds);
        Word word = wordRepository.findById(wr.getId())
            .orElseThrow(() -> new RuntimeException("Word not found"));

        if (userId != null) {
            historyRepository.save(GameHistory.builder()
                .userId(userId)
                .wordId(word.getId())
                .guess("")
                .result("")
                .attempt(0)
                .correct(false)
                .build());
        }

        return GuessResponse.builder()
            .wordId(word.getId())
            .wordLength(word.getValue().length())
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

    public GuessResponse makeGuess(GuessRequest request) {
        Word word = wordRepository.findById(request.getWordId())
            .orElseThrow(() -> new RuntimeException("Word not found"));

        String target = word.getValue().toUpperCase();
        String guess = (request.getGuess() == null ? "" : request.getGuess().trim()).toUpperCase();

        int maxAttempts = gameConfig.getMaxAttempts();
        List<GameHistory> history = historyRepository.findByWordId(word.getId());
        int attempt = history.size() + 1;

        if (attempt > maxAttempts) {
            return GuessResponse.builder()
                .wordId(word.getId())
                .wordLength(target.length())
                .guess(guess)
                .attempt(attempt - 1)
                .maxAttempts(maxAttempts)
                .correct(false)
                .gameOver(true)
                .cells(Collections.emptyList())
                .score(null)
                .message("Het luot doan. Tu dung la: " + target)
                .build();
        }

        List<CellResult> cells = evaluateGuess(guess, target);
        boolean correct = guess.equals(target);

        GameHistory h = GameHistory.builder()
            .userId(request.getUserId())
            .wordId(word.getId())
            .guess(guess)
            .result(cells.stream().map(CellResult::getColor).collect(java.util.stream.Collectors.joining(",")))
            .attempt(attempt)
            .correct(correct)
            .build();
        historyRepository.save(h);

        Integer score = null;
        String message;
        boolean gameOver = false;

        if (correct) {
            score = computeScore(attempt);
            message = "Chuan! Ban doan dung tai lan thu " + attempt + ". Duoc cong " + score + " diem.";
            gameOver = true;
        } else if (attempt >= maxAttempts) {
            gameOver = true;
            message = "Het luot doan. Tu dung la: " + target;
        } else {
            message = "Sai. Con " + (maxAttempts - attempt) + " lan doan.";
        }

        return GuessResponse.builder()
            .wordId(word.getId())
            .wordLength(target.length())
            .guess(guess)
            .attempt(attempt)
            .maxAttempts(maxAttempts)
            .correct(correct)
            .gameOver(gameOver)
            .cells(cells)
            .score(score)
            .message(message)
            .build();
    }

    private List<CellResult> evaluateGuess(String guess, String target) {
        int n = target.length();
        List<CellResult> results = new ArrayList<>(n);
        boolean[] used = new boolean[n];

        for (int i = 0; i < n; i++) {
            char g = i < guess.length() ? guess.charAt(i) : ' ';
            char t = target.charAt(i);
            if (g == t) {
                results.add(CellResult.builder().index(i).letter(g).color("GREEN").label("xanh la").build());
                used[i] = true;
            } else {
                results.add(null);
            }
        }

        for (int i = 0; i < n; i++) {
            CellResult r = results.get(i);
            if (r != null) continue;
            char g = i < guess.length() ? guess.charAt(i) : ' ';
            String color;
            String label;
            if (containsChar(target, g, used)) {
                if (isVowel(g) && isVowelMismatch(target, g)) {
                    color = "BLUE";
                    label = "xanh duong";
                } else {
                    color = "YELLOW";
                    label = "vang";
                }
            } else {
                color = "BLACK";
                label = "den";
            }
            results.set(i, CellResult.builder().index(i).letter(g).color(color).label(label).build());
        }
        return results;
    }

    private boolean containsChar(String target, char c, boolean[] used) {
        for (int i = 0; i < target.length(); i++) {
            if (!used[i] && target.charAt(i) == c) {
                used[i] = true;
                return true;
            }
        }
        return false;
    }

    private boolean isVowel(char c) {
        return "AEIOU".indexOf(c) >= 0;
    }

    private boolean isVowelMismatch(String target, char c) {
        for (int i = 0; i < target.length(); i++) {
            char t = target.charAt(i);
            if (isVowel(t) && normalizeVowel(t) == normalizeVowel(c) && t != c) {
                return true;
            }
        }
        return false;
    }

    private char normalizeVowel(char c) {
        switch (c) {
            case 'A': case 'Á': case 'À': case 'Ả': case 'Ã': case 'Ạ': case 'Â': case 'Ấ': case 'Ầ': case 'Ẩ': case 'Ẫ': case 'Ậ': case 'Ă': case 'Ắ': case 'Ằ': case 'Ẳ': case 'Ẵ': case 'Ặ':
                return 'A';
            case 'E': case 'É': case 'È': case 'Ẻ': case 'Ẽ': case 'Ẹ': case 'Ê': case 'Ế': case 'Ề': case 'Ể': case 'Ễ': case 'Ệ':
                return 'E';
            case 'I': case 'Í': case 'Ì': case 'Ỉ': case 'Ĩ': case 'Ị':
                return 'I';
            case 'O': case 'Ó': case 'Ò': case 'Ỏ': case 'Õ': case 'Ọ': case 'Ô': case 'Ố': case 'Ồ': case 'Ổ': case 'Ỗ': case 'Ộ': case 'Ơ': case 'Ớ': case 'Ờ': case 'Ở': case 'Ỡ': case 'Ợ':
                return 'O';
            case 'U': case 'Ú': case 'Ù': case 'Ủ': case 'Ũ': case 'Ụ': case 'Ư': case 'Ứ': case 'Ừ': case 'Ử': case 'Ữ': case 'Ự':
                return 'U';
            default:
                return c;
        }
    }

    private Integer computeScore(int attempt) {
        int max = gameConfig.getMaxAttempts();
        double ratio = 1.0 - (double) (attempt - 1) / max;
        int score = (int) Math.round(gameConfig.getScoreMin() + ratio * (gameConfig.getScoreMax() - gameConfig.getScoreMin()));
        return Math.max(gameConfig.getScoreMin(), Math.min(gameConfig.getScoreMax(), score));
    }

    public List<WordResponse> getWordsForHistory(Long userId) {
        return wordRepository.findAll().stream()
            .map(w -> WordResponse.builder()
                .id(w.getId())
                .value(w.getValue())
                .wordLength(w.getValue().length())
                .level(w.getLevel())
                .maxAttempts(gameConfig.getMaxAttempts())
                .build())
            .collect(Collectors.toList());
    }
}
