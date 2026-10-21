package com.gameword.controller;

import com.gameword.dto.GuessRequest;
import com.gameword.dto.GuessResponse;
import com.gameword.service.GameService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/game")
@CrossOrigin(origins = "*")
public class GameController {

    private final GameService gameService;

    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    @PostMapping("/start")
    public ResponseEntity<GuessResponse> start(@RequestParam(required = false) Long userId,
                                               @RequestParam(required = false) List<Long> excludedIds) {
        return ResponseEntity.ok(gameService.startGame(userId, excludedIds != null ? excludedIds : List.of()));
    }

    @PostMapping("/guess")
    public ResponseEntity<GuessResponse> guess(@RequestBody GuessRequest request) {
        return ResponseEntity.ok(gameService.makeGuess(request));
    }
}
