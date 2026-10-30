package com.gameword.service;

import com.gameword.dto.ChainWordDto;
import com.gameword.dto.ChatMessageDto;
import com.gameword.dto.RegisterRequest;
import com.gameword.dto.RoomStateResponse;
import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

// Chay toan bo migration Liquibase + Hibernate validate tren PostgreSQL nhung (khong can Docker),
// roi di qua luong phong choi, chat, ket ban voi truy van va khoa dong that.
@SpringBootTest
class RoomFlowIntegrationTest {

    private static final EmbeddedPostgres POSTGRES = startPostgres();
    private static final AtomicInteger SEQ = new AtomicInteger();

    @Autowired
    private UserService userService;
    @Autowired
    private RoomService roomService;
    @Autowired
    private FriendService friendService;
    @Autowired
    private ChatService chatService;
    @Autowired
    private JdbcTemplate jdbc;

    private static EmbeddedPostgres startPostgres() {
        try {
            return EmbeddedPostgres.builder().start();
        } catch (IOException ex) {
            throw new IllegalStateException(ex);
        }
    }

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> POSTGRES.getJdbcUrl("postgres", "postgres"));
        registry.add("spring.datasource.username", () -> "postgres");
        registry.add("spring.datasource.password", () -> "postgres");
        registry.add("spring.jpa.show-sql", () -> "false");
    }

    @AfterAll
    static void stop() throws IOException {
        POSTGRES.close();
    }

    private Long newUser() {
        String name = "it_user" + SEQ.incrementAndGet();
        return userService.register(new RegisterRequest(name, "secret1", name + "@example.com")).getUserId();
    }

    @Test
    void wordGuessRaceFirstCorrectWinsAndPollingIsCheap() {
        Long host = newUser();
        Long guest = newUser();
        RoomStateResponse room = roomService.create(host, "WORD_GUESS");
        String code = room.getCode();
        roomService.join(guest, code);
        roomService.start(host, code, "WORD_GUESS");

        // Doc dap an tu DB (client khong bao gio nhan duoc khi van dang choi)
        RoomStateResponse playing = roomService.getState(guest, code, null, null);
        assertNull(playing.getMatch().getAnswer());
        String answer = jdbc.queryForObject("SELECT w.phrase FROM words w JOIN matches m ON m.word_id = w.id "
            + "WHERE m.id = ?", String.class, playing.getMatch().getId());

        RoomStateResponse after = roomService.guess(guest, code, answer, null);
        assertEquals("FINISHED", after.getMatch().getStatus());
        assertEquals(guest, after.getMatch().getWinnerId());
        assertNotNull(after.getMatch().getAnswer());
        assertEquals("WAITING", after.getStatus());
        // Doi thu chi thay mau
        assertEquals(1, after.getMatch().getPlayers().stream()
            .filter(p -> p.getUserId().equals(guest)).findFirst().orElseThrow().getColorRows().size());

        RoomStateResponse unchanged = roomService.getState(host, code, after.getVersion(), null);
        assertFalse(unchanged.getChanged());
        assertNull(unchanged.getMembers());
    }

    @Test
    void simultaneousCorrectGuessesProduceExactlyOneWinner() throws Exception {
        Long a = newUser();
        Long b = newUser();
        String code = roomService.create(a, "WORD_GUESS").getCode();
        roomService.join(b, code);
        Long matchId = roomService.start(a, code, "WORD_GUESS").getMatch().getId();
        String answer = jdbc.queryForObject("SELECT w.phrase FROM words w JOIN matches m ON m.word_id = w.id "
            + "WHERE m.id = ?", String.class, matchId);

        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            List<Future<String>> results = pool.invokeAll(List.of(guessTask(a, code, answer), guessTask(b, code, answer)));
            int ok = 0;
            for (Future<String> f : results) {
                if ("OK".equals(f.get())) {
                    ok++;
                }
            }
            // Nguoi den sau thay van da ket thuc
            assertEquals(1, ok);
        } finally {
            pool.shutdown();
        }
        Integer winners = jdbc.queryForObject("SELECT COUNT(*) FROM match_players WHERE match_id = ? AND solved_at IS NOT NULL",
            Integer.class, matchId);
        assertEquals(1, winners);
    }

    private Callable<String> guessTask(Long userId, String code, String answer) {
        return () -> {
            try {
                roomService.guess(userId, code, answer, null);
                return "OK";
            } catch (RuntimeException ex) {
                return ex.getMessage();
            }
        };
    }

    @Test
    void wordChainValidatesDictionaryAndEliminates() {
        Long a = newUser();
        Long b = newUser();
        String code = roomService.create(a, "WORD_CHAIN").getCode();
        roomService.join(b, code);
        RoomStateResponse state = roomService.start(a, code, "WORD_CHAIN");
        Long current = state.getMatch().getCurrentUserId();
        String required = state.getMatch().getRequiredSyllable();
        assertNotNull(required);

        List<String> candidates = jdbc.queryForList(
            "SELECT phrase FROM words WHERE phrase LIKE ? AND phrase NOT LIKE ? LIMIT 5", String.class,
            required + " %", required + " % %");
        List<ChainWordDto> chainBefore = state.getMatch().getChain();
        String opening = chainBefore.get(chainBefore.size() - 1).getWord();
        String valid = candidates.stream().filter(w -> !w.equals(opening)).findFirst().orElse(null);
        Long other = current.equals(a) ? b : a;
        if (valid != null) {
            state = roomService.chain(current, code, valid, null);
            assertEquals(other, state.getMatch().getCurrentUserId());
            current = other;
        }

        // Tu khong co trong tu dien -> bi loai, nguoi con lai thang
        String next = state.getMatch().getRequiredSyllable();
        state = roomService.chain(current, code, next + " zzqx", null);
        assertEquals("FINISHED", state.getMatch().getStatus());
        assertNotEquals(current, state.getMatch().getWinnerId());
        assertTrue(state.getMessages().stream().anyMatch(m -> m.getContent().contains("không có trong từ điển")));
    }

    @Test
    void hostLeavingTransfersHostAndChatWorks() {
        Long host = newUser();
        Long guest = newUser();
        String code = roomService.create(host, "WORD_GUESS").getCode();
        roomService.join(guest, code);
        ChatMessageDto sent = roomService.sendMessage(guest, code, "xin chào");
        assertEquals("TEXT", sent.getType());

        roomService.leave(host, code);
        RoomStateResponse state = roomService.getState(guest, code, null, null);
        assertEquals(guest, state.getHostId());
        assertEquals(1, state.getMembers().size());
        assertTrue(roomService.myRooms(host).isEmpty());

        roomService.leave(guest, code);
        assertThrows(RuntimeException.class, () -> roomService.join(host, code));
    }

    @Test
    void friendsCanMessageAndInvite() {
        Long a = newUser();
        Long b = newUser();
        String bName = jdbc.queryForObject("SELECT username FROM users WHERE id = ?", String.class, b);
        assertThrows(RuntimeException.class, () -> friendService.requireFriends(a, b));

        friendService.request(a, bName);
        assertEquals(1, friendService.summary(b).getPendingRequests());
        friendService.acceptRequest(b, a);
        assertTrue(friendService.areFriends(a, b));

        chatService.sendDirect(a, b, "TEXT", "chào bạn");
        assertEquals(1, friendService.summary(b).getUnreadMessages());
        assertEquals(1, chatService.conversation(b, a, null).size());
        assertEquals(0, friendService.summary(b).getUnreadMessages());

        String code = roomService.create(a, "WORD_CHAIN").getCode();
        roomService.invite(a, code, b);
        List<ChatMessageDto> conversation = chatService.conversation(b, a, null);
        assertEquals("ROOM_INVITE", conversation.get(conversation.size() - 1).getType());
        assertEquals(code, conversation.get(conversation.size() - 1).getContent());
    }
}
