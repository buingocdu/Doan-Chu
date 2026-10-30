package com.gameword.service;

import com.gameword.config.GameConfig;
import com.gameword.config.RoomConfig;
import com.gameword.dto.CellResult;
import com.gameword.dto.ChainWordDto;
import com.gameword.dto.ChatMessageDto;
import com.gameword.dto.MatchPlayerDto;
import com.gameword.dto.MatchStateDto;
import com.gameword.dto.RoomMemberDto;
import com.gameword.dto.RoomStateResponse;
import com.gameword.dto.RoomSummary;
import com.gameword.model.ChatMessage;
import com.gameword.model.GameType;
import com.gameword.model.MatchMove;
import com.gameword.model.MatchPlayer;
import com.gameword.model.Room;
import com.gameword.model.RoomMatch;
import com.gameword.model.RoomMember;
import com.gameword.model.Word;
import com.gameword.repository.MatchMoveRepository;
import com.gameword.repository.MatchPlayerRepository;
import com.gameword.repository.RoomMatchRepository;
import com.gameword.repository.RoomMemberRepository;
import com.gameword.repository.RoomRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.function.Consumer;
import java.util.stream.Collectors;
import java.util.stream.Stream;

// Phong choi nhieu nguoi (DOC-007). Moi thao tac thay doi deu khoa dong rooms (SELECT ... FOR UPDATE)
// nen cac nuoc di trong cung phong duoc xu ly tuan tu: khong the co 2 nguoi cung thang.
@Service
@Transactional
public class RoomService {

    // Bo cac ky tu de nham 0/O, 1/I
    private static final String CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int CODE_LENGTH = 6;
    private static final int CHAIN_HISTORY = 50;

    private final RoomRepository roomRepository;
    private final RoomMemberRepository memberRepository;
    private final RoomMatchRepository matchRepository;
    private final MatchPlayerRepository playerRepository;
    private final MatchMoveRepository moveRepository;
    private final WordService wordService;
    private final ChatService chatService;
    private final UserService userService;
    private final FriendService friendService;
    private final WordGuessEngine guessEngine;
    private final WordChainEngine chainEngine;
    private final RoomConfig roomConfig;
    private final GameConfig gameConfig;
    private final SecureRandom random = new SecureRandom();

    @PersistenceContext
    private EntityManager entityManager;

    public RoomService(RoomRepository roomRepository, RoomMemberRepository memberRepository,
                       RoomMatchRepository matchRepository, MatchPlayerRepository playerRepository,
                       MatchMoveRepository moveRepository, WordService wordService, ChatService chatService,
                       UserService userService, FriendService friendService, WordGuessEngine guessEngine,
                       WordChainEngine chainEngine, RoomConfig roomConfig, GameConfig gameConfig) {
        this.roomRepository = roomRepository;
        this.memberRepository = memberRepository;
        this.matchRepository = matchRepository;
        this.playerRepository = playerRepository;
        this.moveRepository = moveRepository;
        this.wordService = wordService;
        this.chatService = chatService;
        this.userService = userService;
        this.friendService = friendService;
        this.guessEngine = guessEngine;
        this.chainEngine = chainEngine;
        this.roomConfig = roomConfig;
        this.gameConfig = gameConfig;
    }

    public RoomStateResponse create(Long userId, String gameType) {
        GameType type = GameType.parse(gameType);
        LocalDateTime now = LocalDateTime.now();
        Room room = roomRepository.save(Room.builder()
            .code(newCode())
            .hostId(userId)
            .gameType(type.name())
            .status(Room.WAITING)
            .version(0L)
            .createdAt(now)
            .updatedAt(now)
            .build());
        memberRepository.save(RoomMember.builder().roomId(room.getId()).userId(userId).joinedAt(now).build());
        announce(room).accept(username(userId) + " đã tạo phòng.");
        touch(room);
        return buildState(room, userId, null);
    }

    @Transactional(readOnly = true)
    public List<RoomSummary> myRooms(Long userId) {
        List<Room> rooms = roomRepository.findOpenRoomsOfUser(userId);
        Map<Long, String> names = userService.usernames(rooms.stream().map(Room::getHostId).collect(Collectors.toList()));
        return rooms.stream().map(r -> RoomSummary.builder()
            .code(r.getCode())
            .status(r.getStatus())
            .gameType(r.getGameType())
            .hostId(r.getHostId())
            .hostName(names.get(r.getHostId()))
            .memberCount(memberRepository.countByRoomId(r.getId()))
            .updatedAt(Times.epochMillis(r.getUpdatedAt()))
            .build()).collect(Collectors.toList());
    }

