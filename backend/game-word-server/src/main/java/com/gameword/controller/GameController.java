package com.gameword.controller;

import com.gameword.dto.GameStateResponse;
import com.gameword.dto.GuessRequest;
import com.gameword.dto.GuessResponse;
import com.gameword.service.GameService;
import com.gameword.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/game")
@CrossOrigin(origins = "*")
public class GameController {

    private final GameService gameService;
    private final UserService userService;

    public GameController(GameService gameService, UserService userService) {
        this.gameService = gameService;
        this.userService = userService;
    }

    // Nguoi choi lay tu JWT (null = khach); khong tin userId do client gui len
    @PostMapping("/start")
    public ResponseEntity<GuessResponse> start(@RequestParam(required = false) List<Long> excludedIds,
                                               Principal principal) {
        return ResponseEntity.ok(gameService.startGame(currentUserId(principal),
            excludedIds != null ? excludedIds : List.of()));
    }

    // Van dang choi do (chua doan dung, con luot) de khoi phuc sau khi reload; 204 neu khong co.
    // Nguoi dang nhap: van gan nhat cua minh; khach: van co gameId duoc luu o trinh duyet.
    @GetMapping("/current")
    public ResponseEntity<GameStateResponse> current(@RequestParam(required = false) Long gameId, Principal principal) {
        return gameService.currentGame(currentUserId(principal), gameId)
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping("/guess")
    public ResponseEntity<GuessResponse> guess(@RequestBody GuessRequest request, Principal principal) {
        return ResponseEntity.ok(gameService.makeGuess(request, currentUserId(principal)));
    }

    private Long currentUserId(Principal principal) {
        return principal != null ? userService.getUserIdByUsername(principal.getName()) : null;
    }
}
