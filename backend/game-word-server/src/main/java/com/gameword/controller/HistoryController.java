package com.gameword.controller;

import com.gameword.model.GameHistory;
import com.gameword.service.HistoryService;
import com.gameword.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/history")
public class HistoryController {

    private final HistoryService historyService;
    private final UserService userService;

    public HistoryController(HistoryService historyService, UserService userService) {
        this.historyService = historyService;
        this.userService = userService;
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<GameHistory>> history(@PathVariable Long userId, Principal principal) {
        requireSelf(userId, principal);
        return ResponseEntity.ok(historyService.getHistoryByUser(userId));
    }

    @GetMapping("/correct/user/{userId}")
    public ResponseEntity<List<GameHistory>> correct(@PathVariable Long userId, Principal principal) {
        requireSelf(userId, principal);
        return ResponseEntity.ok(historyService.getCorrectByUser(userId));
    }

    // Chi duoc xem lich su cua chinh minh
    private void requireSelf(Long userId, Principal principal) {
        if (principal == null || !userId.equals(userService.getUserIdByUsername(principal.getName()))) {
            throw new AccessDeniedException("Khong co quyen xem lich su nay");
        }
    }
}