    // Vao lai phong da la thanh vien thi chi tra ve trang thai
    public RoomStateResponse join(Long userId, String code) {
        Room room = lockOpenRoom(code);
        if (!memberRepository.existsByRoomIdAndUserId(room.getId(), userId)) {
            if (memberRepository.countByRoomId(room.getId()) >= roomConfig.getMaxMembers()) {
                throw new RuntimeException("Room is full");
            }
            memberRepository.save(RoomMember.builder()
                .roomId(room.getId()).userId(userId).joinedAt(LocalDateTime.now()).build());
            announce(room).accept(username(userId) + " đã vào phòng"
                + (Room.PLAYING.equals(room.getStatus()) ? " (xem ván đang chơi, tham gia từ ván sau)." : "."));
            touch(room);
        }
        return buildState(room, userId, null);
    }

    public void leave(Long userId, String code) {
        Room room = lockOpenRoom(code);
        RoomMember member = memberRepository.findByRoomIdAndUserId(room.getId(), userId)
            .orElseThrow(() -> new RuntimeException("Not a room member"));
        RoomMatch match = currentMatch(room);
        Consumer<String> announce = announce(room);
        if (match != null && match.isPlaying()) {
            engineOf(match).forfeit(match, userId, announce);
        }
        memberRepository.delete(member);
        memberRepository.flush();
        announce.accept(username(userId) + " đã rời phòng.");

        List<RoomMember> remaining = memberRepository.findByRoomIdOrderByJoinedAtAscIdAsc(room.getId());
        if (remaining.isEmpty()) {
            if (match != null && match.isPlaying()) {
                match.setStatus(RoomMatch.FINISHED);
                match.setFinishedAt(LocalDateTime.now());
                matchRepository.save(match);
            }
            room.setStatus(Room.CLOSED);
            room.setDeadlineAt(null);
            touch(room);
            return;
        }
        if (room.getHostId().equals(userId)) {
            room.setHostId(remaining.get(0).getUserId());
            announce.accept(username(room.getHostId()) + " là chủ phòng mới.");
        }
        syncRoom(room, match);
        touch(room);
    }

    // Polling: since = version client da co. Khong doi thi tra ve ban rut gon (1 truy van).
    public RoomStateResponse getState(Long userId, String code, Long since, Long afterMessageId) {
        Room room = roomRepository.findByCode(normalizeCode(code))
            .filter(r -> !Room.CLOSED.equals(r.getStatus()))
            .orElseThrow(() -> new RuntimeException("Room not found"));
        requireMember(room, userId);
        if (room.getDeadlineAt() != null && !LocalDateTime.now().isBefore(room.getDeadlineAt())) {
            // Doc lai voi khoa roi xu ly su kien hen gio (het luot / het gio)
            entityManager.refresh(room, LockModeType.PESSIMISTIC_WRITE);
            processDeadline(room);
        }
        if (since != null && since.equals(room.getVersion())) {
            return RoomStateResponse.builder()
                .version(room.getVersion())
                .changed(false)
                .serverTime(Times.nowMillis())
                .build();
        }
        return buildState(room, userId, afterMessageId);
    }

    public RoomStateResponse start(Long userId, String code, String gameType) {
        Room room = lockOpenRoom(code);
        requireMember(room, userId);
        if (!room.getHostId().equals(userId)) {
            throw new RuntimeException("Only the host can start");
        }
        if (Room.PLAYING.equals(room.getStatus())) {
            throw new RuntimeException("Match already in progress");
        }
        List<Long> playerIds = memberRepository.findByRoomIdOrderByJoinedAtAscIdAsc(room.getId()).stream()
            .map(RoomMember::getUserId).collect(Collectors.toList());
        if (playerIds.size() < roomConfig.getMinPlayers()) {
            throw new RuntimeException("Not enough players");
        }
        GameType type = GameType.parse(gameType);
        RoomMatch match = matchRepository.save(RoomMatch.builder()
            .roomId(room.getId())
            .gameType(type.name())
            .status(RoomMatch.PLAYING)
            .startedAt(LocalDateTime.now())
            .build());
        engineOf(match).start(match, playerIds, announce(room));
        room.setGameType(type.name());
        room.setCurrentMatchId(match.getId());
        syncRoom(room, match);
        touch(room);
        return buildState(room, userId, null);
    }

