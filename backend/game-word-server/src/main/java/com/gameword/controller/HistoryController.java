package com.gameword.controller;

import com.gameword.model.GameHistory;
import com.gameword.service.HistoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/history")
@CrossOrigin(origins = "*")
public class HistoryController {

    private final HistoryService historyService;

    public HistoryController(HistoryService historyService) {
        this.historyService = historyService;
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<GameHistory>> history(@PathVariable Long userId) {
        return ResponseEntity.ok(historyService.getHistoryByUser(userId));
    }

    @GetMapping("/correct/user/{userId}")
    public ResponseEntity<List<GameHistory>> correct(@PathVariable Long userId) {
        return ResponseEntity.ok(historyService.getCorrectByUser(userId));
    }
}
