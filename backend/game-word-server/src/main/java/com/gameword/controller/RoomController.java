package com.gameword.controller;

import com.gameword.dto.ChainMoveRequest;
import com.gameword.dto.ChatMessageDto;
import com.gameword.dto.ChatSendRequest;
import com.gameword.dto.GameTypeRequest;
import com.gameword.dto.MessageResponse;
import com.gameword.dto.RoomGuessRequest;
import com.gameword.dto.RoomInviteRequest;
import com.gameword.dto.RoomStateResponse;
import com.gameword.dto.RoomSummary;
import com.gameword.service.RoomService;
import com.gameword.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

// Phong choi nhieu nguoi; tat ca endpoint yeu cau JWT (SecurityConfig: anyRequest().authenticated())
@RestController
@RequestMapping("/api/rooms")
@CrossOrigin(origins = "*")
public class RoomController {

    private final RoomService roomService;
    private final UserService userService;

    public RoomController(RoomService roomService, UserService userService) {
        this.roomService = roomService;
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<RoomStateResponse> create(@RequestBody GameTypeRequest request, Principal principal) {
        return ResponseEntity.ok(roomService.create(currentUserId(principal), request.getGameType()));
    }

    @GetMapping("/mine")
    public ResponseEntity<List<RoomSummary>> mine(Principal principal) {
        return ResponseEntity.ok(roomService.myRooms(currentUserId(principal)));
    }

    // since: version client da co; afterMessageId: id tin nhan cuoi client da co
    @GetMapping("/{code}")
    public ResponseEntity<RoomStateResponse> state(@PathVariable String code,
                                                   @RequestParam(required = false) Long since,
                                                   @RequestParam(required = false) Long afterMessageId,
                                                   Principal principal) {
        return ResponseEntity.ok(roomService.getState(currentUserId(principal), code, since, afterMessageId));
    }

    @PostMapping("/{code}/join")
    public ResponseEntity<RoomStateResponse> join(@PathVariable String code, Principal principal) {
        return ResponseEntity.ok(roomService.join(currentUserId(principal), code));
    }

    @PostMapping("/{code}/leave")
    public ResponseEntity<MessageResponse> leave(@PathVariable String code, Principal principal) {
        roomService.leave(currentUserId(principal), code);
        return ResponseEntity.ok(new MessageResponse("Left room"));
    }

    @PostMapping("/{code}/start")
    public ResponseEntity<RoomStateResponse> start(@PathVariable String code, @RequestBody GameTypeRequest request,
                                                   Principal principal) {
        return ResponseEntity.ok(roomService.start(currentUserId(principal), code, request.getGameType()));
    }

    @PostMapping("/{code}/guess")
    public ResponseEntity<RoomStateResponse> guess(@PathVariable String code, @RequestBody RoomGuessRequest request,
                                                   @RequestParam(required = false) Long afterMessageId,
                                                   Principal principal) {
        return ResponseEntity.ok(roomService.guess(currentUserId(principal), code, request.getGuess(), afterMessageId));
    }

    @PostMapping("/{code}/chain")
    public ResponseEntity<RoomStateResponse> chain(@PathVariable String code, @RequestBody ChainMoveRequest request,
                                                   @RequestParam(required = false) Long afterMessageId,
                                                   Principal principal) {
        return ResponseEntity.ok(roomService.chain(currentUserId(principal), code, request.getWord(), afterMessageId));
    }

    @PostMapping("/{code}/messages")
    public ResponseEntity<ChatMessageDto> message(@PathVariable String code, @RequestBody ChatSendRequest request,
                                                  Principal principal) {
        return ResponseEntity.ok(roomService.sendMessage(currentUserId(principal), code, request.getContent()));
    }

    @PostMapping("/{code}/invite")
    public ResponseEntity<MessageResponse> invite(@PathVariable String code, @RequestBody RoomInviteRequest request,
                                                  Principal principal) {
        roomService.invite(currentUserId(principal), code, request.getFriendId());
        return ResponseEntity.ok(new MessageResponse("Invite sent"));
    }

    private Long currentUserId(Principal principal) {
        return userService.getUserIdByUsername(principal.getName());
    }
}