    public RoomStateResponse guess(Long userId, String code, String guess, Long afterMessageId) {
        Room room = lockOpenRoom(code);
        requireMember(room, userId);
        RoomMatch match = playingMatch(room, GameType.WORD_GUESS);
        guessEngine.guess(match, userId, guess, announce(room));
        syncRoom(room, match);
        touch(room);
        return buildState(room, userId, afterMessageId);
    }

    public RoomStateResponse chain(Long userId, String code, String word, Long afterMessageId) {
        Room room = lockOpenRoom(code);
        requireMember(room, userId);
        RoomMatch match = playingMatch(room, GameType.WORD_CHAIN);
        chainEngine.play(match, userId, word, announce(room));
        syncRoom(room, match);
        touch(room);
        return buildState(room, userId, afterMessageId);
    }

    public ChatMessageDto sendMessage(Long userId, String code, String content) {
        Room room = lockOpenRoom(code);
        requireMember(room, userId);
        ChatMessage message = chatService.roomText(room.getId(), userId, content);
        touch(room);
        return chatService.toDtos(List.of(message)).get(0);
    }

    // Moi ban vao phong: gui tin nhan rieng loai ROOM_INVITE, noi dung la ma phong
    public void invite(Long userId, String code, Long friendId) {
        Room room = roomRepository.findByCode(normalizeCode(code))
            .filter(r -> !Room.CLOSED.equals(r.getStatus()))
            .orElseThrow(() -> new RuntimeException("Room not found"));
        requireMember(room, userId);
        friendService.requireFriends(userId, friendId);
        chatService.sendDirect(userId, friendId, ChatMessage.ROOM_INVITE, room.getCode());
    }

    // ---- Noi bo ----

    private RoomMatch playingMatch(Room room, GameType type) {
        // Het han truoc khi nhan nuoc di (vd het gio doan chu) thi xu ly truoc
        if (room.getDeadlineAt() != null && !LocalDateTime.now().isBefore(room.getDeadlineAt())) {
            processDeadline(room);
        }
        RoomMatch match = currentMatch(room);
        if (match == null || !match.isPlaying()) {
            throw new RuntimeException("No match in progress");
        }
        if (!type.name().equals(match.getGameType())) {
            throw new RuntimeException("Wrong game type");
        }
        return match;
    }

    private void processDeadline(Room room) {
        RoomMatch match = currentMatch(room);
        if (match != null && match.isPlaying()) {
            engineOf(match).tick(match, LocalDateTime.now(), announce(room));
        }
        syncRoom(room, match);
        touch(room);
    }

    // Dong bo trang thai phong theo van: dang choi -> PLAYING + han su kien; xong -> WAITING
    private void syncRoom(Room room, RoomMatch match) {
        if (match != null && match.isPlaying()) {
            room.setStatus(Room.PLAYING);
            room.setDeadlineAt(engineOf(match).nextDeadline(match));
        } else {
            room.setStatus(Room.WAITING);
            room.setDeadlineAt(null);
        }
    }

    private void touch(Room room) {
        room.setVersion(room.getVersion() + 1);
        room.setUpdatedAt(LocalDateTime.now());
        roomRepository.save(room);
    }

    private Consumer<String> announce(Room room) {
        return content -> chatService.roomSystem(room.getId(), content);
    }

    private MatchEngine engineOf(RoomMatch match) {
        return GameType.WORD_CHAIN.name().equals(match.getGameType()) ? chainEngine : guessEngine;
    }

    private RoomMatch currentMatch(Room room) {
        return room.getCurrentMatchId() == null ? null : matchRepository.findById(room.getCurrentMatchId()).orElse(null);
    }

    private Room lockOpenRoom(String code) {
        return roomRepository.findByCodeForUpdate(normalizeCode(code))
            .filter(r -> !Room.CLOSED.equals(r.getStatus()))
            .orElseThrow(() -> new RuntimeException("Room not found"));
    }

    private void requireMember(Room room, Long userId) {
        if (!memberRepository.existsByRoomIdAndUserId(room.getId(), userId)) {
            throw new RuntimeException("Not a room member");
        }
    }

    private String newCode() {
        for (int attempt = 0; attempt < 20; attempt++) {
            StringBuilder sb = new StringBuilder(CODE_LENGTH);
            for (int i = 0; i < CODE_LENGTH; i++) {
                sb.append(CODE_CHARS.charAt(random.nextInt(CODE_CHARS.length())));
            }
            if (!roomRepository.existsByCode(sb.toString())) {
                return sb.toString();
            }
        }
        throw new RuntimeException("Could not create room");
    }

