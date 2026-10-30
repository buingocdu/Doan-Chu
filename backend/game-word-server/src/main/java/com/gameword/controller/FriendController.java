package com.gameword.controller;

import com.gameword.dto.FriendListResponse;
import com.gameword.dto.FriendRequestRequest;
import com.gameword.dto.FriendSummaryResponse;
import com.gameword.dto.MessageResponse;
import com.gameword.dto.UserSearchResult;
import com.gameword.service.FriendService;
import com.gameword.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/friends")
@CrossOrigin(origins = "*")
public class FriendController {

    private final FriendService friendService;
    private final UserService userService;

    public FriendController(FriendService friendService, UserService userService) {
        this.friendService = friendService;
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<FriendListResponse> list(Principal principal) {
        return ResponseEntity.ok(friendService.list(currentUserId(principal)));
    }

    // So loi moi dang cho + tin nhan chua doc (badge tren thanh dieu huong)
    @GetMapping("/summary")
    public ResponseEntity<FriendSummaryResponse> summary(Principal principal) {
        return ResponseEntity.ok(friendService.summary(currentUserId(principal)));
    }

    @GetMapping("/search")
    public ResponseEntity<List<UserSearchResult>> search(@RequestParam(required = false) String q, Principal principal) {
        return ResponseEntity.ok(friendService.search(currentUserId(principal), q));
    }

    @PostMapping("/requests")
    public ResponseEntity<MessageResponse> request(@RequestBody FriendRequestRequest request, Principal principal) {
        friendService.request(currentUserId(principal), request.getUsername());
        return ResponseEntity.ok(new MessageResponse("Friend request sent"));
    }

    @PostMapping("/requests/{userId}/accept")
    public ResponseEntity<MessageResponse> accept(@PathVariable Long userId, Principal principal) {
        friendService.acceptRequest(currentUserId(principal), userId);
        return ResponseEntity.ok(new MessageResponse("Friend request accepted"));
    }

    // Tu choi loi moi den hoac huy loi moi da gui
    @DeleteMapping("/requests/{userId}")
    public ResponseEntity<MessageResponse> removeRequest(@PathVariable Long userId, Principal principal) {
        friendService.removeRequest(currentUserId(principal), userId);
        return ResponseEntity.ok(new MessageResponse("Friend request removed"));
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<MessageResponse> unfriend(@PathVariable Long userId, Principal principal) {
        friendService.unfriend(currentUserId(principal), userId);
        return ResponseEntity.ok(new MessageResponse("Unfriended"));
    }

    private Long currentUserId(Principal principal) {
        return userService.getUserIdByUsername(principal.getName());
    }
}
