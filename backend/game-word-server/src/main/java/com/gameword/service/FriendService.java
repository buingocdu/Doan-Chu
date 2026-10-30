package com.gameword.service;

import com.gameword.dto.FriendDto;
import com.gameword.dto.FriendListResponse;
import com.gameword.dto.FriendSummaryResponse;
import com.gameword.dto.UserSearchResult;
import com.gameword.model.Friendship;
import com.gameword.model.User;
import com.gameword.repository.FriendshipRepository;
import com.gameword.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class FriendService {

    public static final String NONE = "NONE";
    public static final String FRIEND = "FRIEND";
    public static final String INCOMING = "INCOMING";
    public static final String OUTGOING = "OUTGOING";

    private static final int MIN_SEARCH_LENGTH = 2;
    // Chong spam loi moi: so loi moi dang cho toi da cua mot nguoi
    private static final int MAX_PENDING_OUTGOING = 50;

    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    private final ChatService chatService;

    public FriendService(FriendshipRepository friendshipRepository, UserRepository userRepository,
                         UserService userService, ChatService chatService) {
        this.friendshipRepository = friendshipRepository;
        this.userRepository = userRepository;
        this.userService = userService;
        this.chatService = chatService;
    }

    @Transactional(readOnly = true)
    public FriendListResponse list(Long userId) {
        List<Friendship> all = friendshipRepository.findAllOf(userId);
        Map<Long, String> names = userService.usernames(
            all.stream().map(f -> f.otherUserId(userId)).collect(Collectors.toList()));
        Map<Long, Long> unread = chatService.unreadBySender(userId);
        List<FriendDto> friends = new ArrayList<>();
        List<FriendDto> incoming = new ArrayList<>();
        List<FriendDto> outgoing = new ArrayList<>();
        for (Friendship f : all) {
            Long other = f.otherUserId(userId);
            FriendDto dto = FriendDto.builder()
                .userId(other)
                .username(names.get(other))
                .unread(unread.getOrDefault(other, 0L))
                .build();
            if (Friendship.ACCEPTED.equals(f.getStatus())) {
                friends.add(dto);
            } else if (f.getAddresseeId().equals(userId)) {
                incoming.add(dto);
            } else {
                outgoing.add(dto);
            }
        }
        // Ban co tin chua doc len dau, sau do theo ten
        friends.sort(Comparator.comparing((FriendDto d) -> d.getUnread() == 0)
            .thenComparing(d -> d.getUsername() == null ? "" : d.getUsername().toLowerCase()));
        return FriendListResponse.builder().friends(friends).incoming(incoming).outgoing(outgoing).build();
    }

    @Transactional(readOnly = true)
    public FriendSummaryResponse summary(Long userId) {
        return FriendSummaryResponse.builder()
            .pendingRequests(friendshipRepository.countByAddresseeIdAndStatus(userId, Friendship.PENDING))
            .unreadMessages(chatService.unreadCount(userId))
            .build();
    }

    @Transactional(readOnly = true)
    public List<UserSearchResult> search(Long userId, String query) {
        String q = query == null ? "" : query.trim();
        if (q.length() < MIN_SEARCH_LENGTH) {
            return List.of();
        }
        return userRepository.findTop10ByUsernameStartingWithIgnoreCaseOrderByUsernameAsc(q).stream()
            .filter(u -> !u.getId().equals(userId))
            .map(u -> UserSearchResult.builder()
                .userId(u.getId())
                .username(u.getUsername())
                .relation(relation(userId, u.getId()))
                .build())
            .collect(Collectors.toList());
    }

    // B da moi A thi A moi lai = chap nhan luon
    public void request(Long userId, String username) {
        User target = userRepository.findByUsername(username == null ? "" : username.trim())
            .orElseThrow(() -> new RuntimeException("User not found"));
        if (target.getId().equals(userId)) {
            throw new RuntimeException("Cannot add yourself");
        }
        Optional<Friendship> existing = friendshipRepository.findBetween(userId, target.getId());
        if (existing.isPresent()) {
            Friendship f = existing.get();
            if (Friendship.ACCEPTED.equals(f.getStatus())) {
                throw new RuntimeException("Already friends");
            }
            if (f.getRequesterId().equals(userId)) {
                throw new RuntimeException("Request already sent");
            }
            accept(f);
            return;
        }
        if (friendshipRepository.countByRequesterIdAndStatus(userId, Friendship.PENDING) >= MAX_PENDING_OUTGOING) {
            throw new RuntimeException("Too many pending requests");
        }
        friendshipRepository.save(Friendship.builder()
            .requesterId(userId)
            .addresseeId(target.getId())
            .status(Friendship.PENDING)
            .createdAt(LocalDateTime.now())
            .build());
    }

    public void acceptRequest(Long userId, Long requesterId) {
        Friendship f = friendshipRepository.findBetween(userId, requesterId)
            .filter(x -> Friendship.PENDING.equals(x.getStatus()) && x.getAddresseeId().equals(userId))
            .orElseThrow(() -> new RuntimeException("Friend request not found"));
        accept(f);
    }

    // Tu choi loi moi den hoac huy loi moi minh da gui
    public void removeRequest(Long userId, Long otherId) {
        Friendship f = friendshipRepository.findBetween(userId, otherId)
            .filter(x -> Friendship.PENDING.equals(x.getStatus()))
            .orElseThrow(() -> new RuntimeException("Friend request not found"));
        friendshipRepository.delete(f);
    }

    public void unfriend(Long userId, Long otherId) {
        Friendship f = friendshipRepository.findBetween(userId, otherId)
            .filter(x -> Friendship.ACCEPTED.equals(x.getStatus()))
            .orElseThrow(() -> new RuntimeException("Not friends"));
        friendshipRepository.delete(f);
    }

    @Transactional(readOnly = true)
    public boolean areFriends(Long a, Long b) {
        return friendshipRepository.findBetween(a, b)
            .map(f -> Friendship.ACCEPTED.equals(f.getStatus()))
            .orElse(false);
    }

    public void requireFriends(Long a, Long b) {
        if (!areFriends(a, b)) {
            throw new RuntimeException("Not friends");
        }
    }

    private String relation(Long userId, Long otherId) {
        return friendshipRepository.findBetween(userId, otherId)
            .map(f -> Friendship.ACCEPTED.equals(f.getStatus()) ? FRIEND
                : f.getRequesterId().equals(userId) ? OUTGOING : INCOMING)
            .orElse(NONE);
    }

    private void accept(Friendship f) {
        f.setStatus(Friendship.ACCEPTED);
        f.setRespondedAt(LocalDateTime.now());
        friendshipRepository.save(f);
    }
}