    static String normalizeCode(String code) {
        return code == null ? "" : code.trim().toUpperCase(Locale.ROOT);
    }

    private String username(Long userId) {
        return userService.getUser(userId).getUsername();
    }

    // ---- Dung response theo goc nhin nguoi xem ----

    private RoomStateResponse buildState(Room room, Long viewerId, Long afterMessageId) {
        List<RoomMember> members = memberRepository.findByRoomIdOrderByJoinedAtAscIdAsc(room.getId());
        Map<Long, String> names = userService.usernames(members.stream().map(RoomMember::getUserId)
            .collect(Collectors.toList()));
        RoomMatch match = currentMatch(room);
        return RoomStateResponse.builder()
            .code(room.getCode())
            .status(room.getStatus())
            .gameType(room.getGameType())
            .hostId(room.getHostId())
            .version(room.getVersion())
            .changed(true)
            .serverTime(Times.nowMillis())
            .members(members.stream().map(m -> RoomMemberDto.builder()
                .userId(m.getUserId())
                .username(names.get(m.getUserId()))
                .host(m.getUserId().equals(room.getHostId()))
                .build()).collect(Collectors.toList()))
            .match(match == null ? null : buildMatch(match, viewerId))
            .messages(chatService.roomMessages(room.getId(), afterMessageId))
            .build();
    }

    private MatchStateDto buildMatch(RoomMatch match, Long viewerId) {
        List<MatchPlayer> players = playerRepository.findByMatchIdOrderByTurnOrderAsc(match.getId());
        List<MatchMove> moves = moveRepository.findByMatchIdOrderByIdAsc(match.getId());
        Map<Long, String> names = userService.usernames(Stream.concat(
                players.stream().map(MatchPlayer::getUserId),
                Stream.of(match.getWinnerId()))
            .collect(Collectors.toList()));
        boolean guessMode = GameType.WORD_GUESS.name().equals(match.getGameType());

        MatchStateDto.MatchStateDtoBuilder dto = MatchStateDto.builder()
            .id(match.getId())
            .gameType(match.getGameType())
            .status(match.getStatus())
            .winnerId(match.getWinnerId())
            .winnerName(match.getWinnerId() == null ? null : names.get(match.getWinnerId()))
            .startedAt(Times.epochMillis(match.getStartedAt()))
            .players(players.stream().map(p -> MatchPlayerDto.builder()
                .userId(p.getUserId())
                .username(names.get(p.getUserId()))
                .eliminated(p.getEliminated())
                .eliminatedReason(p.getEliminatedReason())
                .attempts(p.getAttempts())
                .solved(p.getSolvedAt() != null)
                // Doi thu chi thay mau, khong thay chu
                .colorRows(guessMode ? moves.stream()
                    .filter(m -> p.getUserId().equals(m.getUserId()))
                    .map(m -> Arrays.asList(m.getResult().split(",")))
                    .collect(Collectors.toList()) : null)
                .build()).collect(Collectors.toList()));

        if (guessMode) {
            Word word = wordService.getWord(match.getWordId());
            List<List<CellResult>> myRows = moves.stream()
                .filter(m -> Objects.equals(viewerId, m.getUserId()))
                .map(m -> GameService.toCells(m.getContent(), m.getResult()))
                .collect(Collectors.toList());
            dto.endsAt(Times.epochMillis(match.getEndsAt()))
                .wordLength(word.getValue().length())
                .partLengths(GameService.partLengths(word))
                .maxAttempts(gameConfig.getMaxAttempts())
                .myRows(myRows);
            // Dap an chi gui khi van da ket thuc
            if (!match.isPlaying()) {
                dto.answer(GameService.answerOf(word)).definition(word.getDefinition());
            }
        } else {
            List<MatchMove> recent = moves.size() > CHAIN_HISTORY
                ? moves.subList(moves.size() - CHAIN_HISTORY, moves.size()) : moves;
            List<ChainWordDto> chain = new ArrayList<>(recent.size());
            for (MatchMove m : recent) {
                chain.add(ChainWordDto.builder()
                    .userId(m.getUserId())
                    .username(m.getUserId() == null ? null : names.get(m.getUserId()))
                    .word(m.getContent())
                    .build());
            }
            dto.chain(chain);
            if (match.isPlaying()) {
                dto.currentUserId(match.getCurrentUserId())
                    .turnDeadline(Times.epochMillis(match.getTurnDeadline()))
                    .requiredSyllable(WordChainEngine.lastSyllable(match.getLastWord()));
            }
        }
        return dto.build();
    }
}
