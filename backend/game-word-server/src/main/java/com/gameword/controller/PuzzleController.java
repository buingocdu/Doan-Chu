package com.gameword.controller;

import com.gameword.dto.PuzzleGameDto;
import com.gameword.dto.PuzzleRankEntry;
import com.gameword.dto.PuzzleScoreRequest;
import com.gameword.dto.PuzzleScoreResponse;
import com.gameword.service.PuzzleService;
import com.gameword.service.UserService;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

// Nguoi choi: xem game admin da tao, tai anh, gui ket qua, bang xep hang
@RestController
@RequestMapping("/api/puzzle")
public class PuzzleController {

    private final PuzzleService puzzleService;
    private final UserService userService;

    public PuzzleController(PuzzleService puzzleService, UserService userService) {
        this.puzzleService = puzzleService;
        this.userService = userService;
    }

    @GetMapping("/games")
    public ResponseEntity<List<PuzzleGameDto>> games() {
        return ResponseEntity.ok(puzzleService.listPlayableGames());
    }

    // Cong khai (SecurityConfig): the <img> khong gui duoc header Authorization. Anh la noi dung game, khong nhay cam.
    @GetMapping("/images/{id}/file")
    public ResponseEntity<byte[]> file(@PathVariable Long id) {
        PuzzleService.PuzzleFile file = puzzleService.file(id, false);
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(file.contentType()))
            // Anh co the bi admin xoay/doi: luon hoi lai bang ETag (304 neu khong doi) thay vi cache cung 7 ngay
            .cacheControl(CacheControl.noCache().cachePublic())
            .eTag("\"" + Integer.toHexString(java.util.Arrays.hashCode(file.data())) + "\"")
            .header("X-Content-Type-Options", "nosniff")
            .body(file.data());
    }

    @PostMapping("/scores")
    public ResponseEntity<PuzzleScoreResponse> submit(@RequestBody PuzzleScoreRequest request, Principal principal) {
        Long userId = userService.getUserIdByUsername(principal.getName());
        return ResponseEntity.ok(puzzleService.submit(userId, request));
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<List<PuzzleRankEntry>> leaderboard(@RequestParam Long gameId) {
        return ResponseEntity.ok(puzzleService.leaderboard(gameId));
    }
}
