package com.gameword.service;

import com.gameword.model.Friendship;
import com.gameword.model.User;
import com.gameword.repository.FriendshipRepository;
import com.gameword.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class FriendServiceTest {

    private FriendshipRepository friendshipRepository;
    private FriendService service;

    @BeforeEach
    void setUp() {
        friendshipRepository = mock(FriendshipRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        when(userRepository.findByUsername("binh")).thenReturn(Optional.of(User.builder().id(2L).username("binh").build()));
        when(userRepository.findByUsername("an")).thenReturn(Optional.of(User.builder().id(1L).username("an").build()));
        when(friendshipRepository.findBetween(anyLong(), anyLong())).thenReturn(Optional.empty());
        service = new FriendService(friendshipRepository, userRepository, mock(UserService.class), mock(ChatService.class));
    }

    @Test
    void requestCreatesPendingFriendship() {
        service.request(1L, "binh");
        ArgumentCaptor<Friendship> saved = ArgumentCaptor.forClass(Friendship.class);
        verify(friendshipRepository).save(saved.capture());
        assertEquals(1L, saved.getValue().getRequesterId());
        assertEquals(2L, saved.getValue().getAddresseeId());
        assertEquals(Friendship.PENDING, saved.getValue().getStatus());
    }

    @Test
    void mutualRequestBecomesFriendship() {
        Friendship pending = Friendship.builder().requesterId(2L).addresseeId(1L).status(Friendship.PENDING).build();
        when(friendshipRepository.findBetween(1L, 2L)).thenReturn(Optional.of(pending));
        service.request(1L, "binh");
        assertEquals(Friendship.ACCEPTED, pending.getStatus());
        assertTrue(service.areFriends(1L, 2L));
    }

    @Test
    void rejectsSelfAndDuplicateRequests() {
        assertThrows(RuntimeException.class, () -> service.request(1L, "an"));
        Friendship pending = Friendship.builder().requesterId(1L).addresseeId(2L).status(Friendship.PENDING).build();
        when(friendshipRepository.findBetween(1L, 2L)).thenReturn(Optional.of(pending));
        RuntimeException ex = assertThrows(RuntimeException.class, () -> service.request(1L, "binh"));
        assertEquals("Request already sent", ex.getMessage());
        // Nguoi gui khong tu chap nhan loi moi cua minh
        assertThrows(RuntimeException.class, () -> service.acceptRequest(1L, 2L));
    }
}
