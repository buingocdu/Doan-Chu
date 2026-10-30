package com.gameword.controller;

import com.gameword.dto.ChatMessageDto;
import com.gameword.dto.ChatSendRequest;
import com.gameword.model.ChatMessage;
import com.gameword.service.ChatService;
import com.gameword.service.FriendService;
import com.gameword.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

// Tin nhan rieng giua ban be
@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final ChatService chatService;
    private final FriendService friendService;
    private final UserService userService;

    public MessageController(ChatService chatService, FriendService friendService, UserService userService) {
        this.chatService = chatService;
        this.friendService = friendService;
        this.userService = userService;
    }

    // Doc duoc lich su ca khi da huy ket ban; danh dau tin gui toi minh la da doc
    @GetMapping("/{friendId}")
    public ResponseEntity<List<ChatMessageDto>> conversation(@PathVariable Long friendId,
                                                             @RequestParam(required = false) Long afterId,
                                                             Principal principal) {
        return ResponseEntity.ok(chatService.conversation(currentUserId(principal), friendId, afterId));
    }

    @PostMapping("/{friendId}")
    public ResponseEntity<ChatMessageDto> send(@PathVariable Long friendId, @RequestBody ChatSendRequest request,
                                               Principal principal) {
        Long userId = currentUserId(principal);
        friendService.requireFriends(userId, friendId);
        return ResponseEntity.ok(chatService.sendDirect(userId, friendId, ChatMessage.TEXT, request.getContent()));
    }

    private Long currentUserId(Principal principal) {
        return userService.getUserIdByUsername(principal.getName());
    }
}
